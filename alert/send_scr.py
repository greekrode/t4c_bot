from telebot.credentials import bot_token, bot_user_name

import pymongo 
import ssl
import csv
import pprint
import datetime
import telegram
import time

global bot
global TOKEN
TOKEN = bot_token
bot = telegram.Bot(token=TOKEN)

bot.sendDocument(
    chat_id = "-1001197862158",
    document = open("C:/Users/Administrator/Documents/Amiexport/StochStatus.html", "rb"),
    filename = "Stoch Status.html",
    caption = "T4C Bot Screener - Stoch Status"
)
time.sleep(1)
bot.sendDocument(
    chat_id = "-1001197862158",
    document = open("C:/Users/Administrator/Documents/Amiexport/MACDStrat.html", "rb"),
    filename = "MACD Strategy.html",
    caption = "T4C Bot Screener - MACD Strategy" 
)
time.sleep(1)
bot.sendDocument(
    chat_id = "-1001197862158",
    document = open("C:/Users/Administrator/Documents/Amiexport/GC-EMA8-MA20.html", "rb"),
    filename = "EMA8 & MA20 Golden Cross.html",
    caption = "T4C Bot Screener - EMA8 & MA20 Golden Cross"
)
time.sleep(1)
bot.sendDocument(
    chat_id = "-1001197862158",
    document = open("C:/Users/Administrator/Documents/Amiexport/Signal.html", "rb"),
    filename = "Trading Signal.html",
    caption = "T4C Bot Screener - Trading Signal"
)
time.sleep(1)
bot.sendDocument(
    chat_id = "-1001197862158",
    document = open("C:/Users/Administrator/Documents/Amiexport/GatorMFI.html", "rb"),
    filename = "Alligator + BW MFI.html",
    caption = "T4C Bot Screener - Alligator + BW MFI"
)
time.sleep(1)
bot.sendDocument(
    chat_id = "-1001197862158",
    document = open("C:/Users/Administrator/Documents/Amiexport/MATrade.html", "rb"),
    filename = "MA Based Trading.html",
    caption = "T4C Bot Screener - MA Based Trading"
)
time.sleep(1)
bot.sendDocument(
    chat_id = "-1001197862158",
    document = open("C:/Users/Administrator/Documents/Amiexport/PriceVolUp.html", "rb"),
    filename = "Price and Volume Up.html",
    caption = "T4C Bot Screener - Price and Volume Up"
)
time.sleep(1)
bot.sendDocument(
    chat_id = "-1001197862158",
    document = open("C:/Users/Administrator/Documents/Amiexport/PriceVolDown.html", "rb"),
    filename = "Price and Volume Down.html",
    caption = "T4C Bot Screener - Price and Volume Down"
)
time.sleep(1)
bot.sendDocument(
    chat_id = "-1001197862158",
    document = open("C:/Users/Administrator/Documents/Amiexport/MAAligned.html", "rb"),
    filename = "Bullish MA Formation.html",
    caption = "T4C Bot Screener - Bullish MA Formation"
)
time.sleep(1)
bot.sendDocument(
    chat_id = "-1001197862158",
    document = open("C:/Users/Administrator/Documents/Amiexport/BullishReversalRSI.html", "rb"),
    filename = "Bullish Reversal RSI.html",
    caption = "T4C Bot Screener - Bullish Reversal RSI"
)
time.sleep(1)
bot.sendDocument(
    chat_id = "-1001197862158",
    document = open("C:/Users/Administrator/Documents/Amiexport/AccDistForeign.html", "rb"),
    filename = "Foreign Accumulation & Distibution.html",
    caption = "T4C Bot Screener - Foreign Accumulation & Distribution"
)
time.sleep(1)
bot.sendDocument(
    chat_id = "-1001197862158",
    document = open("C:/Users/Administrator/Documents/Amiexport/ReboundMA.html", "rb"),
    filename = "Rebound MA.html",
    caption = "T4C Bot Screener - Rebound MA (EMA8, MA20, MA50, MA200)"
)
time.sleep(1)
bot.sendDocument(
    chat_id = "-1001197862158",
    document = open("C:/Users/Administrator/Documents/Amiexport/Vol_Spike_Up.html", "rb"),
    filename = "Volume Spike Up.html",
    caption = "T4C Bot Screener - Volume Spike Up"
)
time.sleep(1)
bot.sendDocument(
    chat_id = "-1001197862158",
    document = open("C:/Users/Administrator/Documents/Amiexport/HakaCLosingEOD.html", "rb"),
    filename = "Closing Strong Haka - EOD.html",
    caption = "T4C Bot Screener - Closing Strong Haka Power (EOD)"
)
time.sleep(1)