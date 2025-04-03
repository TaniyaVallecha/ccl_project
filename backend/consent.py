@app.post("/confirm_consent")
def confirm_consent(application_id: int, user=Depends(get_current_user)):
    supabase.table("applications").update({"consent_" + user["role"]: True}).eq("id", application_id).execute()
    
    # Check if both gave consent
    app_data = supabase.table("applications").select("*").eq("id", application_id).execute().data[0]
    if app_data["consent_client"] and app_data["consent_freelancer"]:
        supabase.table("projects").insert({"application_id": application_id, "status": "In Progress"}).execute()
        return {"message": "Project Started"}
    
    return {"message": "Waiting for other party’s consent"}
