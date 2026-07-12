from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["purvi_travels"]

bills = list(db["bills"].find().sort("_id", 1))

count = 0
for b in bills:
    count += 1
    new_bill_no = f"PT-{count:03d}"
    db["bills"].update_one({"_id": b["_id"]}, {"$set": {"bill_no": new_bill_no}})
    print(f"Updated bill {b.get('bill_no')} to {new_bill_no}")

# Set the counter for pt_bills
if count > 0:
    db["counters"].update_one(
        {"_id": "pt_bills"},
        {"$set": {"sequence_value": count}},
        upsert=True
    )
    print(f"Set pt_bills counter to {count}")

