"""
EduCell - Sınav & Değerlendirme Motoru Router'ı
================================================

Endpoint'ler:
  POST /api/v1/exams/{exam_id}/start          → Sınava başla (karıştırılmış, cevaplar gizli)
  POST /api/v1/exams/{exam_id}/submit         → Cevapları gönder & otomatik puanla
  GET  /api/v1/exams/{exam_id}/result         → Sınav sonucunu getir

Sertifika doğrulama: `GET /api/v1/certificates/{numara}/verify` (course router, public).

Endpointler gerçek PostgreSQL tablolarından beslenir.
"""

from datetime import datetime
import random
from typing import Iterable
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.deps import get_current_user_optional
from app.database import get_db
from app.models.exam import (
    AnswerItem,
    AnswerResult,
    ChoiceSafe,
    DifficultyLevel,
    ExamResultResponse,
    ExamSessionResponse,
    ExamSubmitRequest,
    ExamSubmitResponse,
    QuestionSafe,
    QuestionType,
    ScoreBreakdown,
)
from app.models.course_orm import (
    Certificate,
    Exam,
    ExamAttempt,
    Module,
    Question,
    User,
    UserAnswer,
)

router = APIRouter(tags=["🎓 Sınavlar & Sertifikalar"])
TEST_STUDENT_EMAIL = "ogrenci@educell.com"


def _parse_uuid(value: str, resource_name: str) -> UUID:
    try:
        return UUID(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"'{value}' ID'li {resource_name} bulunamadı.",
        ) from exc


def _now_iso(value: datetime | None = None) -> str:
    return (value or datetime.now()).isoformat()


def _resolve_student(current_user: User | None, db: Session) -> User:
    if current_user is not None:
        return current_user

    student = db.scalar(select(User).where(User.email == TEST_STUDENT_EMAIL))
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test öğrencisi bulunamadı: {TEST_STUDENT_EMAIL}",
        )
    return student


def _question_type(value: str) -> QuestionType:
    """DB enum (MULTIPLE_CHOICE) veya API snake_case değerlerini QuestionType'a çevirir."""
    raw = str(value or "").strip()
    mapping: dict[str, QuestionType] = {
        "MULTIPLE_CHOICE": QuestionType.MULTIPLE_CHOICE,
        "TRUE_FALSE": QuestionType.TRUE_FALSE,
        "MULTI_SELECT": QuestionType.MULTI_SELECT,
        "multiple_choice": QuestionType.MULTIPLE_CHOICE,
        "true_false": QuestionType.TRUE_FALSE,
        "multi_select": QuestionType.MULTI_SELECT,
    }
    return mapping.get(raw, QuestionType.MULTIPLE_CHOICE)


def _safe_choices(options: Iterable[dict]) -> list[ChoiceSafe]:
    return [
        ChoiceSafe(id=str(option.get("id", "")), text=str(option.get("text", "")))
        for option in options
    ]


def _safe_question(question: Question) -> QuestionSafe:
    return QuestionSafe(
        id=str(question.id),
        text=question.text,
        question_type=_question_type(question.type),
        difficulty=DifficultyLevel.EASY,
        points=1.0,
        choices=_safe_choices(question.options or []),
    )


def _correct_option_ids(question: Question) -> set[str]:
    return {
        str(option.get("id"))
        for option in question.options or []
        if option.get("is_correct") is True
    }


def _normalize_selected(values: list[str]) -> list[str]:
    return [str(value) for value in values]


def _score_question(question: Question, selected_values: list[str]) -> tuple[float, bool, bool]:
    selected = set(_normalize_selected(selected_values))
    correct = _correct_option_ids(question)

    if not selected:
        return 0.0, False, False

    if question.type in {"MULTIPLE_CHOICE", "TRUE_FALSE"}:
        is_correct = len(selected) == 1 and selected == correct
        return (1.0 if is_correct else 0.0), is_correct, False

    wrong_selected = selected - correct
    if wrong_selected:
        return 0.0, False, False

    if not correct:
        return 1.0, True, False

    earned = len(selected & correct) / len(correct)
    is_correct = selected == correct
    is_partial = 0 < earned < 1
    return round(earned, 4), is_correct, is_partial


