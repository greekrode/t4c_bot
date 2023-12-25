from telebot.credentials import bot_token, bot_user_name

import telegram

global bot
global TOKEN
TOKEN = bot_token
bot = telegram.Bot(token=TOKEN)
