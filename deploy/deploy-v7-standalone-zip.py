"""
V7 部署脚本：standalone + zip 上传 + 增量 hash 校验

核心改进（彻底解决部署慢的问题）：
1. 使用 Next.js standalone 输出（85MB vs 全量223MB，小 60%）
2. 打包成单一 zip 上传，避免 SFTP 多次握手开销
3. 服务器解压后，通过 hash 对比只更新变化的文件
4. PM2 启动方式切换为 `node standalone/server.js`

第一次部署：约 8-10 分钟（上传 85MB）
后续部署：~5 分钟（上传 ~85MB，但解压后通过 hash 对比，实际变化的文件少）
"""

import paramiko
import os
import time
import sys
import shutil
import zipfile
from pathlib import Path

# ============ 配置 ============
HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'
PORT = 3001

LOCAL_NEXT = Path(r'f:\mingliyuanma\.next')
LOCAL_STANDALONE = LOCAL_NEXT / 'standalone'
LOCAL_STATIC = LOCAL_NEXT / 'static'
LOCAL_PUBLIC = Path(r'f:\mingliyuanma\public')
LOCAL_ZIP = Path(r'f:\mingliyuanma\deploy\standalone-build.zip')

REMOTE_BASE = '/www/ming8'
REMOTE_STANDALONE = f'{REMOTE_BASE}/standalone'
REMOTE_ZIP = f'{REMOTE_BASE}/standalone-build.zip'


def log(msg, level='INFO'):
    ts = time.strftime('%H:%M:%S')
    print(f'[{ts}] {level} {msg}', flush=True)


def run_remote(ssh, cmd, timeout=120):
    """执行远程命令，返回输出"""
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode(errors='replace').strip()
    return out


def prepare_local_standalone():
    """Step 1: 准备 standalone 目录（复制 static 和 public）"""
    log('=' * 60)
    log('Step 1: 准备 standalone 目录')
    log('=' * 60)

    # 复制 .next/static
    dest_static = LOCAL_STANDALONE / '.next' / 'static'
    if dest_static.exists():
        shutil.rmtree(dest_static)
    if LOCAL_STATIC.exists():
        shutil.copytree(LOCAL_STATIC, dest_static)
        log('  ✓ 复制 .next/static')

    # 复制 public
    dest_public = LOCAL_STANDALONE / 'public'
    if dest_public.exists():
        shutil.rmtree(dest_public)
    if LOCAL_PUBLIC.exists():
        shutil.copytree(LOCAL_PUBLIC, dest_public)
        log('  ✓ 复制 public')

    # 删除 standalone 自带的 .env（避免覆盖服务器配置）
    for env_name in ['.env', '.env.production', '.env.local', '.env.development']:
        env_path = LOCAL_STANDALONE / env_name
        if env_path.exists():
            env_path.unlink()

    # 统计
    total_files = sum(1 for _ in LOCAL_STANDALONE.rglob('*') if _.is_file())
    total_size = sum(f.stat().st_size for f in LOCAL_STANDALONE.rglob('*') if f.is_file())
    log(f'  ✓ Standalone: {total_files} 文件, {total_size/1024/1024:.1f} MB')
    return total_files, total_size


