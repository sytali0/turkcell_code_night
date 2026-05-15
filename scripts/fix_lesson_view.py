"""
2.4 - LessonViewPage.jsx patch:
  - import progressAPI ekle
  - curriculum useEffect'inde progress cek ve completedIds'i doldur
"""

path = "frontend/src/pages/LessonViewPage.jsx"
content = open(path, "r", encoding="utf-8").read()

# 1. Import'a progressAPI ekle
old_import = "import { courseAPI, lessonAPI } from '../api/axios';"
new_import = "import { courseAPI, lessonAPI, progressAPI } from '../api/axios';"

if old_import in content:
    content = content.replace(old_import, new_import, 1)
    print("[OK] Import patch applied.")
else:
    print("[WARN] Import not found.")

# 2. curriculum useEffect'inden sonra progress useEffect ekle
# "}, [courseId]);" - curriculum useEffect'in sonundaki satir
# Sonrasina progress useEffect ekleyecegiz

old_effect_end = """  }, [courseId]);

  const handleSelectLesson"""

new_effect_end = """  }, [courseId]);

  // 2.4: Tamamlanan dersleri progress'ten yukle (sayfa yenilemede sifirlanmasin)
  useEffect(() => {
    if (!courseId) return;
    progressAPI.courseProgress(courseId)
      .then((res) => {
        const modules = res.data?.modules || [];
        const ids = new Set();
        modules.forEach((mod) => {
          (mod.completed_lesson_ids || []).forEach((id) => ids.add(id));
        });
        if (ids.size > 0) setCompletedIds(ids);
      })
      .catch(() => {});
  }, [courseId]);

  const handleSelectLesson"""

if old_effect_end in content:
    content = content.replace(old_effect_end, new_effect_end, 1)
    print("[OK] Progress useEffect patch applied.")
else:
    # Try CRLF
    old_crlf = old_effect_end.replace("\n", "\r\n")
    if old_crlf in content:
        new_crlf = new_effect_end.replace("\n", "\r\n")
        content = content.replace(old_crlf, new_crlf, 1)
        print("[OK] Progress useEffect patch applied (CRLF).")
    else:
        print("[WARN] Effect target not found.")

open(path, "w", encoding="utf-8").write(content)
print("Done.")
