from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["purvi_travels"]

mock_users = [
  {
    "email": "admin@purvitravels.com",
    "password": "admin123",
    "name": "Super Admin",
    "phone": "9158197878",
    "role": "superadmin",
    "businessName": "Purvi Travels HQ",
    "businessType": "Car-rental company",
    "city": "Mumbai",
  },
  {
    "email": "vendor@purvitravels.com",
    "password": "vendor123",
    "name": "Vendor User",
    "phone": "9876543210",
    "role": "vendor",
    "businessName": "City Cabs",
    "businessType": "Tours & Travels company",
    "city": "Pune",
  },
  {
    "email": "staff@purvitravels.com",
    "password": "staff123",
    "name": "Staff Member",
    "phone": "9112233445",
    "role": "staff",
    "businessName": "Purvi Travels",
    "businessType": "Car-rental company",
    "city": "Nashik",
  },
  {
    "email": "ravisable099@gmail.com",
    "password": "Ravisable",
    "name": "Ravi Sable",
    "phone": "9876543211",
    "role": "superadmin",
    "businessName": "Miracrest Group",
    "businessType": "Car-rental company",
    "city": "Mumbai"
  }
]

for u in mock_users:
    db.users.update_one({"email": u["email"]}, {"$set": u}, upsert=True)
print("Seeded demo users")
