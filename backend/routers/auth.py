from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from backend.config import users_collection
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    businessName: str
    businessType: str
    address: str
    pincode: str
    city: str
    referral: Optional[str] = ""
    gstin: Optional[str] = ""
    logo: Optional[str] = None
    role: Optional[str] = "superadmin"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    businessName: Optional[str] = None
    businessType: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    city: Optional[str] = None
    gstin: Optional[str] = None
    logo: Optional[str] = None
    state: Optional[str] = None

class UserLogin(BaseModel):
    identifier: str  # Can be email or phone
    password: str

def serialize_user(doc):
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "email": doc.get("email"),
        "name": doc.get("name"),
        "phone": doc.get("phone"),
        "role": doc.get("role", "superadmin"),
        "businessName": doc.get("businessName"),
        "businessType": doc.get("businessType"),
        "address": doc.get("address"),
        "pincode": doc.get("pincode"),
        "city": doc.get("city"),
        "referral": doc.get("referral"),
        "gstin": doc.get("gstin"),
        "logo": doc.get("logo"),
    }

@router.post("/register")
def register(user: UserRegister):
    # Check if user already exists
    if users_collection.find_one({"$or": [{"email": user.email}, {"phone": user.phone}]}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or phone already exists"
        )
    
    user_dict = user.model_dump()
    result = users_collection.insert_one(user_dict)
    
    # Return the user object without password
    doc = users_collection.find_one({"_id": result.inserted_id})
    return serialize_user(doc)

@router.post("/login")
def login(creds: UserLogin):
    # Find user by email or phone
    user = users_collection.find_one({
        "$or": [
            {"email": {"$regex": f"^{creds.identifier}$", "$options": "i"}},
            {"phone": creds.identifier}
        ]
    })
    
    if not user or user.get("password") != creds.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password"
        )
        
    return serialize_user(user)

from backend.dependencies import get_current_user
from fastapi import Depends

@router.put("/profile")
def update_profile(update_data: UserUpdate, user_email: str = Depends(get_current_user)):
    user = users_collection.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        return serialize_user(user)
        
    from pymongo import ReturnDocument
    updated_user = users_collection.find_one_and_update(
        {"email": user_email},
        {"$set": update_dict},
        return_document=ReturnDocument.AFTER
    )
    
    return serialize_user(updated_user)

