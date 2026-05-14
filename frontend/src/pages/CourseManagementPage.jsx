import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BarChart2, BookOpen, Edit3, Filter, Loader2, Plus, RefreshCw, Settings } from 'lucide-react';
import { courseAPI } from '../api/axios';

const STATUS_LABELS = { draft: 'Taslak', published: 'Yayında', archived: 'Arşivlenmiş' };

function statusBadge(status) {
  if (status === 'published') return 'badge-green';
  if (status === 'archived') return 'badge-purple';
  return 'badge-yellow';
}

export default function CourseManagementPage({ mode }) {
  const isAdmin = mode === 'admin';
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', category: '', level: '', instructor: '' });

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = isAdmin
        ? await courseAPI.adminCourses(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)))
        : await courseAPI.instructorCourses();
      setCourses(res.data.courses || []);
      setStats(res.data.stats || null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Kurslar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const categories = useMemo(() => [...new Set(courses.map((c) => c.category).filter(Boolean))], [courses]);
  const instructors = useMemo(() => [...new Set(courses.map((c) => c.instructor_name || c.instructor).filter(Boolean))], [courses]);

  const changeStatus = async (courseId, status) => {
    try {
      await courseAPI.updateStatus(courseId, status);
      setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, status } : c)));
      if (isAdmin) loadCourses();
    } catch (err) {
      setError(err.response?.data?.detail || 'Durum güncellenemedi.');
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '1.5rem', background: 'var(--tc-bg)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ color: 'var(--tc-text)', fontSize: '1.5rem', fontWeight: 800 }}>
              {isAdmin ? 'Admin Kurs Yönetimi' : 'Eğitmen Kurslarım'}
            </h1>
            <p style={{ color: 'var(--tc-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {isAdmin ? 'Tüm kursları durumlarına göre kontrol edin.' : 'Kendi kurslarınızı, modüllerinizi ve derslerinizi yönetin.'}
            </p>
          </div>
          {!isAdmin && (
            <button className="btn-primary" onClick={() => navigate('/instructor/courses/new')}>
              <Plus size={16} /> Yeni Kurs
            </button>
          )}
        </div>

        {isAdmin && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
            {[
              ['Toplam Kurs', stats.totalCourses],
              ['Yayında', stats.publishedCourses],
              ['Taslak', stats.draftCourses],
              ['Arşivlenmiş', stats.archivedCourses],
              ['Toplam Kayıt', stats.totalEnrollments],
            ].map(([label, value]) => (
              <div key={label} className="card" style={{ padding: '1rem' }}>
                <BarChart2 size={16} color="var(--tc-yellow)" />
                <p style={{ color: 'var(--tc-muted)', fontSize: '0.75rem', marginTop: '0.4rem' }}>{label}</p>
                <strong style={{ color: 'var(--tc-text)', fontSize: '1.25rem' }}>{value}</strong>
              </div>
            ))}
          </div>
        )}

        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
            <Filter size={15} color="var(--tc-muted)" />
            <input className="input-field" style={{ maxWidth: '220px' }} placeholder="Ara" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
            <select className="input-field" style={{ maxWidth: '170px' }} value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
              <option value="">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="published">Yayında</option>
              <option value="archived">Arşivlenmiş</option>
            </select>
            <select className="input-field" style={{ maxWidth: '170px' }} value={filters.level} onChange={(e) => setFilters((p) => ({ ...p, level: e.target.value }))}>
              <option value="">Tüm Seviyeler</option>
              <option value="beginner">Başlangıç</option>
              <option value="intermediate">Orta</option>
              <option value="advanced">İleri</option>
            </select>
            <select className="input-field" style={{ maxWidth: '190px' }} value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
              <option value="">Tüm Kategoriler</option>
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select className="input-field" style={{ maxWidth: '190px' }} value={filters.instructor} onChange={(e) => setFilters((p) => ({ ...p, instructor: e.target.value }))}>
              <option value="">Tüm Eğitmenler</option>
              {instructors.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
            <button className="btn-ghost" onClick={() => setFilters({ search: '', status: '', category: '', level: '', instructor: '' })}><RefreshCw size={14} /> Temizle</button>
          </div>
        )}

        {error && <div className="card" style={{ padding: '0.9rem', color: '#F87171', display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}><AlertCircle size={16} /> {error}</div>}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 style={{ animation: 'spin 0.7s linear infinite' }} /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {courses.map((course) => (
              <div key={course.id} className="card animate-fade-in-up" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ height: '130px', background: course.cover_url ? `url(${course.cover_url}) center/cover no-repeat` : 'linear-gradient(135deg, var(--tc-navy-lt), var(--tc-navy))' }} />
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span className={`badge ${statusBadge(course.status)}`}>{STATUS_LABELS[course.status] || course.status}</span>
                    <span style={{ color: 'var(--tc-muted)', fontSize: '0.75rem' }}>{course.student_count} kayıt</span>
                  </div>
                  <h3 style={{ color: 'var(--tc-text)', fontSize: '1rem', fontWeight: 700 }}>{course.title}</h3>
                  <p style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>{course.description}</p>
                  {isAdmin && <p style={{ color: 'var(--tc-muted)', fontSize: '0.75rem' }}>Eğitmen: {course.instructor_name || course.instructor}</p>}
                  <select className="input-field" value={course.status} onChange={(e) => changeStatus(course.id, e.target.value)}>
                    <option value="draft">Taslak</option>
                    <option value="published">Yayında</option>
                    <option value="archived">Arşivlenmiş</option>
                  </select>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" style={{ flex: 1, fontSize: '0.82rem' }} onClick={() => navigate(isAdmin ? `/admin/courses/${course.id}/edit` : `/instructor/courses/${course.id}/edit`)}>
                      <Edit3 size={14} /> Düzenle
                    </button>
                    {!isAdmin && (
                      <button className="btn-primary" style={{ flex: 1, fontSize: '0.82rem' }} onClick={() => navigate(`/instructor/courses/${course.id}/modules`)}>
                        <Settings size={14} /> İçerik
                      </button>
                    )}
                    <button className="btn-ghost" style={{ flex: 1, fontSize: '0.82rem' }} onClick={() => navigate(`/courses/${course.id}`)}>
                      <BookOpen size={14} /> Detay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
