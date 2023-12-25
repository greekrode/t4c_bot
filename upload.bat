@ECHO OFF
CD /D C:\Users\Administrator\Documents\Github\kangritel_bot
echo kangritel39 | pscp -P 2022 -pw kangritel39 indices.csv kangritel@172.16.25.89:/home/kangritel/stocks
echo kangritel39 | pscp -P 2022 -pw kangritel39 tickers.csv kangritel@172.16.25.89:/home/kangritel/stocks