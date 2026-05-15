"""
EduCell - Sinav ve Degerlendirme Motoru Router'i.

Bu router mevcut PostgreSQL tablolarini kullanir:
exams, questions, exam_attempts, user_answers, enrollments.
"""

from datetime import datetime
import random
from typing import Iterable
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import delete, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.exam import (
    AnswerResult,
    ChoiceSafe,
    DifficultyLevel,
    ExamPatchRequest,
    ExamResultResponse,
    ExamSessionResponse,
    ExamSubmitRequest,
    ExamSubmitResponse,
    ExamUpsertRequest,
    QuestionSafe,
    QuestionType,
    QuestionUpsertRequest,
    ScoreBreakdown,
)
from app.models.course_orm import (
    Certificate,
    Course,
    Enrollment,
    Exam,
    ExamAttempt,
    Lesson,
    Module,
    Question,
    User,
    UserAnswer,
)
from app.services.progress_service import check_course_completion

router = APIRouter(tags=["Sinavlar & Degerlendirme"])

VALID_DB_QUESTION_TYPES = {"MULTIPLE_CHOICE", "TRUE_FALSE", "MULTI_SELECT"}


def _parse_uuid(value: str, resource_name: str) -> UUID:
    try:
        return UUID(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"'{value}' ID'li {resource_name} bulunamadi.",
        ) from exc


def _now_iso(value: datetime | None = None) -> str:
    return (value or datetime.now()).isoformat()


def _require_role(user: User, *roles: str) -> None:
    if user.role not in roles:
        raise HTTPException(status_code=403, detail="Bu islem icin yetkiniz yok.")


def _question_type(value: str) -> QuestionType:
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


def _db_question_type(value: str | None) -> str:
    raw = str(value or "").strip()
    mapping = {
        "MULTIPLE_CHOICE": "MULTIPLE_CHOICE",
        "multiple_choice": "MULTIPLE_CHOICE",
        "TRUE_FALSE": "TRUE_FALSE",
        "true_false": "TRUE_FALSE",
        "MULTI_SELECT": "MULTI_SELECT",
        "multi_select": "MULTI_SELECT",
        "MULTIPLE_SELECT": "MULTI_SELECT",
        "multiple_select": "MULTI_SELECT",
    }
    db_type = mapping.get(raw)
    if db_type not in VALID_DB_QUESTION_TYPES:
        raise HTTPException(status_code=400, detail="Gecersiz soru tipi.")
    return db_type


def _safe_choices(options: Iterable[dict]) -> list[ChoiceSafe]:
    choices: list[ChoiceSafe] = []
    for index, option in enumerate(options or []):
        if not isinstance(option, dict):
            continue
        option_id = str(option.get("id") or chr(65 + index))
        text = str(option.get("text") or "")
        choices.append(ChoiceSafe(id=option_id, text=text))
    return choices


def _question_points(question: Question) -> float:
    for option in question.options or []:
        if isinstance(option, dict) and option.get("points") is not None:
            try:
                return max(float(option.get("points")), 0.0)
            except (TypeError, ValueError):
                return 1.0
    return 1.0


def _question_explanation(question: Question) -> str | None:
    for option in question.options or []:
        if isinstance(option, dict) and option.get("explanation"):
            return str(option.get("explanation"))
    return None


def _safe_question(question: Question) -> QuestionSafe:
    return QuestionSafe(
        id=str(question.id),
        text=question.text,
        question_type=_question_type(question.type),
        difficulty=DifficultyLevel.EASY,
        points=_question_points(question),
        choices=_safe_choices(question.options or []),
    )


def _correct_option_ids(question: Question) -> set[str]:
    return {
        str(option.get("id"))
        for option in question.options or []
        if isinstance(option, dict) and option.get("is_correct") is True
    }


