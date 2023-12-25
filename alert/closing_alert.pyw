from telegram import ParseMode
from telebot.client import bot
from telebot.mongoclient import col

import csv
import pprint
import datetime
import imgkit  

now = datetime.datetime.today()
begin_time1 = now.replace(hour = 14, minute = 30, second = 0)
begin_time2 = now.replace(hour = 15, minute = 0, second = 0)
end_time1 = now.replace(hour = 15, minute = 0, second = 0)
end_time2 = now.replace(hour = 15, minute = 5, second = 0)
today_day_of_week = datetime.date.today().weekday()

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
            chat_id = "-1001574613054",
            text = title + text_message,
            parse_mode =  ParseMode.HTML
        )

        bot.sendMessage(
            chat_id = "-1001205124614",
            text = title + text_message,
            parse_mode =  ParseMode.HTML
        )

def jjs() :
    with open('C:/Users/Administrator/Documents/Amiexport/JajanSore.csv', 'r') as file :
        reader = csv.reader(file)
        next(reader)
        title = '<b>!!! Jajan Sore !!!</b>'
        text_message = ''
        
        for row in reader :
            text_message = text_message + '\n\n<b>' + row[0] + '</b>'
            text_message = text_message + '\nClose: ' + row[3] +  '(' + row[4] + '%)'
            text_message = text_message + '\nVol MA20 Break: ' + row[5]
            text_message = text_message + '\nTrx. Val: ' + row[7] + 'B'
        
        send_message(title, text_message)

def near_closing_haka() :
    with open('C:/Users/Administrator/Documents/Amiexport/HakaClosing.csv', 'r') as file :
        reader = csv.reader(file)
        next(reader)
        title = '<b>!!! Near Closing Haka Power !!!</b>'
        text_message = ''
        
        for row in reader :
            text_message = text_message + '\n\n<b>' + row[0] + '</b>'
            text_message = text_message + '\nClose: ' + row[3] +  '(' + row[4] + '%)'
            text_message = text_message + '\n<i>VWAP: ' + row[5]
            text_message = text_message + '\nYVWAP: ' + row[6]
            text_message = text_message + '\nYL: ' + row[7]
            text_message = text_message + '\nYH: ' + row[8] + '</i>'
        
        send_message(title, text_message)

def kamar_gelap_haka() :
    with open('C:/Users/Administrator/Documents/Amiexport/HakaKamarGelap.csv', 'r') as file :
        reader = csv.reader(file)
        next(reader)
        title = '<b>!!! Pre-Closing (Kamar Gelap) Haka Power !!!</b>'
        text_message = ''
        
        for row in reader :
            text_message = text_message + '\n\n<b>' + row[0] + '</b>'
            text_message = text_message + '\nClose: ' + row[3] +  '(' + row[4] + '%)'
            text_message = text_message + '\n<i>VWAP: ' + row[5]
            text_message = text_message + '\nYVWAP: ' + row[6]
            text_message = text_message + '\nYL: ' + row[7]
            text_message = text_message + '\nYH: ' + row[8] + '</i>'
        
        send_message(title, text_message)

if today_day_of_week < 5 :
    if now > begin_time1 and now < end_time1 :
        jjs()
        near_closing_haka()
    elif now > begin_time2 and now < end_time2 :
        kamar_gelap_haka()
