ECHO OFF
CD /D C:\Users\Administrator\Documents\Github\kangritel_bot
call pm2 start index.js --name Amibot --watch --restart-delay=50 --time --exp-backoff-restart-delay=50
call pm2 start worker.js --name Worker --watch --restart-delay=50 --time --exp-backoff-restart-delay=50