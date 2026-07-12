import os
from pymongo import MongoClient

# Database client setup
# Using local MongoDB instance default connection string
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "purvi_travels"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Collections mapping
entities_collection = db["entities"]
plans_collection = db["plans"]
bills_collection = db["bills"]
vehicles_collection = db["vehicles"]
maintenance_collection = db["maintenance"]
drivers_collection = db["drivers"]
bookings_collection = db["bookings"]
payments_collection = db["payments"]
received_payments_collection = db["received_payments"]
event_bills_collection = db["event_bills"]
counters_collection = db["counters"]
users_collection = db["users"]

def get_next_sequence_value(sequence_name: str) -> int:
    sequence_document = counters_collection.find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"sequence_value": 1}},
        upsert=True,
        return_document=True
    )
    return sequence_document["sequence_value"]

def check_db_connection():
    try:
        # Perform a quick ping to verify if MongoDB is running and reachable
        client.admin.command('ping')
        return True
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        return False
