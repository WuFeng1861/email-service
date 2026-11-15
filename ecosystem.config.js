// instances 必须为 1 / fork —— 发送队列处理器是进程内定时器，
// 多实例会把同一封 pending 邮件并发发两次。
// 日志目录由部署脚本通过 PM_LOG_DIR 注入；改了 --home / --run-user 也不会写错地方
const path = require('path');
const LOG_DIR = process.env.PM_LOG_DIR || '/home/nodeapp/logs';

module.exports = {
  apps: [
    {
      name: 'email-server',
      cwd: __dirname,
      script: 'dist/main.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',

      autorestart: true,
      max_restarts: 20,
      min_uptime: '10s',
      restart_delay: 3000,
      max_memory_restart: '400M',
      kill_timeout: 8000,
      listen_timeout: 15000,

      node_args: '--max-old-space-size=384',

      env: {
        NODE_ENV: 'production',
      },

      out_file: path.join(LOG_DIR, 'email-server-out.log'),
      error_file: path.join(LOG_DIR, 'email-server-error.log'),
      merge_logs: true,
      time: true,
    },
  ],
};
