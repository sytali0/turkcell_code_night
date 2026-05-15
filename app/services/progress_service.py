"""
EduCell - 2.4 İlerleme & Sertifika Servisi
============================================

check_course_completion(db, user_id, course_id)
    → Kursun tamamlanıp tamamlanmadığını kontrol eder.
    → Tüm dersler tamamlandıysa ve gerekli sınavlar geçildiyse
      otomatik sertifika oluşturur.
    → Mevcut sertifika varsa tekrar oluşturmaz.
    → Her iki endpoint'ten çağrılabilir:
       - PATCH /lessons/{id}/complete  (ders tamamlama)
       - POST  /exams/{id}/submit      (sınav gönderme)
"""

import secrets
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models.course_orm import (
    Certificate,
    Enrollment,
    Exam,
    ExamAttempt,
    Lesson,
    Module,
)


# ---------------------------------------------------------------------------
# Yardımcı
# ---------------------------------------------------------------------------


def _generate_cert_number() -> str:
    """
    EDUCELL-YYYY-XXXXXX formatında benzersiz sertifika numarası üretir.
    Örnek: EDUCELL-2026-A8F42C
    """
    year = datetime.now().year
    suffix = secrets.token_hex(3).upper()  # 3 byte → 6 hex karakter
    return f"EDUCELL-{year}-{suffix}"


# ---------------------------------------------------------------------------
# Ana Fonksiyon
# ---------------------------------------------------------------------------


def check_course_completion(
    db: Session,
    user_id: UUID,
    course_id: UUID,
) -> "Certificate | None":
    """
    Kursun tamamlanıp tamamlanmadığını kontrol eder.

    Kontrol kriterleri:
    1. Kurstaki tüm dersler tamamlanmış olmalı  (lesson_completions tablosu)
    2. Her modülün sınavı varsa geçilmiş olmalı  (exam_attempts.is_passed = True)

    Sonuç:
    - Zaten sertifika varsa → mevcut sertifika döner (tekrar oluşturmaz)
    - Kurs tamamlandıysa   → yeni sertifika oluşturur ve döner
    - Kurs tamamlanmadıysa → None döner

    NOT: Bu fonksiyon kendi commit()'ini yapar.
         Ders tamamlama / sınav submit'ten SONRA, ayrı try-except içinde çağrılmalı.
    """
    # 1. Mevcut sertifika kontrolü — duplicate önleme
    existing_cert = db.scalar(
        select(Certificate).where(
            Certificate.user_id == user_id,
            Certificate.course_id == course_id,
        )
    )
    if existing_cert:
        return existing_cert

    # 2. Modülleri getir
    modules = list(
        db.scalars(
            select(Module)
            .where(Module.course_id == course_id)
            .order_by(Module.order_index)
        ).all()
    )
    if not modules:
        return None

    total_lessons = 0
    total_completed = 0
    all_exams_passed = True

    for mod in modules:
        # 2a. Ders tamamlama kontrolü
        lessons = list(db.scalars(select(Lesson).where(Lesson.module_id == mod.id)).all())
        mod_total = len(lessons)
        total_lessons += mod_total

        for lesson in lessons:
            cnt = db.execute(
                text(
                    "SELECT COUNT(*) FROM lesson_completions "
                    "WHERE user_id = :uid AND lesson_id = :lid"
                ),
                {"uid": str(user_id), "lid": str(lesson.id)},
            ).scalar() or 0
            total_completed += min(int(cnt), 1)

        # 2b. Modül sınavı geçme kontrolü
        exams = list(db.scalars(select(Exam).where(Exam.module_id == mod.id)).all())
        for exam in exams:
            passed = db.scalar(
                select(ExamAttempt.id).where(
                    ExamAttempt.user_id == user_id,
                    ExamAttempt.exam_id == exam.id,
                    ExamAttempt.finished_at.isnot(None),
                    ExamAttempt.is_passed.is_(True),
                ).limit(1)
            )
            if passed is None:
                all_exams_passed = False
                break

        if not all_exams_passed:
            break

    # 3. Tamamlama değerlendirmesi
    if total_lessons == 0:
        return None

    all_lessons_done = total_completed >= total_lessons
    is_completed = all_lessons_done and all_exams_passed

    if not is_completed:
        return None

    # 4. Sertifika oluştur
    cert_number = _generate_cert_number()
    cert = Certificate(
        id=uuid4(),
        user_id=user_id,
        course_id=course_id,
        certificate_number=cert_number,
        certificate_url=None,
        issued_at=datetime.now(),
    )
    db.add(cert)

    # 5. Enrollment güncelle
    enrollment = db.scalar(
        select(Enrollment).where(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id,
        )
    )
    if enrollment:
        enrollment.progress_percent = 100
        if not enrollment.completed_at:
            enrollment.completed_at = datetime.now()
        enrollment.status = "completed"

    db.commit()
    return cert
