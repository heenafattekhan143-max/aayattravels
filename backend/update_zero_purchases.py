import sys
import os

# Add the parent directory of backend to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import bills_collection, bookings_collection
from backend.routers.bookings import sync_provisional_bills

def fix_zero_purchases():
    # Find purchase bills with final_bill_amount == 0.0
    zero_bills = list(bills_collection.find({"bill_type": "Purchase", "final_bill_amount": 0.0}))
    
    updated_count = 0
    for bill in zero_bills:
        booking_ref = bill.get("booking_ref")
        if not booking_ref:
            continue
            
        booking = bookings_collection.find_one({"_id": booking_ref})
        if not booking:
            # Maybe it's a string ObjectID or maybe real ObjectId
            from bson.objectid import ObjectId
            if isinstance(booking_ref, str) and len(booking_ref) == 24:
                booking = bookings_collection.find_one({"_id": ObjectId(booking_ref)})
                
        if booking:
            # Re-sync to recalculate
            sync_provisional_bills(booking, booking.get("user_email", ""))
            updated_count += 1
            
    print(f"Updated {updated_count} zero-amount purchase bills.")

if __name__ == "__main__":
    fix_zero_purchases()
