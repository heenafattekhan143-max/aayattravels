from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from backend.dependencies import get_current_user
from backend.config import vehicle_classes_collection

router = APIRouter(prefix="/api/vehicle-classes", tags=["vehicle_classes"])

class VehicleClassBase(BaseModel):
    name: str = Field(..., min_length=1)
    capacity: Optional[int] = None
    description: Optional[str] = ""

class VehicleClassCreate(VehicleClassBase):
    pass

class VehicleClassUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    description: Optional[str] = None

class VehicleClassResponse(VehicleClassBase):
    id: str

def serialize_vehicle_class(doc) -> dict:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name"),
        "capacity": doc.get("capacity"),
        "description": doc.get("description", ""),
    }

@router.post("", response_model=VehicleClassResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle_class(vehicle_class: VehicleClassCreate, user_email: str = Depends(get_current_user)):
    vehicle_class_dict = vehicle_class.model_dump()
    vehicle_class_dict['user_email'] = user_email
    
    # Check duplicate
    existing = vehicle_classes_collection.find_one({
        "name": {"$regex": f"^{vehicle_class_dict['name']}$", "$options": "i"},
        "user_email": user_email
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle class with this name already exists."
        )
        
    result = vehicle_classes_collection.insert_one(vehicle_class_dict)
    vehicle_class_dict["_id"] = result.inserted_id
    return serialize_vehicle_class(vehicle_class_dict)

@router.get("", response_model=List[VehicleClassResponse])
def get_vehicle_classes(user_email: str = Depends(get_current_user)):
    docs = list(vehicle_classes_collection.find({"user_email": user_email}))
    return [serialize_vehicle_class(doc) for doc in docs]

@router.get("/{class_id}", response_model=VehicleClassResponse)
def get_vehicle_class(class_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(class_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    doc = vehicle_classes_collection.find_one({"_id": ObjectId(class_id), "user_email": user_email})
    if not doc:
        raise HTTPException(status_code=404, detail="Vehicle class not found")
        
    return serialize_vehicle_class(doc)

@router.put("/{class_id}", response_model=VehicleClassResponse)
def update_vehicle_class(class_id: str, class_update: VehicleClassUpdate, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(class_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    update_data = {k: v for k, v in class_update.model_dump().items() if v is not None}
        
    if not update_data:
        doc = vehicle_classes_collection.find_one({"_id": ObjectId(class_id), "user_email": user_email})
        if not doc:
            raise HTTPException(status_code=404, detail="Vehicle class not found")
        return serialize_vehicle_class(doc)
        
    result = vehicle_classes_collection.find_one_and_update(
        {"_id": ObjectId(class_id), "user_email": user_email},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Vehicle class not found")
        
    return serialize_vehicle_class(result)

@router.delete("/{class_id}")
def delete_vehicle_class(class_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(class_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    result = vehicle_classes_collection.delete_one({"_id": ObjectId(class_id), "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle class not found")
        
    return {"message": "Vehicle class deleted successfully"}
