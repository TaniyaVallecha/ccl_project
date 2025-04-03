@app.post("/post_job")
def post_job(title: str, description: str, client_email: str, user=Depends(get_current_user)):
    if user["role"] != "client":
        return {"error": "Only clients can post jobs"}
    response = supabase.table("jobs").insert({"title": title, "description": description, "client_email": client_email}).execute()
    return response.data

@app.get("/browse_jobs")
def browse_jobs():
    response = supabase.table("jobs").select("*").execute()
    return response.data

@app.post("/apply_job")
def apply_job(job_id: int, freelancer_email: str, user=Depends(get_current_user)):
    if user["role"] != "freelancer":
        return {"error": "Only freelancers can apply"}
    response = supabase.table("applications").insert({"job_id": job_id, "freelancer_email": freelancer_email, "status": "Pending"}).execute()
    return response.data

@app.get("/view_applications")
def view_applications(client_email: str, user=Depends(get_current_user)):
    if user["role"] != "client":
        return {"error": "Only clients can view applications"}
    response = supabase.table("applications").select("*").eq("client_email", client_email).execute()
    return response.data

@app.post("/approve_application")
def approve_application(application_id: int, user=Depends(get_current_user)):
    if user["role"] != "client":
        return {"error": "Only clients can approve"}
    supabase.table("applications").update({"status": "Approved"}).eq("id", application_id).execute()
    return {"message": "Application Approved"}