def _answer_result(
    question: Question,
    selected_values: list[str],
    earned: float,
    is_correct: bool,
    is_partial: bool,
) -> AnswerResult:
    return AnswerResult(
        question_id=str(question.id),
        question_text=question.text,
        question_type=_question_type(question.type),
        is_correct=is_correct,
        is_partial=is_partial,
        earned_points=earned,
        max_points=1.0,
        selected_choices=_normalize_selected(selected_values),
        correct_choices=sorted(_correct_option_ids(question)),
        explanation=None,
    )


def _grade_label(percentage: float) -> str:
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


# ---------------------------------------------------------------------------
# POST /api/v1/exams/{exam_id}/start
# ---------------------------------------------------------------------------

@router.post(
    "/exams/{exam_id}/start",
    response_model=ExamSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Sınava Başla",
    description=(
        "Öğrencinin sınava başlamasını gerçek veritabanında kaydeder. "
        "Sorular **karıştırılarak** döner ve **doğru cevaplar kesinlikle gizlenir**. "
    ),
)
def start_exam(
    exam_id: str = Path(
        ...,
        examples=["2a1ed4a8-f3e5-4b2f-87a9-7368aa91470c"],
        description="Başlatılacak sınavın ID'si",
    ),
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> ExamSessionResponse:
    """
    Sınav oturumu başlatır.

    - Her çağrıda sorular **farklı sırada** gelir (shuffle).
    - Yanıtta `is_correct` alanı **bulunmaz** (güvenlik).
    - Süre aşımını kontrol etmek client sorumluluğundadır.
    """
    exam_uuid = _parse_uuid(exam_id, "sınav")
    try:
        exam = db.get(Exam, exam_uuid)
        if exam is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"'{exam_id}' ID'li sınav bulunamadı.",
            )

        student = _resolve_student(current_user, db)
        # Yalnızca tamamlanmış girişimleri say (finished_at dolu olanlar)
        finished_attempt_count = db.scalar(
            select(func.count())
            .select_from(ExamAttempt)
            .where(
                ExamAttempt.user_id == student.id,
                ExamAttempt.exam_id == exam.id,
                ExamAttempt.finished_at.isnot(None),
            )
        ) or 0

        # Yarım kalmış (açık) girişim varsa aynı oturumu dön.
        # Sayfayı yenilemek veya tekrar denemek yeni deneme hakkı tüketmemeli.
        open_attempt = db.scalar(
            select(ExamAttempt)
            .where(
                ExamAttempt.user_id == student.id,
                ExamAttempt.exam_id == exam.id,
                ExamAttempt.finished_at.is_(None),
            )
            .order_by(ExamAttempt.started_at.desc(), ExamAttempt.created_at.desc())
        )
        if open_attempt is not None:
            attempt = open_attempt
        else:
            if finished_attempt_count >= exam.max_attempts:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Bu sınav için maksimum deneme hakkı ({exam.max_attempts}) doldu.",
                )

            now = datetime.now()
            attempt = ExamAttempt(
                id=uuid4(),
                user_id=student.id,
                exam_id=exam.id,
                started_at=now,
                finished_at=None,
                score=None,
                is_passed=False,
                attempt_no=finished_attempt_count + 1,
                created_at=now,
            )
            db.add(attempt)

        questions = list(
            db.scalars(
                select(Question)
                .where(Question.exam_id == exam.id)
                .order_by(Question.order_index)
            ).all()
        )
        if exam.shuffle:
            random.shuffle(questions)

        db.commit()
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sınav başlatılamadı.",
        ) from exc

    safe_questions = [_safe_question(question) for question in questions]
    return ExamSessionResponse(
        attempt_id=str(attempt.id),
        exam_id=str(exam.id),
        exam_title=exam.title,
        time_limit_min=exam.time_limit_min,
        duration_minutes=exam.time_limit_min,
        total_questions=len(safe_questions),
        total_points=float(len(safe_questions)),
        passing_score=float(exam.passing_score),
        questions=safe_questions,
        started_at=_now_iso(attempt.started_at),
    )


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
        "  `kazanılan = doğru_seçilen / toplam_doğru`\n"
        "  Yanlış ekstra şık seçilirse soru puanı 0 olur."
    ),
)
def submit_exam(
    exam_id: str = Path(
        ...,
        examples=["2a1ed4a8-f3e5-4b2f-87a9-7368aa91470c"],
        description="Puanlanacak sınavın ID'si",
    ),
    body: ExamSubmitRequest = ...,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> ExamSubmitResponse:
    """
    Cevapları değerlendirir; soru bazında sonuç + genel puan dağılımı döner.

    Cevaplar son aktif sınav denemesine kaydedilir.
    """
    exam_uuid = _parse_uuid(exam_id, "sınav")

    try:
        exam = db.get(Exam, exam_uuid)
        if exam is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"'{exam_id}' ID'li sınav bulunamadı.",
            )

        student = _resolve_student(current_user, db)
        attempt = db.scalar(
            select(ExamAttempt)
            .where(
                ExamAttempt.user_id == student.id,
                ExamAttempt.exam_id == exam.id,
                ExamAttempt.finished_at.is_(None),
            )
            .order_by(ExamAttempt.started_at.desc(), ExamAttempt.created_at.desc())
        )
        if attempt is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bu sınav için aktif deneme bulunamadı. Önce sınavı başlatın.",
            )

        # ── Server-side süre doğrulaması ─────────────────────────────────
        # Case şartı: "client-side timer tek başına yetmez"
        if exam.time_limit_min > 0:
            elapsed_seconds = (datetime.now() - attempt.started_at).total_seconds()
            allowed_seconds = exam.time_limit_min * 60 + 30  # 30 sn tolerans
            if elapsed_seconds > allowed_seconds:
                # Süre dolmuş — attempt'ı kapat, 0 puan ver
                attempt.finished_at = datetime.now()
                attempt.score = 0
                attempt.is_passed = False
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Sınav süresi doldu ({exam.time_limit_min} dakika). Cevaplar kabul edilmedi.",
                )

        questions = list(
            db.scalars(
                select(Question)
                .where(Question.exam_id == exam.id)
                .order_by(Question.order_index)
            ).all()
        )
        answer_map: dict[str, list[str]] = {
            answer.question_id: answer.selected_choices for answer in body.answers
        }

        per_question_results: list[AnswerResult] = []
        total_earned = 0.0
        correct_count = 0
        wrong_count = 0
        partial_count = 0
        blank_count = 0

        for question in questions:
            selected = _normalize_selected(answer_map.get(str(question.id), []))
            earned, is_correct, is_partial = _score_question(question, selected)

            if not selected:
                blank_count += 1
            elif is_correct:
                correct_count += 1
            elif is_partial:
                partial_count += 1
            else:
                wrong_count += 1

            db.add(
                UserAnswer(
                    id=uuid4(),
                    attempt_id=attempt.id,
                    question_id=question.id,
                    selected_options=selected,
                    is_correct=is_correct,
                    earned_point=earned,
                    created_at=datetime.now(),
                )
            )
            total_earned += earned
            per_question_results.append(
                _answer_result(question, selected, earned, is_correct, is_partial)
            )

        total_questions = len(questions)
        score = round((total_earned / total_questions) * 100, 2) if total_questions else 0.0
        is_passed = score >= exam.passing_score
        now = datetime.now()
        attempt.finished_at = now
        attempt.score = score
        attempt.is_passed = is_passed
        db.commit()
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sınav cevapları kaydedilemedi.",
        ) from exc

    breakdown = ScoreBreakdown(
        correct_count=correct_count,
        partial_count=partial_count,
        wrong_count=wrong_count,
        blank_count=blank_count,
        total_questions=total_questions,
        earned_points=round(total_earned, 4),
        max_points=float(total_questions),
        percentage_score=score,
        passed=is_passed,
    )
    breakdown_dict = breakdown.model_dump(mode="json")
    return ExamSubmitResponse(
        exam_id=str(exam.id),
        exam_title=exam.title,
        attempt_id=str(attempt.id),
        score=score,
        is_passed=is_passed,
        correct_count=correct_count,
        wrong_count=wrong_count,
        breakdown=breakdown_dict,
        score_breakdown=breakdown,
        per_question_results=per_question_results,
        grade_label=_grade_label(score),
        certificate_eligible=is_passed,
        certificate_number=None,
        submitted_at=_now_iso(now),
    )


