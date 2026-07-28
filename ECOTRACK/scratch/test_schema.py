import os
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

res = requests.get(f"{url}/rest/v1/", headers={"apikey": key})
schema = res.json()
users_def = schema.get("definitions", {}).get("users", {})
print("Users table columns:")
for prop_name, prop_info in users_def.get("properties", {}).items():
    print(f"- {prop_name}: {prop_info.get('type')} {prop_info.get('format', '')}")
