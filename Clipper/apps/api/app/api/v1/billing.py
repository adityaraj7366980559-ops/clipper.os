from fastapi import APIRouter

router = APIRouter(prefix="/billing", tags=["billing"])

@router.get("/usage")
async def get_usage_status():
    return {
        "plan_tier": "Pro Creator",
        "monthly_credit_minutes": 300,
        "used_credit_minutes": 34,
        "remaining_minutes": 266,
        "billing_cycle_resets": "2026-12-01T00:00:00Z",
        "features": {
            "max_video_length_minutes": 180,
            "export_resolution": "4K UHD",
            "animated_templates": 25,
            "watermark_free": True,
            "team_seats": 5,
            "social_auto_publishing": True
        }
    }

@router.post("/checkout-session")
async def create_checkout_session(tier: str = "business"):
    return {
        "session_id": "cs_test_mock_stripe_clipforge_12345",
        "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_mock_clipforge",
        "tier": tier
    }
