from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["purvi_travels"]

db.users.update_many({}, {"$set": {"businessName": "Premier Fleet Management System"}})
print("Updated businessName in DB")
