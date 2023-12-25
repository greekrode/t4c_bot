ECHO OFF
CD /D C:\Users\Administrator\Documents\Github\kangritel_botserver
pm2 restart index.js --name T4CBot_Server --watch --restart-delay=50 --time --exp-backoff-restart-delay=50