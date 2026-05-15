"""
2.4 - exam.py patch script:
  submit_exam endpoint'inde sinav gecilince check_course_completion cagir.
"""

path = "app/routers/exam.py"
content = open(path, "r", encoding="utf-8").read()

# Import ekle (eger yoksa)
old_imports_end = "from app.models.course_orm import (\n    Certificate,\n    Course,\n    Enrollment,\n    Exam,\n    ExamAttempt,\n    Module,\n    Question,\n    User,\n    UserAnswer,\n)"

new_imports_end = (
    "from app.models.course_orm import (\n"
    "    Certificate,\n"
    "    Course,\n"
    "    Enrollment,\n"
    "    Exam,\n"
    "    ExamAttempt,\n"
    "    Module,\n"
    "    Question,\n"
    "    User,\n"
    "    UserAnswer,\n"
    ")\n"
    "from app.services.progress_service import check_course_completion"
)

if "from app.services.progress_service" not in content:
    if old_imports_end in content:
        content = content.replace(old_imports_end, new_imports_end, 1)
        print("[OK] Import eklendi.")
    else:
        print("[WARN] Import blogu bulunamadi, atlanıyor.")
else:
    print("[OK] Import zaten mevcut.")

# submit_exam sonrasinda - db.commit() sonra kurs tamamlama kontrolü ekle
# "attempt.is_passed = is_passed\n        db.commit()" aradigimiz parca
old_submit_end = (
    "        attempt.finished_at = now\n"
    "        attempt.score = score\n"
    "        attempt.is_passed = is_passed\n"
    "        db.commit()\n"
    "    except HTTPException:\n"
    "        raise\n"
    "    except SQLAlchemyError as exc:\n"
    "        db.rollback()\n"
    "        raise HTTPException(status_code=500, detail=\"Sinav cevaplari kaydedilemedi.\") from exc\n"
)

new_submit_end = (
    "        attempt.finished_at = now\n"
    "        attempt.score = score\n"
    "        attempt.is_passed = is_passed\n"
    "        db.commit()\n"
    "\n"
    "        # 2.4: Sinav gecilince kurs tamamlanma kontrol et\n"
    "        if is_passed:\n"
    "            try:\n"
    "                _module, _course = _exam_context(db, exam)\n"
    "                check_course_completion(db, current_user.id, _course.id)\n"
    "            except Exception:\n"
    "                pass  # Sertifika hatasi sinav gonderimi etkilememeli\n"
    "    except HTTPException:\n"
    "        raise\n"
    "    except SQLAlchemyError as exc:\n"
    "        db.rollback()\n"
    "        raise HTTPException(status_code=500, detail=\"Sinav cevaplari kaydedilemedi.\") from exc\n"
)

if old_submit_end in content:
    content = content.replace(old_submit_end, new_submit_end, 1)
    print("[OK] submit_exam patch uygulandı.")
else:
    print("[WARN] submit_exam blogu bulunamadi.")

open(path, "w", encoding="utf-8").write(content)
print("Done.")
