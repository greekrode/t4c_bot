from telegram import ParseMode
from telebot.client import bot
from telebot.mongoclient import col

import csv
import pprint
import itertools
import datetime
import math

now = datetime.datetime.today()
date = datetime.date.today().strftime("%d %b %Y")
begin_time1 = now.replace(hour = 9, minute = 00, second = 0)
begin_time2 = now.replace(hour = 15, minute = 00, second = 0)
end_time1 = now.replace(hour = 12, minute = 30, second = 0)
end_time2 = now.replace(hour = 23, minute = 00, second = 0)
today_day_of_week = datetime.date.today().weekday()

def send_message(title, text_message) :
    if len(text_message) > 0 :
        bot.sendMessage(
            chat_id = "229886930",
            text = title + text_message,
            parse_mode =  ParseMode.HTML
        )

        bot.sendMessage(
            chat_id = "-1001287411917",
            text = title + text_message,
            parse_mode =  ParseMode.HTML
        )

        bot.sendMessage(
            chat_id = "-1001640435916",
            text = title + text_message,
            parse_mode =  ParseMode.HTML
        )

        bot.sendMessage(
            chat_id = "-1001525790748",
            text = title + text_message,
            parse_mode =  ParseMode.HTML
        )


def chg_pct(pct) :
    if float(pct) > 0 :
        return '+' + pct
    else :
        return pct
    
def diff(val) :
    if float(val) > 0 :
        return '+' + val
    else :
        return val

def trx_val(val) :
    if float(val) > 1000 :
        return str(math.ceil( ( float(val)/1000) * 100.0) / 100.0 ) + 'T'
    elif float(val) < -1000 :
        return val + 'T'
    else :
        return val + 'B'

def foreign_status(val) :
    if float(val) > 0 :
        return 'Foreign Net Buy: ' + trx_val(val)
    else :
        return 'Foreign Net Sell: ' + trx_val(val)
    
def truncate_decimal(val) :
    return str(f'{ math.trunc(float(val)) : ,}').replace(',', '.')
    
def top_gainers() :
    with open('C:/Users/Administrator/Documents/Amiexport/TopGainers.csv', 'r') as file :
        reader = csv.reader(file)
        next(reader)
        gainers_title = '\n\n<b>Top Gainers</b>'
        gainers_info = '<code>'
        for row in itertools.islice(reader, 5) :
            gainers_info = gainers_info + '\n' + row[0] + ' ' + row[1] + ' (' + row[2] + '%)';
        return gainers_title + gainers_info + '</code>'
            
def top_losers() :
    with open('C:/Users/Administrator/Documents/Amiexport/TopLosers.csv', 'r') as file :
        reader = csv.reader(file)
        next(reader)
        losers_title = '\n\n<b>Top Losers</b>'
        losers_info = '<code>'
        for row in itertools.islice(reader, 5) :
            losers_info = losers_info + '\n' + row[0] + ' ' + row[1] + ' (' + row[2] + '%)';
        return losers_title + losers_info + '</code>'
    
def top_buy_foreign() :
    with open('C:/Users/Administrator/Documents/Amiexport/TopBuyForeign.csv', 'r') as file :
        reader = csv.reader(file)
        next(reader)
        buy_foreign_title = '\n\n<b>Top Buy Foreign</b>'
        buy_foreign_info = '<code>'
        for row in itertools.islice(reader, 5) :
            buy_foreign_info = buy_foreign_info + '\n' + row[0] + ' ' + row[1] + ' (' + trx_val(row[2]) + ')';
        return buy_foreign_title + buy_foreign_info + '</code>'
    
def top_sell_foreign() :
    with open('C:/Users/Administrator/Documents/Amiexport/TopSellForeign.csv', 'r') as file :
        reader = csv.reader(file)
        next(reader)
        sell_foreign_title = '\n\n<b>Top Sell Foreign</b>'
        sell_foreign_info = '<code>'
        for row in itertools.islice(reader, 5) :
            sell_foreign_info = sell_foreign_info + '\n' + row[0] + ' ' + row[1] + ' (' + trx_val(row[2]) + ')';
        return sell_foreign_title + sell_foreign_info + '</code>'


def index_value() :
    with open('C:/Users/Administrator/Documents/Amiexport/IndexValue.csv', 'r') as file :
        reader = csv.reader(file)
        next(reader)
        ihsg = next(reader)
        index_info = '<b>COMPOSITE (IHSG) \n' + ihsg[1] + ' (' + chg_pct(ihsg[2]) + '%, ' + diff(ihsg[3]) + ')'
        # index_info = index_info + '\nTrx. Value: ' + trx_val(ihsg[3])
        index_info = index_info + '\n' + foreign_status(ihsg[4]) + '</b>\n\n'
        sector_info = sector_info = '<b>Market Sector</b><code>'
        for row in reader :
            sector_info = sector_info + '\n' + row[0] + ' ' + row[1] + '(' + str(chg_pct(row[2])) + '%, ' + str(diff(row[4])) + ')'
        return index_info + sector_info + '</code>'

def top_active_volume() :
    with open('C:/Users/Administrator/Documents/Amiexport/TopActiveVolume.csv', 'r') as file :
        reader = csv.reader(file)
        next(reader)
        active_volume_title = '\n\n<b>Top Active by Volume</b>'
        active_volume_info = '<code>'
        for row in itertools.islice(reader, 10) :
            active_volume_info = active_volume_info + '\n' + row[0] + ' ' +  row[1] +' (' + row[3] + '%) ' + truncate_decimal(row[2]) +  ' LOT';
        return active_volume_title + active_volume_info + '</code>'

def top_active_value() :
    with open('C:/Users/Administrator/Documents/Amiexport/TopActiveValue.csv', 'r') as file :
        reader = csv.reader(file)
        next(reader)
        active_value_title = '\n\n<b>Top Active by Value</b>'
        active_value_info = '<code>'
        for row in itertools.islice(reader, 10) :
            active_value_info = active_value_info + '\n' + row[0] + ' ' +  row[1] +' (' + row[3] + '%) ' + trx_val(row[2]) ;
        return active_value_title + active_value_info + '</code>'
            
            
index = index_value()
gainers = top_gainers()
losers = top_losers()
buy_foreign = top_buy_foreign()
sell_foreign = top_sell_foreign()
active_volume = top_active_volume()
active_value = top_active_value()
info = index + gainers + losers + buy_foreign + sell_foreign + active_volume + active_value
title = ''

if today_day_of_week < 5 :
    if now > begin_time1 and now < end_time1 :
        title = '<b>==== ' + date + ' Market Recap 1st Session ====</b>\nBy Trade4Cuan (https://t.me/tradeforcuan)\n\n' 
        send_message(title, info) 
    elif now > begin_time2 and now < end_time2 :
        title = '<b>==== ' + date + ' Market Recap EOD ====</b>\nBy Trade4Cuan (https://t.me/tradeforcuan)\n\n'
        send_message(title, info)        


