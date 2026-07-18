from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from backend.dependencies import get_current_user
from backend.config import bookings_collection, plans_collection, bills_collection, get_next_sequence_value, vehicles_collection
from datetime import datetime

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

class PassengerDetail(BaseModel):
    name: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""

class BookingBase(BaseModel):
    booking_id: Optional[str] = ""
    booking_date: Optional[str] = ""
    customer_name: Optional[str] = ""
    booked_by_name: Optional[str] = ""
    customer_phone: Optional[str] = ""
    is_guest: Optional[bool] = False
    pickup_location: Optional[str] = ""
    drop_location: Optional[str] = ""
    pickup_time: Optional[str] = ""
    end_time: Optional[str] = ""
    start_garage_mins: Optional[int] = 60
    pickup_address: Optional[str] = ""
    drop_address: Optional[str] = ""
    flight_train_number: Optional[str] = ""
    journey_date: Optional[str] = ""
    return_date: Optional[str] = ""
    vehicle_number: Optional[str] = ""
    driver_name: Optional[str] = ""
    trip_type: Optional[str] = "One Way"   # One Way / Round Trip / Local
    vehicle_type: Optional[str] = ""
    passengers: Optional[int] = 1
    passenger_details: Optional[List[PassengerDetail]] = []
    advance_amount: Optional[float] = 0.0
    total_amount: Optional[float] = 0.0
    payment_status: Optional[str] = "Pending"   # Pending / Partial / Paid
    booking_status: Optional[str] = "Confirmed"  # Confirmed / Cancelled / Completed
    remarks: Optional[str] = ""
    note: Optional[str] = ""
    end_km: Optional[int] = 0
    working_hours: Optional[int] = 0
    plan_id: Optional[str] = None
    event_id: Optional[str] = None
    vehicle_class: Optional[str] = ""
    rate: Optional[float] = 0.0
    da_allowance: Optional[float] = 0.0
    night_allowance: Optional[float] = 0.0
    gst_rate: Optional[float] = 0.0

class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    booking_id: Optional[str] = None
    booking_date: Optional[str] = None
    customer_name: Optional[str] = None
    booked_by_name: Optional[str] = None
    customer_phone: Optional[str] = None
    is_guest: Optional[bool] = None
    pickup_location: Optional[str] = None
    drop_location: Optional[str] = None
    pickup_time: Optional[str] = None
    end_time: Optional[str] = None
    start_garage_mins: Optional[int] = None
    pickup_address: Optional[str] = None
    drop_address: Optional[str] = None
    flight_train_number: Optional[str] = None
    journey_date: Optional[str] = None
    return_date: Optional[str] = None
    vehicle_number: Optional[str] = None
    driver_name: Optional[str] = None
    trip_type: Optional[str] = None
    vehicle_type: Optional[str] = None
    passengers: Optional[int] = None
    passenger_details: Optional[List[PassengerDetail]] = None
    advance_amount: Optional[float] = None
    total_amount: Optional[float] = None
    payment_status: Optional[str] = None
    booking_status: Optional[str] = None
    remarks: Optional[str] = None
    note: Optional[str] = None
    end_km: Optional[int] = None
    working_hours: Optional[int] = None
    plan_id: Optional[str] = None
    event_id: Optional[str] = None
    vehicle_class: Optional[str] = None
    rate: Optional[float] = None
    da_allowance: Optional[float] = None
    night_allowance: Optional[float] = None

class BookingResponse(BookingBase):
    id: str


