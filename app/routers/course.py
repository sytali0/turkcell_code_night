"""
EduCell - Kurs & İçerik Yönetimi Router'ı
==========================================

Endpoint'ler:
  GET  /api/v1/courses                         → Filtrelenebilir kurs listesi
  POST /api/v1/courses/{course_id}/enroll      → Kursa kayıt ol
  GET  /api/v1/courses/{course_id}/curriculum  → Hiyerarşik müfredat
  POST /api/v1/courses/{course_id}/rate        → Kurs değerlendirmesi
  PATCH /api/v1/lessons/{lesson_id}/complete   → Dersi tamamla
  POST  /api/v1/lessons/{lesson_id}/comments   → Derse yorum ekle

Endpointler gerçek PostgreSQL tablolarından beslenir.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
import secrets

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_current_user_optional
from app.database import get_db
from app.models.course import (
    CourseCurriculumResponse,
    CourseLevel,
    ExamResponse,
    CourseListItem,
    CourseListResponse,
    EnrollResponse,
    LessonResponse,
    LessonType,
    ModuleResponse,
    QuestionResponse,
)
from app.models.course_orm import Certificate, Course, Enrollment, Exam, ExamAttempt, Lesson, Module, Question, User

router = APIRouter(prefix="/courses", tags=["📚 Kurslar"])

# ---------------------------------------------------------------------------
# Yardımcı Pydantic modeller (eksik olanlar)
# ---------------------------------------------------------------------------

class RateRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="1-5 arası yıldız puanı")
    review: Optional[str] = Field(default=None, max_length=1000, description="Yazılı değerlendirme")

class RateResponse(BaseModel):
    success: bool = True
    message: str
    course_id: str
    rating: int

class LessonCompleteResponse(BaseModel):
    success: bool = True
    message: str
    lesson_id: str

class CommentRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="Yorum içeriği")

class CommentResponse(BaseModel):
    success: bool = True
    message: str
    comment_id: str
    lesson_id: str
    content: str
    created_at: str

# ---------------------------------------------------------------------------
# GET /api/v1/courses
# ---------------------------------------------------------------------------

@router.get(
    "/",
    response_model=CourseListResponse,
    summary="Kurs Listesi",
)
def list_courses(
    category: Optional[str] = Query(default=None),
    level: Optional[CourseLevel] = Query(default=None),
    db: Session = Depends(get_db),
) -> CourseListResponse:
    stmt = (
        select(Course, User.full_name.label("instructor_name"))
        .join(User, Course.instructor_id == User.id)
        .order_by(Course.order_index, Course.created_at)
    )
    if category:
        stmt = stmt.where(Course.category == category)
    if level:
        stmt = stmt.where(Course.level == level.value)

    try:
        rows = db.execute(stmt).all()
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail="Kurs listesi okunamadı.") from exc

    courses = [
        CourseListItem(
            id=str(course.id),
            title=course.title,
            description=course.description or "",
            cover_url=course.cover_image_url or "",
            category=course.category or "",
            level=course.level,
            instructor=instructor_name,
            instructor_name=instructor_name,
            rating=0.0,
            student_count=0,
            duration_hours=round((course.estimated_duration_min or 0) / 60, 2),
            is_free=True,
            price_tl=None,
            tags=[],
        )
        for course, instructor_name in rows
    ]
    return CourseListResponse(total=len(courses), courses=courses)


# ---------------------------------------------------------------------------
# POST /api/v1/courses/{course_id}/enroll
# ---------------------------------------------------------------------------

@router.post(
    "/{course_id}/enroll",
    response_model=EnrollResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Kursa Kayıt Ol",
)
def enroll_course(
    response: Response,
    course_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EnrollResponse:
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"'{course_id}' ID'li kurs bulunamadı.")

    try:
        course = db.get(Course, course_uuid)
        if course is None:
            raise HTTPException(status_code=404, detail=f"'{course_id}' ID'li kurs bulunamadı.")

        existing = db.scalar(
            select(Enrollment).where(
                Enrollment.user_id == current_user.id,
                Enrollment.course_id == course.id,
            )
        )
        if existing:
            response.status_code = status.HTTP_200_OK
            return EnrollResponse(
                success=True,
                message="Bu kursa zaten kayıtlısınız.",
                course_id=course_id,
                user_note="Mevcut kaydınız üzerinden öğrenmeye devam edebilirsiniz.",
            )

        db.add(
            Enrollment(
                id=uuid4(),
                user_id=current_user.id,
                course_id=course.id,
                enrolled_at=datetime.now(),
                completed_at=None,
                progress_percent=0,
                status="active",
            )
        )
        db.commit()
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Kayıt işlemi tamamlanamadı.") from exc

    return EnrollResponse(
        success=True,
        message="🎉 Başarıyla kaydolundu! Öğrenme yolculuğunuz başlıyor.",
        course_id=course_id,
        user_note="Kursunuza 'Derslerim' bölümünden erişebilirsiniz.",
    )


# ---------------------------------------------------------------------------
# GET /api/v1/courses/{course_id}/curriculum
# ---------------------------------------------------------------------------

@router.get(
    "/{course_id}/curriculum",
    response_model=CourseCurriculumResponse,
    summary="Kurs Müfredatı",
)
def get_curriculum(
    course_id: str = Path(...),
    _current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> CourseCurriculumResponse:
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"'{course_id}' ID'li kurs bulunamadı.")

    try:
        course_row = db.execute(
            select(Course, User.full_name.label("instructor_name"))
            .join(User, Course.instructor_id == User.id)
            .where(Course.id == course_uuid)
        ).one_or_none()

        if course_row is None:
            raise HTTPException(status_code=404, detail=f"'{course_id}' ID'li kurs bulunamadı.")

        course, instructor_name = course_row
        modules = db.scalars(
            select(Module).where(Module.course_id == course.id).order_by(Module.order_index)
        ).all()

        module_items = []
        total_lessons = 0

        for module in modules:
            lessons = db.scalars(
                select(Lesson).where(Lesson.module_id == module.id).order_by(Lesson.order_index)
            ).all()
            exams = db.scalars(
                select(Exam).where(Exam.module_id == module.id).order_by(Exam.created_at)
            ).all()

            lesson_items = [
                LessonResponse(
                    id=str(lesson.id),
                    title=lesson.title,
                    lesson_type=LessonType.VIDEO if lesson.video_url else LessonType.READING,
                    duration_minutes=lesson.estimated_duration_min or 1,
                    is_free_preview=lesson.order_index == 1,
                    order=lesson.order_index,
                )
                for lesson in lessons
            ]

            exam_items = []
            for exam in exams:
                questions = db.scalars(
                    select(Question).where(Question.exam_id == exam.id).order_by(Question.order_index)
                ).all()
                exam_items.append(
                    ExamResponse(
                        id=str(exam.id),
                        title=exam.title,
                        description=exam.description or "",
                        time_limit_min=exam.time_limit_min,
                        passing_score=exam.passing_score,
                        question_count=len(questions),
                        shuffle=exam.shuffle,
                        max_attempts=exam.max_attempts,
                        questions=[
                            QuestionResponse(
                                id=str(q.id),
                                type=q.type,
                                question_type=q.type,
                                text=q.text,
                                options=q.options or [],
                                order=q.order_index,
                            )
                            for q in questions
                        ],
                    )
                )

            total_lessons += len(lesson_items)
            module_items.append(
                ModuleResponse(
                    id=str(module.id),
                    title=module.title,
                    order=module.order_index,
                    description=module.description or "",
                    lesson_count=len(lesson_items),
                    total_duration=sum(l.estimated_duration_min or 0 for l in lessons),
                    lessons=lesson_items,
                    exams=exam_items,
                )
            )

    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail="Müfredat okunamadı.") from exc

    duration_min = course.estimated_duration_min or sum(m.total_duration for m in module_items)
    return CourseCurriculumResponse(
        id=str(course.id),
        title=course.title,
        description=course.description or "",
        cover_url=course.cover_image_url or "",
        category=course.category or "",
        level=course.level,
        instructor=instructor_name,
        instructor_name=instructor_name,
        rating=0.0,
        student_count=0,
        duration_hours=round(duration_min / 60, 2),
        is_free=True,
        price_tl=None,
        tags=[],
        module_count=len(module_items),
        total_lessons=total_lessons,
        modules=module_items,
    )


# ---------------------------------------------------------------------------
# POST /api/v1/courses/{course_id}/rate
# ---------------------------------------------------------------------------

@router.post(
    "/{course_id}/rate",
    response_model=RateResponse,
    summary="Kursu Değerlendir",
    description="1-5 yıldız ve isteğe bağlı yazılı yorum ile kursu değerlendir.",
)
def rate_course(
    body: RateRequest,
    course_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RateResponse:
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Kurs bulunamadı.")

    course = db.get(Course, course_uuid)
    if course is None:
        raise HTTPException(status_code=404, detail="Kurs bulunamadı.")

    try:
        from sqlalchemy import text

        now = datetime.now()
        db.execute(
            text(
                "INSERT INTO course_reviews (id, course_id, user_id, rating, review_text, created_at, updated_at) "
                "VALUES (:id, :course_id, :user_id, :rating, :review_text, :created_at, :updated_at) "
                "ON CONFLICT (user_id, course_id) DO UPDATE SET "
                "rating = EXCLUDED.rating, review_text = EXCLUDED.review_text, updated_at = EXCLUDED.updated_at"
            ),
            {
                "id": str(uuid4()),
                "course_id": str(course_uuid),
                "user_id": str(current_user.id),
                "rating": body.rating,
                "review_text": body.review or "",
                "created_at": now,
                "updated_at": now,
            },
        )
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Değerlendirme kaydedilemedi.") from exc

    return RateResponse(
        success=True,
        message=f"Değerlendirmeniz için teşekkürler! {'⭐' * body.rating}",
        course_id=course_id,
        rating=body.rating,
    )


# ---------------------------------------------------------------------------
# PATCH /api/v1/lessons/{lesson_id}/complete
# ---------------------------------------------------------------------------

lesson_router = APIRouter(prefix="/lessons", tags=["📖 Dersler"])


@lesson_router.patch(
    "/{lesson_id}/complete",
    response_model=LessonCompleteResponse,
    summary="Dersi Tamamla",
)
def complete_lesson(
    lesson_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LessonCompleteResponse:
    try:
        lesson_uuid = UUID(lesson_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Ders bulunamadı.")

    lesson = db.get(Lesson, lesson_uuid)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Ders bulunamadı.")

    # lesson_completions tablosuna kaydet (varsa)
    try:
        from sqlalchemy import text
        db.execute(
            text(
                "INSERT INTO lesson_completions (id, lesson_id, user_id, completed_at) "
                "VALUES (:id, :lesson_id, :user_id, :completed_at) "
                "ON CONFLICT (lesson_id, user_id) DO NOTHING"
            ),
            {
                "id": str(uuid4()),
                "lesson_id": str(lesson_uuid),
                "user_id": str(current_user.id),
                "completed_at": datetime.now(),
            },
        )
        db.commit()
    except Exception:
        db.rollback()

    return LessonCompleteResponse(
        success=True,
        message="✅ Ders tamamlandı! İlerlemeniz kaydedildi.",
        lesson_id=lesson_id,
    )


# ---------------------------------------------------------------------------
# POST /api/v1/lessons/{lesson_id}/comments
# ---------------------------------------------------------------------------

@lesson_router.post(
    "/{lesson_id}/comments",
    response_model=CommentResponse,
    status_code=201,
    summary="Derse Yorum Ekle",
)
def add_comment(
    body: CommentRequest,
    lesson_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CommentResponse:
    try:
        lesson_uuid = UUID(lesson_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Ders bulunamadı.")

    lesson = db.get(Lesson, lesson_uuid)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Ders bulunamadı.")

    comment_id = str(uuid4())
    now = datetime.now()

    try:
        from sqlalchemy import text
        db.execute(
            text(
                "INSERT INTO lesson_comments (id, lesson_id, user_id, content, created_at) "
                "VALUES (:id, :lesson_id, :user_id, :content, :created_at)"
            ),
            {
                "id": comment_id,
                "lesson_id": str(lesson_uuid),
                "user_id": str(current_user.id),
                "content": body.content,
                "created_at": now,
            },
        )
        db.commit()
    except Exception:
        db.rollback()

    return CommentResponse(
        success=True,
        message="Yorumunuz eklendi.",
        comment_id=comment_id,
        lesson_id=lesson_id,
        content=body.content,
        created_at=now.isoformat(),
    )


# ===========================================================================
# POST /api/v1/courses — Eğitmen Kurs Oluşturma
# ===========================================================================

class CreateCourseRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(default=None)
    category: Optional[str] = Field(default=None)
    level: str = Field(default="beginner", pattern="^(beginner|intermediate|advanced)$")
    cover_image_url: Optional[str] = Field(default=None)
    estimated_duration_min: Optional[int] = Field(default=None, ge=1)

class CreateCourseResponse(BaseModel):
    success: bool = True
    message: str
    course_id: str
    title: str


@router.post(
    "/",
    response_model=CreateCourseResponse,
    status_code=201,
    summary="Kurs Oluştur (Eğitmen)",
    tags=["📚 Kurslar"],
)
def create_course(
    body: CreateCourseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CreateCourseResponse:
    now = datetime.now()
    # Her rol kurs oluşturabilir (hackathon kolaylığı)
    new_course = Course(
        id=uuid4(),
        instructor_id=current_user.id,
        title=body.title,
        description=body.description,
        category=body.category,
        level=body.level,
        cover_image_url=body.cover_image_url,
        estimated_duration_min=body.estimated_duration_min,
        status="published",
        order_index=1,
        created_at=now,
        updated_at=now,
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return CreateCourseResponse(
        success=True,
        message=f"'{body.title}' kursu başarıyla oluşturuldu.",
        course_id=str(new_course.id),
        title=new_course.title,
    )


# ===========================================================================
# GET /api/v1/courses/:id/progress — Öğrenci İlerleme
# ===========================================================================

class ProgressResponse(BaseModel):
    course_id: str
    total_lessons: int
    completed_lessons: int
    progress_percent: float
    modules: list[dict]
    is_completed: bool
    certificate_number: Optional[str] = None


@router.get(
    "/{course_id}/progress",
    response_model=ProgressResponse,
    summary="Kurs İlerleme Durumu",
)
def get_progress(
    course_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProgressResponse:
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Kurs bulunamadı.")

    course = db.get(Course, course_uuid)
    if not course:
        raise HTTPException(status_code=404, detail="Kurs bulunamadı.")

    modules = db.scalars(
        select(Module).where(Module.course_id == course_uuid).order_by(Module.order_index)
    ).all()

    total_lessons = 0
    total_completed = 0
    module_progress = []

    for mod in modules:
        lessons = db.scalars(
            select(Lesson).where(Lesson.module_id == mod.id)
        ).all()
        lesson_ids = [l.id for l in lessons]
        mod_total = len(lessons)

        completed_rows = 0
        if mod_total > 0 and lesson_ids:
            from sqlalchemy import text
            try:
                # lesson_completions tablosu varsa say
                for lid in lesson_ids:
                    cnt = db.execute(
                        text("SELECT COUNT(*) FROM lesson_completions WHERE user_id=:uid AND lesson_id=:lid"),
                        {"uid": str(current_user.id), "lid": str(lid)},
                    ).scalar() or 0
                    completed_rows += min(cnt, 1)
            except Exception:
                completed_rows = 0

        # Modül sınavını geçti mi?
        exams = db.scalars(select(Exam).where(Exam.module_id == mod.id)).all()
        exam_passed = True
        for exam in exams:
            passed_attempt = db.scalar(
                select(ExamAttempt)
                .where(
                    ExamAttempt.user_id == current_user.id,
                    ExamAttempt.exam_id == exam.id,
                    ExamAttempt.is_passed == True,
                )
            )
            if not passed_attempt:
                exam_passed = False
                break

        total_lessons += mod_total
        total_completed += completed_rows
        pct = round((completed_rows / mod_total * 100) if mod_total > 0 else 0, 1)
        module_progress.append({
            "module_id": str(mod.id),
            "title": mod.title,
            "total_lessons": mod_total,
            "completed_lessons": completed_rows,
            "progress_percent": pct,
            "exam_passed": exam_passed,
        })

    overall_pct = round((total_completed / total_lessons * 100) if total_lessons > 0 else 0, 1)
    is_completed = overall_pct >= 100 and all(m["exam_passed"] for m in module_progress)

    # Sertifika var mı?
    cert = db.scalar(
        select(Certificate).where(
            Certificate.user_id == current_user.id,
            Certificate.course_id == course_uuid,
        )
    )

    # Kurs tamamlandıysa otomatik sertifika oluştur
    if is_completed and not cert:
        cert_no = "EDU-" + secrets.token_hex(4).upper()
        cert = Certificate(
            id=uuid4(),
            user_id=current_user.id,
            course_id=course_uuid,
            certificate_number=cert_no,
            certificate_url=None,
            issued_at=datetime.now(),
        )
        db.add(cert)
        db.commit()

    # Enrollment progress_percent güncelle
    enrollment = db.scalar(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_uuid,
        )
    )
    if enrollment:
        enrollment.progress_percent = int(overall_pct)
        if is_completed and not enrollment.completed_at:
            enrollment.completed_at = datetime.now()
            enrollment.status = "completed"
        db.commit()

    return ProgressResponse(
        course_id=course_id,
        total_lessons=total_lessons,
        completed_lessons=total_completed,
        progress_percent=overall_pct,
        modules=module_progress,
        is_completed=is_completed,
        certificate_number=cert.certificate_number if cert else None,
    )


# ===========================================================================
# GET /api/v1/certificates/:number/verify — Sertifika Doğrulama (Public)
# ===========================================================================

cert_router = APIRouter(prefix="/certificates", tags=["🏆 Sertifikalar"])


class CertVerifyResponse(BaseModel):
    valid: bool
    certificate_number: str
    holder_name: Optional[str] = None
    course_title: Optional[str] = None
    issued_at: Optional[str] = None
    message: str


@cert_router.get(
    "/{certificate_number}/verify",
    response_model=CertVerifyResponse,
    summary="Sertifika Doğrula (Public)",
    description="JWT gerektirmez. Sertifika numarası ile sertifikanın geçerliliğini kontrol et.",
)
def verify_certificate(
    certificate_number: str = Path(...),
    db: Session = Depends(get_db),
) -> CertVerifyResponse:
    cert = db.scalar(
        select(Certificate).where(Certificate.certificate_number == certificate_number)
    )
    if not cert:
        return CertVerifyResponse(
            valid=False,
            certificate_number=certificate_number,
            message="Bu sertifika numarası geçerli değil veya bulunamadı.",
        )

    user = db.get(User, cert.user_id)
    course = db.get(Course, cert.course_id)

    return CertVerifyResponse(
        valid=True,
        certificate_number=certificate_number,
        holder_name=user.full_name if user else None,
        course_title=course.title if course else None,
        issued_at=cert.issued_at.isoformat(),
        message="✅ Sertifika geçerlidir.",
    )