def _option_text_map(question: Question) -> dict[str, str]:
    result: dict[str, str] = {}
    for index, option in enumerate(question.options or []):
        if not isinstance(option, dict):
            continue
        option_id = str(option.get("id") or chr(65 + index))
        option_text = str(option.get("text") or "")
        result[option_id] = f"{option_id}. {option_text}" if option_text else option_id
    return result


def _option_texts(question: Question, ids: Iterable[str]) -> list[str]:
    mapping = _option_text_map(question)
    return [mapping.get(str(option_id), str(option_id)) for option_id in ids]


def _normalize_selected(values: list[str] | None) -> list[str]:
    return [str(value) for value in values or [] if str(value).strip()]


def _score_question(question: Question, selected_values: list[str]) -> tuple[float, float, bool, bool]:
    selected = set(_normalize_selected(selected_values))
    correct = _correct_option_ids(question)
    max_points = _question_points(question)
    question_type = _question_type(question.type)

    if not selected:
        return 0.0, max_points, False, False

    if question_type in {QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE}:
        is_correct = len(selected) == 1 and selected == correct
        return (max_points if is_correct else 0.0), max_points, is_correct, False

    wrong_selected = selected - correct
    if wrong_selected:
        return 0.0, max_points, False, False

    if not correct:
        return max_points, max_points, True, False

    earned_ratio = len(selected & correct) / len(correct)
    earned = round(max_points * earned_ratio, 4)
    is_correct = selected == correct
    is_partial = 0 < earned < max_points
    return earned, max_points, is_correct, is_partial


