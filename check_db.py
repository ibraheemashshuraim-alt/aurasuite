import json
import os
import requests

# We need the service role key to query supabase
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://placeholder.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "placeholder")

if SUPABASE_URL != "https://placeholder.supabase.co":
    print("Cannot query Supabase directly because url is not configured in python environment.")
else:
    print("Cannot query because placeholder url.")
