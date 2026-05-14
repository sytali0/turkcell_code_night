"""
EduCell - Kurs Pydantic Modelleri.

Hiyerarşi:  Course  ──▶  Module  ──▶  Lesson
            (Kurs)        (Modül)       (Ders)

Şimdilik mock data ile çalışır; SQLAlchemy ORM modelleri
takım arkadaşı tarafından ayrıca yazılacak.
"""

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field, HttpUrl, model_validator


# ---------------------------------------------------------------------------
# Enum'lar
# ---------------------------------------------------------------------------

class CourseCategory(str, Enum):
    """Kurs kategorileri."""
    PROGRAMMING   = "programming"
    DATA_SCIENCE  = "data_science"
    CYBERSECURITY = "cybersecurity"
    CLOUD         = "cloud"
    MOBILE        = "mobile"
    DEVOPS        = "devops"
    AI            = "ai"


class CourseLevel(str, Enum):
    """Kurs zorluk seviyeleri."""
    BEGINNER     = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED     = "advanced"


class LessonType(str, Enum):
    """Ders içerik türleri."""
    VIDEO   = "video"
    QUIZ    = "quiz"
    READING = "reading"
    LAB     = "lab"


# ---------------------------------------------------------------------------
# Lesson (Ders)
# ---------------------------------------------------------------------------

class LessonBase(BaseModel):
    """Ders temel alanları."""
    title:            str        = Field(..., examples=["Python'a Giriş"])
    lesson_type:      LessonType = Field(..., examples=["video"])
    duration_minutes: int        = Field(..., ge=1, examples=[12])
    is_free_preview:  bool       = Field(default=False)


class LessonResponse(LessonBase):
    """Ders detay cevabı."""
    id:    str = Field(..., examples=["les_001"])
    order: int = Field(..., ge=1, examples=[1])
    content: str = Field(default="")
    estimatedDuration: int = Field(default=0)
    orderIndex: int = Field(default=1)

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Exam & Question (Sınav / Soru)
# ---------------------------------------------------------------------------

class QuestionResponse(BaseModel):
    """Sınav sorusu."""
    id:            str              = Field(..., examples=["que_001"])
    type:          str              = Field(..., examples=["MULTIPLE_CHOICE"])
    question_type: str              = Field(..., examples=["MULTIPLE_CHOICE"])
    text:          str              = Field(..., examples=["Python hangi tür bir dildir?"])
    options:       list[dict[str, Any]] = Field(default_factory=list)
    order:         int              = Field(..., ge=1, examples=[1])

    model_config = {"from_attributes": True}


class ExamResponse(BaseModel):
    """Modüle bağlı sınav."""
    id:             str                    = Field(..., examples=["exm_001"])
    title:          str                    = Field(..., examples=["Python'a Giriş Sınavı"])
    description:    str                    = Field(default="")
    time_limit_min: int                    = Field(..., ge=0)
    passing_score:  int                    = Field(..., ge=0, le=100)
    question_count: int                    = Field(..., ge=0)
    shuffle:        bool                   = False
    max_attempts:   int                    = Field(..., ge=1)
    questions:      list[QuestionResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Module (Modül)
# ---------------------------------------------------------------------------

class ModuleBase(BaseModel):
    """Modül temel alanları."""
    title:       str = Field(..., examples=["Temel Kavramlar"])
    description: str = Field(default="", examples=["Bu modülde temel kavramları öğreneceksiniz."])


class ModuleResponse(ModuleBase):
    """Modül detay cevabı (dersleri ile birlikte)."""
    id:             str              = Field(..., examples=["mod_001"])
    order:          int              = Field(..., ge=1, examples=[1])
    lesson_count:   int              = Field(..., ge=0, examples=[5])
    total_duration: int              = Field(..., ge=0, description="Modüldeki toplam süre (dakika)")
    lessons:        list[LessonResponse] = Field(default_factory=list)
    exams:          list[ExamResponse] = Field(default_factory=list)
    is_locked:      bool = False
    is_unlocked:    bool = True
    lock_reason:    Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Course (Kurs) — Liste görünümü (hafif)
# ---------------------------------------------------------------------------

class CourseListItem(BaseModel):
    """
    Kurs listesinde dönen özet kart.
    Curriculum (hiyerarşi) dahil edilmez, liste hızlı yüklensin.
    """
    id:            str           = Field(..., examples=["crs_001"])
    title:         str           = Field(..., examples=["Python ile Veri Bilimi"])
    description:   str           = Field(..., examples=["Sıfırdan Python öğrenin ve veri bilimi dünyasına adım atın."])
    cover_url:     str           = Field(..., examples=["https://picsum.photos/seed/python/800/450"])
    category:      str
    level:         CourseLevel
    instructor:    str           = Field(..., examples=["Dr. Ayşe Kaya"])
    instructor_name: str         = Field(default="", examples=["Dr. Ayşe Kaya"])
    rating:        float         = Field(..., ge=0.0, le=5.0, examples=[4.8])
    student_count: int           = Field(..., ge=0, examples=[1240])
    duration_hours: float        = Field(..., ge=0, examples=[18.5])
    is_free:       bool          = Field(default=False)
    price_tl:      Optional[float] = Field(default=None, examples=[299.0])
    tags:          list[str]     = Field(default_factory=list)
    status:        str           = Field(default="published")
    instructor_id: str           = Field(default="")
    instructorId:  str           = Field(default="")
    coverImageUrl: str           = Field(default="")
    estimatedDuration: int       = Field(default=0)
    createdAt:     Optional[str] = None
    updatedAt:     Optional[str] = None
    enrolled:      bool          = False

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def fill_instructor_name(self) -> "CourseListItem":
        if not self.instructor_name:
            self.instructor_name = self.instructor
        return self


# ---------------------------------------------------------------------------
# Course Curriculum (Kurs detay — hiyerarşik yapı)
# ---------------------------------------------------------------------------

class CourseCurriculumResponse(CourseListItem):
    """
    Kurs müfredatı: CourseListItem + modüller listesi (içlerinde dersler var).
    """
    module_count:    int                 = Field(..., ge=0)
    total_lessons:   int                 = Field(..., ge=0)
    modules:         list[ModuleResponse] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Enroll (Kayıt)
# ---------------------------------------------------------------------------

class EnrollResponse(BaseModel):
    """Kursa kayıt cevabı."""
    success:   bool = True
    message:   str
    course_id: str
    user_note: str = "Kursunuza 'Derslerim' bölümünden erişebilirsiniz."


# ---------------------------------------------------------------------------
# Query Parametreleri için yardımcı (opsiyonel)
# ---------------------------------------------------------------------------

class CourseListResponse(BaseModel):
    """Kurs listesi sarmalayıcı."""
    total:   int
    courses: list[CourseListItem]