def _answer_result(
    question: Question,
    selected_values: list[str],
    earned: float,
    max_points: float,
    is_correct: bool,
    is_partial: bool,
) -> AnswerResult:
    selected = _normalize_selected(selected_values)
    correct = sorted(_correct_option_ids(question))
    return AnswerResult(
        question_id=str(question.id),
        question_text=question.text,
        question_type=_question_type(question.type),
        is_correct=is_correct,
        is_partial=is_partial,
        earned_points=round(earned, 4),
        max_points=round(max_points, 4),
        selected_choices=selected,
        correct_choices=correct,
        selected_choice_texts=_option_texts(question, selected),
        correct_choice_texts=_option_texts(question, correct),
        explanation=_question_explanation(question),
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


def _exam_context(db: Session, exam: Exam) -> tuple[Module, Course]:
    module = db.get(Module, exam.module_id)
    if module is None:
        raise HTTPException(status_code=404, detail="Sinavin modulu bulunamadi.")
    course = db.get(Course, module.course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Sinavin kursu bulunamadi.")
    return module, course


def _require_exam_manager(db: Session, exam: Exam, user: User) -> tuple[Module, Course]:
    _require_role(user, "instructor", "admin")
    module, course = _exam_context(db, exam)
    if user.role != "admin" and course.instructor_id != user.id:
        raise HTTPException(status_code=403, detail="Bu sinavi yonetme yetkiniz yok.")
    return module, course


def _require_module_manager(db: Session, module: Module, user: User) -> Course:
    _require_role(user, "instructor", "admin")
    course = db.get(Course, module.course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Kurs bulunamadi.")
    if user.role != "admin" and course.instructor_id != user.id:
        raise HTTPException(status_code=403, detail="Bu modulu yonetme yetkiniz yok.")
    return course


def _is_module_unlocked_for_student(db: Session, module: Module, user: User) -> tuple[bool, str | None]:
    modules = list(
        db.scalars(
            select(Module)
            .where(Module.course_id == module.course_id)
            .order_by(Module.order_index)
        ).all()
    )
    for item in modules:
        if item.id == module.id:
            return True, None

        previous_exams = list(db.scalars(select(Exam).where(Exam.module_id == item.id)).all())
        if not previous_exams:
            continue

        passed = db.scalar(
            select(ExamAttempt.id)
            .where(
                ExamAttempt.user_id == user.id,
                ExamAttempt.exam_id.in_([exam.id for exam in previous_exams]),
                ExamAttempt.finished_at.isnot(None),
                ExamAttempt.is_passed.is_(True),
            )
            .limit(1)
        )
        if passed is None:
            return False, "Onceki modul sinavini gecmeden bu module erisemezsiniz."

    return True, None


def _require_student_exam_access(db: Session, exam: Exam, user: User) -> tuple[Module, Course]:
    _require_role(user, "student")
    module, course = _exam_context(db, exam)
    enrollment = db.scalar(
        select(Enrollment.id).where(
            Enrollment.user_id == user.id,
            Enrollment.course_id == course.id,
            Enrollment.status.in_(["active", "completed"]),
        )
    )
    if enrollment is None:
        raise HTTPException(status_code=403, detail="Bu sinava erismek icin kursa kayitli olmalisiniz.")

    unlocked, reason = _is_module_unlocked_for_student(db, module, user)
    if not unlocked:
        raise HTTPException(status_code=403, detail=reason)

    # CHECK LESSONS ARE COMPLETED
    from sqlalchemy import text
    total_lessons = db.scalar(select(func.count()).select_from(Lesson).where(Lesson.module_id == module.id)) or 0
    if total_lessons > 0:
        completed = db.scalar(
            text(
                "SELECT COUNT(*) FROM lesson_completions lc "
                "JOIN lessons l ON lc.lesson_id = l.id "
                "WHERE l.module_id = :module_id AND lc.user_id = :user_id"
            ),
            {"module_id": str(module.id), "user_id": str(user.id)}
        ) or 0
        if completed < total_lessons:
            raise HTTPException(status_code=403, detail="Bu modulun sinavina girebilmek icin once moduldeki tum dersleri tamamlamalisiniz.")

    return module, course


def _finished_attempt_count(db: Session, exam: Exam, user: User) -> int:
    return db.scalar(
        select(func.count())
        .select_from(ExamAttempt)
        .where(
            ExamAttempt.user_id == user.id,
            ExamAttempt.exam_id == exam.id,
            ExamAttempt.finished_at.isnot(None),
        )
    ) or 0


def _best_score(db: Session, exam: Exam, user: User) -> float:
    score = db.scalar(
        select(func.max(ExamAttempt.score)).where(
            ExamAttempt.user_id == user.id,
            ExamAttempt.exam_id == exam.id,
            ExamAttempt.finished_at.isnot(None),
        )
    )
    return float(score or 0)


def _serialize_question(question: Question) -> dict:
    return {
        "id": str(question.id),
        "exam_id": str(question.exam_id),
        "type": question.type,
        "question_type": _question_type(question.type).value,
        "text": question.text,
        "options": question.options or [],
        "choices": question.options or [],
        "order_index": question.order_index,
        "order": question.order_index,
        "points": _question_points(question),
        "explanation": _question_explanation(question),
    }


def _serialize_exam(db: Session, exam: Exam, include_questions: bool = False) -> dict:
    module, course = _exam_context(db, exam)
    questions = list(
        db.scalars(
            select(Question)
            .where(Question.exam_id == exam.id)
            .order_by(Question.order_index)
        ).all()
    )
    payload = {
        "id": str(exam.id),
        "module_id": str(exam.module_id),
        "moduleId": str(exam.module_id),
        "module_title": module.title,
        "course_id": str(course.id),
        "courseId": str(course.id),
        "course_title": course.title,
        "title": exam.title,
        "description": exam.description or "",
        "time_limit_min": exam.time_limit_min,
        "durationMinutes": exam.time_limit_min,
        "passing_score": exam.passing_score,
        "passingScore": exam.passing_score,
        "question_count": len(questions),
        "questionCount": len(questions),
        "shuffle": exam.shuffle,
        "shuffleQuestions": exam.shuffle,
        "max_attempts": exam.max_attempts,
        "maxAttempts": exam.max_attempts,
        "createdAt": exam.created_at.isoformat() if exam.created_at else None,
        "updatedAt": exam.updated_at.isoformat() if exam.updated_at else None,
    }
    if include_questions:
        payload["questions"] = [_serialize_question(question) for question in questions]
    return payload


def _validate_question_payload(body: QuestionUpsertRequest) -> tuple[str, list[dict]]:
    db_type = _db_question_type(body.type or body.question_type)
    raw_options = body.options or []

    if db_type == "TRUE_FALSE" and not raw_options:
        raw_options = [
            {"id": "A", "text": "Dogru", "is_correct": True},
            {"id": "B", "text": "Yanlis", "is_correct": False},
        ]

    option_dicts = []
    for index, option in enumerate(raw_options):
        if isinstance(option, dict):
            option_id = option.get("id")
            option_text = option.get("text")
            is_correct = option.get("is_correct")
        else:
            option_id = option.id
            option_text = option.text
            is_correct = option.is_correct

        option_dicts.append(
            {
                "id": str(option_id or chr(65 + index)),
                "text": str(option_text or "").strip(),
                "is_correct": bool(is_correct),
                "points": float(body.points),
                "explanation": body.explanation or "",
            }
        )

    if any(not option["text"] for option in option_dicts):
        raise HTTPException(status_code=400, detail="Secenek metni bos olamaz.")

    correct_count = sum(1 for option in option_dicts if option["is_correct"])
    if db_type == "MULTIPLE_CHOICE":
        if len(option_dicts) != 4:
            raise HTTPException(status_code=400, detail="Coktan secmeli soruda tam 4 sik olmalidir.")
        if correct_count != 1:
            raise HTTPException(status_code=400, detail="Coktan secmeli soruda sadece 1 dogru cevap olmalidir.")
    elif db_type == "TRUE_FALSE":
        if len(option_dicts) != 2:
            raise HTTPException(status_code=400, detail="Dogru/Yanlis sorusunda iki secenek olmalidir.")
        if correct_count != 1:
            raise HTTPException(status_code=400, detail="Dogru/Yanlis sorusunda tek dogru cevap olmalidir.")
    elif db_type == "MULTI_SELECT":
        if len(option_dicts) < 2:
            raise HTTPException(status_code=400, detail="Coklu secim sorusunda en az 2 secenek olmalidir.")
        if correct_count < 1:
            raise HTTPException(status_code=400, detail="Coklu secim sorusunda en az 1 dogru cevap olmalidir.")

    return db_type, option_dicts


def _refresh_question_count(db: Session, exam: Exam) -> None:
    exam.question_count = db.scalar(
        select(func.count()).select_from(Question).where(Question.exam_id == exam.id)
    ) or 0
    if exam.question_count < 1:
        exam.question_count = 1
    exam.updated_at = datetime.now()


@router.get("/modules/{module_id}/exam", summary="Modul sinavini getir")
def get_module_exam(
    module_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    module_uuid = _parse_uuid(module_id, "modul")
    module = db.get(Module, module_uuid)
    if module is None:
        raise HTTPException(status_code=404, detail="Modul bulunamadi.")
    course = _require_module_manager(db, module, current_user)
    exam = db.scalar(select(Exam).where(Exam.module_id == module.id).order_by(Exam.created_at.desc()))
    return {
        "module": {"id": str(module.id), "title": module.title, "course_id": str(course.id), "course_title": course.title},
        "exam": _serialize_exam(db, exam, include_questions=True) if exam else None,
    }


@router.post("/modules/{module_id}/exam", status_code=status.HTTP_201_CREATED, summary="Modul sinavi olustur")
def create_module_exam(
    body: ExamUpsertRequest,
    module_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    module_uuid = _parse_uuid(module_id, "modul")
    module = db.get(Module, module_uuid)
    if module is None:
        raise HTTPException(status_code=404, detail="Modul bulunamadi.")
    course = _require_module_manager(db, module, current_user)
    existing = db.scalar(select(Exam).where(Exam.module_id == module.id))
    if existing is not None:
        raise HTTPException(status_code=409, detail="Bu modul icin zaten sinav tanimli.")

    now = datetime.now()
    exam = Exam(
        id=uuid4(),
        module_id=module.id,
        title=body.title,
        description=body.description or "",
        time_limit_min=body.time_limit_min,
        passing_score=body.passing_score,
        question_count=body.question_count,
        shuffle=body.shuffle,
        max_attempts=body.max_attempts,
        created_at=now,
        updated_at=now,
    )
    db.add(exam)
    module.updated_at = now
    course.updated_at = now
    db.commit()
    db.refresh(exam)
    return _serialize_exam(db, exam, include_questions=True)


@router.patch("/exams/{exam_id}", summary="Sinavi guncelle")
def update_exam(
    body: ExamPatchRequest,
    exam_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    exam_uuid = _parse_uuid(exam_id, "sinav")
    exam = db.get(Exam, exam_uuid)
    if exam is None:
        raise HTTPException(status_code=404, detail="Sinav bulunamadi.")
    module, course = _require_exam_manager(db, exam, current_user)

    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if value is not None:
            setattr(exam, field, value)
    now = datetime.now()
    exam.updated_at = now
    module.updated_at = now
    course.updated_at = now
    db.commit()
    db.refresh(exam)
    return _serialize_exam(db, exam, include_questions=True)


@router.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Sinavi sil")
def delete_exam(
    exam_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    exam_uuid = _parse_uuid(exam_id, "sinav")
    exam = db.get(Exam, exam_uuid)
    if exam is None:
        raise HTTPException(status_code=404, detail="Sinav bulunamadi.")
    _require_exam_manager(db, exam, current_user)
    db.delete(exam)
    db.commit()
    return None


@router.get("/exams/{exam_id}/questions", summary="Sinav sorularini getir")
def get_exam_questions(
    exam_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    exam_uuid = _parse_uuid(exam_id, "sinav")
    exam = db.get(Exam, exam_uuid)
    if exam is None:
        raise HTTPException(status_code=404, detail="Sinav bulunamadi.")
    _require_exam_manager(db, exam, current_user)
    questions = list(
        db.scalars(select(Question).where(Question.exam_id == exam.id).order_by(Question.order_index)).all()
    )
    return {"exam": _serialize_exam(db, exam), "questions": [_serialize_question(question) for question in questions]}


@router.post("/exams/{exam_id}/questions", status_code=status.HTTP_201_CREATED, summary="Sinava soru ekle")
def create_question(
    body: QuestionUpsertRequest,
    exam_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    exam_uuid = _parse_uuid(exam_id, "sinav")
    exam = db.get(Exam, exam_uuid)
    if exam is None:
        raise HTTPException(status_code=404, detail="Sinav bulunamadi.")
    _require_exam_manager(db, exam, current_user)
    db_type, options = _validate_question_payload(body)

    now = datetime.now()
    question = Question(
        id=uuid4(),
        exam_id=exam.id,
        type=db_type,
        text=body.text,
        options=options,
        order_index=body.order_index,
        created_at=now,
        updated_at=now,
    )
    db.add(question)
    _refresh_question_count(db, exam)
    db.commit()
    db.refresh(question)
    return _serialize_question(question)


@router.patch("/questions/{question_id}", summary="Soruyu guncelle")
def update_question(
    body: QuestionUpsertRequest,
    question_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    question_uuid = _parse_uuid(question_id, "soru")
    question = db.get(Question, question_uuid)
    if question is None:
        raise HTTPException(status_code=404, detail="Soru bulunamadi.")
    exam = db.get(Exam, question.exam_id)
    if exam is None:
        raise HTTPException(status_code=404, detail="Sinav bulunamadi.")
    _require_exam_manager(db, exam, current_user)
    db_type, options = _validate_question_payload(body)

    question.type = db_type
    question.text = body.text
    question.options = options
    question.order_index = body.order_index
    question.updated_at = datetime.now()
    _refresh_question_count(db, exam)
    db.commit()
    db.refresh(question)
    return _serialize_question(question)


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Soruyu sil")
def delete_question(
    question_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    question_uuid = _parse_uuid(question_id, "soru")
    question = db.get(Question, question_uuid)
    if question is None:
        raise HTTPException(status_code=404, detail="Soru bulunamadi.")
    exam = db.get(Exam, question.exam_id)
    if exam is None:
        raise HTTPException(status_code=404, detail="Sinav bulunamadi.")
    _require_exam_manager(db, exam, current_user)
    db.execute(delete(UserAnswer).where(UserAnswer.question_id == question.id))
    db.delete(question)
    db.flush()
    _refresh_question_count(db, exam)
    db.commit()
    return None


@router.get("/admin/exams", summary="Admin sinav istatistikleri")
def admin_exam_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    _require_role(current_user, "admin")
    rows = db.execute(
        select(Exam, Module, Course)
        .join(Module, Exam.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .order_by(Course.title, Module.order_index, Exam.created_at)
    ).all()

    items = []
    total_attempts = 0
    for exam, module, course in rows:
        finished_count = db.scalar(
            select(func.count()).select_from(ExamAttempt).where(
                ExamAttempt.exam_id == exam.id,
                ExamAttempt.finished_at.isnot(None),
            )
        ) or 0
        avg_score = db.scalar(
            select(func.avg(ExamAttempt.score)).where(
                ExamAttempt.exam_id == exam.id,
                ExamAttempt.finished_at.isnot(None),
            )
        )
        passed_count = db.scalar(
            select(func.count()).select_from(ExamAttempt).where(
                ExamAttempt.exam_id == exam.id,
                ExamAttempt.finished_at.isnot(None),
                ExamAttempt.is_passed.is_(True),
            )
        ) or 0
        total_attempts += finished_count
        items.append(
            {
                "id": str(exam.id),
                "title": exam.title,
                "course_id": str(course.id),
                "course_title": course.title,
                "module_id": str(module.id),
                "module_title": module.title,
                "time_limit_min": exam.time_limit_min,
                "passing_score": exam.passing_score,
                "question_count": exam.question_count,
                "max_attempts": exam.max_attempts,
                "attempt_count": finished_count,
                "average_score": round(float(avg_score or 0), 2),
                "pass_rate": round((passed_count / finished_count) * 100, 1) if finished_count else 0,
            }
        )

    return {
        "total": len(items),
        "stats": {"totalExams": len(items), "totalAttempts": total_attempts},
        "exams": items,
    }


@router.post(
    "/exams/{exam_id}/start",
    response_model=ExamSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Sinava Basla",
)
def start_exam(
    exam_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExamSessionResponse:
    exam_uuid = _parse_uuid(exam_id, "sinav")
    try:
        exam = db.get(Exam, exam_uuid)
        if exam is None:
            raise HTTPException(status_code=404, detail=f"'{exam_id}' ID'li sinav bulunamadi.")
        _require_student_exam_access(db, exam, current_user)

        finished_attempt_count = _finished_attempt_count(db, exam, current_user)
        open_attempt = db.scalar(
            select(ExamAttempt)
            .where(
                ExamAttempt.user_id == current_user.id,
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
                    status_code=400,
                    detail=f"Bu sinav icin maksimum deneme hakki ({exam.max_attempts}) doldu.",
                )
            now = datetime.now()
            attempt = ExamAttempt(
                id=uuid4(),
                user_id=current_user.id,
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
        if not questions:
            raise HTTPException(status_code=404, detail="Bu sinav icin soru bulunamadi.")
        if exam.shuffle:
            random.shuffle(questions)

        db.commit()
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Sinav baslatilamadi.") from exc

    safe_questions = [_safe_question(question) for question in questions]
    attempts_used = max(attempt.attempt_no, finished_attempt_count)
    return ExamSessionResponse(
        attempt_id=str(attempt.id),
        exam_id=str(exam.id),
        exam_title=exam.title,
        attempt_no=attempt.attempt_no,
        time_limit_min=exam.time_limit_min,
        duration_minutes=exam.time_limit_min,
        total_questions=len(safe_questions),
        total_points=round(sum(_question_points(question) for question in questions), 4),
        passing_score=float(exam.passing_score),
        max_attempts=exam.max_attempts,
        attempts_used=attempts_used,
        remaining_attempts=max(exam.max_attempts - attempts_used, 0),
        questions=safe_questions,
        started_at=_now_iso(attempt.started_at),
    )


@router.post(
    "/exams/{exam_id}/submit",
    response_model=ExamSubmitResponse,
    status_code=status.HTTP_200_OK,
    summary="Sinavi Gonder ve Puanla",
)
def submit_exam(
    exam_id: str = Path(...),
    body: ExamSubmitRequest = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExamSubmitResponse:
    exam_uuid = _parse_uuid(exam_id, "sinav")
    try:
        exam = db.get(Exam, exam_uuid)
        if exam is None:
            raise HTTPException(status_code=404, detail=f"'{exam_id}' ID'li sinav bulunamadi.")
        _require_student_exam_access(db, exam, current_user)

        attempt_stmt = select(ExamAttempt).where(
            ExamAttempt.user_id == current_user.id,
            ExamAttempt.exam_id == exam.id,
            ExamAttempt.finished_at.is_(None),
        )
        if body.attempt_id:
            attempt_uuid = _parse_uuid(body.attempt_id, "deneme")
            attempt_stmt = attempt_stmt.where(ExamAttempt.id == attempt_uuid)
        attempt = db.scalar(attempt_stmt.order_by(ExamAttempt.started_at.desc(), ExamAttempt.created_at.desc()))
        if attempt is None:
            raise HTTPException(
                status_code=404,
                detail="Bu sinav icin aktif deneme bulunamadi. Once sinavi baslatin.",
            )

        if exam.time_limit_min > 0:
            elapsed_seconds = (datetime.now() - attempt.started_at).total_seconds()
            allowed_seconds = exam.time_limit_min * 60 + 30
            if elapsed_seconds > allowed_seconds:
                attempt.finished_at = datetime.now()
                attempt.score = 0
                attempt.is_passed = False
                db.commit()
                raise HTTPException(
                    status_code=400,
                    detail=f"Sinav suresi doldu ({exam.time_limit_min} dakika). Cevaplar kabul edilmedi.",
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

        db.execute(delete(UserAnswer).where(UserAnswer.attempt_id == attempt.id))

        per_question_results: list[AnswerResult] = []
        total_earned = 0.0
        total_max_points = 0.0
        correct_count = 0
        wrong_count = 0
        partial_count = 0
        blank_count = 0

        for question in questions:
            selected = _normalize_selected(answer_map.get(str(question.id), []))
            earned, max_points, is_correct, is_partial = _score_question(question, selected)
            total_max_points += max_points

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
                _answer_result(question, selected, earned, max_points, is_correct, is_partial)
            )

        score = round((total_earned / total_max_points) * 100, 2) if total_max_points else 0.0
        is_passed = score >= exam.passing_score
        now = datetime.now()
        attempt.finished_at = now
        attempt.score = score
        attempt.is_passed = is_passed
        db.commit()

        # 2.4: Sinav gecilince kurs tamamlanma kontrol et
        if is_passed:
            try:
                _module, _course = _exam_context(db, exam)
                check_course_completion(db, current_user.id, _course.id)
            except Exception:
                pass  # Sertifika hatasi sinav gonderimi etkilememeli
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Sinav cevaplari kaydedilemedi.") from exc

    breakdown = ScoreBreakdown(
        correct_count=correct_count,
        partial_count=partial_count,
        wrong_count=wrong_count,
        blank_count=blank_count,
        total_questions=len(questions),
        earned_points=round(total_earned, 4),
        max_points=round(total_max_points, 4),
        percentage_score=score,
        passed=is_passed,
    )
    attempts_used = _finished_attempt_count(db, exam, current_user)
    return ExamSubmitResponse(
        exam_id=str(exam.id),
        exam_title=exam.title,
        attempt_id=str(attempt.id),
        score=score,
        is_passed=is_passed,
        passing_score=float(exam.passing_score),
        attempt_no=attempt.attempt_no,
        best_score=_best_score(db, exam, current_user),
        attempts_used=attempts_used,
        max_attempts=exam.max_attempts,
        remaining_attempts=max(exam.max_attempts - attempts_used, 0),
        correct_count=correct_count,
        wrong_count=wrong_count,
        breakdown=breakdown.model_dump(mode="json"),
        score_breakdown=breakdown,
        per_question_results=per_question_results,
        grade_label=_grade_label(score),
        certificate_eligible=is_passed,
        certificate_number=None,
        submitted_at=_now_iso(now),
    )


@router.get(
    "/exams/{exam_id}/result",
    response_model=ExamResultResponse,
    summary="Sinav Sonucunu Getir",
)
def get_result(
    exam_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExamResultResponse:
    exam_uuid = _parse_uuid(exam_id, "sinav")
    try:
        exam = db.get(Exam, exam_uuid)
        if exam is None:
            raise HTTPException(status_code=404, detail=f"'{exam_id}' ID'li sinav bulunamadi.")
        _require_student_exam_access(db, exam, current_user)

        attempt = db.scalar(
            select(ExamAttempt)
            .where(
                ExamAttempt.user_id == current_user.id,
                ExamAttempt.exam_id == exam.id,
                ExamAttempt.finished_at.isnot(None),
            )
            .order_by(ExamAttempt.attempt_no.desc(), ExamAttempt.started_at.desc())
        )
        if attempt is None:
            raise HTTPException(status_code=404, detail=f"'{exam_id}' icin tamamlanmis sinav bulunamadi.")

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
        raise HTTPException(status_code=500, detail="Sinav sonucu veritabanindan okunamadi.") from exc

    answer_by_question_id = {answer.question_id: answer for answer, _ in answer_rows}
    answer_details: list[AnswerResult] = []
    correct_count = 0
    wrong_count = 0
    blank_count = 0

    for question in questions:
        answer = answer_by_question_id.get(question.id)
        selected = _normalize_selected(answer.selected_options if answer else [])
        earned = float(answer.earned_point or 0) if answer else 0.0
        max_points = _question_points(question)
        is_correct = bool(answer.is_correct) if answer else False
        is_partial = 0 < earned < max_points
        if not selected:
            blank_count += 1
        elif is_correct:
            correct_count += 1
        else:
            wrong_count += 1
        answer_details.append(_answer_result(question, selected, earned, max_points, is_correct, is_partial))

    certificate_number = None
    _, course = _exam_context(db, exam)
    cert = db.scalar(
        select(Certificate).where(
            Certificate.user_id == current_user.id,
            Certificate.course_id == course.id,
        )
    )
    certificate_number = cert.certificate_number if cert is not None else None

    finished_at = attempt.finished_at
    duration_taken_minutes = 0
    if finished_at is not None:
        duration_taken_minutes = max(int((finished_at - attempt.started_at).total_seconds() // 60), 0)

    score = float(attempt.score or 0)
    is_passed = bool(attempt.is_passed)
    attempts_used = _finished_attempt_count(db, exam, current_user)
    completed_at = _now_iso(finished_at or attempt.started_at)
    return ExamResultResponse(
        exam_id=str(exam.id),
        exam_title=exam.title,
        student_name=current_user.full_name,
        score=score,
        is_passed=is_passed,
        passed=is_passed,
        passing_score=float(exam.passing_score),
        best_score=_best_score(db, exam, current_user),
        attempts_used=attempts_used,
        max_attempts=exam.max_attempts,
        remaining_attempts=max(exam.max_attempts - attempts_used, 0),
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
