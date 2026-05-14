"""
EduCell - Sınav & Değerlendirme Servisi
========================================

Bu modül sınavın iş mantığını barındırır:

  1. Mock sınav & soru verisi
  2. Puan hesaplama fonksiyonları
       • score_multiple_choice()  — tek doğru cevap
       • score_true_false()       — doğru/yanlış
       • score_multi_select()     — kısmi puanlama algoritması
       • grade_exam()             — tüm sınavı puanla
  3. Sertifika doğrulama

Üretim ortamında "# DB:" işaretli yerler SQLAlchemy sorgusuyla değiştirilecek.
"""

from __future__ import annotations

import random
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from app.models.exam import (
    AnswerItem,
    AnswerResult,
    CertificateVerifyResponse,
    ChoiceInternal,
    ChoiceSafe,
    DifficultyLevel,
    ExamResultResponse,
    ExamSessionResponse,
    ExamSubmitResponse,
    QuestionInternal,
    QuestionSafe,
    QuestionType,
    ScoreBreakdown,
)

# ---------------------------------------------------------------------------
# Yardımcı
# ---------------------------------------------------------------------------

def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# Mock Sınav Kataloğu
# ---------------------------------------------------------------------------

class _ExamMeta:
    """Sınav üst bilgisi (mock)."""
    def __init__(
        self,
        exam_id: str,
        title: str,
        duration_minutes: int,
        passing_score: float,
        course_id: str,
        course_title: str,
    ) -> None:
        self.exam_id = exam_id
        self.title = title
        self.duration_minutes = duration_minutes
        self.passing_score = passing_score
        self.course_id = course_id
        self.course_title = course_title


_MOCK_EXAMS: Dict[str, _ExamMeta] = {
    "exam_001": _ExamMeta(
        exam_id="exam_001",
        title="Python ile Veri Bilimi — Bölüm 1 Final Sınavı",
        duration_minutes=30,
        passing_score=60.0,
        course_id="crs_001",
        course_title="Python ile Veri Bilimi: Sıfırdan İleri Seviyeye",
    ),
    "exam_002": _ExamMeta(
        exam_id="exam_002",
        title="Siber Güvenliğe Giriş — Final Sınavı",
        duration_minutes=45,
        passing_score=70.0,
        course_id="crs_002",
        course_title="Siber Güvenliğe Giriş: Ağ & Uygulama Güvenliği",
    ),
}


# ---------------------------------------------------------------------------
# Mock Soru Havuzu  (MultipleChoice + TrueFalse + MultiSelect karışık)
# ---------------------------------------------------------------------------

