from pymongo import MongoClient
client = MongoClient("mongodb://127.0.0.1:27017/")
db = client["purvi_travels"]
user = db.users.find_one({"email": "ravisable099@gmail.com"})
print(user)
