import os
import re

ROUTERS_DIR = "backend/routers"

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Add dependencies if not present
    if "Depends" not in content and "fastapi" in content:
        content = re.sub(r"from fastapi import ([^\n]+)", r"from fastapi import \1, Depends", content, count=1)
    
    if "get_current_user" not in content:
        content = content.replace("from bson import ObjectId", "from bson import ObjectId\nfrom backend.dependencies import get_current_user")
    
    # 1. Update route definitions to include user_email
    # def create_something(item: ItemCreate): -> def create_something(item: ItemCreate, user_email: str = Depends(get_current_user)):
    content = re.sub(r"def ([a-zA-Z0-9_]+)\(([^)]*)\):", 
                     lambda m: m.group(0) if "user_email: str" in m.group(0) else f"def {m.group(1)}({m.group(2)}, user_email: str = Depends(get_current_user)):".replace("(, ", "("), 
                     content)

    # 2. Add user_email to dictionaries on inserts
    # item_dict = item.model_dump()
    content = re.sub(r"([a-zA-Z0-9_]+) = ([a-zA-Z0-9_]+)\.model_dump\(\)", 
                     r"\1 = \2.model_dump()\n    \1['user_email'] = user_email", 
                     content)

    # 3. Add user_email to find queries
    # .find() -> .find({"user_email": user_email})
    content = re.sub(r"\.find\(\)", r'.find({"user_email": user_email})', content)
    
    # .find({...}) -> .find({..., "user_email": user_email})
    content = re.sub(r"\.find\(\{([^}]+)\}\)", r'.find({\1, "user_email": user_email})', content)
    
    # .find_one({...})
    content = re.sub(r"\.find_one\(\{([^}]+)\}\)", r'.find_one({\1, "user_email": user_email})', content)
    
    # .find_one_and_update({...})
    content = re.sub(r"\.find_one_and_update\(\s*\{([^}]+)\}", r'.find_one_and_update({\1, "user_email": user_email}', content)
    
    # .find_one_and_replace({...})
    content = re.sub(r"\.find_one_and_replace\(\s*\{([^}]+)\}", r'.find_one_and_replace({\1, "user_email": user_email}', content)
    
    # .delete_one({...})
    content = re.sub(r"\.delete_one\(\{([^}]+)\}\)", r'.delete_one({\1, "user_email": user_email})', content)

    # Remove duplicated "user_email": user_email if any
    content = re.sub(r'"user_email": user_email, "user_email": user_email', r'"user_email": user_email', content)

    with open(filepath, 'w') as f:
        f.write(content)

for filename in os.listdir(ROUTERS_DIR):
    if filename.endswith(".py") and filename != "bills.py":
        patch_file(os.path.join(ROUTERS_DIR, filename))
