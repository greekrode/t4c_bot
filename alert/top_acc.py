from telegram import ParseMode
from telebot.client import bot

import csv
import pprint
import itertools
import datetime
import math
import json
import requests

def jprint(obj):
    # create a formatted string of the Python JSON object
    text = json.dumps(obj, sort_keys=True, indent=4)
    print(text)

acc_list = []
dist_list = []
with open('D:/Documents/Github/kangritel_bot/ticker.csv', 'r') as file:
    reader = csv.reader(file)
    for row in reader :
        if len(row[0]) == 4 and row[0] != "LQ45" and row[0] != "JII7" and row[0] != "ISSI" and row[0] != "AGRI":
            url = "https://api.stockbit.com/v2.4/marketdetector/"
            res = requests.get(url +  row[0], 
                            headers = {
                                "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2MjQ1Mzk0MDcsImp0aSI6ImFzR29yXC9tRDdkRXhxS2JDbDBaR05nPT0iLCJpc3MiOiJTVE9DS0JJVCIsIm5iZiI6MTYyNDUzOTQwNywiZXhwIjoxNjI2MzUzODA3LCJkYXRhIjp7InVzZSI6ImthbmdyaXRlbCIsImVtYSI6ImthbmdyaXRlbEBnbWFpbC5jb20iLCJmdWwiOiJLYW5nIFJpdGVsIiwic2VzIjoidTlNTm5qM3d2UUlNNW9wWiIsImR2YyI6IiJ9fQ.LvoMd1X2NLG6qll9M3gUvvN7ViSKrOctJ_0PafScAes"
                            }
                            )
            try:
                if bool(res.json()["data"]) :
                    res_data = res.json()["data"]["bandar_detector"]
                    if bool(res_data) :
                        doc = {
                            'ticker' : row[0],
                            'bd_vol' : float(res_data["top3"]["vol"]),
                            'bd_val' : float(res_data["top3"]["amount"]),
                            'status' : res_data["top3"]["accdist"]
                        }
                        acc_list.append(doc)
            except KeyError:
                print(res.json())

# url = "https://api.stockbit.com/v2.4/marketdetector/"
# res = requests.get(url +  'TECH', 
#                 headers = {
#                     "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2MTkxNDQxNTksImp0aSI6Inp2eUhmQzFGaWF1N0Vud1psNmZpSkE9PSIsImlzcyI6IlNUT0NLQklUIiwibmJmIjoxNjE5MTQ0MTU5LCJleHAiOjE2MjA5NTg1NTksImRhdGEiOnsidXNlIjoia2FuZ3JpdGVsIiwiZW1hIjoia2FuZ3JpdGVsQGdtYWlsLmNvbSIsImZ1bCI6IkthbmcgUml0ZWwiLCJzZXMiOiJDbVZ0cVk0MmZ6Wlk3RVA3IiwiZHZjIjoiIn19.zu-F4UvW69hCWxuYVij6QdFIsLUA7GBRKiq8bItMhZI"
#                 }
#                 )
# jprint(bool(res.json()["data"]["bandar_detector"]))

jprint(doc)