"""JWT creation and validation utilities."""
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException

from config import settings


def create_jwt(uid_token: str, name: str, provider: str) -> str:
    payload = {
        "uid_token": uid_token,
        "name": name,
        "provider": provider,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.jwt_expire_days),
    }
    return jwt.encode(payload, settings.nextauth_secret, algorithm=settings.jwt_algorithm)


def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.nextauth_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
