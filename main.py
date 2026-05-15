"""
EduCell API - Ana Uygulama Giriş Noktası
Turkcell CodeNight 2024

Başlatmak için:
    uvicorn main:app --reload

Swagger UI:
    http://127.0.0.1:8000/docs

ReDoc:
    http://127.0.0.1:8000/redoc
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.routers import auth as auth_router
from app.routers import course as course_router
from app.routers import exam as exam_router

# ---------------------------------------------------------------------------
# FastAPI Uygulama Tanımı
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## EduCell - Turkcell CodeNight Eğitim Platformu 🎓

EduCell, Türkiye'nin öncü telekom şirketi **Turkcell** için geliştirilen
modern bir eğitim platformudur.

### Özellikler
- 📱 **OTP tabanlı kimlik doğrulama** (telefon numarası ile)
- 🎯 **Kurs yönetimi** (listeleme, kayıt, müfredat)
- 🎓 **Sınav & Değerlendirme Motoru** (çoklu tip, kısmi puan)
- 🏆 **Sertifikasyon & Doğrulama** (public endpoint)
- 📊 **İlerleme takibi** (yakında)

### Geliştirici Notu
> Bu versiyon **mock data** kullanmaktadır.
> SQLAlchemy entegrasyonu `app/services/` altındaki `# DB:` yorumlu satırlar
> güncellenerek yapılacaktır.
""",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ---------------------------------------------------------------------------
# CORS Middleware (Frontend erişimi için)
# Prod ortamında allow_origins'i kısıtlayın!
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # PROD: ["https://educell.turkcell.com.tr"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Router Kayıtları
# ---------------------------------------------------------------------------
API_V1_PREFIX = "/api/v1"

app.include_router(auth_router.router, prefix=API_V1_PREFIX)
app.include_router(course_router.router, prefix=API_V1_PREFIX)
app.include_router(course_router.content_router, prefix=API_V1_PREFIX)
app.include_router(course_router.lesson_router, prefix=API_V1_PREFIX)
app.include_router(course_router.cert_router, prefix=API_V1_PREFIX)
app.include_router(course_router.comment_router, prefix=API_V1_PREFIX)  # 2.5
app.include_router(exam_router.router, prefix=API_V1_PREFIX)
# İleride eklenecek router'lar:
# app.include_router(users_router.router, prefix=API_V1_PREFIX)

# ---------------------------------------------------------------------------
# Root & Health Check Endpoint'leri
# ---------------------------------------------------------------------------

@app.get("/", include_in_schema=False)
def root() -> JSONResponse:
    """Kök endpoint - API'nin ayakta olduğunu doğrular."""
    return JSONResponse(
        content={
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "🟢 Çalışıyor",
            "docs": "/docs",
            "message": "EduCell API'ye hoş geldiniz! Dökümantasyon için /docs adresini ziyaret edin.",
        }
    )


@app.get("/health", tags=["⚙️ Sistem"])
def health_check() -> JSONResponse:
    """
    Sistem sağlık kontrolü.
    Load balancer ve monitoring araçları bu endpoint'i kullanır.
    """
    return JSONResponse(
        content={
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "database": "postgresql",
        }
    )
