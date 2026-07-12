import pymongo

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["purvitravels"]

collections = [
    "bills", "bookings", "customers", "drivers", "event_bills", 
    "maintenance_logs", "payments", "plan_names", "plans", 
    "received_payments", "vehicles"
]

default_user_email = "admin@purvitravels.com"

for coll_name in collections:
    collection = db[coll_name]
    result = collection.update_many(
        {"user_email": {"$exists": False}}, 
        {"$set": {"user_email": default_user_email}}
    )
    print(f"Updated {result.modified_count} records in {coll_name}")