def serialize_booking(doc) -> dict:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "booking_id": doc.get("booking_id", ""),
        "booking_date": doc.get("booking_date", ""),
        "customer_name": doc.get("customer_name", ""),
        "booked_by_name": doc.get("booked_by_name", ""),
        "customer_phone": doc.get("customer_phone", ""),
        "is_guest": doc.get("is_guest", False),
        "pickup_location": doc.get("pickup_location", ""),
        "drop_location": doc.get("drop_location", ""),
        "pickup_time": doc.get("pickup_time", ""),
        "end_time": doc.get("end_time", ""),
        "start_garage_mins": doc.get("start_garage_mins", 60),
        "pickup_address": doc.get("pickup_address", ""),
        "drop_address": doc.get("drop_address", ""),
        "flight_train_number": doc.get("flight_train_number", ""),
        "journey_date": doc.get("journey_date", ""),
        "return_date": doc.get("return_date", ""),
        "vehicle_number": doc.get("vehicle_number", ""),
        "driver_name": doc.get("driver_name", ""),
        "trip_type": doc.get("trip_type", "One Way"),
        "vehicle_type": doc.get("vehicle_type", ""),
        "passengers": doc.get("passengers", 1),
        "passenger_details": doc.get("passenger_details", []),
        "advance_amount": doc.get("advance_amount", 0.0),
        "total_amount": doc.get("total_amount", 0.0),
        "payment_status": doc.get("payment_status", "Pending"),
        "booking_status": doc.get("booking_status", "Confirmed"),
        "remarks": doc.get("remarks", ""),
        "note": doc.get("note", ""),
        "end_km": doc.get("end_km", 0),
        "working_hours": doc.get("working_hours", 0),
        "plan_id": doc.get("plan_id", None),
        "event_id": doc.get("event_id", None),
        "vehicle_class": doc.get("vehicle_class", ""),
        "rate": doc.get("rate", 0.0),
        "da_allowance": doc.get("da_allowance", 0.0),
        "night_allowance": doc.get("night_allowance", 0.0)
    }

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(booking: BookingCreate, user_email: str = Depends(get_current_user)):
    booking_dict = booking.model_dump()
    booking_dict['user_email'] = user_email
    
    # Generate sequential booking_id starting at 101
    last_booking = bookings_collection.find_one(
        {"booking_id": {"$regex": "^[0-9]+$"}},
        sort=[("booking_id", -1)]
    )
    if last_booking and last_booking.get("booking_id"):
        try:
            next_id = int(last_booking["booking_id"]) + 1
        except ValueError:
            next_id = 101
    else:
        count = bookings_collection.count_documents({})
        next_id = 100 + count + 1
        if next_id < 101:
            next_id = 101
            
    booking_dict["booking_id"] = str(next_id)
    
    result = bookings_collection.insert_one(booking_dict)
    booking_dict["_id"] = result.inserted_id
    return serialize_booking(booking_dict)


@router.get("", response_model=List[BookingResponse])
def get_bookings(
    booking_status: Optional[str] = None,
    payment_status: Optional[str] = None,
    journey_date: Optional[str] = None,
    event_id: Optional[str] = None,
    user_email: str = Depends(get_current_user)
):
    query = {"user_email": user_email}
    if booking_status:
        query["booking_status"] = booking_status
    if payment_status:
        query["payment_status"] = payment_status
    if journey_date:
        query["journey_date"] = journey_date
    if event_id:
        if event_id == "none":
            query["event_id"] = {"$in": [None, ""]}
        elif event_id == "any":
            query["event_id"] = {"$nin": [None, ""]}
        else:
            query["event_id"] = event_id

    docs = list(bookings_collection.find(query).sort("_id", -1))
    return [serialize_booking(doc) for doc in docs]


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=400, detail="Invalid booking ID format")

    doc = bookings_collection.find_one({"_id": ObjectId(booking_id), "user_email": user_email})
    if not doc:
        raise HTTPException(status_code=404, detail="Booking not found")

    return serialize_booking(doc)

