from telegram import ParseMode
from telebot.client import bot
from telebot.mongoclient import col

import csv
import pprint
import datetime

now = datetime.datetime.today()
begin_time1 = now.replace(hour = 9, minute = 00, second = 0)
begin_time2 = now.replace(hour = 13, minute = 30, second = 0)
end_time1 = now.replace(hour = 11, minute = 35, second = 0)
end_time2 = now.replace(hour = 15, minute = 35, second = 0)
today_day_of_week = datetime.date.today().weekday()
time_minute = int(now.strftime("%M"))


def send_message(title, text_message) :
    if len(text_message) > 0 :
        bot.sendMessage(
            chat_id = "-1001319739199",
            # chat_id = "229886930",
            text = title + text_message,
            parse_mode =  ParseMode.HTML
        )

        bot.sendMessage(
            chat_id = "-1001273825232",
            text = title + text_message,
            parse_mode =  ParseMode.HTML
        )

        bot.sendMessage(
            chat_id = "-1001205124614",
            text = title + text_message,
            parse_mode =  ParseMode.HTML
        )

def send_message_with_id(id, title, text_message) :
    if len(text_message) > 0 :
        bot.sendMessage(
            chat_id = id,
            text = title + text_message,
            parse_mode =  ParseMode.HTML
        )

def rebound() :
    with open("C:/Users/Administrator/Documents/Amiexport/ReboundAlert.csv", "r") as file :
        reader = csv.reader(file)
        next(reader)
        title = "<b>!!! Rebound EMA21 !!!</b>"
        text_message = ""
        
        for row in reader :
            text_message = text_message + "\n\n<b>" + row[0] + "</b>"
            text_message = text_message + "\nClose: " + row[3] +  "(" + row[4] + "%)"
            text_message = text_message + "\nEMA-8: " + row[5]
            text_message = text_message + "\nEMA-21: " + row[6]
            text_message = text_message + "\nTrx Val: " + row[7] + "B"
        
        send_message(title, text_message)

def haka() :
    with open("C:/Users/Administrator/Documents/Amiexport/HakaAlert.csv", "r") as file :
        reader = csv.reader(file)
        next(reader)
        title = "<b>!!! Super Haka Power !!!</b>"
        text_message = "" 
        
        for row in reader :
            text_message = text_message + "\n\n<b>" + row[0] + "</b>"
            text_message = text_message + "\nClose: " + row[3] +  "(" + row[4] + "%)"
            text_message = text_message + "\n<i>VWAP: " + row[5]
            text_message = text_message + "\nYVWAP: " + row[6]
            text_message = text_message + "\nYL: " + row[7]
            text_message = text_message + "\nYH: " + row[8] + "</i>"
        
        send_message(title, text_message)

def rebound_haka() :
    with open("C:/Users/Administrator/Documents/Amiexport/ReboundHaka.csv", "r") as file :
        reader = csv.reader(file)
        next(reader)
        title = "<b>!!! Rebound Haka Power !!!</b>"
        text_message = ""
        
        for row in reader :
            text_message = text_message + "\n\n<b>" + row[0] + "</b>"
            text_message = text_message + "\nClose: " + row[3] +  "(" + row[4] + "%)"
            text_message = text_message + "\n<i>VWAP: " + row[5]
            text_message = text_message + "\nYVWAP: " + row[6]
            text_message = text_message + "\nYL: " + row[7]
            text_message = text_message + "\nYH: " + row[8] + "</i>"
        
        send_message(title, text_message)

def breakout_haka() :
    with open("C:/Users/Administrator/Documents/Amiexport/HakaBreakout.csv", "r") as file :
        reader = csv.reader(file)
        next(reader)
        title = "<b>!!! Breakout Haka Power !!!</b>"
        text_message = ""
        
        for row in reader :
            text_message = text_message + "\n\n<b>" + row[0] + "</b>"
            text_message = text_message + "\nClose: " + row[3] +  "(" + row[4] + "%)"
            text_message = text_message + "\n<i>VWAP: " + row[5]
            text_message = text_message + "\nYVWAP: " + row[6]
            text_message = text_message + "\nYL: " + row[7]
            text_message = text_message + "\nYH: " + row[8] + "</i>"
        
        send_message(title, text_message)
        
def generate_scalping_message(row, text_message, flag): 
    text_message = text_message + "\n\n<b>" + row[0] + "</b>"
    if flag == "new" :
        text_message = text_message + "<i> **NEW**</i>"
    text_message = text_message + "\nLast Price: " + row[1] + " (" + row[2] + "%)"
    text_message = text_message + "\nEntry Area: " + row[3] + " - " + row[4]
    text_message = text_message + "\nATR: " + row[5]

    return text_message

def scalping() :
    with open("C:/Users/Administrator/Documents/Amiexport/ScalpingAlert.csv", "r") as file :
        reader = csv.reader(file)
        next(reader)
        title = "<b>!!! Scalping Pertamax !!!</b>"
        text_message = ""
        
        for row in reader :
            query = { "ticker" : row[0], "type" : "SCALPING" }
            doc = { "ticker" : row[0], "type" : "SCALPING", "date" : datetime.datetime.today()}
            if col.count_documents(query) == 0 :
                col.insert_one(doc)
                text_message = generate_scalping_message(row, text_message, "new")
            else :
                data = col.find_one(query)
                current = data["date"]
                date_diff = now - current
                if date_diff.days >= 1 :
                    col.delete_one(query)
                    col.insert_one(doc)
                    text_message = generate_scalping_message(row, text_message, "new")
                else :
                    text_message = generate_scalping_message(row, text_message, "")
        
        send_message_with_id("-1001193853425", title, text_message)
        send_message_with_id("-1001293443224", title, text_message)

if today_day_of_week < 5 and ( (now > begin_time1 and now < end_time1) or  (now > begin_time2 and now < end_time2) ):
    # rebound()
    haka()
    rebound_haka()
    breakout_haka()
    if time_minute % 15 <= 2:
        scalping()