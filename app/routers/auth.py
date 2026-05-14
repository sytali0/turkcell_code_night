"""
EduCell - Auth Router.

/api/v1/auth prefix'i altındaki tüm kimlik doğrulama endpoint'leri.
"""

from fastapi import APIRouter

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
Telefon numarası ve OTP kodu ile yeni kullanıcı kaydeder.

**Simülasyon Notu:** OTP kodu her zaman **1234** kabul edilir.
Gerçek SMS entegrasyonu ilerleyen sprintlerde eklenecek.

**Örnek İstek:**
```json
{
  "phone_number": "05321234567",
  "otp_code": "1234",
  "full_name": "Ali Yılmaz"
}
```
""",
)
def register(payload: RegisterRequest) -> RegisterResponse:
    """Yeni kullanıcı kayıt endpoint'i."""
    return AuthService.register(payload)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Kullanıcı girişi (OTP ile)",
    description="""
Kayıtlı telefon numarası ve OTP kodu ile giriş yapar.
Başarılı girişte **Bearer JWT token** döner.

**Simülasyon Notu:** OTP kodu her zaman **1234** kabul edilir.

**Hazır test kullanıcısı:**
- Telefon: `05001234567`
- OTP: `1234`
""",
)
def login(payload: LoginRequest) -> TokenResponse:
    """Kullanıcı giriş endpoint'i."""
    return AuthService.login(payload)
