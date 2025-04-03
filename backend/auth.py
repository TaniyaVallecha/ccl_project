from fastapi import FastAPI, Depends
from supabase import create_client
import jwt

SUPABASE_URL = "https://ogoeydbprqrdimvoefnm.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nb2V5ZGJwcnFyZGltdm9lZm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODcyMTgsImV4cCI6MjA1OTI2MzIxOH0.LouHyANVXKRjgmh4gqKxTKhrai-tJKdYo9PSnzAnF9g"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
app = FastAPI()

def get_current_user(token: str):
    payload = jwt.decode(token, SUPABASE_KEY, algorithms=["HS256"])
    return payload  

@app.post("/signup")
def signup(email: str, password: str, role: str):
    response = supabase.auth.sign_up({"email": email, "password": password, "data": {"role": role}})
    return response

@app.post("/login")
def login(email: str, password: str):
    response = supabase.auth.sign_in_with_password({"email": email, "password": password})
    return response
