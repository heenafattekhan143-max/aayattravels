from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from backend.dependencies import get_current_user
from datetime import datetime
from pymongo import ReturnDocument
from backend.config import db, get_next_sequence_value

router = APIRouter(prefix="/api/event-bills", tags=["event-bills"])
event_bills_collection = db["event_bills"]

# Vehicle Class Summary
class VehicleClassSummary(BaseModel):
    class_name: str
    count: int
    rate: float

# Vehicle Row Detail
class VehicleRowDetail(BaseModel):
    class_name: str
    vehicle_number: str
    driver_name: str
    rate: float
    da_allowance: float = 0.0
    night_allowance: float = 0.0

# Event Bill Schema
class EventBillBase(BaseModel):
    bill_no: Optional[str] = ""
    client_name: str
    customer_id: Optional[str] = ""
    event_name: str
    event_location: Optional[str] = ""
    start_date: str
    end_date: str
    total_days: int
    total_vehicles_count: int
    vehicle_classes: List[VehicleClassSummary]
    vehicle_rows: List[VehicleRowDetail]
    gst_rate: float = 0.0
    toll_amount: float = 0.0
    parking_amount: float = 0.0
    subtotal: float
    gst_amount: float = 0.0
    final_bill_amount: float
    advance_amount: float = 0.0
    final_bill_words: str
    status: str = Field(default="Pending", pattern="^(Pending|Paid|Cancelled|Partial)$")

class EventBillCreate(EventBillBase):
    pass

class EventBillPaymentUpdate(BaseModel):
    advance_amount: float
    status: str

class EventBillResponse(EventBillBase):
    id: str
    created_at: str

def serialize_event_bill(doc) -> dict:
    if not doc:
        return None
    
    created_at_val = doc.get("created_at")
    if isinstance(created_at_val, datetime):
        created_at_str = created_at_val.isoformat()
    else:
        created_at_str = str(created_at_val) if created_at_val else datetime.now().isoformat()
        
    return {
        "id": str(doc["_id"]),
        "bill_no": doc.get("bill_no", str(doc["_id"])[:6].upper()),
        "client_name": doc.get("client_name"),
        "customer_id": doc.get("customer_id", ""),
        "event_name": doc.get("event_name"),
        "start_date": doc.get("start_date"),
        "end_date": doc.get("end_date"),
        "total_days": doc.get("total_days"),
        "total_vehicles_count": doc.get("total_vehicles_count"),
        "vehicle_classes": doc.get("vehicle_classes", []),
        "vehicle_rows": doc.get("vehicle_rows", []),
        "gst_rate": doc.get("gst_rate", 0.0),
        "toll_amount": doc.get("toll_amount", 0.0),
        "parking_amount": doc.get("parking_amount", 0.0),
        "subtotal": doc.get("subtotal"),
        "gst_amount": doc.get("gst_amount", 0.0),
        "final_bill_amount": doc.get("final_bill_amount"),
        "advance_amount": doc.get("advance_amount", 0.0),
        "final_bill_words": doc.get("final_bill_words"),
        "status": doc.get("status", "Pending"),
        "created_at": created_at_str
    }

@router.post("", response_model=EventBillResponse, status_code=status.HTTP_201_CREATED)
def create_event_bill(bill: EventBillCreate, user_email: str = Depends(get_current_user)):
    bill_dict = bill.model_dump()
    bill_dict['user_email'] = user_email
    bill_dict["created_at"] = datetime.now()
    
    seq_val = get_next_sequence_value("event_bills")
    bill_dict["bill_no"] = f"EVT-{seq_val:04d}"
    
    result = event_bills_collection.insert_one(bill_dict)
    bill_dict["_id"] = result.inserted_id
    return serialize_event_bill(bill_dict)

@router.get("", response_model=List[EventBillResponse])
def get_event_bills(user_email: str = Depends(get_current_user)):
    docs = list(event_bills_collection.find({"user_email": user_email}).sort("created_at", -1))
    return [serialize_event_bill(doc) for doc in docs]

@router.get("/{bill_id}", response_model=EventBillResponse)
def get_event_bill(bill_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(bill_id):
        raise HTTPException(status_code=400, detail="Invalid bill ID format")
        
    doc = event_bills_collection.find_one({"_id": ObjectId(bill_id), "user_email": user_email})
    if not doc:
        raise HTTPException(status_code=404, detail="Event bill not found")
        
    return serialize_event_bill(doc)

@router.put("/{bill_id}", response_model=EventBillResponse)
def update_event_bill(bill_id: str, bill: EventBillCreate, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(bill_id):
        raise HTTPException(status_code=400, detail="Invalid bill ID format")
        
    bill_dict = bill.model_dump()
    bill_dict['user_email'] = user_email
    existing = event_bills_collection.find_one({"_id": ObjectId(bill_id), "user_email": user_email})
    if not existing:
        raise HTTPException(status_code=404, detail="Event bill not found")
        
    bill_dict["created_at"] = existing.get("created_at", datetime.now())
    
    if "bill_no" in existing:
        bill_dict["bill_no"] = existing["bill_no"]
    
    result = event_bills_collection.find_one_and_replace({"_id": ObjectId(bill_id), "user_email": user_email},
        bill_dict,
        return_document=ReturnDocument.AFTER
    )
    return serialize_event_bill(result)

@router.patch("/{bill_id}/payment", response_model=EventBillResponse)
def update_event_bill_payment(bill_id: str, payment: EventBillPaymentUpdate, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(bill_id):
        raise HTTPException(status_code=400, detail="Invalid bill ID format")
    
    existing = event_bills_collection.find_one({"_id": ObjectId(bill_id), "user_email": user_email})
    if not existing:
        raise HTTPException(status_code=404, detail="Event bill not found")
        
    result = event_bills_collection.find_one_and_update({"_id": ObjectId(bill_id), "user_email": user_email},
        {"$set": {"advance_amount": payment.advance_amount, "status": payment.status}},
        return_document=ReturnDocument.AFTER
    )
    return serialize_event_bill(result)

@router.delete("/{bill_id}")
def delete_event_bill(bill_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(bill_id):
        raise HTTPException(status_code=400, detail="Invalid bill ID format")
        
    result = event_bills_collection.delete_one({"_id": ObjectId(bill_id), "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event bill not found")
        
    return {"message": "Event bill deleted successfully"}
