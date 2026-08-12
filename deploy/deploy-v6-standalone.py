"""
V6 部署脚本：standalone + 增量 SFTP 上传

核心改进：
1. 使用 Next.js standalone 输出（85MB vs 全量223MB）
2. 增量上传：只传 hash 变化的文件（修改一行代码，通常只传几 KB-几 MB）
3. 自动清理服务器上已删除的旧 chunks
4. PM2 启动方式切换为 `node standalone/server.js`

部署后服务器目录结构：
/www/ming8/
├── standalone/              # 主程序（增量同步）
│   ├── server.js
│   ├── node_modules/
│   ├── .next/server/        # 服务端 bundles
│   ├── .next/static/        # 客户端静态资源
│   ├── .next/BUILD_ID
│   └── public/               # 公共资源
├── .env                     # 环境变量（保留不上传）
├── ecosystem.config.js      # PM2 配置（保留）
└── logs/
"""

import paramiko
import os
import hashlib
import time
import sys
import shutil
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

REMOTE_BASE = '/www/ming8'
REMOTE_STANDALONE = f'{REMOTE_BASE}/standalone'

# 跳过上传的文件（服务器上有自己的版本）
SKIP_FILES = {'.env', '.env.production', '.env.local', '.env.development'}

# 跳过的目录（避免误删或冗余上传）
SKIP_DIRS = {'standalone\\.next\\cache', 'standalone\\trace'}


def log(msg, level='INFO'):
    ts = time.strftime('%H:%M:%S')
    print(f'[{ts}] {level} {msg}', flush=True)


def local_md5(file_path):
    """计算文件 MD5"""
    h = hashlib.md5()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


def prepare_local_standalone():
    """Step 1: 把 .next/static 和 public 复制到 standalone 里"""
    log('=' * 60)
    log('Step 1: 准备 standalone 目录')
    log('=' * 60)

    # 复制 .next/static
    dest_static = LOCAL_STANDALONE / '.next' / 'static'
    if dest_static.exists():
        shutil.rmtree(dest_static)
    if LOCAL_STATIC.exists():
        shutil.copytree(LOCAL_STATIC, dest_static)
        log(f'✓ 已复制 .next/static -> standalone/.next/static')

    # 复制 public
    dest_public = LOCAL_STANDALONE / 'public'
    if dest_public.exists():
        shutil.rmtree(dest_public)
    if LOCAL_PUBLIC.exists():
        shutil.copytree(LOCAL_PUBLIC, dest_public)
        log(f'✓ 已复制 public -> standalone/public')

    # 删除 standalone 自带的 .env（避免覆盖服务器配置）
    for env_name in SKIP_FILES:
        env_path = LOCAL_STANDALONE / env_name
        if env_path.exists():
            env_path.unlink()
            log(f'✓ 删除 standalone 内的 {env_name}（用服务器的）')

    # 统计
    total_files = sum(1 for _ in LOCAL_STANDALONE.rglob('*') if _.is_file())
    total_size = sum(f.stat().st_size for f in LOCAL_STANDALONE.rglob('*') if f.is_file())
    log(f'✓ Standalone 准备完成: {total_files} 个文件, {total_size/1024/1024:.1f} MB')


def collect_local_files():
    """Step 2: 收集本地所有文件 + MD5"""
    log('')
    log('=' * 60)
    log('Step 2: 计算本地文件 hash')
    log('=' * 60)

    files = {}  # rel_path -> (size, md5)
    for root, dirs, files_list in os.walk(LOCAL_STANDALONE):
        for fname in files_list:
            full_path = os.path.join(root, fname)
            rel_path = os.path.relpath(full_path, LOCAL_STANDALONE).replace('\\', '/')
            if rel_path in SKIP_FILES:
                continue
            # 跳过 cache 和 trace
            if 'cache/' in rel_path or 'trace/' in rel_path:
                continue
            try:
                size = os.path.getsize(full_path)
                md5 = local_md5(full_path)
                files[rel_path] = (size, md5)
            except Exception as e:
                log(f'  跳过 {rel_path}: {e}', 'WARN')

    log(f'✓ 本地文件总数: {len(files)}')
    return files


def connect_ssh():
    """Step 3: 连接服务器"""
    log('')
    log('=' * 60)
    log('Step 3: 连接服务器')
    log('=' * 60)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)
    log(f'✓ 已连接 {HOST}')
    return ssh


