import stripe

stripe.api_key = "your_stripe_secret_key"

@app.post("/create_payment")
def create_payment(amount: int, currency: str, user=Depends(get_current_user)):
    if user["role"] != "client":
        return {"error": "Only clients can make payments"}
    
    payment_intent = stripe.PaymentIntent.create(
        amount=amount * 100,  # Convert to cents
        currency=currency,
        payment_method_types=["card"]
    )
    return {"client_secret": payment_intent["client_secret"]}

@app.post("/confirm_payment")
def confirm_payment(payment_id: str):
    payment = stripe.PaymentIntent.retrieve(payment_id)
    if payment["status"] == "succeeded":
        supabase.table("projects").update({"status": "Completed"}).eq("application_id", payment["metadata"]["application_id"]).execute()
        return {"message": "Payment successful, project completed"}
    return {"error": "Payment failed"}
