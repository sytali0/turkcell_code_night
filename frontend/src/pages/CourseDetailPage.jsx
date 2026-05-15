import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, BookOpen, CheckCircle2, ChevronDown, ChevronRight,
  Clock, Loader2, Zap, Award, TrendingUp, Star, MessageSquare, Send,
} from 'lucide-react';

import { courseAPI, progressAPI, reviewAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';

// 2.4: Mini progress bar bileşeni
function ProgressBar({ percent, style = {} }) {
  const pct = Math.min(Math.max(percent || 0, 0), 100);
  return (
    <div style={{
      height: '6px', borderRadius: '999px',
      background: 'rgba(255,255,255,0.08)',
      overflow: 'hidden', ...style,
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        borderRadius: '999px',
        background: pct >= 100
          ? 'linear-gradient(90deg, #4ADE80, #22C55E)'
          : 'linear-gradient(90deg, var(--tc-yellow), #E6BC00)',
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [open, setOpen] = useState({});
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  // 2.4: İlerleme durumu
  const [progress, setProgress] = useState(null);
  const [ratingSummary, setRatingSummary] = useState({ avgRating: 0, reviewCount: 0 });
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [ratingInput, setRatingInput] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

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

  // 2.4: Öğrenci ise progress yükle
  useEffect(() => {
    if (user?.role === 'student') {
      progressAPI.courseProgress(courseId)
        .then((res) => setProgress(res.data))
        .catch(() => {});
    }
  }, [courseId, user]);

  useEffect(() => {
    if (!courseId) return;
    reviewAPI.ratingSummary(courseId).then(r => setRatingSummary(r.data)).catch(() => {});
    reviewAPI.list(courseId).then(r => setReviews(r.data || [])).catch(() => {});
    if (user?.role === 'student') {
      reviewAPI.my(courseId).then(r => {
        if (r.data?.exists) { setMyReview(r.data); setRatingInput(r.data.rating); setReviewText(r.data.reviewText || ''); }
      }).catch(() => {});
    }
  }, [courseId, user]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!ratingInput) return;
    setSubmittingReview(true); setReviewMsg('');
    try {
      await reviewAPI.rate(courseId, { rating: ratingInput, review_text: reviewText });
      setReviewMsg('Degerlendirildi!');
      const [s, l, m] = await Promise.all([reviewAPI.ratingSummary(courseId), reviewAPI.list(courseId), reviewAPI.my(courseId)]);
      setRatingSummary(s.data); setReviews(l.data || []);
      if (m.data?.exists) setMyReview(m.data);
      setTimeout(() => setReviewMsg(''), 3000);
    } catch (err) { setReviewMsg(err.response?.data?.detail || 'Kaydedilemedi.'); }
    finally { setSubmittingReview(false); }
  };

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

  const pct = progress?.progress_percent ?? 0;
  const isCompleted = progress?.is_completed;
  const certNumber = progress?.certificate_number;

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--tc-bg)' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Course header card */}
        <div className="card animate-fade-in-up" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.25rem' }}>
          <div style={{ height: '220px', background: course.cover_url ? `url(${course.cover_url}) center/cover no-repeat` : 'linear-gradient(135deg, var(--tc-navy), #0A2A7A)' }} />
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <span className="badge badge-yellow">{course.category}</span>
                  <span className="badge badge-navy">{course.level}</span>
                  {course.enrolled && <span className="badge badge-green">KAYITLI</span>}
                  {isCompleted && <span className="badge badge-green">✓ TAMAMLANDI</span>}
                </div>
                <h1 style={{ color: 'var(--tc-text)', fontSize: '1.6rem', fontWeight: 800 }}>{course.title}</h1>
                <p style={{ color: 'var(--tc-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginTop: '0.6rem' }}>{course.description}</p>
                <p style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                  Eğitmen: <strong style={{ color: 'var(--tc-text)' }}>{course.instructor_name || course.instructor}</strong> · {course.total_lessons} ders · {course.duration_hours} saat
                </p>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                <button className="btn-primary" onClick={handleEnroll} disabled={enrolling || course.status !== 'published'}>
                  {enrolling ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : course.enrolled ? <CheckCircle2 size={16} /> : <Zap size={16} />}
                  {course.enrolled ? 'Derse Devam Et' : 'Kursa Kaydol'}
                </button>

                {/* 2.4: Sertifika butonu */}
                {certNumber && (
                  <button
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--tc-yellow)', borderColor: 'rgba(255,209,0,0.3)' }}
                    onClick={() => navigate(`/certificates/${certNumber}`)}
                  >
                    <Award size={15} color="var(--tc-yellow)" />
                    Sertifikayı Görüntüle
                  </button>
                )}
              </div>
            </div>

            {/* 2.4: Progress bar — sadece kayıtlı öğrencilere göster */}
            {user?.role === 'student' && course.enrolled && progress !== null && (
              <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tc-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={15} color="var(--tc-yellow)" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tc-text)' }}>Kurs İlerlemeniz</span>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isCompleted ? '#4ADE80' : 'var(--tc-yellow)' }}>
                    {isCompleted ? '✓ Tamamlandı' : `%${Math.round(pct)}`}
                  </span>
                </div>
                <ProgressBar percent={pct} />
                <p style={{ fontSize: '0.75rem', color: 'var(--tc-muted)', marginTop: '0.4rem' }}>
                  {progress.completed_lessons} / {progress.total_lessons} ders tamamlandı
                </p>
              </div>
            )}
          </div>
        </div>

        {error && <div className="card" style={{ padding: '0.9rem', color: '#F87171', marginBottom: '1rem' }}><AlertCircle size={16} /> {error}</div>}

        {/* Module list */}
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

        {/* 2.5: Rating & Review */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <MessageSquare size={18} color="var(--tc-yellow)" />
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tc-text)', margin: 0 }}>Degerlendirmeler</h2>
            {ratingSummary.reviewCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
                <Star size={15} color="#FBBF24" fill="#FBBF24" />
                <span style={{ fontWeight: 800, color: 'var(--tc-text)', fontSize: '0.95rem' }}>{ratingSummary.avgRating.toFixed(1)}</span>
                <span style={{ color: 'var(--tc-muted)', fontSize: '0.8rem' }}>({ratingSummary.reviewCount} degerlendirme)</span>
              </div>
            )}
          </div>
          {user?.role === 'student' && course?.enrolled && (
            <form onSubmit={handleReviewSubmit} style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--tc-border)', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tc-text)', marginBottom: '0.6rem' }}>{myReview ? 'Guncelleyin' : 'Kursu Degerlendirin'}</p>
              <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem' }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setRatingInput(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                    <Star size={24} color="#FBBF24" fill={n <= ratingInput ? '#FBBF24' : 'transparent'} strokeWidth={1.5} />
                  </button>
                ))}
                {ratingInput > 0 && <span style={{ fontSize: '0.8rem', color: 'var(--tc-muted)', alignSelf: 'center', marginLeft: '0.25rem' }}>{ratingInput}/5</span>}
              </div>
              <textarea className="input-field" style={{ minHeight: '75px', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.875rem', marginBottom: '0.6rem' }}
                placeholder="Yorumunuz (istege bagli)..." value={reviewText} onChange={e => setReviewText(e.target.value)} />
              {reviewMsg && <p style={{ fontSize: '0.8rem', color: '#4ADE80', marginBottom: '0.5rem' }}>{reviewMsg}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={!ratingInput || submittingReview} style={{ fontSize: '0.85rem' }}>
                  {submittingReview ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Send size={15} />}
                  {myReview ? 'Guncelle' : 'Degerlendir'}
                </button>
              </div>
            </form>
          )}
          {reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reviews.map(r => (
                <div key={r.id} style={{ padding: '0.9rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--tc-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {[1,2,3,4,5].map(n => <Star key={n} size={13} color="#FBBF24" fill={n <= r.rating ? '#FBBF24' : 'transparent'} strokeWidth={1.5} />)}
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tc-text)', marginLeft: '0.25rem' }}>{r.authorName}</span>
                      {r.isOwn && <span style={{ fontSize: '0.65rem', background: 'rgba(255,209,0,0.15)', color: 'var(--tc-yellow)', borderRadius: '6px', padding: '1px 6px' }}>Siz</span>}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--tc-muted)' }}>{new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                  {r.reviewText && <p style={{ fontSize: '0.85rem', color: 'var(--tc-muted)', margin: 0, lineHeight: 1.5 }}>{r.reviewText}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--tc-muted)', fontSize: '0.875rem', textAlign: 'center' }}>Henuz degerlendirme yok.</p>
          )}
        </div>

    </div>
  );
}
