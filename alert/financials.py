from telegram import ParseMode
from telebot.client import bot
from telebot.mongoclient import col

import csv
import pprint
import datetime
import imgkit    

def send_message(img) :
    bot.sendPhoto(
        chat_id = "229886930",
        photo = open(img, "rb"),
        filename = "HakaClosingEOD.jpg",
        caption = "<b>EOD Closing (15.00-15.15) Strong Haka Power</b>\n\n<i>Kriteria</i>\n\n<code>Net Buy >= 500M\nGap up di closing max 1%\nC > Prev Low\nC > Prev VWAP\nC > VWAP\nC > O\nTrx Val >= 5B</code>",
        parse_mode =  ParseMode.HTML
    )

imgkit.from_file("C:\Users\Administrator\Documents\Github\kangritel_bot/tv_financials.html", "C:\Users\Administrator\Documents\Github\kangritel_bot/tv_financials.jpg")
send_message("C:\Users\Administrator\Documents\Github\kangritel_bot/tv_financials.jpg")