"""
EduCell - Güvenlik yardımcıları.
JWT token oluşturma ve doğrulama işlemleri burada yapılır.
İleride passlib ile şifre hashleme de eklenebilir.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt

from app.core.config import settings


def create_access_token(subject: str | Any, extra_data: dict | None = None) -> str:
    """
    Verilen kullanıcı kimliği (subject) için JWT access token üretir.

    Args:
        subject: Token'ın kime ait olduğu (telefon numarası veya user_id).
        extra_data: Token payload'ına eklenecek opsiyonel ek alanlar.

    Returns:
        İmzalı JWT string'i.
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload: dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    if extra_data:
        payload.update(extra_data)

    encoded_jwt = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any]:
    """
    JWT token'ı decode eder ve payload'ı döner.
    Geçersiz veya süresi dolmuş token için JWTError fırlatır.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
