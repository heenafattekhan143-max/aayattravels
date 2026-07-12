from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["purvi_travels"]

# Delete all documents in the bills collection
result = db["bills"].delete_many({})
print(f"Deleted {result.deleted_count} bills from the 'bills' collection.")

# Reset counters for bills
db["counters"].update_one(
    {"_id": "pt_bills"},
    {"$set": {"sequence_value": 0}},
    upsert=True
)
db["counters"].update_one(
    {"_id": "gst_bills"},
    {"$set": {"sequence_value": 0}},
    upsert=True
)
db["counters"].update_one(
    {"_id": "nongst_bills"},
    {"$set": {"sequence_value": 0}},
    upsert=True
)
print("Reset bill sequence counters to 0.")
