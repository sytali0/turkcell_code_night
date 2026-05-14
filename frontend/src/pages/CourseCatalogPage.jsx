import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  BookOpen,
  Clock,
  Users,
  Star,
  ChevronRight,
  GraduationCap,
  Zap,
  BarChart2,
  AlertCircle,
  RefreshCw,
  Tag,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { courseAPI } from '../api/axios';

// ── Sabitler ──────────────────────────────────────────────────────────────

const LEVELS = [
  { value: '', label: 'Tüm Seviyeler' },
  { value: 'beginner', label: 'Başlangıç' },
  { value: 'intermediate', label: 'Orta' },
  { value: 'advanced', label: 'İleri' },
];

const LEVEL_BADGES = {
  beginner:     { label: 'Başlangıç', cls: 'badge-green' },
  intermediate: { label: 'Orta',      cls: 'badge-yellow' },
  advanced:     { label: 'İleri',     cls: 'badge-purple' },
};

// Turkcell kurumsal kategoriler — backend'den kategori listesi gelmediği için
// mevcut kurslardaki unique kategorileri filtreleyeceğiz
const ALL_CATEGORY_LABEL = 'Tüm Kategoriler';

// ── Yardımcı bileşenler ───────────────────────────────────────────────────

function StatBadge({ icon: Icon, value, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--tc-muted)', fontSize: '0.78rem' }}>
      <Icon size={13} />
      <span>{value} {label}</span>
    </div>
  );
}

