import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, BookOpen, CheckCircle2, ChevronDown, ChevronRight, Clock, Loader2, Zap } from 'lucide-react';
import { courseAPI } from '../api/axios';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [open, setOpen] = useState({});
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await courseAPI.detail(courseId);
        setCourse(res.data);
        const initial = {};
        res.data.modules?.forEach((mod) => { initial[mod.id] = true; });
        setOpen(initial);
      } catch (err) {
        setError(err.response?.data?.detail || 'Kurs detayı yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const handleEnroll = async () => {
    if (course?.enrolled) {
      navigate(`/courses/${courseId}/learn`);
      return;
    }
    setEnrolling(true);
    setError('');
    try {
      await courseAPI.enroll(courseId);
      setCourse((prev) => ({ ...prev, enrolled: true }));
      navigate(`/courses/${courseId}/learn`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Kursa kayıt olunamadı.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 style={{ animation: 'spin 0.7s linear infinite' }} /></div>;
  }

  if (error && !course) {
    return <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="card" style={{ padding: '2rem', color: '#F87171' }}><AlertCircle /> {error}</div></div>;
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--tc-bg)' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '1.5rem' }}>
        <div className="card animate-fade-in-up" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.25rem' }}>
          <div style={{ height: '220px', background: course.cover_url ? `url(${course.cover_url}) center/cover no-repeat` : 'linear-gradient(135deg, var(--tc-navy), #0A2A7A)' }} />
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <span className="badge badge-yellow">{course.category}</span>
                <span className="badge badge-navy">{course.level}</span>
                {course.enrolled && <span className="badge badge-green">KAYITLI</span>}
              </div>
              <h1 style={{ color: 'var(--tc-text)', fontSize: '1.6rem', fontWeight: 800 }}>{course.title}</h1>
              <p style={{ color: 'var(--tc-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginTop: '0.6rem' }}>{course.description}</p>
              <p style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                Eğitmen: <strong style={{ color: 'var(--tc-text)' }}>{course.instructor_name || course.instructor}</strong> · {course.total_lessons} ders · {course.duration_hours} saat
              </p>
            </div>
            <button className="btn-primary" onClick={handleEnroll} disabled={enrolling || course.status !== 'published'}>
              {enrolling ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : course.enrolled ? <CheckCircle2 size={16} /> : <Zap size={16} />}
              {course.enrolled ? 'Derse Devam Et' : 'Kursa Kaydol'}
            </button>
          </div>
        </div>

        {error && <div className="card" style={{ padding: '0.9rem', color: '#F87171', marginBottom: '1rem' }}><AlertCircle size={16} /> {error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {course.modules?.map((mod) => (
            <div key={mod.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => setOpen((prev) => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                style={{ width: '100%', padding: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--tc-text)' }}
              >
                <div style={{ textAlign: 'left' }}>
                  <strong>{mod.title}</strong>
                  <p style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{mod.description}</p>
                </div>
                {open[mod.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {open[mod.id] && (
                <div style={{ borderTop: '1px solid var(--tc-border)' }}>
                  {mod.lessons?.map((lesson) => (
                    <div key={lesson.id} style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--tc-muted)', fontSize: '0.85rem' }}>
                      <BookOpen size={15} color="var(--tc-yellow)" />
                      <span style={{ flex: 1, color: 'var(--tc-text)' }}>{lesson.title}</span>
                      <Clock size={13} /> {lesson.duration_minutes} dk
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
