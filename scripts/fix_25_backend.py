"""
2.5 Etkileşim — course.py backend patch script.

Yapılan değişiklikler:
1. course.py import satırına LessonComment, CourseReview ekleme
2. _course_to_item'e gerçek avg_rating hesaplama
3. POST /lessons/{id}/comments'a enrollment kontrolü
4. Yeni endpoint'ler ekleme:
   - GET  /lessons/{id}/comments
   - POST /comments/{id}/reply
   - DELETE /comments/{id}
   - GET  /courses/{id}/rating-summary
   - GET  /courses/{id}/reviews
   - GET  /courses/{id}/reviews/my
   - GET  /instructor/courses/{id}/comments (admin/instructor)
"""

path = "app/routers/course.py"
content = open(path, "r", encoding="utf-8").read()

# ===========================================================================
# Patch 1: Import satırına LessonComment ve CourseReview ekle
# ===========================================================================
old_import = "from app.models.course_orm import Certificate, Course, Enrollment, Exam, ExamAttempt, Lesson, Module, Question, User"
new_import = "from app.models.course_orm import Certificate, Course, CourseReview, Enrollment, Exam, ExamAttempt, Lesson, LessonComment, Module, Question, User"

if old_import in content:
    content = content.replace(old_import, new_import, 1)
    print("[OK] Patch 1: imports updated")
else:
    print("[WARN] Patch 1: import line not found")

# ===========================================================================
# Patch 2: _course_to_item'e gerçek avg_rating hesaplama ekle
# Mevcut: rating=0.0
# Yeni: course_reviews tablosundan hesapla
# ===========================================================================
old_rating_line = "        rating=0.0,\n        student_count=_course_student_count(db, course.id),"
new_rating_line = (
    "        rating=_course_avg_rating(db, course.id),\n"
    "        student_count=_course_student_count(db, course.id),"
)

if old_rating_line in content:
    content = content.replace(old_rating_line, new_rating_line, 1)
    print("[OK] Patch 2a: _course_to_item rating updated")
else:
    print("[WARN] Patch 2a: rating=0.0 line not found")

# _course_avg_rating fonksiyonu ekle (_course_student_count'tan sonra)
old_student_count = """def _course_student_count(db: Session, course_id: UUID) -> int:
    return db.scalar(
        select(func.count()).select_from(Enrollment).where(Enrollment.course_id == course_id)
    ) or 0"""

new_student_count = """def _course_student_count(db: Session, course_id: UUID) -> int:
    return db.scalar(
        select(func.count()).select_from(Enrollment).where(Enrollment.course_id == course_id)
    ) or 0


def _course_avg_rating(db: Session, course_id: UUID) -> float:
    \"\"\"2.5: course_reviews tablosundan gerçek ortalama puan hesapla.\"\"\"
    from sqlalchemy import func as sqlfunc
    result = db.execute(
        select(
            sqlfunc.avg(CourseReview.rating).label("avg_rating"),
        ).where(CourseReview.course_id == course_id)
    ).one()
    avg = result.avg_rating
    return round(float(avg), 1) if avg is not None else 0.0"""

if old_student_count in content:
    content = content.replace(old_student_count, new_student_count, 1)
    print("[OK] Patch 2b: _course_avg_rating function added")
else:
    print("[WARN] Patch 2b: _course_student_count block not found")

# ===========================================================================
# Patch 3: add_comment fonksiyonuna enrollment kontrolü ekle
# Mevcut: lesson get + comment_id = str(uuid4())
# Yeni: lesson get + enrollment check + comment_id
# ===========================================================================
old_add_comment_start = (
    "    lesson = db.get(Lesson, lesson_uuid)\n"
    "    if lesson is None:\n"
    "        raise HTTPException(status_code=404, detail=\"Ders bulunamad\u0131.\")\n"
    "\n"
    "    comment_id = str(uuid4())"
)
new_add_comment_start = (
    "    lesson = db.get(Lesson, lesson_uuid)\n"
    "    if lesson is None:\n"
    "        raise HTTPException(status_code=404, detail=\"Ders bulunamad\u0131.\")\n"
    "\n"
    "    # 2.5: Student sadece kayitli oldugu kursa yorum yazabilir\n"
    "    if current_user.role == \"student\":\n"
    "        module = db.get(Module, lesson.module_id)\n"
    "        if module:\n"
    "            enrolled = db.scalar(\n"
    "                select(Enrollment).where(\n"
    "                    Enrollment.user_id == current_user.id,\n"
    "                    Enrollment.course_id == module.course_id,\n"
    "                    Enrollment.status.in_([\"active\", \"completed\"]),\n"
    "                )\n"
    "            )\n"
    "            if enrolled is None:\n"
    "                raise HTTPException(\n"
    "                    status_code=403,\n"
    "                    detail=\"Bu derse yorum yazmak i\u00e7in kursa kay\u0131tl\u0131 olmal\u0131s\u0131n\u0131z.\",\n"
    "                )\n"
    "\n"
    "    comment_id = str(uuid4())"
)