function CourseCard({ course, onEnroll, enrolling, enrolled }) {
  const levelInfo = LEVEL_BADGES[course.level] || { label: course.level, cls: 'badge-navy' };

  return (
    <div
      className="card animate-fade-in-up"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        padding: 0,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Cover image */}
      <div
        style={{
          height: '160px',
          background: course.cover_url
            ? `url(${course.cover_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, var(--tc-navy-lt) 0%, var(--tc-navy) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(17,24,39,0.9) 100%)',
          }}
        />
        {/* Level badge */}
        <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
          <span className={`badge ${levelInfo.cls}`}>{levelInfo.label}</span>
        </div>
        {/* Free badge */}
        {course.is_free && (
          <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
            <span className="badge badge-green">ÜCRETSİZ</span>
          </div>
        )}
        {/* Category icon area */}
        {!course.cover_url && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={48} color="rgba(255,209,0,0.3)" />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Category */}
        {course.category && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Tag size={11} color="var(--tc-yellow)" />
            <span style={{ fontSize: '0.7rem', color: 'var(--tc-yellow)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {course.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h3
          style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: 'var(--tc-text)',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {course.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--tc-muted)',
            lineHeight: 1.5,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {course.description}
        </p>

        {/* Instructor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%',
            background: 'var(--tc-navy-lt)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <GraduationCap size={12} color="var(--tc-yellow)" />
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--tc-muted)', fontWeight: 500 }}>
            {course.instructor_name || course.instructor}
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.25rem', flexWrap: 'wrap' }}>
          {course.rating > 0 && (
            <StatBadge icon={Star} value={course.rating.toFixed(1)} label="puan" />
          )}
          {course.student_count > 0 && (
            <StatBadge icon={Users} value={course.student_count.toLocaleString('tr-TR')} label="öğrenci" />
          )}
          {course.duration_hours > 0 && (
            <StatBadge icon={Clock} value={`${course.duration_hours}s`} label="" />
          )}
        </div>

        {/* Divider */}
        <div className="divider" style={{ margin: '0' }} />

        {/* Enroll button */}
        {enrolled ? (
          <button
            onClick={() => onEnroll(course.id, true)}
            className="btn-primary"
            style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
          >
            <BookOpen size={15} />
            Kursa Git
            <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={() => onEnroll(course.id, false)}
            disabled={enrolling}
            className="btn-primary"
            style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
          >
            {enrolling ? (
              <>
                <Loader2 size={15} className="animate-spin" style={{ animation: 'spin 0.7s linear infinite' }} />
                Kaydolunuyor…
              </>
            ) : (
              <>
                <Zap size={15} />
                {course.is_free ? 'Ücretsiz Başla' : 'Kursa Kaydol'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <div style={{
      gridColumn: '1 / -1',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '1rem', padding: '4rem 2rem', textAlign: 'center',
    }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '20px',
        background: 'var(--tc-surface2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <BookOpen size={32} color="var(--tc-muted)" />
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--tc-text)' }}>
        {hasFilters ? 'Filtreler için kurs bulunamadı' : 'Henüz kurs yok'}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--tc-muted)', maxWidth: '300px' }}>
        {hasFilters
          ? 'Farklı filtreler deneyebilir ya da tüm kursları görebilirsiniz.'
          : 'Yakında yeni kurslar eklenecek.'}
      </p>
      {hasFilters && (
        <button onClick={onReset} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> Filtreleri Temizle
        </button>
      )}
    </div>
  );
}

// ── Ana sayfa bileşeni ────────────────────────────────────────────────────

export default function CourseCatalogPage() {
  const navigate = useNavigate();

  // ── State ──
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // enrolledIds: hangi kurslara kayıtlıyız (session içinde tutuluyor)
  const [enrolledIds, setEnrolledIds] = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem('enrolled_courses') || '[]')); }
    catch { return new Set(); }
  });
  const [enrollingId, setEnrollingId] = useState(null);
  const [enrollSuccess, setEnrollSuccess] = useState('');

  // ── Kursları yükle ──
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedLevel) params.level = selectedLevel;
      if (selectedCategory) params.category = selectedCategory;

      const res = await courseAPI.list(params);
      const list = res.data.courses || [];
      setCourses(list);

      // Unique kategorileri çıkar
      const cats = [...new Set(list.map((c) => c.category).filter(Boolean))];
      setCategories(cats);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Kurslar yüklenirken hata oluştu.';
      setError(typeof msg === 'string' ? msg : 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, selectedCategory]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // ── Kayıt / Kursa git ──
  const handleEnroll = async (courseId, alreadyEnrolled) => {
    if (alreadyEnrolled) {
      navigate(`/courses/${courseId}/learn`);
      return;
    }

    setEnrollingId(courseId);
    setEnrollSuccess('');
    try {
      const res = await courseAPI.enroll(courseId);
      const msg = res.data?.message || 'Kursa başarıyla kaydoldunuz!';

      // Kayıtlı kursları session'a kaydet
      const updated = new Set(enrolledIds);
      updated.add(courseId);
      setEnrolledIds(updated);
      sessionStorage.setItem('enrolled_courses', JSON.stringify([...updated]));

      setEnrollSuccess(msg);
      setTimeout(() => {
        setEnrollSuccess('');
        navigate(`/courses/${courseId}/learn`);
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.detail;
      // "Zaten kayıtlısınız" → doğrudan kursa git
      if (err.response?.status === 200 || (typeof msg === 'string' && msg.includes('zaten'))) {
        const updated = new Set(enrolledIds);
        updated.add(courseId);
        setEnrolledIds(updated);
        sessionStorage.setItem('enrolled_courses', JSON.stringify([...updated]));
        navigate(`/courses/${courseId}/learn`);
      } else {
        setError(typeof msg === 'string' ? msg : 'Kayıt işlemi başarısız oldu.');
        setTimeout(() => setError(''), 4000);
      }
    } finally {
      setEnrollingId(null);
    }
  };

  // ── Client-side arama filtresi ──
  const filteredCourses = courses.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.instructor_name || c.instructor || '').toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q)
    );
  });

  const hasFilters = !!(search || selectedLevel || selectedCategory);

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--tc-bg)' }}>
      {/* ── Hero başlık ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--tc-navy) 0%, #0A2A7A 50%, #0A0F1E 100%)',
          borderBottom: '1px solid var(--tc-border)',
          padding: '2.5rem 1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dekoratif daireler */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'rgba(255,209,0,0.06)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '20%',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(255,209,0,0.04)', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
            <span className="badge badge-yellow">
              <Zap size={10} /> CANLI
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--tc-muted)' }}>
              {loading ? '…' : `${courses.length} kurs mevcut`}
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 800, color: 'var(--tc-text)',
            letterSpacing: '-0.03em', marginBottom: '0.4rem',
          }}>
            Kurs <span className="gradient-text">Kataloğu</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--tc-muted)', maxWidth: '480px' }}>
            Kariyerinizi ilerletin — sertifikalı kurslar, gerçek SQL veritabanından canlı olarak yükleniyor.
          </p>

          {/* ── Arama kutusu ── */}
          <div style={{ position: 'relative', maxWidth: '480px', marginTop: '1.25rem' }}>
            <Search
              size={16}
              style={{
                position: 'absolute', left: '0.9rem', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--tc-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              className="input-field"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Kurs, eğitmen veya kategori ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── İçerik alanı ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
        {/* ── Filtreler satırı ── */}
        <div style={{
          display: 'flex', gap: '0.75rem', marginBottom: '1.5rem',
          flexWrap: 'wrap', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={15} color="var(--tc-muted)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--tc-muted)', fontWeight: 500 }}>Filtrele:</span>
          </div>

          {/* Level filtresi */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            style={{
              background: 'var(--tc-surface)',
              border: '1px solid var(--tc-border)',
              color: selectedLevel ? 'var(--tc-text)' : 'var(--tc-muted)',
              fontSize: '0.82rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value} style={{ background: '#1a2235' }}>
                {l.label}
              </option>
            ))}
          </select>

          {/* Kategori filtresi (dinamik, API'den geliyor) */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                background: 'var(--tc-surface)',
                border: '1px solid var(--tc-border)',
                color: selectedCategory ? 'var(--tc-text)' : 'var(--tc-muted)',
                fontSize: '0.82rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <option value="" style={{ background: '#1a2235' }}>{ALL_CATEGORY_LABEL}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} style={{ background: '#1a2235' }}>{cat}</option>
              ))}
            </select>
          )}

          {/* Aktif filtre sayısı */}
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setSelectedLevel(''); setSelectedCategory(''); }}
              className="btn-ghost"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
            >
              <RefreshCw size={12} /> Temizle
            </button>
          )}

          {/* Sonuç sayısı */}
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--tc-muted)' }}>
            {loading ? '' : `${filteredCourses.length} kurs`}
          </span>
        </div>

        {/* ── Kayıt başarı bildirimi ── */}
        {enrollSuccess && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.9rem 1.25rem', marginBottom: '1rem',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: '12px', color: '#4ADE80', fontSize: '0.875rem', fontWeight: 500,
            }}
          >
            <CheckCircle2 size={18} />
            {enrollSuccess}
          </div>
        )}

        {/* ── Hata bildirimi ── */}
        {error && !loading && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.9rem 1.25rem', marginBottom: '1rem',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '12px', color: '#F87171', fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={18} />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={fetchCourses} className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem', color: '#F87171', borderColor: 'rgba(239,68,68,0.3)' }}>
              <RefreshCw size={13} /> Tekrar Dene
            </button>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: '380px', borderRadius: '16px',
                  background: 'var(--tc-surface)',
                  border: '1px solid var(--tc-border)',
                  overflow: 'hidden',
                  animation: `fadeIn 0.3s ease ${i * 0.07}s both`,
                }}
              >
                <div style={{ height: '160px', background: 'var(--tc-surface2)' }} />
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[100, 70, 50, 80].map((w, j) => (
                    <div
                      key={j}
                      style={{
                        height: j === 0 ? '1rem' : '0.75rem',
                        width: `${w}%`,
                        background: 'var(--tc-surface2)',
                        borderRadius: '4px',
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Kurs kartları grid ── */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}>
            {filteredCourses.length === 0 ? (
              <EmptyState
                hasFilters={hasFilters}
                onReset={() => { setSearch(''); setSelectedLevel(''); setSelectedCategory(''); }}
              />
            ) : (
              filteredCourses.map((course, idx) => (
                <div
                  key={course.id}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <CourseCard
                    course={course}
                    onEnroll={handleEnroll}
                    enrolling={enrollingId === course.id}
                    enrolled={enrolledIds.has(course.id)}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Alt bilgi ── */}
        {!loading && filteredCourses.length > 0 && (
          <div style={{
            marginTop: '2rem', textAlign: 'center',
            fontSize: '0.78rem', color: '#334155',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          }}>
            <BarChart2 size={13} />
            Veriler PostgreSQL veritabanından canlı olarak yükleniyor · EduCell API v0.1.0
          </div>
        )}
      </div>
    </div>
  );
}
