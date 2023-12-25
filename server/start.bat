ECHO OFF
CD /D C:\Users\Administrator\Documents\Github\kangritel_bot\server
pm2 start index.js --name T4CBot_Server --watch --restart-delay=50 --time --exp-backoff-restart-delay=50