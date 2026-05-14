"""
EduCell - Auth Service (İş Mantığı Katmanı).

Bu dosya şimdilik in-memory mock data ile çalışmaktadır.
Takım arkadaşı SQLAlchemy entegrasyonunu tamamladığında,
aşağıdaki mock_users sözlüğü yerine DB sorguları kullanılacak.

Değişmesi gereken tek yer: AuthService metodlarının içindeki
veri okuma/yazma satırları (# DB: yorumlu satırlar).
"""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token
from app.models.auth import (
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UserResponse,
)

# ---------------------------------------------------------------------------
# Mock Veri Deposu
# Anahtar: telefon_numarası → kullanıcı dict'i
# ---------------------------------------------------------------------------
_mock_users: dict[str, dict] = {
    # Başlangıç test kullanıcısı - Swagger'da hemen deneyebilirsiniz
    "05001234567": {
        "id": "usr_demo_001",
        "phone_number": "05001234567",
        "full_name": "Demo Kullanıcı",
        "is_active": True,
        "role": "student",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
}


def _build_user_response(user_dict: dict) -> UserResponse:
    """Dict'ten UserResponse Pydantic modeli oluşturur."""
    return UserResponse(
        id=user_dict["id"],
        phone_number=user_dict["phone_number"],
        full_name=user_dict["full_name"],
        is_active=user_dict["is_active"],
        role=user_dict["role"],
    )


class AuthService:
    """Kimlik doğrulama iş mantığı."""

    # ------------------------------------------------------------------
    # Register
    # ------------------------------------------------------------------
    @staticmethod
    def register(data: RegisterRequest) -> RegisterResponse:
        """
        Yeni kullanıcı kaydeder.

        Kurallar:
        - OTP kodu sabit "1234" olmalı (simülasyon).
        - Aynı telefon numarası iki kez kayıt olamaz.
        """
        # 1. OTP doğrulama
        if data.otp_code != settings.MOCK_OTP_CODE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "code": "INVALID_OTP",
                    "message": "Girdiğiniz OTP kodu hatalı. Simülasyonda doğru kod: 1234",
                },
            )

        # 2. Tekrar kayıt kontrolü
        # DB: db.query(User).filter(User.phone_number == data.phone_number).first()
        if data.phone_number in _mock_users:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "code": "PHONE_ALREADY_EXISTS",
                    "message": f"{data.phone_number} numaralı telefon zaten kayıtlı.",
                },
            )

        # 3. Kullanıcı oluştur
        new_user: dict = {
            "id": f"usr_{uuid.uuid4().hex[:8]}",
            "phone_number": data.phone_number,
            "full_name": data.full_name,
            "is_active": True,
            "role": "student",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # DB: db.add(User(**new_user)); db.commit(); db.refresh(user)
        _mock_users[data.phone_number] = new_user

        return RegisterResponse(
            success=True,
            message=f"Kayıt başarılı! Hoş geldin, {data.full_name} 🎓",
            user=_build_user_response(new_user),
        )

    # ------------------------------------------------------------------
    # Login
    # ------------------------------------------------------------------
    @staticmethod
    def login(data: LoginRequest) -> TokenResponse:
        """
        Kullanıcı girişi yapar ve JWT token döner.

        Kurallar:
        - OTP kodu sabit "1234" olmalı (simülasyon).
        - Telefon numarası kayıtlı olmalı.
        - Kullanıcı aktif olmalı.
        """
        # 1. OTP doğrulama
        if data.otp_code != settings.MOCK_OTP_CODE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "code": "INVALID_OTP",
                    "message": "Girdiğiniz OTP kodu hatalı. Simülasyonda doğru kod: 1234",
                },
            )

        # 2. Kullanıcı arama
        # DB: user = db.query(User).filter(User.phone_number == data.phone_number).first()
        user_dict = _mock_users.get(data.phone_number)

        if not user_dict:
            # Güvenlik: kayıtlı mı değil mi bilgisi saldırganla paylaşılmaz
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "success": False,
                    "code": "INVALID_CREDENTIALS",
                    "message": "Telefon numarası veya OTP kodu hatalı.",
                },
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 3. Aktiflik kontrolü
        if not user_dict["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "code": "USER_INACTIVE",
                    "message": "Hesabınız askıya alınmış. Lütfen destek ekibiyle iletişime geçin.",
                },
            )

        # 4. JWT oluştur
        token = create_access_token(
            subject=user_dict["phone_number"],
            extra_data={
                "user_id": user_dict["id"],
                "role": user_dict["role"],
            },
        )

        expire_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=expire_seconds,
            user=_build_user_response(user_dict),
        )