# ---------------------------------------------------------------------------
# GET /api/v1/exams/{exam_id}/result
# ---------------------------------------------------------------------------

@router.get(
    "/exams/{exam_id}/result",
    response_model=ExamResultResponse,
    summary="Sınav Sonucunu Getir",
    description=(
        "Tamamlanmış bir sınav için kayıtlı özet sonucu döner. "
        "Doğru/yanlış/boş dağılımı ve cevap detayları yer alır."
    ),
)
def get_result(
    exam_id: str = Path(
        ...,
        examples=["2a1ed4a8-f3e5-4b2f-87a9-7368aa91470c"],
        description="Sonucu getirilecek sınavın ID'si",
    ),
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> ExamResultResponse:
    """
    Sınav özet sonucu.

    - Sınav bulunamazsa **404** döner.
    """
    exam_uuid = _parse_uuid(exam_id, "sınav")

    try:
        exam = db.get(Exam, exam_uuid)
        if exam is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"'{exam_id}' ID'li sınav bulunamadı.",
            )

        student = _resolve_student(current_user, db)
        attempt = db.scalar(
            select(ExamAttempt)
            .where(
                ExamAttempt.user_id == student.id,
                ExamAttempt.exam_id == exam.id,
                ExamAttempt.finished_at.isnot(None),
            )
            .order_by(ExamAttempt.attempt_no.desc(), ExamAttempt.started_at.desc())
        )
        if attempt is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"'{exam_id}' için tamamlanmış sınav bulunamadı.",
            )

        questions = list(
            db.scalars(
                select(Question)
                .where(Question.exam_id == exam.id)
                .order_by(Question.order_index)
            ).all()
        )
        answer_rows = db.execute(
            select(UserAnswer, Question)
            .join(Question, UserAnswer.question_id == Question.id)
            .where(UserAnswer.attempt_id == attempt.id)
            .order_by(Question.order_index)
        ).all()
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sınav sonucu veritabanından okunamadı.",
        ) from exc

    answer_details = [
        _answer_result(
            question,
            answer.selected_options or [],
            float(answer.earned_point or 0),
            bool(answer.is_correct),
            0 < float(answer.earned_point or 0) < 1,
        )
        for answer, question in answer_rows
    ]
    answered_question_ids = {answer.question_id for answer, _ in answer_rows}
    correct_count = sum(1 for answer, _ in answer_rows if answer.is_correct is True)
    wrong_count = sum(
        1
        for answer, _ in answer_rows
        if answer.selected_options and not answer.is_correct and float(answer.earned_point or 0) == 0
    )
    blank_count = max(len(questions) - len(answered_question_ids), 0)

    certificate_number = None
    course_id = db.scalar(
        select(Module.course_id)
        .join(Exam, Exam.module_id == Module.id)
        .where(Exam.id == exam.id)
    )
    if course_id is not None:
        cert = db.scalar(
            select(Certificate).where(
                Certificate.user_id == student.id,
                Certificate.course_id == course_id,
            )
        )
        certificate_number = cert.certificate_number if cert is not None else None

    finished_at = attempt.finished_at
    duration_taken_minutes = 0
    if finished_at is not None:
        duration_taken_minutes = max(
            int((finished_at - attempt.started_at).total_seconds() // 60),
            0,
        )

    score = float(attempt.score or 0)
    is_passed = bool(attempt.is_passed)
    completed_at = _now_iso(finished_at or attempt.started_at)
    return ExamResultResponse(
        exam_id=str(exam.id),
        exam_title=exam.title,
        student_name=student.full_name,
        score=score,
        is_passed=is_passed,
        passed=is_passed,
        attempt_no=attempt.attempt_no,
        started_at=_now_iso(attempt.started_at),
        finished_at=_now_iso(finished_at) if finished_at else None,
        correct_count=correct_count,
        wrong_count=wrong_count,
        blank_count=blank_count,
        total_questions=len(questions),
        duration_taken_minutes=duration_taken_minutes,
        certificate_number=certificate_number,
        completed_at=completed_at,
        answers=answer_details,
    )
