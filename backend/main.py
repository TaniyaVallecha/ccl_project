from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
import os

# Initialize FastAPI app
app = FastAPI()

# CORS Middleware (to allow frontend requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Credentials
SUPABASE_URL = "https://ogoeydbprqrdimvoefnm.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nb2V5ZGJwcnFyZGltdm9lZm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODcyMTgsImV4cCI6MjA1OTI2MzIxOH0.LouHyANVXKRjgmh4gqKxTKhrai-tJKdYo9PSnzAnF9g"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Pydantic Models
class UserRegister(BaseModel):
    email: str
    password: str
    role: str

class JobPost(BaseModel):
    title: str
    description: str
    client_email: str

class JobApplication(BaseModel):
    job_id: int
    freelancer_email: str

class ApplicationApproval(BaseModel):
    application_id: int
    status: str  # Approved / Rejected

# API Endpoints

@app.post("/register")
async def register_user(user: UserRegister):
    response = supabase.auth.sign_up({"email": user.email, "password": user.password})
    if response.get("error"):
        raise HTTPException(status_code=400, detail=response["error"]["message"])
    
    supabase.table("users").insert({"email": user.email, "role": user.role}).execute()
    return {"message": "User registered successfully!"}

@app.post("/post-job")
async def post_job(job: JobPost):
    response = supabase.table("jobs").insert({"title": job.title, "description": job.description, "client_email": job.client_email}).execute()
    if response.get("error"):
        raise HTTPException(status_code=400, detail=response["error"]["message"])
    return {"message": "Job posted successfully!"}

@app.get("/jobs")
async def get_jobs():
    response = supabase.table("jobs").select("*").execute()
    return response.get("data", [])

@app.post("/apply-job")
async def apply_job(application: JobApplication):
    response = supabase.table("applications").insert({"job_id": application.job_id, "freelancer_email": application.freelancer_email, "status": "Pending"}).execute()
    if response.get("error"):
        raise HTTPException(status_code=400, detail=response["error"]["message"])
    return {"message": "Application submitted successfully!"}

@app.get("/applications")
async def get_applications():
    response = supabase.table("applications").select("*").execute()
    return response.get("data", [])

@app.post("/approve-application")
async def approve_application(approval: ApplicationApproval):
    response = supabase.table("applications").update({"status": approval.status}).eq("id", approval.application_id).execute()
    if response.get("error"):
        raise HTTPException(status_code=400, detail=response["error"]["message"])
    return {"message": "Application updated successfully!"}

# Run Server (if running locally)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
