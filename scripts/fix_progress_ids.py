"""
2.4 - course.py patch: module_progress dict'e completed_lesson_ids ekle
"""

path = "app/routers/course.py"
content = open(path, "r", encoding="utf-8").read()

# module_progress.append'deki dict'e completed_lesson_ids ekle
old_append = '''        completed_rows = 0
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
                completed_rows = 0'''

new_append = '''        completed_rows = 0
        completed_lesson_ids_list = []
        if mod_total > 0 and lesson_ids:
            from sqlalchemy import text
            try:
                # lesson_completions tablosu varsa say
                for lid in lesson_ids:
                    cnt = db.execute(
                        text("SELECT COUNT(*) FROM lesson_completions WHERE user_id=:uid AND lesson_id=:lid"),
                        {"uid": str(current_user.id), "lid": str(lid)},
                    ).scalar() or 0
                    if cnt > 0:
                        completed_rows += 1
                        completed_lesson_ids_list.append(str(lid))
            except Exception:
                completed_rows = 0'''

# Try LF version
old_lf = old_append.replace('\r\n', '\n')
new_lf = new_append.replace('\r\n', '\n')

if old_append in content:
    content = content.replace(old_append, new_append, 1)
    print("[OK] Patch 1 CRLF applied.")
elif old_lf in content:
    content = content.replace(old_lf, new_lf, 1)
    print("[OK] Patch 1 LF applied.")
else:
    print("[WARN] Patch 1 not found.")

# module_progress.append'e completed_lesson_ids ekle
old_module_append = '''        module_progress.append({
            "module_id": str(mod.id),
            "title": mod.title,
            "total_lessons": mod_total,
            "completed_lessons": completed_rows,
            "progress_percent": pct,
            "exam_passed": exam_passed,
        })'''

new_module_append = '''        module_progress.append({
            "module_id": str(mod.id),
            "title": mod.title,
            "total_lessons": mod_total,
            "completed_lessons": completed_rows,
            "completed_lesson_ids": completed_lesson_ids_list,
            "progress_percent": pct,
            "exam_passed": exam_passed,
        })'''

old_ma_lf = old_module_append.replace('\r\n', '\n')
new_ma_lf = new_module_append.replace('\r\n', '\n')

if old_module_append in content:
    content = content.replace(old_module_append, new_module_append, 1)
    print("[OK] Patch 2 CRLF applied.")
elif old_ma_lf in content:
    content = content.replace(old_ma_lf, new_ma_lf, 1)
    print("[OK] Patch 2 LF applied.")
else:
    print("[WARN] Patch 2 not found.")

open(path, "w", encoding="utf-8").write(content)
print("Done.")
