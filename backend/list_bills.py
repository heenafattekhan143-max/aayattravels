from pymongo import MongoClient
import os

client = MongoClient("mongodb://localhost:27017")
db = client["purvi_travels"]

bills = list(db["bills"].find().sort("_id", 1))
for i, b in enumerate(bills):
    print(f"ID: {b['_id']}, current bill_no: {b.get('bill_no', 'N/A')}")
