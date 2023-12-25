from telegram import ParseMode
from telebot.client import bot
from telebot.mongoclient import col

import csv
import pprint
import datetime
import imgkit    

now = datetime.datetime.today()
today_day_of_week = datetime.date.today().weekday()

def send_message(img) :
    bot.sendPhoto(
        chat_id = "-1001319739199",
        photo = open(img, "rb"),
        filename = "HakaClosingEOD.jpg",
        caption = "<b>EOD Closing (15.00-15.15) Strong Haka Power</b>\n\n<i>Kriteria</i>\n\n<code>Net Buy >= 500M\nGap up di closing max 1%\nC > Prev Low\nC > Prev VWAP\nC > VWAP\nC > O\nTrx Val >= 5B</code>",
        parse_mode =  ParseMode.HTML
    )

    bot.sendPhoto(
        chat_id = "-1001273825232",
        photo = open(img, "rb"),
        filename = "HakaClosingEOD.jpg",
        caption = "<b>EOD Closing (15.00-15.15) Strong Haka Power</b>\n\n<i>Kriteria</i>\n\n<code>Net Buy >= 500M\nGap up di closing max 1%\nC > Prev Low\nC > Prev VWAP\nC > VWAP\nC > O\nTrx Val >= 5B</code>",
        parse_mode =  ParseMode.HTML
    )

    bot.sendPhoto(
        chat_id = "-1001574613054",
        photo = open(img, "rb"),
        filename = "HakaClosingEOD.jpg",
        caption = "<b>EOD Closing (15.00-15.15) Strong Haka Power</b>\n\n<i>Kriteria</i>\n\n<code>Net Buy >= 500M\nGap up di closing max 1%\nC > Prev Low\nC > Prev VWAP\nC > VWAP\nC > O\nTrx Val >= 5B</code>",
        parse_mode =  ParseMode.HTML
    )

    bot.sendPhoto(
        chat_id = "-1001205124614",
        photo = open(img, "rb"),
        filename = "HakaClosingEOD.jpg",
        caption = "<b>EOD Closing (15.00-15.15) Strong Haka Power</b>\n\n<i>Kriteria</i>\n\n<code>Net Buy >= 500M\nGap up di closing max 1%\nC > Prev Low\nC > Prev VWAP\nC > VWAP\nC > O\nTrx Val >= 5B</code>",
        parse_mode =  ParseMode.HTML
    )


imgkit.from_file("C:\Users\Administrator\Documents\Amiexport\HakaClosingEOD.html", "C:\Users\Administrator\Documents\Amiexport\HakaClosingEOD.jpg")
if today_day_of_week < 5 :
    send_message("C:\Users\Administrator\Documents\Amiexport\HakaClosingEOD.jpg")
