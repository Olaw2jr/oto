"""Verify Google identity before issuing a short-lived Oto access token.

Production clients obtain Google ID tokens with native Authorization Code + PKCE.
The backend never trusts a user id, email or provider subject supplied separately.
"""
import uuid
import httpx
from datetime import datetime, timedelta, timezone
from authlib.jose import JsonWebKey, jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from .config import settings
from .db import session
from .models import User

bearer = HTTPBearer(auto_error=False)
GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs"

async def verify_google_id_token(token: str) -> dict:
    if not settings.oauth_google_client_id:
        raise HTTPException(503, "Google sign-in is not configured")
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(GOOGLE_JWKS)
            response.raise_for_status()
        keys = JsonWebKey.import_key_set(response.json())
        claims = jwt.decode(token, keys)
        claims.validate(leeway=60)
        if claims.get("iss") not in ("https://accounts.google.com", "accounts.google.com"):
            raise ValueError("Invalid issuer")
        if claims.get("aud") != settings.oauth_google_client_id:
            raise ValueError("Invalid audience")
        if not claims.get("sub") or claims.get("email_verified") is not True:
            raise ValueError("Invalid identity")
        return dict(claims)
    except Exception as exc:
        raise HTTPException(401, "Invalid Google identity token") from exc

def issue_access_token(user_id: uuid.UUID) -> str:
    if len(settings.jwt_secret) < 32:
        raise HTTPException(503, "Configure a strong JWT_SECRET")
    now = datetime.now(timezone.utc)
    return jwt.encode({"alg": "HS256"}, {
        "iss": "oto", "aud": "oto-api", "sub": str(user_id),
        "iat": int(now.timestamp()), "exp": int((now + timedelta(minutes=15)).timestamp()),
    }, settings.jwt_secret).decode()

async def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(session),
) -> User:
    if not credentials or not settings.jwt_secret:
        raise HTTPException(401, "Authentication required")
    try:
        claims = jwt.decode(credentials.credentials, settings.jwt_secret)
        claims.validate()
        if claims.get("iss") != "oto" or claims.get("aud") != "oto-api":
            raise ValueError("Invalid token claims")
        user_id = uuid.UUID(claims["sub"])
    except Exception as exc:
        raise HTTPException(401, "Invalid access token") from exc
    user = await db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise HTTPException(401, "Account no longer exists")
    return user
