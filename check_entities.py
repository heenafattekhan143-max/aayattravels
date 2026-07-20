from pymongo import MongoClient
client = MongoClient("mongodb://localhost:27017")
db = client["purvi_travels"]
print("Total entities:", db["entities"].count_documents({}))
for e in db["entities"].find():
    print(e.get("name"), e.get("entity_type"), e.get("user_email"))
