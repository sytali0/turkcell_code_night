"""
EduCell - Kurs & İçerik Yönetimi Router'ı
==========================================

Endpoint'ler:
  GET  /api/v1/courses                         → Filtrelenebilir kurs listesi
  POST /api/v1/courses/{course_id}/enroll      → Kursa kayıt ol
  GET  /api/v1/courses/{course_id}/curriculum  → Hiyerarşik müfredat

Mock data kullanılmaktadır.  DB:  işaretli satırlar SQLAlchemy
entegrasyonunda güncellenecektir.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Path, Query, status

from app.models.course import (
    CourseCategory,
    CourseCurriculumResponse,
    CourseLevel,
    CourseListItem,
    CourseListResponse,
    EnrollResponse,
    LessonResponse,
    LessonType,
    ModuleResponse,
)

router = APIRouter(prefix="/courses", tags=["📚 Kurslar"])


# ---------------------------------------------------------------------------
# Mock Data — Üretim aşamasında DB:  sorgularıyla değiştirilecek
# ---------------------------------------------------------------------------

_MOCK_COURSES: list[CourseListItem] = [
    CourseListItem(
        id="crs_001",
        title="Python ile Veri Bilimi: Sıfırdan İleri Seviyeye",
        description=(
            "NumPy, Pandas ve Scikit-learn kütüphaneleriyle gerçek dünya veri "
            "setleri üzerinde çalışın; makine öğrenmesi modellerini sıfırdan inşa edin."
        ),
        cover_url="https://picsum.photos/seed/python-ds/800/450",
        category=CourseCategory.DATA_SCIENCE,
        level=CourseLevel.BEGINNER,
        instructor="Dr. Ayşe Kaya",
        rating=4.9,
        student_count=3_812,
        duration_hours=22.5,
        is_free=False,
        price_tl=349.0,
        tags=["python", "pandas", "numpy", "makine-öğrenmesi"],
    ),
    CourseListItem(
        id="crs_002",
        title="Siber Güvenliğe Giriş: Ağ & Uygulama Güvenliği",
        description=(
            "Tehdit modelleme, penetrasyon testleri, OWASP Top-10 açıkları ve "
            "savunma stratejileri ile siber güvenlik kariyerinize sağlam bir temel atın."
        ),
        cover_url="https://picsum.photos/seed/cybersec/800/450",
        category=CourseCategory.CYBERSECURITY,
        level=CourseLevel.INTERMEDIATE,
        instructor="Mert Yıldız, CEH",
        rating=4.7,
        student_count=1_540,
        duration_hours=18.0,
        is_free=False,
        price_tl=299.0,
        tags=["siber-güvenlik", "network", "owasp", "pentest"],
    ),
    CourseListItem(
        id="crs_003",
        title="Kubernetes & Docker ile Modern DevOps",
        description=(
            "Container mimarisi, Helm chart'ları, CI/CD pipeline'ları ve "
            "Kubernetes cluster yönetimini uygulamalı örneklerle öğrenin."
        ),
        cover_url="https://picsum.photos/seed/devops-k8s/800/450",
        category=CourseCategory.DEVOPS,
        level=CourseLevel.ADVANCED,
        instructor="Can Arslan",
        rating=4.8,
        student_count=2_076,
        duration_hours=30.0,
        is_free=True,
        price_tl=None,
        tags=["kubernetes", "docker", "devops", "ci-cd"],
    ),
]

# Kurs ID → müfredat haritası (mock)
_MOCK_CURRICULUM: dict[str, CourseCurriculumResponse] = {
    "crs_001": CourseCurriculumResponse(
        **_MOCK_COURSES[0].model_dump(),
        module_count=3,
        total_lessons=12,
        modules=[
            ModuleResponse(
                id="mod_001", title="Python Temelleri", order=1,
                description="Değişkenler, döngüler, fonksiyonlar ve OOP.",
                lesson_count=4, total_duration=60,
                lessons=[
                    LessonResponse(id="les_001", title="Kurulum & Hello World",   lesson_type=LessonType.VIDEO,   duration_minutes=10, is_free_preview=True,  order=1),
                    LessonResponse(id="les_002", title="Değişkenler & Tipler",     lesson_type=LessonType.VIDEO,   duration_minutes=15, is_free_preview=False, order=2),
                    LessonResponse(id="les_003", title="Döngüler & Koşullar",      lesson_type=LessonType.READING, duration_minutes=20, is_free_preview=False, order=3),
                    LessonResponse(id="les_004", title="Bölüm Sınavı",            lesson_type=LessonType.QUIZ,    duration_minutes=15, is_free_preview=False, order=4),
                ],
            ),
            ModuleResponse(
                id="mod_002", title="NumPy & Pandas ile Veri Analizi", order=2,
                description="Veri temizleme, dönüştürme ve keşifsel veri analizi.",
                lesson_count=5, total_duration=110,
                lessons=[
                    LessonResponse(id="les_005", title="NumPy Dizileri",           lesson_type=LessonType.VIDEO,   duration_minutes=18, is_free_preview=False, order=1),
                    LessonResponse(id="les_006", title="Pandas DataFrame",         lesson_type=LessonType.VIDEO,   duration_minutes=25, is_free_preview=False, order=2),
                    LessonResponse(id="les_007", title="Veri Temizleme Lab'ı",    lesson_type=LessonType.LAB,     duration_minutes=30, is_free_preview=False, order=3),
                    LessonResponse(id="les_008", title="Görselleştirme (Matplotlib)", lesson_type=LessonType.VIDEO, duration_minutes=22, is_free_preview=False, order=4),
                    LessonResponse(id="les_009", title="Bölüm Sınavı",            lesson_type=LessonType.QUIZ,    duration_minutes=15, is_free_preview=False, order=5),
                ],
            ),
            ModuleResponse(
                id="mod_003", title="Makine Öğrenmesi Temelleri", order=3,
                description="Scikit-learn ile sınıflandırma ve regresyon modelleri.",
                lesson_count=3, total_duration=65,
                lessons=[
                    LessonResponse(id="les_010", title="Scikit-learn'e Giriş",    lesson_type=LessonType.VIDEO,   duration_minutes=20, is_free_preview=False, order=1),
                    LessonResponse(id="les_011", title="İlk Modelimizi Eğitelim", lesson_type=LessonType.LAB,     duration_minutes=30, is_free_preview=False, order=2),
                    LessonResponse(id="les_012", title="Final Sınavı",            lesson_type=LessonType.QUIZ,    duration_minutes=15, is_free_preview=False, order=3),
                ],
            ),
        ],
    ),
    "crs_002": CourseCurriculumResponse(
        **_MOCK_COURSES[1].model_dump(),
        module_count=2,
        total_lessons=8,
        modules=[
            ModuleResponse(
                id="mod_004", title="Ağ Güvenliği Temelleri", order=1,
                description="TCP/IP, firewall ve IDS/IPS sistemleri.",
                lesson_count=4, total_duration=80,
                lessons=[
                    LessonResponse(id="les_013", title="OSI Modeli & Protokoller",  lesson_type=LessonType.VIDEO,   duration_minutes=20, is_free_preview=True,  order=1),
                    LessonResponse(id="les_014", title="Firewall Konfigürasyonu",   lesson_type=LessonType.LAB,     duration_minutes=25, is_free_preview=False, order=2),
                    LessonResponse(id="les_015", title="Wireshark ile Analiz",      lesson_type=LessonType.LAB,     duration_minutes=20, is_free_preview=False, order=3),
                    LessonResponse(id="les_016", title="Bölüm Sınavı",             lesson_type=LessonType.QUIZ,    duration_minutes=15, is_free_preview=False, order=4),
                ],
            ),
            ModuleResponse(
                id="mod_005", title="OWASP Top-10 & Web Güvenliği", order=2,
                description="SQL Injection, XSS, CSRF ve diğer web açıkları.",
                lesson_count=4, total_duration=90,
                lessons=[
                    LessonResponse(id="les_017", title="OWASP Top-10 Tanıtımı",   lesson_type=LessonType.VIDEO,   duration_minutes=18, is_free_preview=False, order=1),
                    LessonResponse(id="les_018", title="SQL Injection Lab'ı",      lesson_type=LessonType.LAB,     duration_minutes=30, is_free_preview=False, order=2),
                    LessonResponse(id="les_019", title="XSS & CSRF Savunmaları",   lesson_type=LessonType.READING, duration_minutes=22, is_free_preview=False, order=3),
                    LessonResponse(id="les_020", title="Final Sınavı",             lesson_type=LessonType.QUIZ,    duration_minutes=20, is_free_preview=False, order=4),
                ],
            ),
        ],
    ),
    "crs_003": CourseCurriculumResponse(
        **_MOCK_COURSES[2].model_dump(),
        module_count=2,
        total_lessons=8,
        modules=[
            ModuleResponse(
                id="mod_006", title="Docker ile Container Dünyası", order=1,
                description="Image oluşturma, Docker Compose ve registry yönetimi.",
                lesson_count=4, total_duration=95,
                lessons=[
                    LessonResponse(id="les_021", title="Docker Nedir?",            lesson_type=LessonType.VIDEO,   duration_minutes=15, is_free_preview=True,  order=1),
                    LessonResponse(id="les_022", title="Dockerfile Yazımı",        lesson_type=LessonType.LAB,     duration_minutes=30, is_free_preview=False, order=2),
                    LessonResponse(id="les_023", title="Docker Compose Projesi",   lesson_type=LessonType.LAB,     duration_minutes=35, is_free_preview=False, order=3),
                    LessonResponse(id="les_024", title="Bölüm Sınavı",            lesson_type=LessonType.QUIZ,    duration_minutes=15, is_free_preview=False, order=4),
                ],
            ),
            ModuleResponse(
                id="mod_007", title="Kubernetes Cluster Yönetimi", order=2,
                description="Pod, Deployment, Service ve Helm chart kurulumları.",
                lesson_count=4, total_duration=120,
                lessons=[
                    LessonResponse(id="les_025", title="Kubernetes Mimarisi",      lesson_type=LessonType.VIDEO,   duration_minutes=25, is_free_preview=False, order=1),
                    LessonResponse(id="les_026", title="kubectl ile Deployment",   lesson_type=LessonType.LAB,     duration_minutes=40, is_free_preview=False, order=2),
                    LessonResponse(id="les_027", title="Helm Chart Kurulumu",      lesson_type=LessonType.LAB,     duration_minutes=40, is_free_preview=False, order=3),
                    LessonResponse(id="les_028", title="Final Sınavı",             lesson_type=LessonType.QUIZ,    duration_minutes=15, is_free_preview=False, order=4),
                ],
            ),
        ],
    ),
}


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
    category: Optional[CourseCategory] = Query(
        default=None,
        description="Kurs kategorisi: programming, data_science, cybersecurity, cloud, mobile, devops, ai",
    ),
    level: Optional[CourseLevel] = Query(
        default=None,
        description="Zorluk seviyesi: beginner, intermediate, advanced",
    ),
) -> CourseListResponse:
    """
    Filtrelenebilir kurs listesi döner.

    - **category**: Opsiyonel kategori filtresi
    - **level**: Opsiyonel zorluk seviyesi filtresi
    """
    # DB:  SELECT * FROM courses WHERE category = :cat AND level = :lvl
    result = _MOCK_COURSES

    if category:
        result = [c for c in result if c.category == category]

    if level:
        result = [c for c in result if c.level == level]

    return CourseListResponse(total=len(result), courses=result)


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
    course_id: str = Path(..., examples=["crs_001"], description="Kayıt olunacak kursun ID'si"),
) -> EnrollResponse:
    """
    Kursa kayıt simülasyonu.

    - Kurs bulunamadığında **404** döner.
    - Başarılı kayıtta **201** ve `EnrollResponse` döner.
    """
    # DB:  SELECT id FROM courses WHERE id = :course_id
    course_ids = {c.id for c in _MOCK_COURSES}

    if course_id not in course_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"'{course_id}' ID'li kurs bulunamadı.",
        )

    # DB:  INSERT INTO enrollments (user_id, course_id, enrolled_at) VALUES (...)
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
        "**Kurs → Modüller → Dersler**."
    ),
)
def get_curriculum(
    course_id: str = Path(..., examples=["crs_001"], description="Müfredatı getirilecek kursun ID'si"),
) -> CourseCurriculumResponse:
    """
    Kurs müfredatı (hiyerarşik).

    Yanıt yapısı:
    ```
    Course
     └── modules[]
          └── lessons[]
    ```

    - Kurs bulunamadığında **404** döner.
    """
    # DB:  JOIN courses, modules, lessons WHERE courses.id = :course_id
    curriculum = _MOCK_CURRICULUM.get(course_id)

    if curriculum is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"'{course_id}' ID'li kursun müfredatı bulunamadı.",
        )

    return curriculum