if old_add_comment_start in content:
    content = content.replace(old_add_comment_start, new_add_comment_start, 1)
    print("[OK] Patch 3: add_comment enrollment check added")
else:
    print("[WARN] Patch 3: add_comment start block not found")

# ===========================================================================
# Patch 4: POST /courses/{id}/rate'e enrollment + rol kontrolü ekle
# Mevcut: lesson var mı kontrol (basit)
# ===========================================================================
old_rate_start = (
    "    course = db.get(Course, course_uuid)\n"
    "    if course is None:\n"
    "        raise HTTPException(status_code=404, detail=\"Kurs bulunamad\u0131.\")\n"
    "\n"
    "    try:\n"
    "        from sqlalchemy import text\n"
    "\n"
    "        now = datetime.now()\n"
    "        db.execute(\n"
    "            text(\n"
    "                \"INSERT INTO course_reviews (id, course_id, user_id, rating, review_text, created_at, updated_at) \"\n"
    "                \"VALUES (:id, :course_id, :user_id, :rating, :review_text, :created_at, :updated_at) \"\n"
    "                \"ON CONFLICT (user_id, course_id) DO UPDATE SET \"\n"
    "                \"rating = EXCLUDED.rating, review_text = EXCLUDED.review_text, updated_at = EXCLUDED.updated_at\"\n"
    "            ),"
)
new_rate_start = (
    "    course = db.get(Course, course_uuid)\n"
    "    if course is None:\n"
    "        raise HTTPException(status_code=404, detail=\"Kurs bulunamad\u0131.\")\n"
    "\n"
    "    # 2.5: Sadece student puanlayabilir; kayitli olmalidir\n"
    "    _require_role(current_user, \"student\")\n"
    "    enrollment = db.scalar(\n"
    "        select(Enrollment).where(\n"
    "            Enrollment.user_id == current_user.id,\n"
    "            Enrollment.course_id == course_uuid,\n"
    "            Enrollment.status.in_([\"active\", \"completed\"]),\n"
    "        )\n"
    "    )\n"
    "    if enrollment is None:\n"
    "        raise HTTPException(\n"
    "            status_code=403,\n"
    "            detail=\"Bu kursu de\u011flendirmek i\u00e7in kay\u0131tl\u0131 olmal\u0131s\u0131n\u0131z.\",\n"
    "        )\n"
    "\n"
    "    try:\n"
    "        from sqlalchemy import text\n"
    "\n"
    "        now = datetime.now()\n"
    "        db.execute(\n"
    "            text(\n"
    "                \"INSERT INTO course_reviews (id, course_id, user_id, rating, review_text, created_at, updated_at) \"\n"
    "                \"VALUES (:id, :course_id, :user_id, :rating, :review_text, :created_at, :updated_at) \"\n"
    "                \"ON CONFLICT (user_id, course_id) DO UPDATE SET \"\n"
    "                \"rating = EXCLUDED.rating, review_text = EXCLUDED.review_text, updated_at = EXCLUDED.updated_at\"\n"
    "            ),"
)

if old_rate_start in content:
    content = content.replace(old_rate_start, new_rate_start, 1)
    print("[OK] Patch 4: rate_course enrollment check added")
else:
    print("[WARN] Patch 4: rate_course block not found")

