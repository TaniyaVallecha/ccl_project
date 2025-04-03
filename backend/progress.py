@app.get("/project_status")
def project_status(application_id: int):
    response = supabase.table("projects").select("*").eq("application_id", application_id).execute()
    return response.data

@app.post("/update_progress")
def update_progress(application_id: int, status: str, user=Depends(get_current_user)):
    if user["role"] != "client":
        return {"error": "Only clients can update progress"}
    supabase.table("projects").update({"status": status}).eq("application_id", application_id).execute()
    return {"message": "Project status updated"}
