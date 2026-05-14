import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { courseAPI } from '../api/axios';

export default function MyCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await courseAPI.myEnrollments();
        setCourses(res.data.courses || []);
      } catch (err) {
        setError(err.response?.data?.detail || 'Kayıtlı kurslar yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '1.5rem', background: 'var(--tc-bg)' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--tc-text)' }}>Kayıtlı Kurslarım</h1>
          <p style={{ color: 'var(--tc-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Devam ettiğiniz kurslar ve ilerleme durumunuz.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 style={{ animation: 'spin 0.7s linear infinite' }} /></div>
        ) : error ? (
          <div className="card" style={{ padding: '1rem', color: '#F87171', display: 'flex', gap: '0.5rem' }}><AlertCircle size={18} />{error}</div>
        ) : courses.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <BookOpen size={42} color="var(--tc-muted)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--tc-muted)' }}>Henüz kayıtlı kursunuz yok.</p>
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/courses')}>Katalogu Aç</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {courses.map((course) => (
              <div key={course.id} className="card animate-fade-in-up" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ height: '130px', background: course.cover_url ? `url(${course.cover_url}) center/cover no-repeat` : 'linear-gradient(135deg, var(--tc-navy-lt), var(--tc-navy))' }} />
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span className="badge badge-green">KAYITLI</span>
                  <h3 style={{ color: 'var(--tc-text)', fontSize: '1rem', fontWeight: 700 }}>{course.title}</h3>
                  <p style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>{course.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--tc-muted)', fontSize: '0.78rem' }}>
                    <Clock size={13} /> %{course.progress_percent ?? 0} ilerleme
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" style={{ flex: 1, fontSize: '0.82rem' }} onClick={() => navigate(`/courses/${course.id}`)}>Detay</button>
                    <button className="btn-primary" style={{ flex: 1, fontSize: '0.82rem' }} onClick={() => navigate(`/courses/${course.id}/learn`)}>
                      Devam Et <ChevronRight size={14} />
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
