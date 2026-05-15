import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Award, BookOpen, ChevronRight, Clock, Loader2, TrendingUp } from 'lucide-react';
import { courseAPI } from '../api/axios';

// 2.4: Progress bar bileşeni
function ProgressBar({ percent }) {
  const pct = Math.min(Math.max(percent || 0, 0), 100);
  return (
    <div style={{ height: '5px', borderRadius: '999px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`, borderRadius: '999px',
        background: pct >= 100
          ? 'linear-gradient(90deg, #4ADE80, #22C55E)'
          : 'linear-gradient(90deg, var(--tc-yellow), #E6BC00)',
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

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

  const completedCount = courses.filter((c) => (c.progress_percent ?? 0) >= 100).length;

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '1.5rem', background: 'var(--tc-bg)' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--tc-text)' }}>Kayıtlı Kurslarım</h1>
            <p style={{ color: 'var(--tc-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Devam ettiğiniz kurslar ve ilerleme durumunuz.
            </p>
          </div>
          {/* 2.4: Sertifikalarım kısayolu */}
          {completedCount > 0 && (
            <button
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--tc-yellow)', borderColor: 'rgba(255,209,0,0.3)' }}
              onClick={() => navigate('/certificates')}
            >
              <Award size={15} color="var(--tc-yellow)" />
              Sertifikalarım ({completedCount})
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 size={32} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--tc-yellow)' }} />
          </div>
        ) : error ? (
          <div className="card" style={{ padding: '1rem', color: '#F87171', display: 'flex', gap: '0.5rem' }}>
            <AlertCircle size={18} />{error}
          </div>
        ) : courses.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <BookOpen size={42} color="var(--tc-muted)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--tc-muted)' }}>Henüz kayıtlı kursunuz yok.</p>
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/courses')}>Katalogu Aç</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {courses.map((course) => {
              const pct = course.progress_percent ?? 0;
              const isDone = pct >= 100;
              return (
                <div key={course.id} className="card animate-fade-in-up" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Cover */}
                  <div style={{
                    height: '130px',
                    background: course.cover_url
                      ? `url(${course.cover_url}) center/cover no-repeat`
                      : 'linear-gradient(135deg, var(--tc-navy-lt), var(--tc-navy))',
                    position: 'relative',
                  }}>
                    {/* 2.4: Tamamlandı rozeti */}
                    {isDone && (
                      <div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: 'rgba(74,222,128,0.9)',
                        borderRadius: '8px', padding: '3px 8px',
                        fontSize: '0.65rem', fontWeight: 700, color: '#052e16',
                        display: 'flex', alignItems: 'center', gap: '3px',
                      }}>
                        <Award size={10} /> TAMAMLANDI
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <span className="badge badge-green">KAYITLI</span>
                      {isDone && <span className="badge" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80' }}>✓ BİTİRDİ</span>}
                    </div>
                    <h3 style={{ color: 'var(--tc-text)', fontSize: '1rem', fontWeight: 700 }}>{course.title}</h3>
                    <p style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>{course.description}</p>

                    {/* 2.4: Progress bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--tc-muted)', fontSize: '0.75rem' }}>
                          <TrendingUp size={12} color="var(--tc-yellow)" /> İlerleme
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isDone ? '#4ADE80' : 'var(--tc-yellow)' }}>
                          %{Math.round(pct)}
                        </span>
                      </div>
                      <ProgressBar percent={pct} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-secondary" style={{ flex: 1, fontSize: '0.82rem' }} onClick={() => navigate(`/courses/${course.id}`)}>
                        Detay
                      </button>
                      <button
                        className="btn-primary"
                        style={{ flex: 1, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center' }}
                        onClick={() => isDone
                          ? navigate('/certificates')
                          : navigate(`/courses/${course.id}/learn`)}
                      >
                        {isDone ? (
                          <><Award size={13} /> Sertifika</>
                        ) : (
                          <>Devam Et <ChevronRight size={14} /></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
