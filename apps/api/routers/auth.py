"""Authentication router: Aadhaar OTP + DigiLocker OAuth."""
import hashlib
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models import User
from services.auth_service import create_jwt

router = APIRouter(prefix="/auth", tags=["auth"])


class AadhaarOTPRequest(BaseModel):
    aadhaar_number: str


class AadhaarVerifyRequest(BaseModel):
    aadhaar_number: str
    otp: str
    txn_id: str


class DigiLockerCallbackRequest(BaseModel):
    code: str
    state: str


class GuestSessionRequest(BaseModel):
    pass


def _hash_uid(uid: str) -> str:
    return hashlib.sha256(uid.encode()).hexdigest()[:64]


@router.post("/aadhaar/send-otp")
async def aadhaar_send_otp(request: AadhaarOTPRequest) -> dict:
    """
    Initiates Aadhaar OTP flow via UIDAI sandbox.
    In production: calls UIDAI AUA API with AUA code + license key.
    """
    if len(request.aadhaar_number.replace(" ", "")) != 12:
        raise HTTPException(status_code=400, detail="Invalid Aadhaar number format")

    txn_id = str(uuid.uuid4())
    # In production: POST to UIDAI sandbox with AUA credentials
    # For sandbox/dev: return mock txn_id
    return {"txn_id": txn_id, "message": "OTP sent to registered mobile number"}


@router.post("/aadhaar/verify-otp")
async def aadhaar_verify_otp(
    request: AadhaarVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Verifies Aadhaar OTP and returns JWT session.
    In production: validates OTP with UIDAI and receives eKYC data.
    """
    # Sandbox: accept OTP "123456" for testing
    if settings.environment == "development" and request.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP")

    uid_token = _hash_uid(request.aadhaar_number)

    existing = (
        await db.execute(select(User).where(User.uid_token == uid_token))
    ).scalar_one_or_none()

    if not existing:
        existing = User(
            uid_token=uid_token,
            provider="aadhaar",
            name="Aadhaar User",
        )
        db.add(existing)
        await db.flush()

    token = create_jwt(
        uid_token=uid_token,
        name=existing.name or "User",
        provider="aadhaar",
    )
    return {"access_token": token, "token_type": "bearer"}


@router.post("/guest")
async def guest_session(db: AsyncSession = Depends(get_db)) -> dict:
    """Creates an ephemeral guest session token."""
    guest_uid = _hash_uid(f"guest-{uuid.uuid4()}")

    guest_user = User(uid_token=guest_uid, provider="guest", name="Guest")
    db.add(guest_user)
    await db.flush()

    token = create_jwt(uid_token=guest_uid, name="Guest", provider="guest")
    return {"access_token": token, "token_type": "bearer"}
