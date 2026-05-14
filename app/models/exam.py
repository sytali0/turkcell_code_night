"""
EduCell - Sınav & Değerlendirme Motoru Modelleri
=================================================

Veri yapıları:
  • Soru tipleri  : MultipleChoice, TrueFalse, MultiSelect
  • Güvenli çıktı : Doğru cevaplar gizlenerek öğrenciye dönülür
  • Puanlama çıktı: AnswerResult, ExamResult, CertificateVerify
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enum'lar
# ---------------------------------------------------------------------------


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"  # Tek doğru cevap
    TRUE_FALSE = "true_false"           # Doğru / Yanlış
    MULTI_SELECT = "multi_select"       # Birden fazla doğru seçenek (kısmi puan)


class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


# ---------------------------------------------------------------------------
# İç Modeller (Sadece servis katmanında kullanılır, dışarıya açılmaz)
# ---------------------------------------------------------------------------


class ChoiceInternal(BaseModel):
    """Şık — doğru cevap bilgisi dahil (sadece servis içi)."""
    id: str = Field(..., description="Şık ID: a, b, c, d …")
    text: str = Field(..., description="Şık metni")
    is_correct: bool = Field(..., description="Bu şık doğru mu?")


class QuestionInternal(BaseModel):
    """Tam soru modeli — doğru cevaplar dahil (sadece servis içi)."""
    id: str
    text: str
    question_type: QuestionType
    difficulty: DifficultyLevel
    points: float = Field(default=1.0, description="Bu sorunun tam puanı")
    choices: List[ChoiceInternal] = Field(default_factory=list)
    # true_false için ayrı alan (choices listesi boş kalır)
    correct_bool: Optional[bool] = Field(
        default=None,
        description="TrueFalse sorusu için doğru cevap (True=Doğru, False=Yanlış)",
    )
    explanation: Optional[str] = Field(
        default=None, description="Cevap açıklaması (result'ta gösterilir)"
    )


# ---------------------------------------------------------------------------
# Öğrenciye Dönen Güvenli Modeller (correct bilgisi gizlenmiş)
# ---------------------------------------------------------------------------


class ChoiceSafe(BaseModel):
    """Öğrenciye gösterilen şık — is_correct alanı YOK."""
    id: str = Field(..., description="Şık ID: a, b, c, d …")
    text: str = Field(..., description="Şık metni")


class QuestionSafe(BaseModel):
    """Öğrenciye sunulan soru — doğru cevaplar gizlenmiş."""
    id: str
    text: str
    question_type: QuestionType
    difficulty: DifficultyLevel
    points: float
    choices: List[ChoiceSafe] = Field(default_factory=list)
    # TrueFalse için choices boş, soru metninde "Doğru/Yanlış" beklenir


class ExamSessionResponse(BaseModel):
    """POST /exams/{id}/start yanıtı."""
    exam_id: str
    exam_title: str
    duration_minutes: int
    total_questions: int
    total_points: float
    passing_score: float = Field(..., description="Geçme notu (0-100)")
    questions: List[QuestionSafe] = Field(..., description="Karıştırılmış sorular — cevaplar gizli")
    started_at: str


# ---------------------------------------------------------------------------
# Submission (Öğrenci Cevapları)
# ---------------------------------------------------------------------------


class AnswerItem(BaseModel):
    """Öğrencinin tek bir soruya verdiği cevap."""
    question_id: str = Field(..., description="Sorunun ID'si")
    # MultipleChoice / TrueFalse: tek şık ID'si veya 'true'/'false'
    # MultiSelect: birden fazla şık ID'si
    selected_choices: List[str] = Field(
        ...,
        description=(
            "Seçilen şık ID listesi. "
            "MultipleChoice/TrueFalse için tek eleman. "
            "MultiSelect için birden fazla eleman."
        ),
    )


class ExamSubmitRequest(BaseModel):
    """POST /exams/{id}/submit istek gövdesi."""
    answers: List[AnswerItem] = Field(..., description="Tüm cevaplar")


# ---------------------------------------------------------------------------
# Sonuç Modelleri
# ---------------------------------------------------------------------------


class AnswerResult(BaseModel):
    """Tek bir sorunun değerlendirme sonucu."""
    question_id: str
    question_text: str
    question_type: QuestionType
    is_correct: bool
    is_partial: bool = Field(default=False, description="Kısmi puan mı? (multi_select)")
    earned_points: float
    max_points: float
    selected_choices: List[str]
    correct_choices: List[str]
    explanation: Optional[str] = None


class ScoreBreakdown(BaseModel):
    """Puan dağılımı özeti."""
    correct_count: int
    partial_count: int
    wrong_count: int
    blank_count: int
    total_questions: int
    earned_points: float
    max_points: float
    percentage_score: float = Field(..., description="Ham yüzde puan (0-100)")
    passed: bool


class ExamSubmitResponse(BaseModel):
    """POST /exams/{id}/submit tam yanıtı."""
    exam_id: str
    exam_title: str
    score_breakdown: ScoreBreakdown
    per_question_results: List[AnswerResult]
    grade_label: str = Field(..., description="AA, BA, BB, CB, CC, DC, DD, FF")
    certificate_eligible: bool
    certificate_number: Optional[str] = None
    submitted_at: str


class ExamResultResponse(BaseModel):
    """GET /exams/{id}/result özet yanıtı."""
    exam_id: str
    exam_title: str
    student_name: str
    score: float
    passed: bool
    correct_count: int
    wrong_count: int
    blank_count: int
    total_questions: int
    duration_taken_minutes: int
    certificate_number: Optional[str] = None
    completed_at: str


# ---------------------------------------------------------------------------
# Sertifika Doğrulama
# ---------------------------------------------------------------------------


class CertificateVerifyResponse(BaseModel):
    """GET /certificates/{cert_number}/verify yanıtı."""
    certificate_number: str
    is_valid: bool
    student_full_name: Optional[str] = None
    course_title: Optional[str] = None
    issued_at: Optional[str] = None
    expires_at: Optional[str] = None
    score: Optional[float] = None
    message: str
