from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from backend.dependencies import get_current_user
from datetime import datetime
from backend.config import received_payments_collection

router = APIRouter(prefix="/api/received-payments", tags=["received-payments"])

class ReceivedPaymentBase(BaseModel):
    customer_id: str
    customer_name: str
    amount: float
    payment_date: str
    payment_mode: str = Field(default="Cash", pattern="^(Cash|UPI|Bank Transfer|Cheque)$")
    reference_id: Optional[str] = ""
    notes: Optional[str] = ""

class ReceivedPaymentCreate(ReceivedPaymentBase):
    pass

class ReceivedPaymentResponse(ReceivedPaymentBase):
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
        "customer_id": doc.get("customer_id"),
        "customer_name": doc.get("customer_name"),
        "amount": doc.get("amount", 0.0),
        "payment_date": doc.get("payment_date"),
        "payment_mode": doc.get("payment_mode", "Cash"),
        "reference_id": doc.get("reference_id", ""),
        "notes": doc.get("notes", ""),
        "created_at": created_at_str
    }

@router.post("", response_model=ReceivedPaymentResponse, status_code=status.HTTP_201_CREATED)
def create_received_payment(payment: ReceivedPaymentCreate, user_email: str = Depends(get_current_user)):
    payment_dict = payment.model_dump()
    payment_dict['user_email'] = user_email
    payment_dict["created_at"] = datetime.now()
    
    result = received_payments_collection.insert_one(payment_dict)
    payment_dict["_id"] = result.inserted_id
    return serialize_payment(payment_dict)

@router.get("", response_model=List[ReceivedPaymentResponse])
def get_all_received_payments(user_email: str = Depends(get_current_user)):
    docs = list(received_payments_collection.find({"user_email": user_email}).sort("payment_date", -1))
    return [serialize_payment(doc) for doc in docs]

@router.get("/customer/{customer_id}", response_model=List[ReceivedPaymentResponse])
def get_customer_received_payments(customer_id: str, user_email: str = Depends(get_current_user)):
    docs = list(received_payments_collection.find({"customer_id": customer_id, "user_email": user_email}).sort("payment_date", -1))
    return [serialize_payment(doc) for doc in docs]

@router.delete("/{payment_id}")
def delete_received_payment(payment_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(payment_id):
        raise HTTPException(status_code=400, detail="Invalid payment ID format")
        
    result = received_payments_collection.delete_one({"_id": ObjectId(payment_id), "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    return {"message": "Received payment deleted successfully"}