_MOCK_QUESTIONS: Dict[str, List[QuestionInternal]] = {
    "exam_001": [
        # ── Multiple Choice ─────────────────────────────────────────────────
        QuestionInternal(
            id="q001",
            text="Python'da bir liste oluşturmak için hangi sözdizimi kullanılır?",
            question_type=QuestionType.MULTIPLE_CHOICE,
            difficulty=DifficultyLevel.EASY,
            points=1.0,
            choices=[
                ChoiceInternal(id="a", text="liste = (1, 2, 3)",     is_correct=False),
                ChoiceInternal(id="b", text="liste = [1, 2, 3]",     is_correct=True),
                ChoiceInternal(id="c", text="liste = {1, 2, 3}",     is_correct=False),
                ChoiceInternal(id="d", text="liste = <1, 2, 3>",     is_correct=False),
            ],
            explanation="Köşeli parantez [] Python'da liste tanımlar.",
        ),
        QuestionInternal(
            id="q002",
            text="NumPy'da iki matrisin eleman bazında çarpımı için hangi fonksiyon kullanılır?",
            question_type=QuestionType.MULTIPLE_CHOICE,
            difficulty=DifficultyLevel.MEDIUM,
            points=1.0,
            choices=[
                ChoiceInternal(id="a", text="np.dot(A, B)",           is_correct=False),
                ChoiceInternal(id="b", text="np.matmul(A, B)",        is_correct=False),
                ChoiceInternal(id="c", text="np.multiply(A, B)",      is_correct=True),
                ChoiceInternal(id="d", text="A @ B",                  is_correct=False),
            ],
            explanation="np.multiply() eleman bazlı (element-wise) çarpım yapar.",
        ),
        QuestionInternal(
            id="q003",
            text="Pandas'ta bir DataFrame'in ilk 5 satırını görmek için hangi metot kullanılır?",
            question_type=QuestionType.MULTIPLE_CHOICE,
            difficulty=DifficultyLevel.EASY,
            points=1.0,
            choices=[
                ChoiceInternal(id="a", text="df.top(5)",              is_correct=False),
                ChoiceInternal(id="b", text="df.first(5)",            is_correct=False),
                ChoiceInternal(id="c", text="df.head(5)",             is_correct=True),
                ChoiceInternal(id="d", text="df.show(5)",             is_correct=False),
            ],
            explanation="df.head(n) ilk n satırı döner, varsayılan n=5'tir.",
        ),
        # ── True / False ────────────────────────────────────────────────────
        QuestionInternal(
            id="q004",
            text="Python'da bir değişken kullanılmadan önce mutlaka tip bildirimi (type declaration) yapılmalıdır.",
            question_type=QuestionType.TRUE_FALSE,
            difficulty=DifficultyLevel.EASY,
            points=1.0,
            choices=[],
            correct_bool=False,
            explanation="Python dinamik tiplemeli bir dil; açık tip bildirimi gerekmez.",
        ),
        QuestionInternal(
            id="q005",
            text="Pandas'ta `df.dropna()` fonksiyonu eksik değer içeren satırları veri setinden kaldırır.",
            question_type=QuestionType.TRUE_FALSE,
            difficulty=DifficultyLevel.EASY,
            points=1.0,
            choices=[],
            correct_bool=True,
            explanation="dropna() varsayılan olarak NaN içeren tüm satırları siler.",
        ),
        # ── Multi-Select (kısmi puan) ────────────────────────────────────────
        QuestionInternal(
            id="q006",
            text="Aşağıdakilerden hangileri Python'da değiştirilemez (immutable) veri tipleridir? (Tüm doğruları seçin)",
            question_type=QuestionType.MULTI_SELECT,
            difficulty=DifficultyLevel.MEDIUM,
            points=2.0,
            choices=[
                ChoiceInternal(id="a", text="list",    is_correct=False),
                ChoiceInternal(id="b", text="tuple",   is_correct=True),
                ChoiceInternal(id="c", text="str",     is_correct=True),
                ChoiceInternal(id="d", text="dict",    is_correct=False),
                ChoiceInternal(id="e", text="int",     is_correct=True),
            ],
            explanation="tuple, str ve int değiştirilemez; list ve dict değiştirilebilir.",
        ),
        QuestionInternal(
            id="q007",
            text="NumPy ile ilgili doğru olan ifadeleri seçin. (Tüm doğruları seçin)",
            question_type=QuestionType.MULTI_SELECT,
            difficulty=DifficultyLevel.HARD,
            points=2.0,
            choices=[
                ChoiceInternal(id="a", text="NumPy dizileri aynı tipte eleman içerir",           is_correct=True),
                ChoiceInternal(id="b", text="NumPy, Python listelerinden yavaş çalışır",          is_correct=False),
                ChoiceInternal(id="c", text="np.zeros(3) üç elemanlı sıfır dizisi oluşturur",    is_correct=True),
                ChoiceInternal(id="d", text="NumPy vektörizasyonu CPU optimizasyonu sağlar",     is_correct=True),
                ChoiceInternal(id="e", text="NumPy dizilerinin boyutu dinamik olarak değişebilir", is_correct=False),
            ],
            explanation="NumPy homojen, sabit boyutlu, vektörizasyon destekli C tabanlı diziler kullanır.",
        ),
    ],
    "exam_002": [
        QuestionInternal(
            id="q101",
            text="OSI modelinde 'Transport' katmanı hangi katmandır?",
            question_type=QuestionType.MULTIPLE_CHOICE,
            difficulty=DifficultyLevel.EASY,
            points=1.0,
            choices=[
                ChoiceInternal(id="a", text="3. Katman (Network)",      is_correct=False),
                ChoiceInternal(id="b", text="4. Katman (Transport)",    is_correct=True),
                ChoiceInternal(id="c", text="5. Katman (Session)",      is_correct=False),
                ChoiceInternal(id="d", text="6. Katman (Presentation)", is_correct=False),
            ],
            explanation="Transport katmanı (Layer 4) TCP/UDP protokollerini kapsar.",
        ),
        QuestionInternal(
            id="q102",
            text="SQL Injection saldırısı yalnızca eski sistemlerde etkilidir.",
            question_type=QuestionType.TRUE_FALSE,
            difficulty=DifficultyLevel.EASY,
            points=1.0,
            choices=[],
            correct_bool=False,
            explanation="Parametrize sorgu kullanmayan her sistemde SQL Injection riski mevcuttur.",
        ),
        QuestionInternal(
            id="q103",
            text="OWASP Top-10 2021 listesinde yer alan güvenlik açıklarını seçin. (Tüm doğruları seçin)",
            question_type=QuestionType.MULTI_SELECT,
            difficulty=DifficultyLevel.MEDIUM,
            points=3.0,
            choices=[
                ChoiceInternal(id="a", text="Broken Access Control",   is_correct=True),
                ChoiceInternal(id="b", text="Buffer Overflow",         is_correct=False),
                ChoiceInternal(id="c", text="Cryptographic Failures",  is_correct=True),
                ChoiceInternal(id="d", text="Injection",               is_correct=True),
                ChoiceInternal(id="e", text="Race Condition",          is_correct=False),
            ],
            explanation="Broken Access Control, Cryptographic Failures ve Injection OWASP 2021 top 3'tedir.",
        ),
    ],
}


