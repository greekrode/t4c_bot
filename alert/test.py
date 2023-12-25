import datetime

now = datetime.datetime(2021, 9, 14, 17, 0)
time_minute = int(now.strftime("%M"))

print(time_minute % 15 == 0)
