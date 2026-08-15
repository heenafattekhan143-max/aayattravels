from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from backend.dependencies import get_current_user
from datetime import datetime
from backend.config import advances_collection

router = APIRouter(prefix="/api/advances", tags=["advances"])

class AdvanceBase(BaseModel):
    party_type: str = Field(pattern="^(Vendor|Driver)$")
    party_id: str
    party_name: str
    amount: float
    date: str
    direction: str = Field(default="sent", pattern="^(sent|received)$")
    payment_mode: str = Field(default="Cash", pattern="^(Cash|UPI|Bank Transfer|Cheque)$")
    notes: Optional[str] = ""

class AdvanceCreate(AdvanceBase):
    pass

class AdvanceResponse(AdvanceBase):
    id: str
    created_at: str

def serialize_advance(doc) -> dict:
    if not doc:
        return None
    
    created_at_val = doc.get("created_at")
    if isinstance(created_at_val, datetime):
        created_at_str = created_at_val.isoformat()
    else:
        created_at_str = str(created_at_val) if created_at_val else datetime.now().isoformat()
        
    return {
        "id": str(doc["_id"]),
        "party_type": doc.get("party_type"),
        "party_id": doc.get("party_id"),
        "party_name": doc.get("party_name"),
        "amount": doc.get("amount", 0.0),
        "date": doc.get("date"),
        "payment_mode": doc.get("payment_mode", "Cash"),
        "notes": doc.get("notes", ""),
        "direction": doc.get("direction", "sent"),
        "created_at": created_at_str
    }

@router.post("", response_model=AdvanceResponse, status_code=status.HTTP_201_CREATED)
def create_advance(advance: AdvanceCreate, user_email: str = Depends(get_current_user)):
    advance_dict = advance.model_dump()
    advance_dict['user_email'] = user_email
    advance_dict["created_at"] = datetime.now()
    
    result = advances_collection.insert_one(advance_dict)
    advance_dict["_id"] = result.inserted_id
    return serialize_advance(advance_dict)

@router.get("", response_model=List[AdvanceResponse])
def get_all_advances(user_email: str = Depends(get_current_user)):
    docs = list(advances_collection.find({"user_email": user_email}).sort("date", -1))
    return [serialize_advance(doc) for doc in docs]

@router.get("/party/{party_type}/{party_id}", response_model=List[AdvanceResponse])
def get_party_advances(party_type: str, party_id: str, user_email: str = Depends(get_current_user)):
    docs = list(advances_collection.find({
        "party_type": party_type, 
        "party_id": party_id, 
        "user_email": user_email
    }).sort("date", -1))
    return [serialize_advance(doc) for doc in docs]

@router.delete("/{advance_id}")
def delete_advance(advance_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(advance_id):
        raise HTTPException(status_code=400, detail="Invalid advance ID format")
        
    result = advances_collection.delete_one({"_id": ObjectId(advance_id), "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Advance not found")
        
    return {"message": "Advance deleted successfully"}
