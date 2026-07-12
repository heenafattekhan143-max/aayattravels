from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from pymongo import ReturnDocument
from backend.config import bills_collection, get_next_sequence_value, vehicles_collection
from backend.dependencies import get_current_user

router = APIRouter(prefix="/api/bills", tags=["bills"])

# Table Item Schema
class BillItem(BaseModel):
    plan_id: str
    plan_name: str
    rate: Optional[float] = 0.0
    date: str
    end_date: Optional[str] = ""
    total_distance_km: float
    extra_km: float
    total_hours: float
    extra_hours: float
    da_allowance: Optional[float] = 0.0
    night_allowance: Optional[float] = 0.0
    amount_without_gst: float
    gst_rate: float
    amount_with_gst: float

# Bill Base Schema
class BillBase(BaseModel):
    bill_no: Optional[str] = ""
    bill_type: str = Field(default="Sales", pattern="^(Sales|Purchase)$")
    party_type: str = Field(..., pattern="^(customer|vendor)$")
    gst_enabled: bool
    customer_id: str
    customer_name: str
    phone_number: str
    guest_name: Optional[str] = ""
    date: str
    vendor_name: str
    vehicle_number: str
    driver_name: str
    source: Optional[str] = ""
    destination: Optional[str] = ""
    travel_distance: float = 0.0
    table_items: List[BillItem]
    toll_amount: float
    parking_amount: float = 0.0
    final_bill_amount: float
    final_bill_words: str
    paid_amount: Optional[float] = 0.0
    status: str = Field(default="Pending", pattern="^(Pending|Paid|Cancelled|Partial)$")
    profit: Optional[float] = 0.0

class BillCreate(BillBase):
    pass

class BillResponse(BillBase):
    id: str
    created_at: str

def serialize_bill(doc) -> dict:
    if not doc:
        return None
    
    # Handle datetime serialization
    created_at_val = doc.get("created_at")
    if isinstance(created_at_val, datetime):
        created_at_str = created_at_val.isoformat()
    else:
        created_at_str = str(created_at_val) if created_at_val else datetime.now().isoformat()
        
    return {
        "id": str(doc["_id"]),
        "bill_no": doc.get("bill_no", str(doc["_id"])[:6].upper()),
        "bill_type": doc.get("bill_type", "Sales"),
        "party_type": doc.get("party_type"),
        "gst_enabled": doc.get("gst_enabled"),
        "customer_id": doc.get("customer_id"),
        "customer_name": doc.get("customer_name"),
        "phone_number": doc.get("phone_number"),
        "guest_name": doc.get("guest_name", ""),
        "date": doc.get("date"),
        "vendor_name": doc.get("vendor_name"),
        "vehicle_number": doc.get("vehicle_number"),
        "driver_name": doc.get("driver_name", ""),
        "source": doc.get("source", ""),
        "destination": doc.get("destination", ""),
        "table_items": doc.get("table_items", []),
        "toll_amount": doc.get("toll_amount", 0.0),
        "parking_amount": doc.get("parking_amount", 0.0),
        "final_bill_amount": doc.get("final_bill_amount"),
        "final_bill_words": doc.get("final_bill_words"),
        "paid_amount": doc.get("paid_amount", 0.0),
        "status": doc.get("status", "Pending"),
        "profit": doc.get("profit", 0.0),
        "created_at": created_at_str
    }

@router.post("", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
def create_bill(bill: BillCreate, user_email: str = Depends(get_current_user)):
    bill_dict = bill.model_dump()
    bill_dict["created_at"] = datetime.now()
    bill_dict["user_email"] = user_email
    
    # Generate unified bill_no with prefix PT-
    sequence_name = "pt_bills"
    seq_val = get_next_sequence_value(sequence_name)
    prefix = "PT-"
    bill_dict["bill_no"] = f"{prefix}{seq_val:03d}"
    
    result = bills_collection.insert_one(bill_dict)
    bill_dict["_id"] = result.inserted_id
    
    # Update vehicle's total traveled kilometers
    vehicle_number = bill_dict.get("vehicle_number")
    distance_to_add = bill_dict.get("travel_distance", 0.0)
    
    if not distance_to_add and bill_dict.get("table_items"):
        distance_to_add = sum(item.get("total_distance_km", 0.0) for item in bill_dict["table_items"])
        
        if vehicle_number and distance_to_add > 0:
            vehicles_collection.update_one(
                {"vehicle_number": vehicle_number.upper(), "user_email": user_email},
                {"$inc": {"total_km_travelled": distance_to_add}}
            )

    return serialize_bill(bill_dict)

@router.get("", response_model=List[BillResponse])
def get_bills(user_email: str = Depends(get_current_user)):
    docs = list(bills_collection.find({"user_email": user_email}).sort("created_at", -1))
    return [serialize_bill(doc) for doc in docs]

@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(bill_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(bill_id):
        raise HTTPException(status_code=400, detail="Invalid bill ID format")
        
    doc = bills_collection.find_one({"_id": ObjectId(bill_id), "user_email": user_email})
    if not doc:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    return serialize_bill(doc)

@router.put("/{bill_id}", response_model=BillResponse)
def update_bill(bill_id: str, bill: BillCreate, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(bill_id):
        raise HTTPException(status_code=400, detail="Invalid bill ID format")
        
    bill_dict = bill.model_dump()
    bill_dict["user_email"] = user_email
    existing = bills_collection.find_one({"_id": ObjectId(bill_id), "user_email": user_email})
    if not existing:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    bill_dict["created_at"] = existing.get("created_at", datetime.now())
    # Preserve existing bill_no if it exists
    if "bill_no" in existing:
        bill_dict["bill_no"] = existing["bill_no"]
    
    result = bills_collection.find_one_and_replace(
        {"_id": ObjectId(bill_id), "user_email": user_email},
        bill_dict,
        return_document=ReturnDocument.AFTER
    )
    return serialize_bill(result)

class BillStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(Pending|Paid|Cancelled|Partial)$")
    paid_amount: Optional[float] = None

@router.patch("/{bill_id}/status", response_model=BillResponse)
def update_bill_status(bill_id: str, status_update: BillStatusUpdate, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(bill_id):
        raise HTTPException(status_code=400, detail="Invalid bill ID format")
        
    update_data = {"status": status_update.status}
    if status_update.paid_amount is not None:
        update_data["paid_amount"] = status_update.paid_amount

    result = bills_collection.find_one_and_update(
        {"_id": ObjectId(bill_id), "user_email": user_email},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )
    if not result:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    return serialize_bill(result)

@router.delete("/{bill_id}")
def delete_bill(bill_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(bill_id):
        raise HTTPException(status_code=400, detail="Invalid bill ID format")
        
    result = bills_collection.delete_one({"_id": ObjectId(bill_id), "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    return {"message": "Bill deleted successfully"}
