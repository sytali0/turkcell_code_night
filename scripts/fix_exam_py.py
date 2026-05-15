import os

path = "app/routers/exam.py"
content = open(path, "r", encoding="utf-8").read()

# 1. Ensure Lesson is imported
if "Lesson," not in content and "Lesson" not in content[:1000]:
    content = content.replace("Module,\n", "Lesson,\n    Module,\n", 1)

# 2. Add the check in _require_student_exam_access
old_block = """    unlocked, reason = _is_module_unlocked_for_student(db, module, user)
    if not unlocked:
        raise HTTPException(status_code=403, detail=reason)

    return module, course"""

new_block = """    unlocked, reason = _is_module_unlocked_for_student(db, module, user)
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

    return module, course"""

if old_block in content and "Bu modulun sinavina girebilmek" not in content:
    content = content.replace(old_block, new_block, 1)
    open(path, "w", encoding="utf-8").write(content)
    print("[OK] Backend check added.")
else:
    print("[WARN] Block not found or already patched.")
