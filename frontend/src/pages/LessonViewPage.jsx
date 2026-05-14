import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, Video, FileText, FlaskConical, ChevronDown, ChevronRight,
  CheckCircle2, Play, Lock, Send, MessageSquare, Trophy, ArrowLeft,
  Clock, AlertCircle, Loader2, ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { courseAPI, lessonAPI } from '../api/axios';

const LESSON_ICON = { video: Video, reading: FileText, quiz: FlaskConical, lab: FlaskConical };

function Sidebar({ curriculum, activeLessonId, activeExamId, onSelectLesson, onSelectExam, completedIds }) {
  const [openModules, setOpenModules] = useState({});

  useEffect(() => {
    if (!curriculum) return;
    const init = {};
    curriculum.modules?.forEach((m) => { init[m.id] = true; });
    setOpenModules(init);
  }, [curriculum]);

  const toggle = (id) => setOpenModules((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div style={{
      width: '300px', flexShrink: 0,
      background: 'var(--tc-surface)',
      borderRight: '1px solid var(--tc-border)',
      height: 'calc(100vh - 64px)',
      overflowY: 'auto',
      position: 'sticky', top: '64px',
    }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--tc-border)' }}>
        <button onClick={() => window.history.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: 'var(--tc-muted)', cursor: 'pointer', fontSize: '0.8rem', marginBottom: '0.6rem' }}>
          <ArrowLeft size={14} /> Kataloğa Dön
        </button>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--tc-text)', lineHeight: 1.3 }}>
          {curriculum?.title}
        </h2>
        <p style={{ fontSize: '0.72rem', color: 'var(--tc-muted)', marginTop: '0.25rem' }}>
          {curriculum?.total_lessons} ders · {curriculum?.module_count} modül
        </p>
      </div>

      {curriculum?.modules?.map((mod) => (
        <div key={mod.id}>
          <button
            onClick={() => toggle(mod.id)}
            style={{
              width: '100%', padding: '0.75rem 1rem',
              background: 'none', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', borderBottom: '1px solid var(--tc-border)',
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tc-text)', textAlign: 'left' }}>
              {mod.title}
            </span>
            {openModules[mod.id]
              ? <ChevronDown size={14} color="var(--tc-muted)" />
              : <ChevronRight size={14} color="var(--tc-muted)" />}
          </button>

          {openModules[mod.id] && (
            <div>
              {mod.lessons?.map((lesson) => {
                const Icon = LESSON_ICON[lesson.lesson_type] || BookOpen;
                const isActive = lesson.id === activeLessonId;
                const isDone = completedIds.has(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson)}
                    style={{
                      width: '100%', padding: '0.6rem 1rem 0.6rem 1.5rem',
                      background: isActive ? 'rgba(255,209,0,0.08)' : 'none',
                      border: 'none', borderLeft: isActive ? '3px solid var(--tc-yellow)' : '3px solid transparent',
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {isDone
                      ? <CheckCircle2 size={14} color="#4ADE80" />
                      : <Icon size={14} color={isActive ? 'var(--tc-yellow)' : 'var(--tc-muted)'} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.78rem', color: isActive ? 'var(--tc-yellow)' : 'var(--tc-text)', fontWeight: isActive ? 600 : 400, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lesson.title}
                      </p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--tc-muted)' }}>{lesson.duration_minutes}dk</p>
                    </div>
                  </button>
                );
              })}

              {mod.exams?.map((exam) => {
                const isActive = exam.id === activeExamId;
                return (
                  <button
                    key={exam.id}
                    onClick={() => onSelectExam(exam)}
                    style={{
                      width: '100%', padding: '0.6rem 1rem 0.6rem 1.5rem',
                      background: isActive ? 'rgba(255,209,0,0.08)' : 'none',
                      border: 'none', borderLeft: isActive ? '3px solid var(--tc-yellow)' : '3px solid transparent',
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <Trophy size={14} color={isActive ? 'var(--tc-yellow)' : '#A78BFA'} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.78rem', color: isActive ? 'var(--tc-yellow)' : 'var(--tc-text)', fontWeight: isActive ? 600 : 400, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exam.title}
                      </p>
                      <p style={{ fontSize: '0.68rem', color: '#A78BFA' }}>Sınav · {exam.question_count} soru</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LessonContent({ lesson, onComplete, completing, completed }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-navy" style={{ textTransform: 'capitalize' }}>{lesson.lesson_type}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--tc-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={12} />{lesson.duration_minutes} dakika
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--tc-text)', letterSpacing: '-0.02em' }}>
            {lesson.title}
          </h1>
        </div>

        {completed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '10px', color: '#4ADE80', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
            <CheckCircle2 size={16} /> Tamamlandı
          </div>
        ) : (
          <button onClick={onComplete} disabled={completing} className="btn-primary" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
            {completing ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />Kaydediliyor…</> : <><CheckCircle2 size={15} />Tamamlandı İşaretle</>}
          </button>
        )}
      </div>

      {lesson.lesson_type === 'video' ? (
        <div style={{ background: 'var(--tc-surface2)', borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--tc-border)', position: 'relative' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--tc-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(255,209,0,0.3)', cursor: 'pointer' }}>
              <Play size={28} color="var(--tc-navy)" fill="var(--tc-navy)" style={{ marginLeft: '3px' }} />
            </div>
            <p style={{ color: 'var(--tc-muted)', fontSize: '0.875rem' }}>{lesson.title}</p>
            <p style={{ color: '#334155', fontSize: '0.75rem', marginTop: '0.25rem' }}>Video içeriği — {lesson.duration_minutes} dakika</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.5rem', lineHeight: '1.8' }}>
          <p style={{ color: 'var(--tc-muted)', fontSize: '0.9rem' }}>
            📖 Bu ders okuma içeriği içermektedir. Aşağıdaki konuları kapsar:
          </p>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {['Temel kavramlar ve tanımlar', 'Pratik uygulama örnekleri', 'Sık yapılan hatalar ve çözümleri', 'İleri seviye ipuçları'].map((item) => (
              <li key={item} style={{ color: 'var(--tc-text)', fontSize: '0.875rem' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CommentSection({ lessonId }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true); setError('');
    try {
      await lessonAPI.comment(lessonId, { content });
      setSent(true); setContent('');
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Yorum gönderilemedi.');
    } finally { setSending(false); }
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tc-text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MessageSquare size={18} color="var(--tc-yellow)" /> Yorumlar
      </h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <textarea
          className="input-field"
          style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
          placeholder="Bu ders hakkında düşüncelerinizi paylaşın…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {error && <p style={{ fontSize: '0.8rem', color: '#F87171', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertCircle size={13} />{error}</p>}
        {sent && <p style={{ fontSize: '0.8rem', color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={13} />Yorumunuz gönderildi!</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-primary" disabled={sending || !content.trim()} style={{ fontSize: '0.85rem' }}>
            {sending ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Send size={15} />}
            Gönder
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LessonViewPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [completing, setCompleting] = useState(false);

  const allLessons = curriculum?.modules?.flatMap((m) => m.lessons) ?? [];

  useEffect(() => {
    (async () => {
      try {
        const res = await courseAPI.curriculum(courseId);
        setCurriculum(res.data);
        const firstLesson = res.data.modules?.[0]?.lessons?.[0];
        if (firstLesson) setActiveLesson(firstLesson);
      } catch (err) {
        setError(err.response?.data?.detail || 'Müfredat yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const handleSelectLesson = (lesson) => { setActiveLesson(lesson); setActiveExam(null); };
  const handleSelectExam = (exam) => { setActiveExam(exam); setActiveLesson(null); };

  const handleComplete = async () => {
    if (!activeLesson) return;
    setCompleting(true);
    try {
      await lessonAPI.complete(activeLesson.id);
      setCompletedIds((prev) => new Set([...prev, activeLesson.id]));
      const idx = allLessons.findIndex((l) => l.id === activeLesson.id);
      if (idx < allLessons.length - 1) {
        setTimeout(() => setActiveLesson(allLessons[idx + 1]), 800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  const currentIdx = allLessons.findIndex((l) => l.id === activeLesson?.id);

  if (loading) return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--tc-muted)' }}>Müfredat yükleniyor…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
        <AlertCircle size={40} color="#F87171" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: '#F87171' }}>{error}</p>
        <button onClick={() => navigate('/')} className="btn-secondary" style={{ marginTop: '1rem' }}>Kataloğa Dön</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <Sidebar
        curriculum={curriculum}
        activeLessonId={activeLesson?.id}
        activeExamId={activeExam?.id}
        onSelectLesson={handleSelectLesson}
        onSelectExam={handleSelectExam}
        completedIds={completedIds}
      />

      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', maxWidth: 'calc(100% - 300px)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {activeExam ? (
            <div className="card animate-fade-in-up" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 12px 32px rgba(124,58,237,0.3)' }}>
                <Trophy size={32} color="white" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tc-text)', marginBottom: '0.5rem' }}>{activeExam.title}</h2>
              <p style={{ color: 'var(--tc-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                {activeExam.question_count} soru · {activeExam.time_limit_min} dakika · Geçme notu: %{activeExam.passing_score}
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => navigate(`/exams/${activeExam.id}`)} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.75rem 2rem' }}>
                  <Trophy size={16} /> Sınava Başla
                </button>
                <button onClick={() => navigate(`/exams/${activeExam.id}/result`)} className="btn-secondary" style={{ fontSize: '0.9rem' }}>
                  Sonuçları Gör
                </button>
              </div>
            </div>
          ) : activeLesson ? (
            <>
              <LessonContent
                lesson={activeLesson}
                onComplete={handleComplete}
                completing={completing}
                completed={completedIds.has(activeLesson.id)}
              />

              {allLessons.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <button
                    onClick={() => currentIdx > 0 && setActiveLesson(allLessons[currentIdx - 1])}
                    disabled={currentIdx <= 0}
                    className="btn-secondary"
                    style={{ fontSize: '0.85rem', opacity: currentIdx <= 0 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={15} /> Önceki Ders
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--tc-muted)', alignSelf: 'center' }}>
                    {currentIdx + 1} / {allLessons.length}
                  </span>
                  <button
                    onClick={() => currentIdx < allLessons.length - 1 && setActiveLesson(allLessons[currentIdx + 1])}
                    disabled={currentIdx >= allLessons.length - 1}
                    className="btn-primary"
                    style={{ fontSize: '0.85rem', opacity: currentIdx >= allLessons.length - 1 ? 0.4 : 1 }}
                  >
                    Sonraki Ders <ChevronRightIcon size={15} />
                  </button>
                </div>
              )}

              <CommentSection lessonId={activeLesson.id} />
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <BookOpen size={48} color="var(--tc-muted)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--tc-muted)' }}>Soldan bir ders seçin</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
