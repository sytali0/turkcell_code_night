"""
EduCell - Kurs & İçerik Yönetimi Router'ı
==========================================

Endpoint'ler:
  GET  /api/v1/courses                         → Filtrelenebilir kurs listesi
  POST /api/v1/courses/{course_id}/enroll      → Kursa kayıt ol
  GET  /api/v1/courses/{course_id}/curriculum  → Hiyerarşik müfredat

Endpointler gerçek PostgreSQL tablolarından beslenir.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

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
from app.models.course_orm import Course, Enrollment, Exam, Lesson, Module, Question, User

router = APIRouter(prefix="/courses", tags=["📚 Kurslar"])

# ---------------------------------------------------------------------------
# GET /api/v1/courses
# ---------------------------------------------------------------------------

@router.get(
    "/",
    response_model=CourseListResponse,
    summary="Kurs Listesi",
    description=(
        "Platformdaki tüm kursları döner. "
        "`category` ve `level` query parametreleriyle filtreleme yapılabilir."
    ),
)
def list_courses(
    category: Optional[str] = Query(
        default=None,
        description="Kurs kategorisi. Ornek: Yazilim, Veri Bilimi",
    ),
    level: Optional[CourseLevel] = Query(
        default=None,
        description="Zorluk seviyesi: beginner, intermediate, advanced",
    ),
    db: Session = Depends(get_db),
) -> CourseListResponse:
    """
    Filtrelenebilir kurs listesi döner.

    - **category**: Opsiyonel kategori filtresi
    - **level**: Opsiyonel zorluk seviyesi filtresi
    """
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kurs listesi veritabanindan okunamadi.",
        ) from exc

    courses = []
    for course, instructor_name in rows:
        duration_min = course.estimated_duration_min or 0
        courses.append(
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
                duration_hours=round(duration_min / 60, 2),
                is_free=True,
                price_tl=None,
                tags=[],
            )
        )

    return CourseListResponse(total=len(courses), courses=courses)


# ---------------------------------------------------------------------------
# POST /api/v1/courses/{course_id}/enroll
# ---------------------------------------------------------------------------

@router.post(
    "/{course_id}/enroll",
    response_model=EnrollResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Kursa Kayıt Ol",
    description="Belirtilen kursa kayıt işlemini simüle eder ve onay mesajı döner.",
)
def enroll_course(
    response: Response,
    course_id: str = Path(
        ...,
        examples=["aad553fa-4455-4f1c-8002-91c66644f7a5"],
        description="Kayıt olunacak kursun ID'si",
    ),
    db: Session = Depends(get_db),
) -> EnrollResponse:
    """
    Test öğrencisini gerçek veritabanındaki kursa kaydeder.

    - Kurs bulunamadığında **404** döner.
    - Öğrenci zaten kayıtlıysa yeni kayıt açmadan bilgi mesajı döner.
    """
    try:
        course_uuid = UUID(course_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"'{course_id}' ID'li kurs bulunamadı.",
        ) from exc

    try:
        course = db.get(Course, course_uuid)
        if course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"'{course_id}' ID'li kurs bulunamadı.",
            )

        student = db.scalar(select(User).where(User.email == "ogrenci@educell.com"))
        if student is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="'ogrenci@educell.com' e-postalı öğrenci bulunamadı.",
            )

        existing = db.scalar(
            select(Enrollment).where(
                Enrollment.user_id == student.id,
                Enrollment.course_id == course.id,
            )
        )
        if existing is not None:
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
                user_id=student.id,
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kursa kayıt işlemi veritabanında tamamlanamadı.",
        ) from exc

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
    description=(
        "Seçilen kursun tam hiyerarşik yapısını döner: "
        "**Kurs → Modüller → Dersler / Sınavlar → Sorular**."
    ),
)
def get_curriculum(
    course_id: str = Path(
        ...,
        examples=["aad553fa-4455-4f1c-8002-91c66644f7a5"],
        description="Müfredatı getirilecek kursun ID'si",
    ),
    db: Session = Depends(get_db),
) -> CourseCurriculumResponse:
    """
    Kurs müfredatı (hiyerarşik).

    Yanıt yapısı:
    ```
    Course
     └── modules[]
          ├── lessons[]
          └── exams[]
              └── questions[]
    ```

    - Kurs bulunamadığında **404** döner.
    """
    try:
        course_uuid = UUID(course_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"'{course_id}' ID'li kurs bulunamadı.",
        ) from exc

    try:
        course_row = db.execute(
            select(Course, User.full_name.label("instructor_name"))
            .join(User, Course.instructor_id == User.id)
            .where(Course.id == course_uuid)
        ).one_or_none()

        if course_row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"'{course_id}' ID'li kurs bulunamadı.",
            )

        course, instructor_name = course_row
        modules = db.scalars(
            select(Module)
            .where(Module.course_id == course.id)
            .order_by(Module.order_index)
        ).all()

        module_items = []
        total_lessons = 0

        for module in modules:
            lessons = db.scalars(
                select(Lesson)
                .where(Lesson.module_id == module.id)
                .order_by(Lesson.order_index)
            ).all()
            exams = db.scalars(
                select(Exam)
                .where(Exam.module_id == module.id)
                .order_by(Exam.created_at)
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
                    select(Question)
                    .where(Question.exam_id == exam.id)
                    .order_by(Question.order_index)
                ).all()
                question_items = [
                    QuestionResponse(
                        id=str(question.id),
                        type=question.type,
                        question_type=question.type,
                        text=question.text,
                        options=question.options or [],
                        order=question.order_index,
                    )
                    for question in questions
                ]
                exam_items.append(
                    ExamResponse(
                        id=str(exam.id),
                        title=exam.title,
                        description=exam.description or "",
                        time_limit_min=exam.time_limit_min,
                        passing_score=exam.passing_score,
                        question_count=len(question_items),
                        shuffle=exam.shuffle,
                        max_attempts=exam.max_attempts,
                        questions=question_items,
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
                    total_duration=sum(lesson.estimated_duration_min or 0 for lesson in lessons),
                    lessons=lesson_items,
                    exams=exam_items,
                )
            )

    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kurs müfredatı veritabanından okunamadı.",
        ) from exc

    duration_min = course.estimated_duration_min or sum(
        module.total_duration for module in module_items
    )
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