def run_remote(ssh, cmd, timeout=60):
    """执行远程命令"""
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode(errors='replace').strip()
    err = stderr.read().decode(errors='replace').strip()
    return out, err


def collect_remote_files(ssh):
    """Step 4: 收集服务器现有文件"""
    log('')
    log('=' * 60)
    log('Step 4: 收集服务器文件清单')
    log('=' * 60)

    # 先确保目录存在
    run_remote(ssh, f'mkdir -p {REMOTE_STANDALONE}')

    # 用 find + stat 输出 "relpath|size" 格式
    cmd = f'cd {REMOTE_STANDALONE} && find . -type f -not -path "./.env*" -not -path "*/cache/*" -not -path "*/trace/*" -exec stat -c "%n|%s" {{}} \\; 2>/dev/null'
    out, _ = run_remote(ssh, cmd, timeout=120)

    files = {}  # rel_path -> size
    for line in out.split('\n'):
        if not line or '|' not in line:
            continue
        parts = line.split('|', 1)
        if len(parts) != 2:
            continue
        path, size_str = parts
        rel_path = path.lstrip('./').replace('\\', '/')
        try:
            size = int(size_str)
            files[rel_path] = size
        except ValueError:
            continue

    log(f'✓ 服务器文件总数: {len(files)}')
    return files


def upload_diff(ssh, local_files, remote_files):
    """Step 5: 增量上传变化的文件"""
    log('')
    log('=' * 60)
    log('Step 5: 增量上传')
    log('=' * 60)

    sftp = ssh.open_sftp()
    uploaded = 0
    skipped = 0
    total_bytes = 0

    for rel_path, (size, md5) in local_files.items():
        remote_path = f'{REMOTE_STANDALONE}/{rel_path}'

        # 检查是否需要上传：服务器没有、或 size 不一致
        if rel_path in remote_files and remote_files[rel_path] == size:
            skipped += 1
            continue

        # 创建目录
        remote_dir = os.path.dirname(remote_path)
        try:
            run_remote(ssh, f'mkdir -p "{remote_dir}"', timeout=10)
        except Exception:
            pass

        # 上传
        local_path = os.path.join(LOCAL_STANDALONE, rel_path.replace('/', os.sep))
        try:
            sftp.put(local_path, remote_path)
            uploaded += 1
            total_bytes += size
            if uploaded <= 5 or uploaded % 50 == 0:
                log(f'  [{uploaded}] 上传 {rel_path} ({size/1024:.1f} KB)')
        except Exception as e:
            log(f'  ✗ 上传失败 {rel_path}: {e}', 'ERROR')

    sftp.close()
    log(f'✓ 新增/更新: {uploaded} 个文件 ({total_bytes/1024/1024:.2f} MB)')
    log(f'✓ 跳过未变化: {skipped} 个文件')


def cleanup_deleted(ssh, local_files, remote_files):
    """Step 6: 删除服务器上已不存在的文件"""
    log('')
    log('=' * 60)
    log('Step 6: 清理已删除的旧文件')
    log('=' * 60)

    deleted = 0
    for rel_path in remote_files:
        if rel_path not in local_files:
            remote_path = f'{REMOTE_STANDALONE}/{rel_path}'
            try:
                run_remote(ssh, f'rm -f "{remote_path}"', timeout=10)
                deleted += 1
                if deleted <= 5:
                    log(f'  删除 {rel_path}')
            except Exception as e:
                log(f'  ✗ 删除失败 {rel_path}: {e}', 'WARN')

    log(f'✓ 清理旧文件: {deleted} 个')


