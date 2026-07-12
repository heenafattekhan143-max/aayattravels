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