def generate_bill_for_booking(booking_doc, user_email: str = Depends(get_current_user)):
    plan_id = booking_doc.get("plan_id")
    if not plan_id:
        return

    plan = plans_collection.find_one({"_id": ObjectId(plan_id), "user_email": user_email})
    if not plan:
        return

    end_km = float(booking_doc.get("end_km") or 0.0)
    working_hours = float(booking_doc.get("working_hours") or 0.0)
    
    base_km = float(plan.get("base_km") or 0.0)
    base_hours = float(plan.get("base_hours") or 0.0)
    
    extra_km = max(0.0, end_km - base_km)
    extra_km_rate = float(plan.get("extra_km_rate") or 0.0)
    extra_km_charge = extra_km * extra_km_rate
    
    extra_hours = max(0.0, working_hours - base_hours)
    extra_hours_rate = float(plan.get("extra_hours_rate") or 0.0)
    extra_hours_charge = extra_hours * extra_hours_rate
    
    base_rate = float(plan.get("rate") or 0.0)
    da_allowance = float(plan.get("da_allowance") or 0.0)
    night_allowance = float(plan.get("night_allowance") or 0.0)
    
    amount_without_gst = base_rate + extra_km_charge + extra_hours_charge + da_allowance + night_allowance
    
    gst_rate = float(booking_doc.get("gst_rate") or 0.0)
    amount_with_gst = amount_without_gst
    if gst_rate > 0:
        amount_with_gst = round(amount_without_gst * (1 + gst_rate / 100), 2)
    
    table_item = {
        "plan_id": str(plan["_id"]),
        "plan_name": plan.get("plan_name", ""),
        "rate": base_rate,
        "date": booking_doc.get("journey_date", ""),
        "total_distance_km": end_km,
        "extra_km": extra_km,
        "total_hours": working_hours,
        "extra_hours": extra_hours,
        "da_allowance": da_allowance,
        "night_allowance": night_allowance,
        "amount_without_gst": amount_without_gst,
        "gst_rate": gst_rate,
        "amount_with_gst": amount_with_gst
    }
    
    advance = float(booking_doc.get("advance_amount") or 0.0)
    status = "Pending"
    if advance >= amount_without_gst and amount_without_gst > 0:
        status = "Paid"
    elif advance > 0:
        status = "Partial"

    seq_val = get_next_sequence_value("nongst_bills")
    bill_no = f"INV-{seq_val:04d}"

    bill_dict = {
        "bill_no": bill_no,
        "bill_type": "Sales",
        "party_type": "customer",
        "gst_enabled": gst_rate > 0,
        "customer_id": "",
        "customer_name": booking_doc.get("customer_name", ""),
        "phone_number": booking_doc.get("customer_phone", ""),
        "guest_name": booking_doc.get("customer_name", "") if booking_doc.get("is_guest") else "",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "vendor_name": "", 
        "vehicle_number": booking_doc.get("vehicle_number", ""),
        "driver_name": booking_doc.get("driver_name", ""),
        "source": booking_doc.get("pickup_location", ""),
        "destination": booking_doc.get("drop_location", ""),
        "travel_distance": end_km,
        "table_items": [table_item],
        "toll_amount": 0.0,
        "parking_amount": 0.0,
        "final_bill_amount": amount_with_gst,
        "final_bill_words": "",
        "paid_amount": advance,
        "status": status,
        "profit": amount_with_gst,
        "created_at": datetime.now(),
        "booking_ref": str(booking_doc["_id"])
    }
    
    bills_collection.insert_one(bill_dict)
    
    vehicle_num = booking_doc.get("vehicle_number")
    if vehicle_num and end_km > 0:
        vehicles_collection.update_one(
            {"vehicle_number": vehicle_num},
            {"$inc": {"total_km_travelled": end_km}}
        )

@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(booking_id: str, booking_update: BookingUpdate, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=400, detail="Invalid booking ID format")

    update_data = {k: v for k, v in booking_update.model_dump().items() if v is not None}

    if not update_data:
        doc = bookings_collection.find_one({"_id": ObjectId(booking_id), "user_email": user_email})
        if not doc:
            raise HTTPException(status_code=404, detail="Booking not found")
        return serialize_booking(doc)

    old_doc = bookings_collection.find_one({"_id": ObjectId(booking_id), "user_email": user_email})
    if not old_doc:
        raise HTTPException(status_code=404, detail="Booking not found")

    result = bookings_collection.find_one_and_update({"_id": ObjectId(booking_id), "user_email": user_email},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Auto-generate bill on booking completion
    if update_data.get("booking_status") == "Completed" and old_doc.get("booking_status") != "Completed":
        generate_bill_for_booking(result)

    return serialize_booking(result)


@router.delete("/{booking_id}")
def delete_booking(booking_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=400, detail="Invalid booking ID format")

    result = bookings_collection.delete_one({"_id": ObjectId(booking_id), "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")

    return {"message": "Booking deleted successfully"}
