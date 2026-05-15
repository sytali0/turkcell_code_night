"""
2.4 - course.py patch script:
  1. complete_lesson'a enrollment kontrolü + check_course_completion ekle
  2. get_progress'teki eski cert oluşturmayı yeni servisle değiştir
"""

import re

path = "app/routers/course.py"
content = open(path, "r", encoding="utf-8").read()

# ---- Patch 1: complete_lesson ----
# Eski: lesson get + lesson_completions insert (enrollment kontrolü yok)
# Yeni: enrollment kontrolü + lesson_completions insert + check_course_completion

old_complete = (
    '    lesson = db.get(Lesson, lesson_uuid)\r\n'
    '    if lesson is None:\r\n'
    '        raise HTTPException(status_code=404, detail="Ders bulunamad\u0131.")\r\n'
    '\r\n'
    '    # lesson_completions tablosuna kaydet (varsa)\r\n'
    '    try:\r\n'
    '        from sqlalchemy import text\r\n'
    '        db.execute(\r\n'
    '            text(\r\n'
    '                "INSERT INTO lesson_completions (id, lesson_id, user_id, completed_at) "\r\n'
    '                "VALUES (:id, :lesson_id, :user_id, :completed_at) "\r\n'
    '                "ON CONFLICT (lesson_id, user_id) DO NOTHING"\r\n'
    '            ),\r\n'
    '            {\r\n'
    '                "id": str(uuid4()),\r\n'
    '                "lesson_id": str(lesson_uuid),\r\n'
    '                "user_id": str(current_user.id),\r\n'
    '                "completed_at": datetime.now(),\r\n'
    '            },\r\n'
    '        )\r\n'
    '        db.commit()\r\n'
    '    except Exception:\r\n'
    '        db.rollback()\r\n'
    '\r\n'
    '    return LessonCompleteResponse(\r\n'
    '        success=True,\r\n'
    '        message="\u2705 Ders tamamland\u0131! \u0130lerlemeniz kaydedildi.",\r\n'
    '        lesson_id=lesson_id,\r\n'
    '    )\r\n'
)

new_complete = (
    '    lesson = db.get(Lesson, lesson_uuid)\n'
    '    if lesson is None:\n'
    '        raise HTTPException(status_code=404, detail="Ders bulunamad\u0131.")\n'
    '\n'
    '    # 2.4: Sadece student rol\u00fc tamamlayabilir\n'
    '    _require_role(current_user, "student")\n'
    '\n'
    '    # 2.4: \u00d6\u011frenci bu derse ait kursa kay\u0131tl\u0131 olmal\u0131\n'
    '    module = db.get(Module, lesson.module_id)\n'
    '    if module is None:\n'
    '        raise HTTPException(status_code=404, detail="Ders mod\u00fcl\u00fc bulunamad\u0131.")\n'
    '\n'
    '    enrollment = db.scalar(\n'
    '        select(Enrollment).where(\n'
    '            Enrollment.user_id == current_user.id,\n'
    '            Enrollment.course_id == module.course_id,\n'
    '            Enrollment.status.in_(["active", "completed"]),\n'
    '        )\n'
    '    )\n'
    '    if enrollment is None:\n'
    '        raise HTTPException(\n'
    '            status_code=403,\n'
    '            detail="Bu dersi tamamlamak i\u00e7in kursa kay\u0131tl\u0131 olmal\u0131s\u0131n\u0131z.",\n'
    '        )\n'
    '\n'
    '    # lesson_completions tablosuna kaydet \u2014 duplicate kabul etme\n'
    '    try:\n'
    '        from sqlalchemy import text\n'
    '        db.execute(\n'
    '            text(\n'
    '                "INSERT INTO lesson_completions (id, lesson_id, user_id, completed_at) "\n'
    '                "VALUES (:id, :lesson_id, :user_id, :completed_at) "\n'
    '                "ON CONFLICT (lesson_id, user_id) DO NOTHING"\n'
    '            ),\n'
    '            {\n'
    '                "id": str(uuid4()),\n'
    '                "lesson_id": str(lesson_uuid),\n'
    '                "user_id": str(current_user.id),\n'
    '                "completed_at": datetime.now(),\n'
    '            },\n'
    '        )\n'
    '        db.commit()\n'
    '    except Exception:\n'
    '        db.rollback()\n'
    '        raise HTTPException(status_code=500, detail="Ders tamamlama kaydedilemedi.")\n'
    '\n'
    '    # 2.4: Kurs tamamlanma kontrol\u00fc \u2014 ayr\u0131 try-except (ders kayd\u0131n\u0131 etkilemez)\n'
    '    try:\n'
    '        check_course_completion(db, current_user.id, module.course_id)\n'
    '    except Exception:\n'
    '        pass  # Sertifika olu\u015fturma hatas\u0131 ders tamamlamay\u0131 engellememeli\n'
    '\n'
    '    return LessonCompleteResponse(\n'
    '        success=True,\n'
    '        message="\u2705 Ders tamamland\u0131! \u0130lerlemeniz kaydedildi.",\n'
    '        lesson_id=lesson_id,\n'
    '    )\n'
)

if old_complete in content:
    content = content.replace(old_complete, new_complete, 1)
    print("[OK] Patch 1 (complete_lesson) applied.")
else:
    # Try LF-only version
    old_lf = old_complete.replace('\r\n', '\n')
    if old_lf in content:
        content = content.replace(old_lf, new_complete, 1)
        print("[OK] Patch 1 LF (complete_lesson) applied.")
    else:
        print("[WARN] Patch 1 not found, skipping.")

# ---- Patch 2: get_progress cert oluşturma ----
old_cert_block = (
    '    # Kurs tamamland\u0131ysa otomatik sertifika olu\u015ftur\r\n'
    '    if is_completed and not cert:\r\n'
    '        cert_no = "EDU-" + secrets.token_hex(4).upper()\r\n'
    '        cert = Certificate(\r\n'
    '            id=uuid4(),\r\n'
    '            user_id=current_user.id,\r\n'
    '            course_id=course_uuid,\r\n'
    '            certificate_number=cert_no,\r\n'
    '            certificate_url=None,\r\n'
    '            issued_at=datetime.now(),\r\n'
    '        )\r\n'
    '        db.add(cert)\r\n'
    '        db.commit()\r\n'
)

new_cert_block = (
    '    # 2.4: Kurs tamamland\u0131ysa sertifika olu\u015ftur (EDUCELL-YYYY-XXXXXX format\u0131)\n'
    '    if is_completed and not cert:\n'
    '        try:\n'
    '            cert = check_course_completion(db, current_user.id, course_uuid)\n'
    '        except Exception:\n'
    '            pass  # Sertifika hatas\u0131 progress endpoint\'ini engellememeli\n'
)

if old_cert_block in content:
    content = content.replace(old_cert_block, new_cert_block, 1)
    print("[OK] Patch 2 (cert format) applied.")
else:
    old_cert_lf = old_cert_block.replace('\r\n', '\n')
    if old_cert_lf in content:
        content = content.replace(old_cert_lf, new_cert_block, 1)
        print("[OK] Patch 2 LF (cert format) applied.")
    else:
        print("[WARN] Patch 2 not found, skipping.")

open(path, "w", encoding="utf-8").write(content)
print("Done. File written.")
