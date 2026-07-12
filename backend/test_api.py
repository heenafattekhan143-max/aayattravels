import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_db_check():
    response = client.get("/api/db-check")
    assert response.status_code == 200
    assert response.json()["status"] == "connected"

def test_customer_crud():
    # Clean database state before testing to ensure idempotency
    from backend.config import entities_collection
    entities_collection.delete_many({"phone": "9876543210"})

    # 1. Create a customer (Valid)
    cust_data = {
        "entity_type": "customer",
        "name": "Test Company Ltd",
        "phone": "9876543210",
        "gst_type": "Registered",
        "gstin": "27AAAAA1111A1Z1",
        "billing_address": "123 Main St, Mumbai",
        "state": "Maharashtra",
        "email": "test@company.com"
    }
    response = client.post("/api/customers", json=cust_data)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["name"] == "Test Company Ltd"
    assert "id" in res_json
    customer_id = res_json["id"]

    # 2. Duplicate Check
    response_dup = client.post("/api/customers", json=cust_data)
    assert response_dup.status_code == 400
    
    # 3. Create a Customer (Invalid Phone)
    bad_phone = cust_data.copy()
    bad_phone["phone"] = "123"
    bad_phone["name"] = "Bad Phone Company"
    response_phone = client.post("/api/customers", json=bad_phone)
    assert response_phone.status_code == 422 # Pydantic validation error

    # 5. List Customers
    list_response = client.get("/api/customers")
    assert list_response.status_code == 200
    assert len(list_response.json()) >= 1

    # Cleanup test customer
    del_response = client.delete(f"/api/customers/{customer_id}")
    assert del_response.status_code == 200

def test_plan_crud():
    # Clean database state before testing to ensure idempotency
    from backend.config import plans_collection
    plans_collection.delete_many({"plan_name": "8 hours 80 Kms package"})

    # 1. Create plan and test auto-parsing of base km & hours from plan name
    plan_data = {
        "plan_name": "8 hours 80 Kms package",
        "rate": 4500.0,
        "vehicle_type": "Sedan"
    }
    response = client.post("/api/plans", json=plan_data)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["base_hours"] == 8
    assert res_json["base_km"] == 80
    assert res_json["extra_km_rate"] == 12.0 # Default for Sedan
    assert res_json["extra_hours_rate"] == 150.0 # Default for Sedan
    plan_id = res_json["id"]

    # 2. List plans
    list_response = client.get("/api/plans")
    assert list_response.status_code == 200
    assert len(list_response.json()) >= 1

    # 3. Update Plan (PUT)
    put_response = client.put(f"/api/plans/{plan_id}", json={"rate": 5000.0})
    assert put_response.status_code == 200
    assert put_response.json()["rate"] == 5000.0

    # Cleanup
    del_response = client.delete(f"/api/plans/{plan_id}")
    assert del_response.status_code == 200

def test_bill_crud():
    from backend.config import entities_collection, plans_collection, bills_collection
    from bson import ObjectId

    # Clean up previous test bills
    bills_collection.delete_many({"guest_name": "John Doe Test"})

    customer = entities_collection.find_one({"name": "Test Customer"})
    plan = plans_collection.find_one({"plan_name": "8 hours 80 Kms"})

    # Fallback to create them if not run inside browser tests
    if not customer:
        cust_res = client.post("/api/customers", json={
            "entity_type": "customer",
            "name": "Test Customer",
            "phone": "9876543210",
            "gst_type": "Registered",
            "gstin": "27AADCB8384D1ZY",
            "billing_address": "123 Street",
            "state": "Maharashtra"
        })
        customer = cust_res.json()
        customer["_id"] = customer["id"]
        
    if not plan:
        plan_res = client.post("/api/plans", json={
            "plan_name": "8 hours 80 Kms",
            "rate": 4000.0,
            "vehicle_type": "Sedan"
        })
        plan = plan_res.json()
        plan["_id"] = plan["id"]

    # Construct billing payload
    bill_data = {
        "party_type": "customer",
        "gst_enabled": True,
        "customer_id": str(customer["_id"]),
        "customer_name": customer["name"],
        "phone_number": customer["phone"],
        "guest_name": "John Doe Test",
        "date": "2026-06-22",
        "vendor_name": "Purvi Travels",
        "vehicle_number": "MH12SP9620",
        "driver_name": "Test Driver",
        "travel_distance": 150.0,
        "table_items": [
            {
                "plan_id": str(plan["_id"]),
                "plan_name": plan["plan_name"],
                "date": "2026-06-22",
                "total_distance_km": 100.0,
                "extra_km": 20.0,
                "total_hours": 9.0,
                "extra_hours": 1.0,
                "amount_without_gst": 4390.0,
                "gst_rate": 12.0,
                "amount_with_gst": 4917.0
            }
        ],
        "toll_amount": 500.0,
        "final_bill_amount": 5417.0,
        "final_bill_words": "(Rs. Five Thousand Four Hundred Seventeen Only)"
    }

    # Post to bills route
    response = client.post("/api/bills", json=bill_data)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["final_bill_amount"] == 5417.0
    assert res_json["final_bill_words"] == "(Rs. Five Thousand Four Hundred Seventeen Only)"

    # Verify document exists in DB
    bill_id = res_json["id"]
    db_bill = bills_collection.find_one({"_id": ObjectId(bill_id)})
    assert db_bill is not None
    assert db_bill["final_bill_amount"] == 5417.0

    # 4. Update Bill (PUT)
    bill_data["toll_amount"] = 600.0
    bill_data["final_bill_amount"] = 5517.0
    bill_data["final_bill_words"] = "(Rs. Five Thousand Five Hundred Seventeen Only)"
    
    put_response = client.put(f"/api/bills/{bill_id}", json=bill_data)
    assert put_response.status_code == 200
    assert put_response.json()["toll_amount"] == 600.0
    assert put_response.json()["final_bill_amount"] == 5517.0

    # Cleanup
    bills_collection.delete_one({"_id": ObjectId(bill_id)})