# ---------------------------------------------------------------------------
# Mock Sertifika Deposu
# ---------------------------------------------------------------------------

_MOCK_CERTIFICATES: Dict[str, dict] = {
    "CERT-2024-001-TC": {
        "student_full_name": "Ahmet Yılmaz",
        "course_title": "Python ile Veri Bilimi: Sıfırdan İleri Seviyeye",
        "issued_at": "2024-11-15T10:30:00Z",
        "expires_at": "2027-11-15T10:30:00Z",
        "score": 87.5,
    },
    "CERT-2024-002-TC": {
        "student_full_name": "Zeynep Arslan",
        "course_title": "Siber Güvenliğe Giriş: Ağ & Uygulama Güvenliği",
        "issued_at": "2024-12-01T14:00:00Z",
        "expires_at": "2027-12-01T14:00:00Z",
        "score": 92.0,
    },
    "CERT-2025-003-TC": {
        "student_full_name": "Mehmet Kaya",
        "course_title": "Kubernetes & Docker ile Modern DevOps",
        "issued_at": "2025-01-20T09:00:00Z",
        "expires_at": "2028-01-20T09:00:00Z",
        "score": 78.0,
    },
}


# ===========================================================================
# PUANLAMA ALGORİTMALARI
# ===========================================================================


def score_multiple_choice(
    question: QuestionInternal,
    selected_choices: List[str],
) -> Tuple[float, bool]:
    """
    Çoklu seçmeli (tek doğru cevap) soruyu puanlar.

    Kurallar:
    - Doğru şık seçildiyse tam puan.
    - Yanlış şık veya boş bırakılmışsa 0 puan (negatif puan yok).

    Returns:
        (earned_points, is_correct)
    """
    if not selected_choices:
        return 0.0, False

    correct_ids = {c.id for c in question.choices if c.is_correct}
    selected = selected_choices[0]  # Sadece ilk seçim dikkate alınır

    if selected in correct_ids:
        return question.points, True
    return 0.0, False


def score_true_false(
    question: QuestionInternal,
    selected_choices: List[str],
) -> Tuple[float, bool]:
    """
    Doğru/Yanlış soruyu puanlar.

    Beklenen selected_choices: ['true'] veya ['false']

    Returns:
        (earned_points, is_correct)
    """
    if not selected_choices:
        return 0.0, False

    answer = selected_choices[0].strip().lower()
    student_bool = answer in ("true", "doğru", "evet", "1")

    if student_bool == question.correct_bool:
        return question.points, True
    return 0.0, False


def score_multi_select(
    question: QuestionInternal,
    selected_choices: List[str],
) -> Tuple[float, bool, bool]:
    """
    Çoklu seçim (Multi-Select) kısmi puanlama algoritması.

    Algoritma:
    ─────────────────────────────────────────────────────────────────
    • Doğru seçenek sayısı     = N  (örn: 3)
    • Öğrencinin doğru bulduğu = K  (örn: 2)
    • Öğrencinin yanlış işaret ettiği şıklar puanı DÜŞÜRMEZ
      (sadece kısmi puan hesabı yapılır).

    Kazanılan puan = (K / N) * max_points

    Örnek:
        N=3 doğru şık, K=2 doğru seçildi → puan = (2/3) * max_points
        N=3 doğru şık, K=0 doğru seçildi → puan = 0
        N=3 doğru şık, K=3 doğru seçildi → puan = max_points (tam puan)
    ─────────────────────────────────────────────────────────────────

    Returns:
        (earned_points, is_correct, is_partial)
        - is_correct : True yalnızca TÜM doğru şıklar seçilip hiç yanlış seçilmediğinde
        - is_partial : True kısmi puan kazanıldığında (0 < earned < max)
    """
    correct_ids: set[str] = {c.id for c in question.choices if c.is_correct}
    selected_set: set[str] = set(selected_choices)
    total_correct = len(correct_ids)

    if total_correct == 0:
        # Soruyu yanlış yapılandırma güvencesi
        return question.points, True, False

    # Doğru seçeneklerden kaç tanesi doğru işaretlenmiş?
    correctly_selected = len(correct_ids & selected_set)

    # Kısmi puan hesabı: yanlış şık seçmek puanı düşürmez
    earned = (correctly_selected / total_correct) * question.points

    is_correct = (selected_set == correct_ids)  # Tam isabet
    is_partial = (0 < earned < question.points)

    return round(earned, 4), is_correct, is_partial


