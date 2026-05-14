"""
EduCell - Sınav & Değerlendirme Motoru Router'ı
================================================

Endpoint'ler:
  POST /api/v1/exams/{exam_id}/start          → Sınava başla (karıştırılmış, cevaplar gizli)
  POST /api/v1/exams/{exam_id}/submit         → Cevapları gönder & otomatik puanla
  GET  /api/v1/exams/{exam_id}/result         → Sınav sonucunu getir
  GET  /api/v1/certificates/{cert_number}/verify → Sertifika doğrula (public)

Mock data kullanılmaktadır.  DB: işaretli satırlar SQLAlchemy ile değiştirilecek.
"""

from fastapi import APIRouter, HTTPException, Path, status

from app.models.exam import (
    CertificateVerifyResponse,
    ExamResultResponse,
    ExamSessionResponse,
    ExamSubmitRequest,
    ExamSubmitResponse,
)
from app.services.exam_service import (
    get_exam_result,
    get_exam_session,
    grade_exam,
    verify_certificate,
)

router = APIRouter(tags=["🎓 Sınavlar & Sertifikalar"])


# ---------------------------------------------------------------------------
# POST /api/v1/exams/{exam_id}/start
# ---------------------------------------------------------------------------

@router.post(
    "/exams/{exam_id}/start",
    response_model=ExamSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Sınava Başla",
    description=(
        "Öğrencinin sınava başlamasını simüle eder. "
        "Sorular **karıştırılarak** döner ve **doğru cevaplar kesinlikle gizlenir**. "
        "\n\nTest için: `exam_001` veya `exam_002`"
    ),
)
def start_exam(
    exam_id: str = Path(
        ...,
        examples=["exam_001"],
        description="Başlatılacak sınavın ID'si",
    ),
) -> ExamSessionResponse:
    """
    Sınav oturumu başlatır.

    - Her çağrıda sorular **farklı sırada** gelir (shuffle).
    - Yanıtta `is_correct` alanı **bulunmaz** (güvenlik).
    - Süre aşımını kontrol etmek client sorumluluğundadır.
    """
    # DB:  SELECT * FROM exams WHERE id = :exam_id AND is_active = true
    session = get_exam_session(exam_id)

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"'{exam_id}' ID'li sınav bulunamadı.",
        )

    return session


# ---------------------------------------------------------------------------
# POST /api/v1/exams/{exam_id}/submit
# ---------------------------------------------------------------------------

@router.post(
    "/exams/{exam_id}/submit",
    response_model=ExamSubmitResponse,
    status_code=status.HTTP_200_OK,
    summary="Sınavı Gönder & Puanla",
    description=(
        "Öğrencinin cevaplarını alır ve otomatik puanlama yapar.\n\n"
        "**Puanlama kuralları:**\n"
        "- `multiple_choice`: Doğru şık → tam puan, yanlış → 0\n"
        "- `true_false`: Doğru cevap → tam puan, yanlış → 0\n"
        "- `multi_select`: **Kısmi puanlama** — "
        "  `kazanılan = (doğru_seçilen / toplam_doğru) × max_puan`\n"
        "  Yanlış şık seçmek puanı **kırmaz**, sadece kısmi puanı etkiler.\n\n"
        "Geçme notuna ulaşılırsa yanıtta `certificate_number` üretilir."
    ),
)
def submit_exam(
    exam_id: str = Path(
        ...,
        examples=["exam_001"],
        description="Puanlanacak sınavın ID'si",
    ),
    body: ExamSubmitRequest = ...,
) -> ExamSubmitResponse:
    """
    Cevapları değerlendirir; soru bazında sonuç + genel puan dağılımı döner.

    Örnek istek gövdesi (exam_001):
    ```json
    {
      "answers": [
        {"question_id": "q001", "selected_choices": ["b"]},
        {"question_id": "q002", "selected_choices": ["c"]},
        {"question_id": "q003", "selected_choices": ["c"]},
        {"question_id": "q004", "selected_choices": ["false"]},
        {"question_id": "q005", "selected_choices": ["true"]},
        {"question_id": "q006", "selected_choices": ["b", "c", "e"]},
        {"question_id": "q007", "selected_choices": ["a", "c", "d"]}
      ]
    }
    ```
    """
    # DB:  SELECT * FROM exams WHERE id = :exam_id
    result = grade_exam(exam_id, body.answers)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"'{exam_id}' ID'li sınav bulunamadı.",
        )

    return result


# ---------------------------------------------------------------------------
# GET /api/v1/exams/{exam_id}/result
# ---------------------------------------------------------------------------

@router.get(
    "/exams/{exam_id}/result",
    response_model=ExamResultResponse,
    summary="Sınav Sonucunu Getir",
    description=(
        "Tamamlanmış bir sınav için kayıtlı özet sonucu döner. "
        "Doğru/yanlış/boş dağılımı ve toplam puan yer alır.\n\n"
        "Test için: `exam_001` veya `exam_002`"
    ),
)
def get_result(
    exam_id: str = Path(
        ...,
        examples=["exam_001"],
        description="Sonucu getirilecek sınavın ID'si",
    ),
) -> ExamResultResponse:
    """
    Sınav özet sonucu.

    - Sınav bulunamazsa **404** döner.
    """
    # DB:  SELECT * FROM exam_results WHERE exam_id = :exam_id ORDER BY completed_at DESC LIMIT 1
    result = get_exam_result(exam_id)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"'{exam_id}' ID'li sınav sonucu bulunamadı.",
        )

    return result


# ---------------------------------------------------------------------------
# GET /api/v1/certificates/{cert_number}/verify   (Public endpoint)
# ---------------------------------------------------------------------------

@router.get(
    "/certificates/{cert_number}/verify",
    response_model=CertificateVerifyResponse,
    summary="Sertifika Doğrula (Public)",
    description=(
        "**Herkese açık** sertifika doğrulama endpoint'i. "
        "Sertifika numarasını alır; ad-soyad, kurs adı ve geçerlilik durumunu döner. "
        "Kimlik doğrulaması **gerektirmez**.\n\n"
        "**Test sertifika numaraları:**\n"
        "- `CERT-2024-001-TC` → Ahmet Yılmaz\n"
        "- `CERT-2024-002-TC` → Zeynep Arslan\n"
        "- `CERT-2025-003-TC` → Mehmet Kaya\n"
        "- `CERT-GECERSIZ-000` → Geçersiz örnek"
    ),
)
def verify_cert(
    cert_number: str = Path(
        ...,
        examples=["CERT-2024-001-TC"],
        description="Doğrulanacak sertifika numarası",
    ),
) -> CertificateVerifyResponse:
    """
    Sertifika doğrulama.

    - Geçerli → `is_valid: true` + kişi/kurs bilgisi
    - Geçersiz → `is_valid: false` + açıklayıcı mesaj
    - Her durumda **200 OK** döner (404 kullanmıyoruz: doğrulama her zaman yanıt verir).
    """
    # DB:  SELECT * FROM certificates WHERE cert_number = :cert_number
    return verify_certificate(cert_number)