def test_vehicle_crud():
    from backend.config import vehicles_collection
    from bson import ObjectId

    # Clean up duplicate plates
    vehicles_collection.delete_many({"vehicle_number": "MH12SP9999"})

    # 1. Create (POST)
    veh_data = {
        "vehicle_number": "mh12sp9999",
        "model": "Suzuki Ertiga",
        "driver_name": "Ramesh Patil",
        "vehicle_type": "Ertiga",
        "status": "Active"
    }
    response = client.post("/api/vehicles", json=veh_data)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["vehicle_number"] == "MH12SP9999"
    vehicle_id = res_json["id"]

    # 2. Duplicate Check
    response_dup = client.post("/api/vehicles", json=veh_data)
    assert response_dup.status_code == 400

    # 3. Update (PUT)
    put_response = client.put(f"/api/vehicles/{vehicle_id}", json={"driver_name": "Rajesh Patil", "status": "Maintenance"})
    assert put_response.status_code == 200
    assert put_response.json()["driver_name"] == "Rajesh Patil"
    assert put_response.json()["status"] == "Maintenance"

    # 4. List (GET)
    get_response = client.get("/api/vehicles")
    assert get_response.status_code == 200
    assert len(get_response.json()) >= 1

    # Cleanup
    del_response = client.delete(f"/api/vehicles/{vehicle_id}")
    assert del_response.status_code == 200

def test_driver_crud():
    from backend.config import drivers_collection
    from bson import ObjectId

    # Cleanup duplicate drivers
    drivers_collection.delete_many({"phone": "9876500000"})

    # 1. Create (POST)
    driver_data = {
        "name": "Driver Test",
        "phone": "9876500000",
        "license_number": "DL1234567890",
        "status": "Active",
        "address": "Driver Address",
        "joining_date": "2026-06-01",
        "license_expiry_date": "2036-06-01"
    }
    response = client.post("/api/drivers", json=driver_data)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["name"] == "Driver Test"
    assert res_json["phone"] == "9876500000"
    assert res_json["joining_date"] == "2026-06-01"
    assert res_json["license_expiry_date"] == "2036-06-01"
    driver_id = res_json["id"]

    # 2. Duplicate Check
    response_dup = client.post("/api/drivers", json=driver_data)
    assert response_dup.status_code == 400

    # 3. Update (PUT)
    put_response = client.put(f"/api/drivers/{driver_id}", json={
        "status": "Inactive", 
        "name": "Driver Test Updated",
        "joining_date": "2026-06-02",
        "license_expiry_date": "2036-06-02"
    })
    assert put_response.status_code == 200
    assert put_response.json()["status"] == "Inactive"
    assert put_response.json()["name"] == "Driver Test Updated"
    assert put_response.json()["joining_date"] == "2026-06-02"
    assert put_response.json()["license_expiry_date"] == "2036-06-02"

    # 4. List (GET)
    get_response = client.get("/api/drivers")
    assert get_response.status_code == 200
    assert len(get_response.json()) >= 1

    # Cleanup
    del_response = client.delete(f"/api/drivers/{driver_id}")
    assert del_response.status_code == 200

if __name__ == "__main__":
    import pytest
    pytest.main([__file__])
