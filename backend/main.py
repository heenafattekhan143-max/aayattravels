import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import customers, plans, bills, vehicles, plan_names, maintenance, drivers, bookings, payments, received_payments, event_bills, auth
from backend.config import check_db_connection

app = FastAPI(
    title="Purvi Travels Billing API",
    description="Backend API for travel billing management system",
    version="1.0.0"
)

# CORS: In production, set ALLOWED_ORIGINS env var to your Vercel app URL.
# e.g. ALLOWED_ORIGINS=https://yourapp.vercel.app,https://custom-domain.com
# In development, allow all origins for convenience.
raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
if raw_origins == "*":
    allow_origins = ["*"]
else:
    allow_origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(customers.router)
app.include_router(plans.router)
app.include_router(bills.router)
app.include_router(vehicles.router)
app.include_router(plan_names.router)
app.include_router(maintenance.router)
app.include_router(drivers.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(received_payments.router)
app.include_router(event_bills.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "Purvi Travels Billing API",
        "version": "1.0.0"
    }

@app.get("/api/db-check")
def db_check():
    connected = check_db_connection()
    if connected:
        return {"status": "connected", "database": "mongodb"}
    else:
        return {"status": "disconnected", "error": "Unable to ping MongoDB community instance"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)

