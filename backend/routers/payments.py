from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from backend.dependencies import get_current_user
from datetime import datetime
from backend.config import payments_collection

router = APIRouter(prefix="/api/payments", tags=["payments"])

class PaymentBase(BaseModel):
    vendor_id: str
    vendor_name: str
    amount: float
    payment_date: str
    payment_mode: str = Field(default="Cash", pattern="^(Cash|UPI|Bank Transfer|Cheque)$")
    reference_id: Optional[str] = ""
    notes: Optional[str] = ""

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: str
    created_at: str

def serialize_payment(doc) -> dict:
    if not doc:
        return None
    
    created_at_val = doc.get("created_at")
    if isinstance(created_at_val, datetime):
        created_at_str = created_at_val.isoformat()
    else:
        created_at_str = str(created_at_val) if created_at_val else datetime.now().isoformat()
        
    return {
        "id": str(doc["_id"]),
        "vendor_id": doc.get("vendor_id"),
        "vendor_name": doc.get("vendor_name"),
        "amount": doc.get("amount", 0.0),
        "payment_date": doc.get("payment_date"),
        "payment_mode": doc.get("payment_mode", "Cash"),
        "reference_id": doc.get("reference_id", ""),
        "notes": doc.get("notes", ""),
        "created_at": created_at_str
    }

@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(payment: PaymentCreate, user_email: str = Depends(get_current_user)):
    payment_dict = payment.model_dump()
    payment_dict['user_email'] = user_email
    payment_dict["created_at"] = datetime.now()
    
    result = payments_collection.insert_one(payment_dict)
    payment_dict["_id"] = result.inserted_id
    return serialize_payment(payment_dict)

@router.get("", response_model=List[PaymentResponse])
def get_all_payments(user_email: str = Depends(get_current_user)):
    docs = list(payments_collection.find({"user_email": user_email}).sort("payment_date", -1))
    return [serialize_payment(doc) for doc in docs]

@router.get("/vendor/{vendor_id}", response_model=List[PaymentResponse])
def get_vendor_payments(vendor_id: str, user_email: str = Depends(get_current_user)):
    docs = list(payments_collection.find({"vendor_id": vendor_id, "user_email": user_email}).sort("payment_date", -1))
    return [serialize_payment(doc) for doc in docs]

@router.delete("/{payment_id}")
def delete_payment(payment_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(payment_id):
        raise HTTPException(status_code=400, detail="Invalid payment ID format")
        
    result = payments_collection.delete_one({"_id": ObjectId(payment_id), "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    return {"message": "Payment deleted successfully"}
