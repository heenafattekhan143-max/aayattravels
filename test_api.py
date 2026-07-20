import urllib.request
import urllib.parse
import json

API = "http://localhost:5000/api"

# Login
login_data = urllib.parse.urlencode({"username": "ravisable099@gmail.com", "password": "password123"}).encode('ascii')
req = urllib.request.Request(f"{API}/auth/login", data=login_data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
try:
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        token = res.get("access_token")
        
        # Fetch customers
        req2 = urllib.request.Request(f"{API}/customers", headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req2) as res2:
            data = json.loads(res2.read().decode())
            print("Customers count:", len(data))
except Exception as e:
    print("Error:", e)
