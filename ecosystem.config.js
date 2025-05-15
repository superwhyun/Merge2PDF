module.exports = {
  apps: [
    {
      name: 'merge2pdf',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
