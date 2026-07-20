from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from backend.dependencies import get_current_user
from backend.config import vehicles_collection

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])

class VehicleBase(BaseModel):
    vehicle_number: str = Field(..., min_length=1)
    model: Optional[str] = ""
    vehicle_type: str = Field(..., pattern="^(Sedan|Ertiga|SUV)$")
    status: str = Field(..., pattern="^(Active|Maintenance|Inactive)$")
    ownership_type: str = Field(default="Owner", pattern="^(Owner|Vendor)$")
    owner_name: Optional[str] = "Ravi Sable"
    maintenance_km_threshold: Optional[int] = None
    total_km_travelled: Optional[float] = 0.0
    insurance_expiry: Optional[str] = None
    insurance_notify_days: Optional[int] = None
    road_tax_expiry: Optional[str] = None
    road_tax_notify_days: Optional[int] = None
    permit_expiry: Optional[str] = None
    permit_notify_days: Optional[int] = None
    authorization_expiry: Optional[str] = None
    authorization_notify_days: Optional[int] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = None
    model: Optional[str] = None
    vehicle_type: Optional[str] = None
    status: Optional[str] = None
    ownership_type: Optional[str] = None
    owner_name: Optional[str] = None
    maintenance_km_threshold: Optional[int] = None
    total_km_travelled: Optional[float] = None
    insurance_expiry: Optional[str] = None
    insurance_notify_days: Optional[int] = None
    road_tax_expiry: Optional[str] = None
    road_tax_notify_days: Optional[int] = None
    permit_expiry: Optional[str] = None
    permit_notify_days: Optional[int] = None
    authorization_expiry: Optional[str] = None
    authorization_notify_days: Optional[int] = None

class VehicleResponse(VehicleBase):
    id: str

def serialize_vehicle(doc) -> dict:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "vehicle_number": doc.get("vehicle_number"),
        "model": doc.get("model", ""),
        "driver_name": doc.get("driver_name", ""),
        "vehicle_type": doc.get("vehicle_type"),
        "status": doc.get("status"),
        "ownership_type": doc.get("ownership_type", "Owner"),
        "owner_name": doc.get("owner_name", "Ravi Sable"),
        "maintenance_km_threshold": doc.get("maintenance_km_threshold"),
        "total_km_travelled": doc.get("total_km_travelled", 0.0),
        "insurance_expiry": doc.get("insurance_expiry"),
        "insurance_notify_days": doc.get("insurance_notify_days"),
        "road_tax_expiry": doc.get("road_tax_expiry"),
        "road_tax_notify_days": doc.get("road_tax_notify_days"),
        "permit_expiry": doc.get("permit_expiry"),
        "permit_notify_days": doc.get("permit_notify_days"),
        "authorization_expiry": doc.get("authorization_expiry"),
        "authorization_notify_days": doc.get("authorization_notify_days"),
    }

@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(vehicle: VehicleCreate, user_email: str = Depends(get_current_user)):
    vehicle_dict = vehicle.model_dump()
    vehicle_dict['user_email'] = user_email
    vehicle_dict["vehicle_number"] = vehicle_dict["vehicle_number"].upper()
    
    # Check duplicate vehicle number
    existing = vehicles_collection.find_one({"vehicle_number": vehicle_dict["vehicle_number"], "user_email": user_email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle with this plate number already exists."
        )
        
    result = vehicles_collection.insert_one(vehicle_dict)
    vehicle_dict["_id"] = result.inserted_id
    return serialize_vehicle(vehicle_dict)

@router.get("", response_model=List[VehicleResponse])
def get_vehicles(vehicle_type: Optional[str] = None, user_email: str = Depends(get_current_user)):
    query = {"user_email": user_email}
    if vehicle_type:
        query["vehicle_type"] = vehicle_type
        
    docs = list(vehicles_collection.find(query))
    return [serialize_vehicle(doc) for doc in docs]

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(vehicle_id):
        raise HTTPException(status_code=400, detail="Invalid vehicle ID format")
        
    doc = vehicles_collection.find_one({"_id": ObjectId(vehicle_id), "user_email": user_email})
    if not doc:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    return serialize_vehicle(doc)

@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: str, vehicle_update: VehicleUpdate, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(vehicle_id):
        raise HTTPException(status_code=400, detail="Invalid vehicle ID format")
        
    update_data = {k: v for k, v in vehicle_update.model_dump().items() if v is not None}
    if "vehicle_number" in update_data:
        update_data["vehicle_number"] = update_data["vehicle_number"].upper()
        
    if not update_data:
        doc = vehicles_collection.find_one({"_id": ObjectId(vehicle_id), "user_email": user_email})
        if not doc:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        return serialize_vehicle(doc)
        
    result = vehicles_collection.find_one_and_update({"_id": ObjectId(vehicle_id), "user_email": user_email},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    return serialize_vehicle(result)

@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(vehicle_id):
        raise HTTPException(status_code=400, detail="Invalid vehicle ID format")
        
    result = vehicles_collection.delete_one({"_id": ObjectId(vehicle_id), "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    return {"message": "Vehicle deleted successfully"}
