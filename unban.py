import requests

url = "https://trrvcethuyqldnzrneiw.supabase.co/rest/v1/profiles?email=in.(mehmood.0ab123@gmail.com,kashifbhaiabc904@gmail.com)"
headers = {
    "apikey": "sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx",
    "Authorization": "Bearer sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}
data = {
    "is_banned": False,
    "banned_until": None,
    "ban_reason": None
}

response = requests.patch(url, headers=headers, json=data)
print(response.json())
