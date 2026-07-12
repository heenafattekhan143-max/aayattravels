from pymongo import MongoClient
client = MongoClient("mongodb://localhost:27017/")
db = client["purvi_travels"]
bookings = list(db.bookings.find({"booking_id": {"$in": ["117", "121"]}}))
for b in bookings:
    print(f"Booking {b.get('booking_id')}: event_id={b.get('event_id')}, trip_type={b.get('trip_type')}")
