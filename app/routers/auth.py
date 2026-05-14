"""
EduCell - Auth Router.
/api/v1/auth prefix'i altındaki tüm kimlik doğrulama endpoint'leri.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth import (
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
)
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
Telefon numarası ve OTP kodu ile yeni kullanıcı kaydeder (PostgreSQL).

**Demo OTP:** `1234`

**Örnek:**
```json
{"phone_number": "05321234567", "otp_code": "1234", "full_name": "Ali Yılmaz"}
```
""",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> RegisterResponse:
    return AuthService.register(payload, db)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Kullanıcı girişi (OTP ile)",
    description="""
Kayıtlı telefon numarası ve OTP kodu ile giriş. **Bearer JWT** döner.

**Demo OTP:** `1234`
""",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return AuthService.login(payload, db)
