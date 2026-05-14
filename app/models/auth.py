"""
EduCell - Auth Pydantic Modelleri.
Request (gelen istek) ve Response (dönen cevap) şemaları burada tanımlanır.
"""

import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator


UserRole = Literal["student", "instructor", "admin"]


def normalize_turkcell_gsm(value: str) -> str:
    """05XXXXXXXXX, 905XXXXXXXXX veya +905XXXXXXXXX formatını 90XXXXXXXXXX olarak saklar."""
    cleaned = re.sub(r"[\s\-()]", "", value or "")
    if cleaned.startswith("+"):
        cleaned = cleaned[1:]
    if re.match(r"^0[5][0-9]{9}$", cleaned):
        return "90" + cleaned[1:]
    if re.match(r"^90[5][0-9]{9}$", cleaned):
        return cleaned
    raise ValueError("Geçerli bir Turkcell GSM numarası giriniz (05XX... veya 90XX...)")


def validate_otp(value: str) -> str:
    cleaned = (value or "").strip()
    if not re.match(r"^[0-9]{4}$", cleaned):
        raise ValueError("OTP kodu 4 haneli olmalıdır")
    return cleaned


class RegisterRequest(BaseModel):
    """Kayıt isteği: telefon numarası, OTP, ad ve rol beklenir."""

    phone_number: str = Field(
        ...,
        examples=["05321234567"],
        description="Turkcell GSM numarası (05XX... veya 90XX...)",
    )
    otp_code: str = Field(
        ...,
        min_length=4,
        max_length=4,
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
    role: UserRole = Field(
        ...,
        examples=["student"],
        description="Kullanıcı rolü: student, instructor veya admin",
    )
    bio: str | None = Field(default=None, max_length=2000)
    expertise: str | None = Field(default=None, max_length=2000)
    interests: str | None = Field(default=None, max_length=2000)

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_turkcell_gsm(value)

    @field_validator("otp_code")
    @classmethod
    def validate_register_otp(cls, value: str) -> str:
        return validate_otp(value)


class LoginRequest(BaseModel):
    """Giriş isteği: telefon numarası ve OTP kodu ile giriş."""

    phone_number: str = Field(
        ...,
        examples=["05321234567"],
        description="Kayıtlı Turkcell GSM numarası",
    )
    otp_code: str = Field(
        ...,
        min_length=4,
        max_length=4,
        examples=["1234"],
        description="SMS ile gönderilen OTP kodu (simülasyonda sabit: 1234)",
    )

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_turkcell_gsm(value)

    @field_validator("otp_code")
    @classmethod
    def validate_login_otp(cls, value: str) -> str:
        return validate_otp(value)


class OtpVerifyRequest(BaseModel):
    """OTP doğrulama simülasyonu."""

    phone_number: str = Field(..., examples=["05321234567"])
    otp_code: str = Field(..., min_length=4, max_length=4, examples=["1234"])

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_turkcell_gsm(value)

    @field_validator("otp_code")
    @classmethod
    def validate_verify_otp(cls, value: str) -> str:
        return validate_otp(value)


class UserResponse(BaseModel):
    """Kullanıcı bilgileri (hassas alanlar hariç)."""

    id: str
    phone_number: str
    full_name: str
    is_active: bool
    role: str
    bio: str | None = None
    expertise: str | None = None
    interests: str | None = None

    model_config = {"from_attributes": True}


class RegisterResponse(BaseModel):
    """Kayıt başarı cevabı."""

    success: bool = True
    message: str
    user: UserResponse
    access_token: str | None = None
    token_type: str = "bearer"
    expires_in: int | None = None


class TokenResponse(BaseModel):
    """JWT token cevabı."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class ProfileUpdateRequest(BaseModel):
    """Profil güncelleme isteği."""

    full_name: str = Field(..., min_length=2, max_length=100)
    bio: str | None = Field(default=None, max_length=2000)
    expertise: str | None = Field(default=None, max_length=2000)
    interests: str | None = Field(default=None, max_length=2000)


class MessageResponse(BaseModel):
    """Genel başarı/hata mesajı."""

    success: bool
    message: str
