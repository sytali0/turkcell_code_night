"""
EduCell - Auth Router.
/api/v1/auth prefix'i altındaki kimlik doğrulama ve profil endpoint'leri.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
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
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["🔐 Auth - Kimlik Doğrulama"],
)


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=201,
    summary="Yeni kullanıcı kaydı",
    description="""
Turkcell GSM numarası, rol ve OTP kodu ile yeni kullanıcı kaydeder.

**Demo OTP:** `1234`

**Örnek:**
```json
{"phone_number": "05321234567", "otp_code": "1234", "full_name": "Ali Yılmaz", "role": "student"}
```
""",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> RegisterResponse:
    return AuthService.register(payload, db)


@router.post(
    "/verify-otp",
    response_model=MessageResponse,
    summary="OTP doğrula",
    description="OTP simülasyonu. Geçerli kod sabit olarak `1234` kabul edilir.",
)
def verify_otp(payload: OtpVerifyRequest) -> MessageResponse:
    return AuthService.verify_otp(payload)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Kullanıcı girişi (OTP ile)",
    description="""
Kayıtlı Turkcell GSM numarası ve OTP kodu ile giriş. **Bearer JWT** döner.

**Demo OTP:** `1234`
""",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return AuthService.login(payload, db)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Aktif kullanıcı profilini getir",
)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return AuthService.get_profile(current_user)


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Aktif kullanıcı profilini güncelle",
)
def update_me(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    return AuthService.update_profile(current_user, payload, db)
