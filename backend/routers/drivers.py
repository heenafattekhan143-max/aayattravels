from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from backend.dependencies import get_current_user
from backend.config import drivers_collection

router = APIRouter(prefix="/api/drivers", tags=["drivers"])

class DriverBase(BaseModel):
    name: str = Field(..., min_length=1)
    phone: str = Field(..., pattern="^[0-9]{10}$")
    license_number: Optional[str] = ""
    status: str = Field(default="Active", pattern="^(Active|Inactive)$")
    address: Optional[str] = ""
    joining_date: Optional[str] = ""
    license_expiry_date: Optional[str] = ""
    basic_salary: Optional[float] = 0.0
    da_local: Optional[float] = 0.0
    da_outstation: Optional[float] = 0.0

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    status: Optional[str] = None
    address: Optional[str] = None
    joining_date: Optional[str] = None
    license_expiry_date: Optional[str] = None
    basic_salary: Optional[float] = None
    da_local: Optional[float] = None
    da_outstation: Optional[float] = None

class DriverResponse(DriverBase):
    id: str

def serialize_driver(doc) -> dict:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name"),
        "phone": doc.get("phone"),
        "license_number": doc.get("license_number", ""),
        "status": doc.get("status", "Active"),
        "address": doc.get("address", ""),
        "joining_date": doc.get("joining_date", ""),
        "license_expiry_date": doc.get("license_expiry_date", ""),
        "basic_salary": doc.get("basic_salary", 0.0),
        "da_local": doc.get("da_local", 0.0),
        "da_outstation": doc.get("da_outstation", 0.0),
    }

@router.post("", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(driver: DriverCreate, user_email: str = Depends(get_current_user)):
    driver_dict = driver.model_dump()
    driver_dict['user_email'] = user_email
    
    # Check for duplicate phone number
    existing = drivers_collection.find_one({"phone": driver_dict["phone"], "user_email": user_email})
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Driver with this phone number already exists."
        )
        
    result = drivers_collection.insert_one(driver_dict)
    driver_dict["_id"] = result.inserted_id
    return serialize_driver(driver_dict)

@router.get("", response_model=List[DriverResponse])
def get_drivers(status: Optional[str] = None, user_email: str = Depends(get_current_user)):
    query = {"user_email": user_email}
    if status:
        query["status"] = status
    
    docs = list(drivers_collection.find(query))
    return [serialize_driver(doc) for doc in docs]

@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(driver_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(driver_id):
        raise HTTPException(status_code=400, detail="Invalid driver ID format")
        
    doc = drivers_collection.find_one({"_id": ObjectId(driver_id), "user_email": user_email})
    if not doc:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    return serialize_driver(doc)

@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver(driver_id: str, driver_update: DriverUpdate, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(driver_id):
        raise HTTPException(status_code=400, detail="Invalid driver ID format")
        
    update_data = {k: v for k, v in driver_update.model_dump().items() if v is not None}
    
    if "phone" in update_data:
        # Check duplicate if phone changes
        existing = drivers_collection.find_one({"phone": update_data["phone"], "user_email": user_email})
        if existing and str(existing["_id"]) != driver_id:
            raise HTTPException(
                status_code=400,
                detail="Driver with this phone number already exists."
            )
            
    if not update_data:
        doc = drivers_collection.find_one({"_id": ObjectId(driver_id), "user_email": user_email})
        if not doc:
            raise HTTPException(status_code=404, detail="Driver not found")
        return serialize_driver(doc)
        
    result = drivers_collection.find_one_and_update({"_id": ObjectId(driver_id), "user_email": user_email},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    return serialize_driver(result)

@router.delete("/{driver_id}")
def delete_driver(driver_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(driver_id):
        raise HTTPException(status_code=400, detail="Invalid driver ID format")
        
    result = drivers_collection.delete_one({"_id": ObjectId(driver_id), "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    return {"message": "Driver deleted successfully"}
