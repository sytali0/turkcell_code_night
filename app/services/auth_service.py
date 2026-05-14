"""
EduCell - Auth Service (PostgreSQL Entegrasyonlu)
==================================================
Kullanıcı kayıt ve giriş işlemlerini PostgreSQL'de gerçek User ORM
tablosu üzerinden yapar. OTP simülasyon kodu: 1234
"""

from datetime import datetime
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token
from app.models.auth import (
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UserResponse,
)
from app.models.course_orm import User


def _user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        phone_number=user.gsm_number,
        full_name=user.full_name,
        is_active=user.is_gsm_verified,
        role=user.role,
    )


class AuthService:

    # ------------------------------------------------------------------
    # Register
    # ------------------------------------------------------------------
    @staticmethod
    def register(data: RegisterRequest, db: Session) -> RegisterResponse:
        # 1. OTP doğrulama
        if data.otp_code != settings.MOCK_OTP_CODE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Girdiğiniz OTP kodu hatalı. Demo kodu: 1234",
            )

        # 2. Telefon numarası zaten kayıtlı mı?
        existing = db.scalar(select(User).where(User.gsm_number == data.phone_number))
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{data.phone_number} numaralı telefon zaten kayıtlı.",
            )

        # 3. Yeni kullanıcı oluştur
        now = datetime.now()
        new_user = User(
            id=uuid4(),
            full_name=data.full_name,
            gsm_number=data.phone_number,
            email=None,
            password_hash=None,
            role="student",
            bio=None,
            expertise=None,
            interests=None,
            is_gsm_verified=True,
            created_at=now,
            updated_at=now,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return RegisterResponse(
            success=True,
            message=f"Kayıt başarılı! Hoş geldin, {data.full_name} 🎓",
            user=_user_to_response(new_user),
        )

    # ------------------------------------------------------------------
    # Login
    # ------------------------------------------------------------------
    @staticmethod
    def login(data: LoginRequest, db: Session) -> TokenResponse:
        # 1. OTP doğrulama
        if data.otp_code != settings.MOCK_OTP_CODE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Girdiğiniz OTP kodu hatalı. Demo kodu: 1234",
            )

        # 2. Kullanıcı arama
        user = db.scalar(select(User).where(User.gsm_number == data.phone_number))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Bu telefon numarası kayıtlı değil. Önce kayıt olun.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 3. JWT oluştur (sub = gsm_number, token'da phone ile user bulunacak)
        token = create_access_token(
            subject=user.gsm_number,
            extra_data={"user_id": str(user.id), "role": user.role},
        )

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=_user_to_response(user),
        )