def _assign_grade(percentage: float) -> str:
    """
    Türk üniversitesi harf notu sistemine benzer eşleştirme.

    90-100 → AA
    85-90  → BA
    75-85  → BB
    70-75  → CB
    60-70  → CC
    50-60  → DC
    45-50  → DD
    <45    → FF
    """
    if percentage >= 90:
        return "AA"
    if percentage >= 85:
        return "BA"
    if percentage >= 75:
        return "BB"
    if percentage >= 70:
        return "CB"
    if percentage >= 60:
        return "CC"
    if percentage >= 50:
        return "DC"
    if percentage >= 45:
        return "DD"
    return "FF"


# ===========================================================================
# SERVİS FONKSİYONLARI
# ===========================================================================


def get_exam_session(exam_id: str) -> Optional[ExamSessionResponse]:
    """
    POST /exams/{exam_id}/start

    • Sınav meta verisini getirir.
    • Soruları karıştırır (shuffle).
    • Doğru cevapları gizler (QuestionSafe döner).
    • Sınav bulunamazsa None döner.
    """
    # DB:  SELECT * FROM exams WHERE id = :exam_id
    meta = _MOCK_EXAMS.get(exam_id)
    if meta is None:
        return None

    # DB:  SELECT * FROM questions WHERE exam_id = :exam_id
    questions_raw = list(_MOCK_QUESTIONS.get(exam_id, []))

    # Soruları karıştır (her sınav oturumu farklı sıra)
    random.shuffle(questions_raw)

    total_points = sum(q.points for q in questions_raw)

    # Doğru cevapları gizleyerek QuestionSafe listesi oluştur
    safe_questions: List[QuestionSafe] = []
    for q in questions_raw:
        safe_choices = [ChoiceSafe(id=c.id, text=c.text) for c in q.choices]
        # Şıkları da karıştır (MultipleChoice için)
        if q.question_type != QuestionType.TRUE_FALSE:
            random.shuffle(safe_choices)

        safe_questions.append(
            QuestionSafe(
                id=q.id,
                text=q.text,
                question_type=q.question_type,
                difficulty=q.difficulty,
                points=q.points,
                choices=safe_choices,
            )
        )

    return ExamSessionResponse(
        exam_id=exam_id,
        exam_title=meta.title,
        duration_minutes=meta.duration_minutes,
        total_questions=len(safe_questions),
        total_points=total_points,
        passing_score=meta.passing_score,
        questions=safe_questions,
        started_at=_now_iso(),
    )


