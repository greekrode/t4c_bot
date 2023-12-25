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

def send_message(title, text_message) :
    if len(text_message) > 0 :
        bot.sendMessage(
            chat_id = "-1001193853425",
            # chat_id = "229886930",
            text = title + text_message,
            parse_mode =  ParseMode.HTML
        )


def scalping() :
    with open("C:/Users/Administrator/Documents/Amiexport/ScalpingAlert.csv", "r") as file :
        reader = csv.reader(file)
        next(reader)
        title = "<b>!!! Scalping Pertamax !!!</b>"
        text_message = ""
        
        for row in reader :
            text_message = text_message + "\n\n<b>" + row[0] + "</b>"
            text_message = text_message + "\nClose: " + row[1] + " (" + row[2] + "%)"
            text_message = text_message + "\nEntry Area: " + row[4] + " - " + row[3]
            text_message = text_message + "\nATR: " + row[5]
        
        send_message(title, text_message)

if today_day_of_week < 5 and ( (now > begin_time1 and now < end_time1) or  (now > begin_time2 and now < end_time2) ):
    scalping()