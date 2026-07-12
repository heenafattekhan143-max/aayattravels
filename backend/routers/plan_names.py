from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List
from bson import ObjectId
from backend.dependencies import get_current_user
from backend.config import db

router = APIRouter(prefix="/api/plan-names", tags=["plan_names"])
plan_names_collection = db["plan_names"]

class PlanNameBase(BaseModel):
    name: str = Field(..., min_length=1)

class PlanNameResponse(PlanNameBase):
    id: str

def serialize_plan_name(doc) -> dict:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name")
    }

@router.get("", response_model=List[PlanNameResponse])
def get_plan_names(user_email: str = Depends(get_current_user)):
    docs = list(plan_names_collection.find({"user_email": user_email}))
    return [serialize_plan_name(doc) for doc in docs]

@router.post("", response_model=PlanNameResponse, status_code=status.HTTP_201_CREATED)
def create_plan_name(plan_name: PlanNameBase, user_email: str = Depends(get_current_user)):
    # Check if exists
    existing = plan_names_collection.find_one({"name": {"$regex": f"^{plan_name.name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail="Plan name already exists")
    
    plan_dict = plan_name.model_dump()
    plan_dict['user_email'] = user_email
    result = plan_names_collection.insert_one(plan_dict)
    plan_dict["_id"] = result.inserted_id
    return serialize_plan_name(plan_dict)

@router.delete("/{plan_id}")
def delete_plan_name(plan_id: str, user_email: str = Depends(get_current_user)):
    if not ObjectId.is_valid(plan_id):
        raise HTTPException(status_code=400, detail="Invalid plan name ID")
        
    result = plan_names_collection.delete_one({"_id": ObjectId(plan_id), "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plan name not found")
        
    return {"message": "Deleted successfully"}
