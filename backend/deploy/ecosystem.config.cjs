module.exports = {
  apps: [
    {
      name: 'manufacture-backend',
      cwd: '/srv/manufacture/backend',
      script: 'src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '350M',
      listen_timeout: 10000,
      kill_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
