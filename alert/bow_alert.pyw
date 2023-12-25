from telegram import ParseMode
from telebot.client import bot
from telebot.mongoclient import col

import csv
import datetime

text_message = ''
now = datetime.datetime.today()
begin_time = now.replace(hour = 9, minute = 15, second = 0)
end_time = now.replace(hour = 15, minute = 35, second = 0)
today_day_of_week = datetime.datetime.today().weekday()

def generate_message(row, text_message):
    text_message = text_message + '\n\n<b>' + row[0] + ' (' + row[1] + ')</b>';
    text_message = text_message + '\n\nClose: ' + row[3];
    text_message = text_message + '\nPrev. Close: ' + row[4];
    text_message = text_message + '\nDrop Bars: ' + row[5] + ' - Drop Pct: ' + row[6] + '%';
    text_message = text_message + '\nTrx. Value: ' + row[7] + 'B';
    text_message = text_message + '\nVWAP: ' + row[8];
    text_message = text_message + '\n\n<code>Trading Plan';
    text_message = text_message + '\nTP1: ' + row[11] + '\nTP2: ' + row[12] + '\nTP3: ' + row[13];
    text_message = text_message + '\nSL: ' + row[10];
    text_message = text_message + '\nMax Buy: ' + row[14];
    text_message = text_message + '\nRisk Reward Ratio: ' + row[15];
    text_message = text_message + '\nSizing: ' + row[16] + '</code>';
    return text_message

if today_day_of_week < 5 and now > begin_time and now < end_time:
    with open('C:/Users/Administrator/Documents/Amiexport/BuyOnWaterfall.csv', 'r') as file:
        reader = csv.reader(file)
        next(reader)
        for row in reader :
            if row[9] == "BUY NOW" :
                query = { "ticker" : row[0], "type" : "BOW" }
                doc = { "ticker" : row[0], "type" : "BOW", "date" : datetime.datetime.today()}
                if col.count_documents(query) == 0 :
                    col.insert_one(doc)
                    text_message = generate_message(row, text_message)
                else :
                    data = col.find_one(query)
                    current = data["date"]
                    date_diff = now - current
                    if date_diff.days >= 1 :
                        col.delete_one(query)
                        col.insert_one(doc)
                        text_message = generate_message(row, text_message)

    if len(text_message) > 0 :
        title = '<b>!!! Buy On Waterfall !!!</b>'
        bot.sendMessage(
            chat_id = "-520085542",
            text = title + text_message,
            parse_mode = ParseMode.HTML
        )
        
        bot.sendMessage(
            chat_id = "-1001489519583",
            text = title + text_message,
            parse_mode = ParseMode.HTML
        )

        # bot.sendMessage(
        #     chat_id = "-1001574613054",
        #     text = title + text_message,
        #     parse_mode =  ParseMode.HTML
        # )

        # bot.sendMessage(
        #     chat_id = "-1001205124614",
        #     text = title + text_message,
        #     parse_mode =  ParseMode.HTML
        # )