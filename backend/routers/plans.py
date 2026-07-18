import re
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from backend.dependencies import get_current_user
from backend.config import plans_collection

router = APIRouter(prefix="/api/plans", tags=["plans"])

# Helper function to parse base hours and kms from plan_name
def parse_plan_limits(plan_name: str, user_email: str = Depends(get_current_user)):
    # Match hours
    hour_match = re.search(r"(\d+)\s*(?:hour|hr|h)", plan_name, re.IGNORECASE)
    # Match kms
    km_match = re.search(r"(\d+)\s*(?:km|kilometer)", plan_name, re.IGNORECASE)
    
    base_hours = int(hour_match.group(1)) if hour_match else 8
    base_km = int(km_match.group(1)) if km_match else 80
    return base_hours, base_km

# Helper function to get default extra rates
def get_default_extra_rates(vehicle_type: str, user_email: str = Depends(get_current_user)):
    vt = vehicle_type.lower()
    if "sedan" in vt:
        return 12, 150  # 12 Rs/km, 150 Rs/hr
    elif "ertiga" in vt:
        return 15, 180  # 15 Rs/km, 180 Rs/hr
    else:  # SUV or fallback
        return 18, 200  # 18 Rs/km, 200 Rs/hr

class PlanBase(BaseModel):
    plan_name: str = Field(..., min_length=1)
    rate: float = Field(..., gt=0)
    vehicle_type: str = Field(..., pattern="^(Sedan|Ertiga|SUV)$")
    base_hours: Optional[int] = None
    base_km: Optional[int] = None
    extra_km_rate: Optional[float] = None
    extra_hours_rate: Optional[float] = None
    plan_type: Optional[str] = None
    da_allowance: Optional[float] = 0.0
    night_allowance: Optional[float] = 0.0

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    plan_name: Optional[str] = None
    rate: Optional[float] = None
    vehicle_type: Optional[str] = None
    base_hours: Optional[int] = None
    base_km: Optional[int] = None
    extra_km_rate: Optional[float] = None
    extra_hours_rate: Optional[float] = None
    plan_type: Optional[str] = None
    da_allowance: Optional[float] = None
    night_allowance: Optional[float] = None

class PlanResponse(PlanBase):
    id: str
    base_hours: int
    base_km: int
    extra_km_rate: float
    extra_hours_rate: float

def serialize_plan(doc) -> dict:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "plan_name": doc.get("plan_name"),
        "rate": doc.get("rate"),
        "vehicle_type": doc.get("vehicle_type"),
        "base_hours": doc.get("base_hours"),
        "base_km": doc.get("base_km"),
        "extra_km_rate": doc.get("extra_km_rate"),
        "extra_hours_rate": doc.get("extra_hours_rate"),
        "plan_type": doc.get("plan_type"),
        "da_allowance": doc.get("da_allowance", 0.0),
        "night_allowance": doc.get("night_allowance", 0.0)
    }

@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(plan: PlanCreate, user_email: str = Depends(get_current_user)):
    plan_dict = plan.model_dump()
    plan_dict['user_email'] = user_email
    
    # Auto-calculate base hours/km if not provided
    if plan_dict["base_hours"] is None or plan_dict["base_km"] is None:
        parsed_hours, parsed_km = parse_plan_limits(plan_dict["plan_name"])
        if plan_dict["base_hours"] is None:
            plan_dict["base_hours"] = parsed_hours
        if plan_dict["base_km"] is None:
            plan_dict["base_km"] = parsed_km
            
    # Auto-calculate extra rates if not provided
    def_km_rate, def_hr_rate = get_default_extra_rates(plan_dict["vehicle_type"])
    if plan_dict["extra_km_rate"] is None:
        plan_dict["extra_km_rate"] = def_km_rate
    if plan_dict["extra_hours_rate"] is None:
        plan_dict["extra_hours_rate"] = def_hr_rate
        
    result = plans_collection.insert_one(plan_dict)
    plan_dict["_id"] = result.inserted_id
    return serialize_plan(plan_dict)

@router.get("", response_model=List[PlanResponse])
def get_plans(
    vehicle_type: Optional[str] = None
, user_email: str = Depends(get_current_user)):
    query = {"user_email": user_email}
    if vehicle_type:
        query["vehicle_type"] = vehicle_type
    
    docs = list(plans_collection.find(query))
    return [serialize_plan(doc) for doc in docs]

@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(plan_id):
        raise HTTPException(status_code=400, detail="Invalid plan ID format")
        
    doc = plans_collection.find_one({"_id": ObjectId(plan_id), "user_email": user_email})
    if not doc:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    return serialize_plan(doc)

@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(plan_id: str, plan_update: PlanUpdate, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(plan_id):
        raise HTTPException(status_code=400, detail="Invalid plan ID format")
        
    update_data = {k: v for k, v in plan_update.model_dump().items() if v is not None}
    if not update_data:
        doc = plans_collection.find_one({"_id": ObjectId(plan_id), "user_email": user_email})
        if not doc:
            raise HTTPException(status_code=404, detail="Plan not found")
        return serialize_plan(doc)
        
    if "plan_name" in update_data and ("base_hours" not in update_data or "base_km" not in update_data):
        parsed_hours, parsed_km = parse_plan_limits(update_data["plan_name"])
        if "base_hours" not in update_data:
            update_data["base_hours"] = parsed_hours
        if "base_km" not in update_data:
            update_data["base_km"] = parsed_km
            
    if "vehicle_type" in update_data and ("extra_km_rate" not in update_data or "extra_hours_rate" not in update_data):
        def_km_rate, def_hr_rate = get_default_extra_rates(update_data["vehicle_type"])
        if "extra_km_rate" not in update_data:
            update_data["extra_km_rate"] = def_km_rate
        if "extra_hours_rate" not in update_data:
            update_data["extra_hours_rate"] = def_hr_rate

    result = plans_collection.find_one_and_update({"_id": ObjectId(plan_id), "user_email": user_email},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    return serialize_plan(result)

@router.delete("/{plan_id}")
def delete_plan(plan_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(plan_id):
        raise HTTPException(status_code=400, detail="Invalid plan ID format")
        
    result = plans_collection.delete_one({"_id": ObjectId(plan_id), "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    return {"message": "Plan deleted successfully"}
