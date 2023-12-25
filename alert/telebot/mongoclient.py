import pymongo 
import ssl

client = pymongo.MongoClient("mongodb://localhost:27017/?retryWrites=true")
db = client.kangritelbot
col = db.alert
bdcol = db.broker_summary