def restart_pm2(ssh):
    """Step 7: 切换 PM2 到 standalone 启动方式"""
    log('')
    log('=' * 60)
    log('Step 7: 切换 PM2 启动方式')
    log('=' * 60)

    # 设置权限
    run_remote(ssh, f'chown -R admin:admin {REMOTE_STANDALONE}')
    run_remote(ssh, f'chmod -R u+rwX,g+rX,o+rX {REMOTE_STANDALONE}')

    # 创建 .env 软链接（让 standalone/server.js 能读到服务器 .env）
    run_remote(ssh, f'ln -sf {REMOTE_BASE}/.env {REMOTE_STANDALONE}/.env')

    # 创建 ecosystem 配置文件（cwd 设为 /www/ming8 以加载 .env）
    ecosystem_content = f'''module.exports = {{
  apps: [{{
    name: 'ming8',
    cwd: '{REMOTE_BASE}',
    script: 'standalone/server.js',
    env: {{
      NODE_ENV: 'production',
      PORT: {PORT},
    }},
    max_memory_restart: '512M',
    instances: 1,
    autorestart: true,
    watch: false,
    error_file: '{REMOTE_BASE}/logs/error.log',
    out_file: '{REMOTE_BASE}/logs/out.log',
    merge_logs: true,
    time: true,
  }},
}};
'''
    cmd = f"cat > {REMOTE_BASE}/ecosystem.config.js << 'EOF'\n{ecosystem_content}EOF"
    run_remote(ssh, cmd)
    run_remote(ssh, f'chown admin:admin {REMOTE_BASE}/ecosystem.config.js')

    # 确保日志目录存在
    run_remote(ssh, f'mkdir -p {REMOTE_BASE}/logs && chown admin:admin {REMOTE_BASE}/logs')

    # 切换流程：先 stop + delete 旧的，再用新配置 start
    log('  停止旧的 ming8 进程...')
    run_remote(ssh, 'su - admin -c "pm2 stop ming8 2>/dev/null"')
    run_remote(ssh, 'su - admin -c "pm2 delete ming8 2>/dev/null"')

    log('  使用 standalone 方式启动...')
    run_remote(ssh, f'cd {REMOTE_BASE} && su - admin -c "pm2 start ecosystem.config.js"')

    # 保存 PM2 配置（开机自启）
    run_remote(ssh, 'su - admin -c "pm2 save" 2>/dev/null')

    log('等待 10 秒服务启动...')
    time.sleep(10)

    # 检查进程状态
    out, _ = run_remote(ssh, 'su - admin -c "pm2 list 2>/dev/null" | grep ming8')
    log(f'  PM2 状态: {out.strip()[:200]}')


def verify(ssh):
    """Step 8: 验证服务"""
    log('')
    log('=' * 60)
    log('Step 8: 验证服务')
    log('=' * 60)

    # 首页
    out, _ = run_remote(ssh, f'curl -s -o /dev/null -w "%{{http_code}}" --max-time 20 http://localhost:{PORT}')
    log(f'  首页 HTTP: {out.strip()[-3:]}')

    # 代理商API
    out, _ = run_remote(ssh, f'curl -s -o /dev/null -w "%{{http_code}}" --max-time 15 http://localhost:{PORT}/api/agent/stats')
    log(f'  代理商 stats API: {out.strip()[-3:]}')

    # 管理后台API
    out, _ = run_remote(ssh, f'curl -s -o /dev/null -w "%{{http_code}}" --max-time 15 http://localhost:{PORT}/api/admin/agents')
    log(f'  管理后台 agents API: {out.strip()[-3:]}')

    # 充值套餐 API（本次新增）
    out, _ = run_remote(ssh, f'curl -s --max-time 10 http://localhost:{PORT}/api/user/recharge')
    log(f'  充值套餐 API: {out.strip()[:200]}')

    # 错误日志
    log('')
    log('--- 最近错误日志 ---')
    out, _ = run_remote(ssh, 'su - admin -c "pm2 logs ming8 --lines 8 --nostream --err 2>/dev/null" | tail -15')
    log(out)


def main():
    start_time = time.time()

    log('=' * 60)
    log('V6 部署：standalone + 增量 SFTP')
    log('=' * 60)

    # Step 1: 准备 standalone
    if not LOCAL_STANDALONE.exists():
        log('✗ standalone 目录不存在，请先运行 npm run build', 'ERROR')
        sys.exit(1)
    prepare_local_standalone()

    # Step 2: 收集本地文件
    local_files = collect_local_files()

    # Step 3: 连接服务器
    ssh = connect_ssh()

    try:
        # Step 4: 收集服务器文件
        remote_files = collect_remote_files(ssh)

        # Step 5: 增量上传
        upload_diff(ssh, local_files, remote_files)

        # Step 6: 清理已删除
        cleanup_deleted(ssh, local_files, remote_files)

        # Step 7: 重启 PM2
        restart_pm2(ssh)

        # Step 8: 验证
        verify(ssh)

    finally:
        ssh.close()

    elapsed = time.time() - start_time
    log('')
    log('=' * 60)
    log(f'✓ 部署完成！耗时 {elapsed:.0f} 秒')
    log('=' * 60)


if __name__ == '__main__':
    main()
