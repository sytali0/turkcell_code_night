import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy, CheckCircle2, XCircle, Star, RotateCcw,
  BookOpen, Award, TrendingUp, Clock, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import { examAPI, courseAPI } from '../api/axios';

// ── Yıldız rating bileşeni ─────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem' }}
        >
          <Star
            size={28}
            color={(hover || value) >= s ? 'var(--tc-yellow)' : 'var(--tc-border)'}
            fill={(hover || value) >= s ? 'var(--tc-yellow)' : 'none'}
            style={{ transition: 'all 0.15s' }}
          />
        </button>
      ))}
    </div>
  );
}

// ── Soru sonuç kartı ───────────────────────────────────────────────────────
function AnswerCard({ item, index }) {
  const [open, setOpen] = useState(false);
  const correct = item.is_correct;
  const partial = !correct && item.earned_points > 0;

  return (
    <div
      className="card"
      style={{
        padding: '1rem 1.25rem',
        borderLeft: `4px solid ${correct ? '#4ADE80' : partial ? '#FBBF24' : '#F87171'}`,
        cursor: 'pointer',
      }}
      onClick={() => setOpen((p) => !p)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
          {correct
            ? <CheckCircle2 size={18} color="#4ADE80" />
            : partial
              ? <TrendingUp size={18} color="#FBBF24" />
              : <XCircle size={18} color="#F87171" />}
          <span style={{ fontSize: '0.82rem', color: 'var(--tc-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {index + 1}. {item.question_text || `Soru ${index + 1}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: correct ? '#4ADE80' : partial ? '#FBBF24' : '#F87171' }}>
            {item.earned_points ?? 0}/{item.max_points ?? 1} pt
          </span>
          {open ? <ChevronUp size={14} color="var(--tc-muted)" /> : <ChevronDown size={14} color="var(--tc-muted)" />}
        </div>
      </div>

      {open && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--tc-border)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {item.question_text && (
            <p style={{ fontSize: '0.85rem', color: 'var(--tc-text)', lineHeight: 1.5 }}>{item.question_text}</p>
          )}
          {item.selected_choices?.length > 0 && (
            <p style={{ fontSize: '0.78rem', color: 'var(--tc-muted)' }}>
              <span style={{ fontWeight: 600 }}>Cevabınız:</span> {item.selected_choices.join(', ')}
            </p>
          )}
          {item.correct_choices?.length > 0 && !correct && (
            <p style={{ fontSize: '0.78rem', color: '#4ADE80' }}>
              <span style={{ fontWeight: 600 }}>Doğru cevap:</span> {item.correct_choices.join(', ')}
            </p>
          )}
          {item.explanation && (
            <p style={{ fontSize: '0.78rem', color: 'var(--tc-muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>
              💡 {item.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Ana bileşen ────────────────────────────────────────────────────────────
export default function ExamResultPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [result, setResult] = useState(location.state?.result ?? null);
  const [loading, setLoading] = useState(!result);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [ratingDone, setRatingDone] = useState(false);
  const [courseId, setCourseId] = useState(null);

  useEffect(() => {
    if (result) return;
    (async () => {
      try {
        const res = await examAPI.result(examId);
        setResult(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Sonuç yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  const handleRate = async (stars) => {
    setRating(stars);
    if (!courseId) return;
    try {
      await courseAPI.rate(courseId, { rating: stars, review: '' });
      setRatingDone(true);
    } catch (_) {}
  };

  if (loading) return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: '44px', height: '44px', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--tc-muted)' }}>Sonuçlar yükleniyor…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '400px' }}>
        <XCircle size={48} color="#F87171" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: '#F87171', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={() => navigate('/')} className="btn-secondary">Ana Sayfaya Dön</button>
      </div>
    </div>
  );

  if (!result) return null;

  const score = result.score ?? 0;
  const passed = result.is_passed ?? (score >= (result.passing_score ?? 70));
  const answers = result.answers ?? [];
  const totalQ = answers.length || result.question_count || 0;
  const correctCount = answers.filter((a) => a.is_correct).length;

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--tc-bg)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── Sonuç özeti ── */}
        <div className="card animate-fade-in-up" style={{ padding: '2.5rem', textAlign: 'center', background: passed ? 'linear-gradient(135deg, rgba(74,222,128,0.08), rgba(17,24,39,0) 60%)' : 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(17,24,39,0) 60%)' }}>
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%',
            background: passed ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.12)',
            border: `3px solid ${passed ? '#4ADE80' : '#F87171'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: passed ? '0 0 32px rgba(74,222,128,0.2)' : '0 0 32px rgba(239,68,68,0.2)',
          }}>
            {passed
              ? <Trophy size={36} color="#4ADE80" />
              : <BookOpen size={36} color="#F87171" />}
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: passed ? '#4ADE80' : '#F87171', marginBottom: '0.4rem' }}>
            {passed ? '🎉 Tebrikler, Geçtiniz!' : 'Tekrar Deneyebilirsiniz'}
          </h1>
          <p style={{ color: 'var(--tc-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {result.exam_title}
          </p>

          {/* Skor dairesi */}
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
            <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', width: '120px', height: '120px' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--tc-surface2)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke={passed ? '#4ADE80' : '#F87171'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - score / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--tc-text)' }}>
                {score.toFixed(0)}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--tc-muted)' }}>puan</span>
            </div>
          </div>

          {/* İstatistikler */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', maxWidth: '400px', margin: '0 auto' }}>
            {[
              { icon: CheckCircle2, color: '#4ADE80', val: correctCount, label: 'Doğru' },
              { icon: XCircle, color: '#F87171', val: totalQ - correctCount, label: 'Yanlış' },
              { icon: TrendingUp, color: 'var(--tc-yellow)', val: `%${result.passing_score ?? 70}`, label: 'Geçme Notu' },
            ].map(({ icon: Icon, color, val, label }) => (
              <div key={label} className="card" style={{ padding: '0.9rem 0.5rem', textAlign: 'center' }}>
                <Icon size={20} color={color} style={{ margin: '0 auto 0.3rem' }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--tc-text)' }}>{val}</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--tc-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Sertifika */}
          {passed && result.certificate_number && (
            <div style={{ marginTop: '1.25rem', padding: '0.9rem', background: 'rgba(255,209,0,0.08)', border: '1px solid rgba(255,209,0,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
              <Award size={20} color="var(--tc-yellow)" />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tc-yellow)' }}>Sertifikanız Hazır</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--tc-muted)' }}>No: {result.certificate_number}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Aksiyon butonları ── */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/')} className="btn-secondary" style={{ flex: 1 }}>
            <BookOpen size={15} /> Kataloğa Dön
          </button>
          {!passed && (
            <button onClick={() => navigate(`/exams/${examId}`)} className="btn-primary" style={{ flex: 1 }}>
              <RotateCcw size={15} /> Tekrar Dene
            </button>
          )}
          {passed && (
            <button onClick={() => navigate(-1)} className="btn-primary" style={{ flex: 1 }}>
              <Trophy size={15} /> Kursa Devam Et
            </button>
          )}
        </div>

        {/* ── Kurs puanı ── */}
        {passed && (
          <div className="card animate-fade-in-up" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tc-text)', marginBottom: '0.5rem' }}>
              Kursu Değerlendirin
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--tc-muted)', marginBottom: '1rem' }}>
              Deneyiminizi paylaşarak diğer öğrencilere yardımcı olun.
            </p>
            {ratingDone ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: '#4ADE80', fontSize: '0.875rem' }}>
                <CheckCircle2 size={18} /> Değerlendirmeniz için teşekkürler!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <StarRating value={rating} onChange={handleRate} />
                {rating > 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--tc-muted)' }}>
                    {'⭐'.repeat(rating)} {['', 'Çok Kötü', 'Kötü', 'İdare Eder', 'İyi', 'Mükemmel'][rating]}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Soru bazında sonuçlar ── */}
        {answers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tc-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="var(--tc-yellow)" /> Soru Analizi
            </h2>
            {answers.map((item, i) => (
              <AnswerCard key={item.question_id || i} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
