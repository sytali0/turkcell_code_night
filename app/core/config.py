"""
EduCell - Turkcell CodeNight
Uygulama konfigürasyonu (settings).
Gerçek projede bu değerler .env dosyasından okunur.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings  # type: ignore


class Settings(BaseSettings):
    APP_NAME: str = "EduCell API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    DATABASE_URL: str | None = None

    # JWT ayarları
    SECRET_KEY: str = "educell-super-secret-key-turkcell-codenight-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 gün

    # OTP simülasyonu - gerçekte SMS servisinden gelir
    MOCK_OTP_CODE: str = "1234"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value: object) -> object:
        if isinstance(value, str) and value.lower() in {"release", "prod", "production"}:
            return False
        return value

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