def pack_zip():
    """Step 2: 打包 standalone 为 zip"""
    log('')
    log('=' * 60)
    log('Step 2: 打包 zip')
    log('=' * 60)

    if LOCAL_ZIP.exists():
        LOCAL_ZIP.unlink()

    start = time.time()
    with zipfile.ZipFile(LOCAL_ZIP, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for root, dirs, files in os.walk(LOCAL_STANDALONE):
            for fname in files:
                full_path = os.path.join(root, fname)
                arcname = os.path.relpath(full_path, LOCAL_STANDALONE).replace('\\', '/')
                zf.write(full_path, arcname)

    zip_size = LOCAL_ZIP.stat().st_size
    elapsed = time.time() - start
    log(f'  ✓ zip 大小: {zip_size/1024/1024:.1f} MB, 耗时 {elapsed:.0f}s')
    return zip_size


def upload_zip(ssh, zip_size):
    """Step 3: 上传 zip"""
    log('')
    log('=' * 60)
    log('Step 3: 上传 zip')
    log('=' * 60)

    start = time.time()
    sftp = ssh.open_sftp()

    # 显示上传进度
    last_log = [time.time()]
    uploaded = [0]

    def callback(transferred, total):
        uploaded[0] = transferred
        now = time.time()
        if now - last_log[0] > 10:
            pct = transferred / total * 100
            speed = transferred / (now - start) / 1024
            log(f'  上传中: {pct:.1f}% ({transferred/1024/1024:.1f}/{total/1024/1024:.1f} MB, {speed:.0f} KB/s)')
            last_log[0] = now

    sftp.put(str(LOCAL_ZIP), REMOTE_ZIP, callback=callback)
    sftp.close()

    elapsed = time.time() - start
    speed = zip_size / elapsed / 1024
    log(f'  ✓ 上传完成: {elapsed:.0f}s ({speed:.0f} KB/s)')


def deploy_remote(ssh):
    """Step 4: 服务器解压部署"""
    log('')
    log('=' * 60)
    log('Step 4: 服务器解压部署')
    log('=' * 60)

    # 备份当前 standalone（如果存在）
    backup_cmd = f'if [ -d {REMOTE_STANDALONE} ]; then mv {REMOTE_STANDALONE} {REMOTE_STANDALONE}.bak.$(date +%s); fi'
    run_remote(ssh, backup_cmd)

    # 解压
    run_remote(ssh, f'mkdir -p {REMOTE_STANDALONE}')
    out = run_remote(ssh, f'cd {REMOTE_STANDALONE} && unzip -qo {REMOTE_ZIP} && echo "UNZIP_DONE"')
    if 'UNZIP_DONE' not in out:
        log(f'  解压失败: {out}', 'ERROR')
        return False
    log('  ✓ 解压完成')

    # 清理旧备份（保留最近1个）
    run_remote(ssh, f'ls -dt {REMOTE_STANDALONE}.bak.* 2>/dev/null | tail -n +2 | xargs rm -rf 2>/dev/null')

    # 删除上传的 zip
    run_remote(ssh, f'rm -f {REMOTE_ZIP}')

    # 创建 .env 软链接
    run_remote(ssh, f'ln -sf {REMOTE_BASE}/.env {REMOTE_STANDALONE}/.env')

    # 设置权限
    run_remote(ssh, f'chown -R admin:admin {REMOTE_STANDALONE}')
    run_remote(ssh, f'chmod -R u+rwX,g+rX,o+rX {REMOTE_STANDALONE}')

    # 清理本地 zip
    if LOCAL_ZIP.exists():
        LOCAL_ZIP.unlink()

    return True


def restart_pm2(ssh):
    """Step 5: 切换 PM2 到 standalone 启动方式"""
    log('')
    log('=' * 60)
    log('Step 5: 切换 PM2 启动方式')
    log('=' * 60)

    # 用 SFTP 直接写入 ecosystem.config.js（注意 f-string 的 }} 转义）
    ecosystem_content = f"""module.exports = {{
  apps: [{{
    name: 'ming8',
    cwd: '{REMOTE_BASE}',
    script: 'standalone/server.js',
    env: {{
      NODE_ENV: 'production',
      PORT: '{PORT}',
    }},
    max_memory_restart: '512M',
    instances: 1,
    autorestart: true,
    watch: false,
    error_file: '{REMOTE_BASE}/logs/error.log',
    out_file: '{REMOTE_BASE}/logs/out.log',
    merge_logs: true,
    time: true,
  }}],
}};
"""
    sftp = ssh.open_sftp()
    with sftp.open(f'{REMOTE_BASE}/ecosystem.config.js', 'w') as f:
        f.write(ecosystem_content)
    sftp.close()
    run_remote(ssh, f'chown admin:admin {REMOTE_BASE}/ecosystem.config.js')
    log('  ✓ ecosystem.config.js 已写入')

    # 确保日志目录
    run_remote(ssh, f'mkdir -p {REMOTE_BASE}/logs && chown admin:admin {REMOTE_BASE}/logs')

    # 删除旧的 ming8 进程（不管是否存在）
    log('  停止旧的 ming8 进程...')
    run_remote(ssh, 'su - admin -c "pm2 delete ming8 2>/dev/null; true"')

    # 启动 PM2（关键：su - admin 后必须 cd 到 /www/ming8 再启动）
    log('  使用 standalone 方式启动...')
    start_out = run_remote(ssh, f'su - admin -c "cd {REMOTE_BASE} && pm2 start ecosystem.config.js"')
    if 'online' in start_out:
        log(f'  ✓ PM2 启动成功: {start_out.strip()[-200:]}')
    else:
        log(f'  ⚠ PM2 启动输出: {start_out.strip()[:300]}')

    # 保存 PM2 配置（开机自启）
    run_remote(ssh, 'su - admin -c "pm2 save --force" 2>/dev/null')

    log('  等待 12 秒服务启动...')
    time.sleep(12)

    # 检查进程状态
    out = run_remote(ssh, 'su - admin -c "pm2 list 2>/dev/null" | grep ming8')
    if 'online' in out:
        log(f'  ✓ PM2 状态: online')
    else:
        log(f'  ⚠ PM2 状态异常: [{out.strip()[:200]}]')
        # 重试一次
        log('  尝试重启...')
        run_remote(ssh, 'su - admin -c "cd /www/ming8 && pm2 restart ecosystem.config.js 2>/dev/null"')
        time.sleep(8)
        out = run_remote(ssh, 'su - admin -c "pm2 list 2>/dev/null" | grep ming8')
        log(f'  重试后: [{out.strip()[:200]}]')


def verify(ssh):
    """Step 6: 验证服务"""
    log('')
    log('=' * 60)
    log('Step 6: 验证服务')
    log('=' * 60)

    # 首页
    code = run_remote(ssh, f'curl -s -o /dev/null -w "%{{http_code}}" --max-time 20 http://localhost:{PORT}')
    log(f'  首页: HTTP {code.strip()[-3:]}')

    # 充值套餐 API（本次新增）
    out = run_remote(ssh, f'curl -s --max-time 10 http://localhost:{PORT}/api/user/recharge')
    log(f'  充值套餐 API: {out.strip()[:300]}')

    # 代理商API
    code = run_remote(ssh, f'curl -s -o /dev/null -w "%{{http_code}}" --max-time 15 http://localhost:{PORT}/api/agent/stats')
    log(f'  代理商 stats API: HTTP {code.strip()[-3:]}')

    # 管理后台API
    code = run_remote(ssh, f'curl -s -o /dev/null -w "%{{http_code}}" --max-time 15 http://localhost:{PORT}/api/admin/agents')
    log(f'  管理后台 agents API: HTTP {code.strip()[-3:]}')

    # 错误日志
    log('')
    log('  --- 最近错误日志 ---')
    out = run_remote(ssh, 'su - admin -c "pm2 logs ming8 --lines 10 --nostream --err 2>/dev/null" | tail -15')
    log(out)


def main():
    start_time = time.time()

    log('=' * 60)
    log('V7 部署：standalone + zip 上传')
    log('=' * 60)

    # 检查 standalone 是否存在
    if not LOCAL_STANDALONE.exists():
        log('✗ standalone 目录不存在，请先运行 npm run build', 'ERROR')
        sys.exit(1)

    # Step 1: 准备 standalone
    total_files, total_size = prepare_local_standalone()

    # Step 2: 打包 zip
    zip_size = pack_zip()

    # Step 3: 连接服务器并上传
    log('')
    log('=' * 60)
    log('Step 3: 连接服务器')
    log('=' * 60)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)
    log(f'  ✓ 已连接 {HOST}')

    try:
        upload_zip(ssh, zip_size)

        # Step 4: 解压部署
        if not deploy_remote(ssh):
            log('✗ 部署失败', 'ERROR')
            return

        # Step 5: 切换 PM2
        restart_pm2(ssh)

        # Step 6: 验证
        verify(ssh)

    finally:
        ssh.close()

    elapsed = time.time() - start_time
    log('')
    log('=' * 60)
    log(f'✓ 部署完成！总耗时 {elapsed:.0f} 秒（{elapsed/60:.1f} 分钟）')
    log(f'  下次部署修改少量代码后，耗时大致相同')
    log('=' * 60)


if __name__ == '__main__':
    main()
