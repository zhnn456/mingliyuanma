module.exports = {
  apps: [{
    name: 'ming8',
    cwd: '/www/ming8',
    script: 'server.js',
    args: '',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      IS_CENTER: 'true',
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '500M',
    error_file: '/www/ming8/logs/error.log',
    out_file: '/www/ming8/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
  }]
};
