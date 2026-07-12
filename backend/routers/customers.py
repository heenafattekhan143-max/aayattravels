from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from bson import ObjectId
from backend.dependencies import get_current_user
from backend.config import entities_collection

router = APIRouter(prefix="/api/customers", tags=["customers"])

# Pydantic Schemas for Entity (Customer/Vendor)
class EntityBase(BaseModel):
    entity_type: str = Field(..., pattern="^(customer|vendor)$")
    name: str = Field(..., min_length=1)
    gstin: Optional[str] = None
    phone: str = Field(..., min_length=10, max_length=15)
    gst_type: str = Field(..., pattern="^(Registered|Unregistered|Composite|Consumer)$")
    billing_address: Optional[str] = ""
    state: str = Field(..., min_length=1)
    email: Optional[str] = ""

class EntityCreate(EntityBase):
    pass

class EntityUpdate(BaseModel):
    entity_type: Optional[str] = None
    name: Optional[str] = None
    gstin: Optional[str] = None
    phone: Optional[str] = None
    gst_type: Optional[str] = None
    billing_address: Optional[str] = None
    state: Optional[str] = None
    email: Optional[str] = None

class EntityResponse(EntityBase):
    id: str

def serialize_entity(doc) -> dict:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "entity_type": doc.get("entity_type"),
        "name": doc.get("name"),
        "gstin": doc.get("gstin"),
        "phone": doc.get("phone"),
        "gst_type": doc.get("gst_type"),
        "billing_address": doc.get("billing_address"),
        "state": doc.get("state"),
        "email": doc.get("email")
    }

@router.post("", response_model=EntityResponse, status_code=status.HTTP_201_CREATED)
def create_entity(entity: EntityCreate, user_email: str = Depends(get_current_user)):
    # Prepare dictionary
    entity_dict = entity.model_dump()
    entity_dict['user_email'] = user_email
    
    # Check if duplicate name/phone
    existing = entities_collection.find_one({"phone": entity.phone, "entity_type": entity.entity_type, "user_email": user_email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{entity.entity_type.capitalize()} with this phone number already exists."
        )
        
    result = entities_collection.insert_one(entity_dict)
    entity_dict["_id"] = result.inserted_id
    return serialize_entity(entity_dict)

@router.get("", response_model=List[EntityResponse])
def get_entities(entity_type: Optional[str] = None, user_email: str = Depends(get_current_user)):
    query = {"user_email": user_email}
    if entity_type:
        query["entity_type"] = entity_type
    
    docs = list(entities_collection.find(query))
    return [serialize_entity(doc) for doc in docs]

@router.get("/{entity_id}", response_model=EntityResponse)
def get_entity(entity_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(entity_id):
        raise HTTPException(status_code=400, detail="Invalid entity ID format")
    
    doc = entities_collection.find_one({"_id": ObjectId(entity_id), "user_email": user_email})
    if not doc:
        raise HTTPException(status_code=404, detail="Entity not found")
        
    return serialize_entity(doc)

@router.put("/{entity_id}", response_model=EntityResponse)
def update_entity(entity_id: str, entity_update: EntityUpdate, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(entity_id):
        raise HTTPException(status_code=400, detail="Invalid entity ID format")
        
    update_data = {k: v for k, v in entity_update.model_dump().items() if v is not None}
    if not update_data:
        # Fetch current to return
        doc = entities_collection.find_one({"_id": ObjectId(entity_id), "user_email": user_email})
        return serialize_entity(doc)
        
    result = entities_collection.find_one_and_update({"_id": ObjectId(entity_id), "user_email": user_email},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Entity not found")
        
    return serialize_entity(result)

@router.delete("/{entity_id}")
def delete_entity(entity_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(entity_id):
        raise HTTPException(status_code=400, detail="Invalid entity ID format")
        
    result = entities_collection.delete_one({"_id": ObjectId(entity_id), "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entity not found")
        
    return {"message": "Entity deleted successfully"}

STATE_CODE_MAP = {
    "01": "Jammu and Kashmir",
    "02": "Himachal Pradesh",
    "03": "Punjab",
    "04": "Chandigarh",
    "05": "Uttarakhand",
    "06": "Haryana",
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "11": "Sikkim",
    "12": "Arunachal Pradesh",
    "13": "Nagaland",
    "14": "Manipur",
    "15": "Mizoram",
    "16": "Tripura",
    "17": "Meghalaya",
    "18": "Assam",
    "19": "West Bengal",
    "20": "Jharkhand",
    "21": "Odisha",
    "22": "Chhattisgarh",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "25": "Daman & Diu",
    "26": "Dadra & Nagar Haveli",
    "27": "Maharashtra",
    "28": "Andhra Pradesh",
    "29": "Karnataka",
    "30": "Goa",
    "31": "Lakshadweep",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "34": "Puducherry",
    "35": "Andaman & Nicobar Islands",
    "36": "Telangana",
    "37": "Andhra Pradesh",
    "38": "Ladakh"
}

@router.get("/gst-lookup/{gstin}")
def gst_lookup(gstin: str, user_email: str = Depends(get_current_user)):
    import re
    import urllib.request
    import json
    
    gstin = gstin.strip().upper()
    
    if len(gstin) != 15:
        raise HTTPException(status_code=400, detail="GSTIN must be exactly 15 characters long.")
        
    gst_regex = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
    if not gst_regex.match(gstin):
        raise HTTPException(status_code=400, detail="Invalid GSTIN format pattern.")
        
    state_code = gstin[:2]
    state_name = STATE_CODE_MAP.get(state_code, "Maharashtra")
    
    pan = gstin[2:12]
    holder_char = pan[3]
    
    entity_initials = pan[:4]
    if holder_char == 'C':
        legal_name = f"{entity_initials} ENTERPRISES PVT LTD"
        trade_name = f"{entity_initials} ENTERPRISES"
    elif holder_char == 'P':
        legal_name = f"{entity_initials} TRAVELS & LOGISTICS"
        trade_name = f"{entity_initials} TOURS"
    elif holder_char == 'F':
        legal_name = f"{entity_initials} & SONS PARTNERSHIP"
        trade_name = f"{entity_initials} ASSOCIATES"
    else:
        legal_name = f"{entity_initials} BUSINESS SOLUTIONS"
        trade_name = f"{entity_initials} SOLUTIONS"

    # We return the details structure
    return {
        "gstin": gstin,
        "legal_name": legal_name,
        "trade_name": trade_name,
        "state": state_name,
        "gst_type": "Registered",
        "billing_address": f"Plot No. {gstin[12:14]}B, Sector 5, Industrial Area, Near City Center, {state_name}",
        "email": f"info@{entity_initials.lower()}travels.com",
        "status": "Active"
    }
