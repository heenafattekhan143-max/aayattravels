import sys
import pymongo

sys.path.append("/Users/aayatimranfattekhan/Documents/MyWork/Clients/RaviSable/project-code/PurviTravels")
from backend.routers.bookings import sync_provisional_bills, generate_bill_for_booking

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["purvi_travels"]

booking = db.bookings.find_one({})
if booking:
    print(f"Testing with booking: {booking['_id']}")
    try:
        sync_provisional_bills(booking, booking.get("user_email", ""))
        print("sync_provisional_bills: Success!")
    except Exception as e:
        print("sync_provisional_bills: FAILED")
        import traceback
        traceback.print_exc()

    try:
        generate_bill_for_booking(booking, booking.get("user_email", ""))
        print("generate_bill_for_booking: Success!")
    except Exception as e:
        print("generate_bill_for_booking: FAILED")
        import traceback
        traceback.print_exc()
else:
    print("No booking found.")