# ===========================================================================
# Patch 5: course.py dosyasının sonuna yeni endpoint'ler ekle
# ===========================================================================
NEW_ENDPOINTS = '''

# ===========================================================================
# 2.5 ETKİLEŞİM — Yeni Endpoint'ler
# ===========================================================================

# ---------------------------------------------------------------------------
# GET /api/v1/lessons/{lesson_id}/comments  — Yorum Listesi
# parent_comment_id NULL → ana yorum; dolu → cevap
# ---------------------------------------------------------------------------

@lesson_router.get(
    "/{lesson_id}/comments",
    summary="Ders Yorumlarını Listele (2.5)",
    tags=["💬 Yorumlar"],
)
def list_comments(
    lesson_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    try:
        lesson_uuid = UUID(lesson_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Ders bulunamadı.")

    # Ana yorumları çek (parent_comment_id IS NULL)
    comments = db.scalars(
        select(LessonComment)
        .where(
            LessonComment.lesson_id == lesson_uuid,
            LessonComment.parent_comment_id.is_(None),
        )
        .order_by(LessonComment.created_at.asc())
    ).all()

    result = []
    for comment in comments:
        author = db.get(User, comment.user_id)
        # Cevapları çek
        replies = db.scalars(
            select(LessonComment)
            .where(LessonComment.parent_comment_id == comment.id)
            .order_by(LessonComment.created_at.asc())
        ).all()

        reply_list = []
        for reply in replies:
            reply_author = db.get(User, reply.user_id)
            reply_list.append({
                "id": str(reply.id),
                "content": reply.content,
                "authorName": reply_author.full_name if reply_author else "Kullanıcı",
                "authorRole": reply_author.role if reply_author else "student",
                "isInstructorReply": (reply_author.role == "instructor") if reply_author else False,
                "createdAt": reply.created_at.isoformat(),
            })

        result.append({
            "id": str(comment.id),
            "content": comment.content,
            "authorId": str(comment.user_id),
            "authorName": author.full_name if author else "Kullanıcı",
            "authorRole": author.role if author else "student",
            "isOwn": str(comment.user_id) == str(current_user.id),
            "createdAt": comment.created_at.isoformat(),
            "replies": reply_list,
        })

    return result


# ---------------------------------------------------------------------------
# POST /api/v1/comments/{comment_id}/reply  — Eğitmen Cevabı (2.5)
# Sadece instructor kendi kursundaki yorumlara cevap verebilir
# ---------------------------------------------------------------------------

@lesson_router.post(
    "/{comment_id}/reply",  # /lessons/{comment_id}/reply olarak tanımlı olacak
    status_code=201,
    summary="Yoruma Cevap Ver — Eğitmen (2.5)",
    tags=["💬 Yorumlar"],
    include_in_schema=False,  # ayrı router'da expose edilecek
)
def _placeholder_reply():
    pass  # aşağıda comment_router tanımlanıyor


# ---------------------------------------------------------------------------
# comment_router — /comments prefix'i
# ---------------------------------------------------------------------------

comment_router = APIRouter(prefix="/comments", tags=["💬 Yorumlar"])


@comment_router.post(
    "/{comment_id}/reply",
    status_code=201,
    summary="Yoruma Cevap Ver — Eğitmen (2.5)",
)
def reply_comment(
    body: "CommentRequest",
    comment_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    _require_role(current_user, "instructor", "admin")

    try:
        comment_uuid = UUID(comment_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı.")

    parent = db.get(LessonComment, comment_uuid)
    if parent is None or parent.parent_comment_id is not None:
        raise HTTPException(status_code=404, detail="Ana yorum bulunamadı.")

    # Instructor kendi kursundaki yorumlara cevap verebilir
    if current_user.role == "instructor":
        lesson = db.get(Lesson, parent.lesson_id)
        if lesson:
            module = db.get(Module, lesson.module_id)
            if module:
                course = db.get(Course, module.course_id)
                if course and course.instructor_id != current_user.id:
                    raise HTTPException(
                        status_code=403,
                        detail="Sadece kendi kursunuzdaki yorumlara cevap verebilirsiniz.",
                    )

    now = datetime.now()
    reply = LessonComment(
        id=uuid4(),
        lesson_id=parent.lesson_id,
        user_id=current_user.id,
        parent_comment_id=parent.id,
        content=body.content,
        created_at=now,
        updated_at=now,
    )
    db.add(reply)
    db.commit()

    return {
        "success": True,
        "id": str(reply.id),
        "content": reply.content,
        "authorName": current_user.full_name,
        "authorRole": current_user.role,
        "isInstructorReply": current_user.role == "instructor",
        "createdAt": now.isoformat(),
    }


@comment_router.delete(
    "/{comment_id}",
    status_code=200,
    summary="Yorum Sil (2.5)",
)
def delete_comment(
    comment_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    try:
        comment_uuid = UUID(comment_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı.")

    comment = db.get(LessonComment, comment_uuid)
    if comment is None:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı.")

    # Kendi yorumu, eğitmen (kendi kursu) veya admin silebilir
    if current_user.role == "student" and comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu yorumu silemezsiniz.")
    if current_user.role == "instructor":
        if comment.user_id != current_user.id:
            # Kendi kursundaki yorum mu?
            lesson = db.get(Lesson, comment.lesson_id)
            if lesson:
                module = db.get(Module, lesson.module_id)
                if module:
                    course = db.get(Course, module.course_id)
                    if course and course.instructor_id != current_user.id:
                        raise HTTPException(status_code=403, detail="Bu yorumu silemezsiniz.")

    # Cevapları da sil (CASCADE olmasına rağmen explicit)
    replies = db.scalars(
        select(LessonComment).where(LessonComment.parent_comment_id == comment_uuid)
    ).all()
    for r in replies:
        db.delete(r)
    db.delete(comment)
    db.commit()
    return {"success": True, "message": "Yorum silindi."}


# ---------------------------------------------------------------------------
# review_router — /courses prefix altına eklenecek (router içinde)
# ---------------------------------------------------------------------------

@router.get(
    "/{course_id}/rating-summary",
    summary="Kurs Rating Özeti (2.5)",
)
def course_rating_summary(
    course_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Kurs bulunamadı.")

    from sqlalchemy import func as sqlfunc
    row = db.execute(
        select(
            sqlfunc.avg(CourseReview.rating).label("avg_rating"),
            sqlfunc.count(CourseReview.id).label("review_count"),
        ).where(CourseReview.course_id == course_uuid)
    ).one()

    return {
        "avgRating": round(float(row.avg_rating), 1) if row.avg_rating else 0.0,
        "reviewCount": row.review_count or 0,
    }


@router.get(
    "/{course_id}/reviews",
    summary="Kurs Değerlendirme Listesi (2.5)",
)
def list_reviews(
    course_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Kurs bulunamadı.")

    rows = db.execute(
        select(CourseReview, User)
        .join(User, CourseReview.user_id == User.id)
        .where(CourseReview.course_id == course_uuid)
        .order_by(CourseReview.created_at.desc())
    ).all()

    return [
        {
            "id": str(review.id),
            "rating": review.rating,
            "reviewText": review.review_text or "",
            "authorName": user.full_name,
            "isOwn": str(review.user_id) == str(current_user.id),
            "createdAt": review.created_at.isoformat(),
        }
        for review, user in rows
    ]


@router.get(
    "/{course_id}/reviews/my",
    summary="Benim Değerlendirmem (2.5)",
)
def my_review(
    course_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Kurs bulunamadı.")

    review = db.scalar(
        select(CourseReview).where(
            CourseReview.course_id == course_uuid,
            CourseReview.user_id == current_user.id,
        )
    )
    if review is None:
        return {"exists": False}

    return {
        "exists": True,
        "id": str(review.id),
        "rating": review.rating,
        "reviewText": review.review_text or "",
        "createdAt": review.created_at.isoformat(),
    }


# ---------------------------------------------------------------------------
# GET /instructor/courses/{course_id}/comments — Eğitmen Kurs Yorumları (2.5)
# ---------------------------------------------------------------------------

@content_router.get("/instructor/courses/{course_id}/comments")
def instructor_course_comments(
    course_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    _require_role(current_user, "instructor", "admin")
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Kurs bulunamadı.")

    course = db.get(Course, course_uuid)
    if course is None:
        raise HTTPException(status_code=404, detail="Kurs bulunamadı.")
    if current_user.role == "instructor":
        _require_owner_or_admin(course, current_user)

    # Kursun tüm derslerini bul
    modules = db.scalars(select(Module).where(Module.course_id == course_uuid)).all()
    lesson_ids = []
    for mod in modules:
        lessons = db.scalars(select(Lesson).where(Lesson.module_id == mod.id)).all()
        lesson_ids.extend([l.id for l in lessons])

    if not lesson_ids:
        return {"total": 0, "comments": []}

    # Ana yorumları çek
    comments = db.scalars(
        select(LessonComment)
        .where(
            LessonComment.lesson_id.in_(lesson_ids),
            LessonComment.parent_comment_id.is_(None),
        )
        .order_by(LessonComment.created_at.desc())
    ).all()

    result = []
    for comment in comments:
        author = db.get(User, comment.user_id)
        lesson = db.get(Lesson, comment.lesson_id)
        replies = db.scalars(
            select(LessonComment)
            .where(LessonComment.parent_comment_id == comment.id)
            .order_by(LessonComment.created_at.asc())
        ).all()

        reply_list = []
        for reply in replies:
            reply_author = db.get(User, reply.user_id)
            reply_list.append({
                "id": str(reply.id),
                "content": reply.content,
                "authorName": reply_author.full_name if reply_author else "Kullanıcı",
                "authorRole": reply_author.role if reply_author else "student",
                "isInstructorReply": (reply_author.role == "instructor") if reply_author else False,
                "createdAt": reply.created_at.isoformat(),
            })

        result.append({
            "id": str(comment.id),
            "content": comment.content,
            "authorName": author.full_name if author else "Kullanıcı",
            "authorRole": author.role if author else "student",
            "lessonTitle": lesson.title if lesson else "?",
            "createdAt": comment.created_at.isoformat(),
            "replies": reply_list,
        })

    return {"total": len(result), "comments": result}
'''

# Dosyanın sonuna ekle
if "# 2.5 ETKİLEŞİM" not in content:
    content = content.rstrip() + "\n" + NEW_ENDPOINTS
    print("[OK] Patch 5: new 2.5 endpoints appended")
else:
    print("[WARN] Patch 5: already applied, skipping")

open(path, "w", encoding="utf-8").write(content)
print("Done. Syntax check...")

import ast
try:
    ast.parse(content)
    print("[OK] Syntax OK")
except SyntaxError as e:
    print(f"[ERROR] Syntax error: {e}")
