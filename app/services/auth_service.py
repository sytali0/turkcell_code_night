"""
EduCell - Auth Service (PostgreSQL Entegrasyonlu)
==================================================
Kullanıcı kayıt, giriş ve profil işlemlerini PostgreSQL'de gerçek User ORM
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
    MessageResponse,
    OtpVerifyRequest,
    ProfileUpdateRequest,
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
        bio=user.bio,
        expertise=user.expertise,
        interests=user.interests,
    )


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _role_profile_fields(
    role: str,
    bio: str | None,
    expertise: str | None,
    interests: str | None,
) -> dict[str, str | None]:
    return {
        "bio": _clean_optional(bio),
        "expertise": _clean_optional(expertise) if role == "instructor" else None,
        "interests": _clean_optional(interests) if role == "student" else None,
    }


def _token_for_user(user: User) -> TokenResponse:
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


class AuthService:

    @staticmethod
    def verify_otp(data: OtpVerifyRequest) -> MessageResponse:
        if data.otp_code != settings.MOCK_OTP_CODE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Girdiğiniz OTP kodu hatalı. Demo kodu: 1234",
            )
        return MessageResponse(success=True, message="OTP doğrulandı.")

    @staticmethod
    def register(data: RegisterRequest, db: Session) -> RegisterResponse:
        if data.otp_code != settings.MOCK_OTP_CODE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Girdiğiniz OTP kodu hatalı. Demo kodu: 1234",
            )

        existing = db.scalar(select(User).where(User.gsm_number == data.phone_number))
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{data.phone_number} numaralı telefon zaten kayıtlı.",
            )

        now = datetime.now()
        profile_fields = _role_profile_fields(
            data.role,
            data.bio,
            data.expertise,
            data.interests,
        )
        new_user = User(
            id=uuid4(),
            full_name=data.full_name.strip(),
            gsm_number=data.phone_number,
            email=None,
            password_hash=None,
            role=data.role,
            bio=profile_fields["bio"],
            expertise=profile_fields["expertise"],
            interests=profile_fields["interests"],
            is_gsm_verified=True,
            created_at=now,
            updated_at=now,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        token_response = _token_for_user(new_user)
        return RegisterResponse(
            success=True,
            message=f"Kayıt başarılı! Hoş geldin, {data.full_name}",
            user=token_response.user,
            access_token=token_response.access_token,
            token_type=token_response.token_type,
            expires_in=token_response.expires_in,
        )

    @staticmethod
    def login(data: LoginRequest, db: Session) -> TokenResponse:
        if data.otp_code != settings.MOCK_OTP_CODE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Girdiğiniz OTP kodu hatalı. Demo kodu: 1234",
            )

        user = db.scalar(select(User).where(User.gsm_number == data.phone_number))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Bu telefon numarası kayıtlı değil. Önce kayıt olun.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return _token_for_user(user)

    @staticmethod
    def get_profile(user: User) -> UserResponse:
        return _user_to_response(user)

    @staticmethod
    def update_profile(user: User, data: ProfileUpdateRequest, db: Session) -> UserResponse:
        profile_fields = _role_profile_fields(
            user.role,
            data.bio,
            data.expertise,
            data.interests,
        )
        user.full_name = data.full_name.strip()
        user.bio = profile_fields["bio"]
        user.expertise = profile_fields["expertise"]
        user.interests = profile_fields["interests"]
        user.updated_at = datetime.now()

        db.commit()
        db.refresh(user)
        return _user_to_response(user)
