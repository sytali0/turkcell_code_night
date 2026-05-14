"""
EduCell - Auth Pydantic Modelleri.
Request (gelen istek) ve Response (dönen cevap) şemaları burada tanımlanır.
SQLAlchemy ORM modelleri takım arkadaşı tarafından ayrıca yazılacak.
"""

from pydantic import BaseModel, Field, field_validator
import re


# ---------------------------------------------------------------------------
# Request Şemaları (gelen veriler)
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    """Kayıt isteği: telefon numarası ve OTP kodu beklenir."""

    phone_number: str = Field(
        ...,
        examples=["05321234567"],
        description="Türkiye formatında telefon numarası (05XX ile başlamalı)",
    )
    otp_code: str = Field(
        ...,
        min_length=4,
        max_length=6,
        examples=["1234"],
        description="SMS ile gönderilen OTP kodu (simülasyonda sabit: 1234)",
    )
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        examples=["Ali Yılmaz"],
        description="Kullanıcının tam adı",
    )

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Basit Türkiye telefon numarası doğrulaması."""
        # Boşluk ve tire temizle
        cleaned = re.sub(r"[\s\-]", "", v)
        if not re.match(r"^0[5][0-9]{9}$", cleaned):
            raise ValueError(
                "Geçerli bir Türkiye cep telefonu numarası giriniz (05XX ile başlamalı, 11 hane)"
            )
        return cleaned


class LoginRequest(BaseModel):
    """Giriş isteği: telefon numarası ve OTP kodu ile giriş."""

    phone_number: str = Field(
        ...,
        examples=["05321234567"],
        description="Kayıtlı telefon numarası",
    )
    otp_code: str = Field(
        ...,
        min_length=4,
        max_length=6,
        examples=["1234"],
        description="SMS ile gönderilen OTP kodu (simülasyonda sabit: 1234)",
    )

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-]", "", v)
        if not re.match(r"^0[5][0-9]{9}$", cleaned):
            raise ValueError("Geçerli bir Türkiye cep telefonu numarası giriniz")
        return cleaned


# ---------------------------------------------------------------------------
# Response Şemaları (dönen veriler)
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    """Kullanıcı bilgileri (hassas alanlar hariç)."""

    id: str
    phone_number: str
    full_name: str
    is_active: bool
    role: str  # "student" | "instructor" | "admin"

    model_config = {"from_attributes": True}  # ORM modeli ile uyumluluk için


class RegisterResponse(BaseModel):
    """Kayıt başarı cevabı."""

    success: bool = True
    message: str
    user: UserResponse


class TokenResponse(BaseModel):
    """JWT token cevabı."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int  # saniye cinsinden
    user: UserResponse


class MessageResponse(BaseModel):
    """Genel başarı/hata mesajı."""

    success: bool
    message: str