def grade_exam(
    exam_id: str,
    answers: List[AnswerItem],
) -> Optional[ExamSubmitResponse]:
    """
    POST /exams/{exam_id}/submit

    Tüm cevapları alır, soru tipine göre puanlar ve tam sonuç döner.
    Sınav bulunamazsa None döner.
    """
    # DB:  SELECT * FROM exams WHERE id = :exam_id
    meta = _MOCK_EXAMS.get(exam_id)
    if meta is None:
        return None

    # DB:  SELECT * FROM questions WHERE exam_id = :exam_id
    questions_raw: List[QuestionInternal] = _MOCK_QUESTIONS.get(exam_id, [])
    question_map: Dict[str, QuestionInternal] = {q.id: q for q in questions_raw}
    answer_map: Dict[str, List[str]] = {a.question_id: a.selected_choices for a in answers}

    per_question_results: List[AnswerResult] = []
    total_earned = 0.0
    total_max = sum(q.points for q in questions_raw)
    correct_count = 0
    partial_count = 0
    wrong_count = 0
    blank_count = 0

    for question in questions_raw:
        selected = answer_map.get(question.id, [])
        is_blank = len(selected) == 0
        is_partial = False

        if is_blank:
            earned = 0.0
            is_correct = False
            blank_count += 1
        elif question.question_type == QuestionType.MULTIPLE_CHOICE:
            earned, is_correct = score_multiple_choice(question, selected)
            if not is_correct:
                wrong_count += 1
            else:
                correct_count += 1
        elif question.question_type == QuestionType.TRUE_FALSE:
            earned, is_correct = score_true_false(question, selected)
            if not is_correct:
                wrong_count += 1
            else:
                correct_count += 1
        else:  # MULTI_SELECT
            earned, is_correct, is_partial = score_multi_select(question, selected)
            if is_correct:
                correct_count += 1
            elif is_partial:
                partial_count += 1
            elif earned == 0:
                wrong_count += 1

        total_earned += earned

        # Doğru cevap ID'lerini belirle
        if question.question_type == QuestionType.TRUE_FALSE:
            correct_choices = ["true"] if question.correct_bool else ["false"]
        else:
            correct_choices = [c.id for c in question.choices if c.is_correct]

        per_question_results.append(
            AnswerResult(
                question_id=question.id,
                question_text=question.text,
                question_type=question.question_type,
                is_correct=is_correct,
                is_partial=is_partial,
                earned_points=round(earned, 4),
                max_points=question.points,
                selected_choices=selected,
                correct_choices=correct_choices,
                explanation=question.explanation,
            )
        )

    percentage = round((total_earned / total_max) * 100, 2) if total_max > 0 else 0.0
    passed = percentage >= meta.passing_score
    grade_label = _assign_grade(percentage)

    # Sertifika numarası (sadece geçtiyse)
    cert_number: Optional[str] = None
    if passed:
        import uuid
        cert_number = f"CERT-{datetime.now(timezone.utc).strftime('%Y')}-{uuid.uuid4().hex[:6].upper()}-TC"

    breakdown = ScoreBreakdown(
        correct_count=correct_count,
        partial_count=partial_count,
        wrong_count=wrong_count,
        blank_count=blank_count,
        total_questions=len(questions_raw),
        earned_points=round(total_earned, 4),
        max_points=total_max,
        percentage_score=percentage,
        passed=passed,
    )

    return ExamSubmitResponse(
        exam_id=exam_id,
        exam_title=meta.title,
        score_breakdown=breakdown,
        per_question_results=per_question_results,
        grade_label=grade_label,
        certificate_eligible=passed,
        certificate_number=cert_number,
        submitted_at=_now_iso(),
    )


def get_exam_result(exam_id: str) -> Optional[ExamResultResponse]:
    """
    GET /exams/{exam_id}/result

    Mock sonuç döner (üretimde veritabanından çekilir).
    Sınav bulunamazsa None döner.
    """
    # DB:  SELECT * FROM exam_results WHERE exam_id = :exam_id AND user_id = :user_id
    meta = _MOCK_EXAMS.get(exam_id)
    if meta is None:
        return None

    # Sabit mock sonuç verisi
    mock_results = {
        "exam_001": ExamResultResponse(
            exam_id="exam_001",
            exam_title="Python ile Veri Bilimi — Bölüm 1 Final Sınavı",
            student_name="Ahmet Yılmaz",
            score=85.71,
            passed=True,
            correct_count=5,
            wrong_count=1,
            blank_count=1,
            total_questions=7,
            duration_taken_minutes=22,
            certificate_number="CERT-2024-001-TC",
            completed_at="2024-11-15T10:30:00Z",
        ),
        "exam_002": ExamResultResponse(
            exam_id="exam_002",
            exam_title="Siber Güvenliğe Giriş — Final Sınavı",
            student_name="Zeynep Arslan",
            score=92.0,
            passed=True,
            correct_count=4,
            wrong_count=0,
            blank_count=1,
            total_questions=5,
            duration_taken_minutes=38,
            certificate_number="CERT-2024-002-TC",
            completed_at="2024-12-01T14:00:00Z",
        ),
    }
    return mock_results.get(exam_id)


def verify_certificate(cert_number: str) -> CertificateVerifyResponse:
    """
    GET /certificates/{cert_number}/verify

    Sertifika numarasını doğrular; ad-soyad ve kurs adını döner.
    """
    # DB:  SELECT * FROM certificates WHERE cert_number = :cert_number
    cert = _MOCK_CERTIFICATES.get(cert_number)

    if cert is None:
        return CertificateVerifyResponse(
            certificate_number=cert_number,
            is_valid=False,
            message="❌ Bu sertifika numarası geçersiz veya sistemde kayıtlı değil.",
        )

    return CertificateVerifyResponse(
        certificate_number=cert_number,
        is_valid=True,
        student_full_name=cert["student_full_name"],
        course_title=cert["course_title"],
        issued_at=cert["issued_at"],
        expires_at=cert["expires_at"],
        score=cert["score"],
        message="✅ Sertifika geçerlidir. Turkcell EduCell tarafından onaylanmıştır.",
    )
