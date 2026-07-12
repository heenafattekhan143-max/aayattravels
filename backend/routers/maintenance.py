from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from backend.dependencies import get_current_user
from datetime import datetime
from backend.config import maintenance_collection

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])

class MaintenanceBase(BaseModel):
    vehicle: str
    type: str
    service: Optional[str] = ""
    cost: float
    date: str
    status: str = Field(default="Completed", pattern="^(Completed|In Progress)$")
    odo_km: Optional[int] = None

class MaintenanceCreate(MaintenanceBase):
    pass

class MaintenanceResponse(MaintenanceBase):
    id: str
    created_at: datetime

def serialize_maintenance(doc) -> dict:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "vehicle": doc.get("vehicle"),
        "type": doc.get("type"),
        "service": doc.get("service", ""),
        "cost": doc.get("cost", 0.0),
        "date": doc.get("date"),
        "status": doc.get("status", "Completed"),
        "odo_km": doc.get("odo_km"),
        "created_at": doc.get("created_at")
    }

@router.get("", response_model=List[MaintenanceResponse])
def get_maintenance_logs(user_email: str = Depends(get_current_user)):
    docs = list(maintenance_collection.find({"user_email": user_email}).sort("date", -1))
    return [serialize_maintenance(doc) for doc in docs]

@router.post("", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_log(log: MaintenanceCreate, user_email: str = Depends(get_current_user)):
    log_dict = log.model_dump()
    log_dict['user_email'] = user_email
    log_dict["created_at"] = datetime.now()
    
    result = maintenance_collection.insert_one(log_dict)
    log_dict["_id"] = result.inserted_id
    return serialize_maintenance(log_dict)

@router.put("/{log_id}", response_model=MaintenanceResponse)
def update_maintenance_log(log_id: str, log: MaintenanceCreate, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(log_id):
        raise HTTPException(status_code=400, detail="Invalid log ID")
    
    log_dict = log.model_dump()
    log_dict['user_email'] = user_email
    result = maintenance_collection.find_one_and_update({"_id": ObjectId(log_id), "user_email": user_email},
        {"$set": log_dict},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Log not found")
    return serialize_maintenance(result)

@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maintenance_log(log_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(log_id):
        raise HTTPException(status_code=400, detail="Invalid log ID")
    
    result = maintenance_collection.delete_one({"_id": ObjectId(log_id), "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Log not found")
