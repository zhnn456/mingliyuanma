#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库自动备份到 Cloudflare R2
- mysqldump 全量备份 -> gzip 压缩 -> 上传 R2
- 本地保留最近 3 份，R2 保留 30 天（超期自动删除）
- 日志: /root/backup-r2.log
凭证: /root/.r2-backup.env (chmod 600)
"""
import os, sys, gzip, shutil, subprocess, datetime, glob, json
import boto3
from botocore.config import Config

# ===== 配置 =====
ENV_FILE = '/root/.r2-backup.env'
LOG_FILE = '/root/backup-r2.log'
LOCAL_DIR = '/root/db-backups'
KEEP_LOCAL = 3          # 本地保留份数
KEEP_REMOTE_DAYS = 30   # R2 保留天数

# ===== 读取凭证与配置 =====
def load_env(path):
    env = {}
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip()
    return env

def log(msg):
    ts = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line)
    with open(LOG_FILE, 'a') as f:
        f.write(line + '\n')

def main():
    env = load_env(ENV_FILE)
    missing = [k for k in ['R2_ACCESS_KEY', 'R2_SECRET_KEY', 'R2_ENDPOINT', 'R2_BUCKET',
                           'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'] if not env.get(k)]
    if missing:
        log(f'ERROR: 缺少配置 {missing}')
        sys.exit(1)

    os.makedirs(LOCAL_DIR, exist_ok=True)
    today = datetime.date.today().strftime('%Y%m%d')
    hostname = os.uname().nodename if hasattr(os, 'uname') else 'server'
    raw_file = os.path.join(LOCAL_DIR, f'db-{hostname}-{today}.sql')
    gz_file = raw_file + '.gz'

    # 1. mysqldump
    log('开始 mysqldump ...')
    cmd = [
        'mysqldump',
        f'-u{env["MYSQL_USER"]}', f'-p{env["MYSQL_PASSWORD"]}',
        '--single-transaction', '--routines', '--triggers', '--hex-blob',
        env['MYSQL_DATABASE'],
    ]
    try:
        with open(raw_file, 'wb') as f:
            subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, check=True, timeout=1800)
    except subprocess.CalledProcessError as e:
        log(f'ERROR: mysqldump 失败: {e.stderr.decode(errors="replace")[:300]}')
        sys.exit(1)

    # 2. gzip 压缩
    try:
        with open(raw_file, 'rb') as fin, gzip.open(gz_file, 'wb', compresslevel=6) as fout:
            shutil.copyfileobj(fin, fout)
        os.remove(raw_file)
    except Exception as e:
        log(f'ERROR: 压缩失败: {e}')
        sys.exit(1)

    size_mb = os.path.getsize(gz_file) / 1024 / 1024
    log(f'备份完成: {os.path.basename(gz_file)} ({size_mb:.1f} MB)')

    # 3. 上传 R2
    try:
        s3 = boto3.client(
            's3',
            endpoint_url=env['R2_ENDPOINT'],
            aws_access_key_id=env['R2_ACCESS_KEY'],
            aws_secret_access_key=env['R2_SECRET_KEY'],
            region_name='auto',
            config=Config(signature_version='s3v4', connect_timeout=30, read_timeout=300),
        )
        key = os.path.basename(gz_file)
        s3.upload_file(gz_file, env['R2_BUCKET'], key)
        # 校验：对比大小
        head = s3.head_object(Bucket=env['R2_BUCKET'], Key=key)
        remote_size = head.get('ContentLength', 0)
        local_size = os.path.getsize(gz_file)
        if remote_size != local_size:
            log(f'ERROR: 上传校验失败 (本地 {local_size} vs 远端 {remote_size})')
            sys.exit(1)
        log(f'上传成功: {key} ({remote_size/1024/1024:.1f} MB)')
    except Exception as e:
        log(f'ERROR: 上传失败: {e}')
        sys.exit(1)

    # 4. 清理本地旧备份（保留 KEEP_LOCAL 份）
    backups = sorted(glob.glob(os.path.join(LOCAL_DIR, 'db-*.sql.gz')))
    for old in backups[:-KEEP_LOCAL]:
        os.remove(old)
        log(f'本地清理: {os.path.basename(old)}')

    # 5. 清理 R2 旧备份（保留 KEEP_REMOTE_DAYS 天）
    try:
        cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=KEEP_REMOTE_DAYS)
        paginator = s3.get_paginator('list_objects_v2')
        for page in paginator.paginate(Bucket=env['R2_BUCKET']):
            for obj in page.get('Contents', []):
                if obj['Key'].startswith('db-') and obj['LastModified'].replace(tzinfo=datetime.timezone.utc) < cutoff:
                    s3.delete_object(Bucket=env['R2_BUCKET'], Key=obj['Key'])
                    log(f'R2 清理: {obj["Key"]}')
    except Exception as e:
        log(f'WARN: R2 旧备份清理失败: {e}')

    log('=== 备份任务完成 ===')

if __name__ == '__main__':
    main()
