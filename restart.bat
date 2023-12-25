ECHO OFF
CD /D D:\Documents\GitHub\kangritel_bot
pm2 restart index.js --name Amibot --watch --restart-delay=50 --time --exp-backoff-restart-delay=50