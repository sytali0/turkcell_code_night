import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy, Clock, ChevronLeft, ChevronRight, Send, AlertCircle,
  CheckCircle2, Circle, BookOpen, Loader2, Flag, XCircle, CheckSquare,
} from 'lucide-react';
import { examAPI } from '../api/axios';

// ── Timer hook ─────────────────────────────────────────────────────────────
function useTimer(totalSeconds, onExpire) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const ref = useRef(null);

  useEffect(() => {
    if (totalSeconds <= 0) {
      setRemaining(0);
      return;
    }
    setRemaining(totalSeconds);
    ref.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(ref.current); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [totalSeconds]);

  const fmt = (s) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const pct = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 100;
  const urgent = remaining <= 60 && totalSeconds > 0;
  return { display: fmt(remaining), pct, urgent };
}

function getRemainingSeconds(session) {
  const total = (session?.time_limit_min ?? 0) * 60;
  if (total <= 0) return 0;
  const startedAt = session?.started_at ? new Date(session.started_at).getTime() : Date.now();
  const elapsed = Math.max(Math.floor((Date.now() - startedAt) / 1000), 0);
  return Math.max(total - elapsed, 0);
}

// ── Soru tip ikonları ──────────────────────────────────────────────────────
function QuestionTypeBadge({ type }) {
  const map = {
    MULTIPLE_CHOICE: { label: 'Tek Seçenek', color: 'var(--tc-yellow)', bg: 'rgba(255,209,0,0.1)' },
    multiple_choice: { label: 'Tek Seçenek', color: 'var(--tc-yellow)', bg: 'rgba(255,209,0,0.1)' },
    TRUE_FALSE:      { label: 'Doğru/Yanlış', color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
    true_false:      { label: 'Doğru/Yanlış', color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
    MULTI_SELECT:    { label: 'Çok Seçenekli', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
    multi_select:    { label: 'Çok Seçenekli', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
    MULTIPLE_SELECT: { label: 'Çok Seçenekli', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
  };
  const info = map[type] || { label: type, color: 'var(--tc-muted)', bg: 'var(--tc-surface2)' };
  return (
    <span style={{
      padding: '0.25rem 0.6rem', borderRadius: '6px',
      fontSize: '0.7rem', fontWeight: 600,
      color: info.color, background: info.bg,
    }}>
      {info.label}
    </span>
  );
}

// ── Cevap seçeneği ─────────────────────────────────────────────────────────
function ChoiceButton({ choice, selected, multiSelect, onToggle }) {
  const Icon = multiSelect
    ? (selected ? CheckSquare : Circle)
    : (selected ? CheckCircle2 : Circle);

  return (
    <button
      onClick={() => onToggle(choice.id)}
      style={{
        width: '100%', padding: '0.9rem 1.1rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        background: selected ? 'rgba(255,209,0,0.08)' : 'var(--tc-surface2)',
        border: selected ? '2px solid var(--tc-yellow)' : '2px solid var(--tc-border)',
        borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.15s',
      }}
    >
      <Icon
        size={18}
        color={selected ? 'var(--tc-yellow)' : 'var(--tc-muted)'}
        fill={selected && !multiSelect ? 'var(--tc-yellow)' : 'none'}
      />
      <span style={{
        fontSize: '0.9rem',
        color: selected ? 'var(--tc-text)' : 'var(--tc-muted)',
        fontWeight: selected ? 600 : 400,
        flex: 1,
      }}>
        {choice.text}
      </span>
    </button>
  );
}

function normalizeQuestionType(question) {
  return question?.type || question?.question_type || '';
}

function choicesFromOptionFields(question) {
  const fieldGroups = [
    [['A', 'option_a'], ['B', 'option_b'], ['C', 'option_c'], ['D', 'option_d']],
    [['A', 'answerA'], ['B', 'answerB'], ['C', 'answerC'], ['D', 'answerD']],
  ];

  for (const fields of fieldGroups) {
    const choices = fields
      .map(([id, field]) => ({ id, text: question?.[field] }))
      .filter((choice) => choice.text !== undefined && choice.text !== null && String(choice.text).trim());

    if (choices.length > 0) return choices;
  }

  return [];
}

function normalizeChoices(question) {
  const candidates = [question?.choices, question?.options, question?.answers];
  let rawChoices = candidates.find((value) => Array.isArray(value) && value.length > 0);

  if (!rawChoices) {
    const objectChoices = candidates.find((value) => value && typeof value === 'object' && !Array.isArray(value));
    if (objectChoices) {
      rawChoices = Object.entries(objectChoices).map(([id, value]) => (
        value && typeof value === 'object'
          ? { id, ...value }
          : { id, text: value }
      ));
    }
  }

  if (!rawChoices) {
    rawChoices = choicesFromOptionFields(question);
  }

  if (!Array.isArray(rawChoices) || rawChoices.length === 0) {
    console.warn('[ExamPage] Question options are empty', {
      questionId: question?.id,
      questionText: question?.text,
      rawChoices,
    });
    return [];
  }

  return rawChoices.map((choice, index) => {
    if (typeof choice === 'string') {
      return { id: String.fromCharCode(65 + index), text: choice };
    }

    const id = String(choice.id ?? choice.key ?? choice.option_id ?? choice.value ?? String.fromCharCode(65 + index));
    const text = choice.text ?? choice.label ?? choice.option_text ?? choice.answer_text ?? choice.title ?? choice.name ?? choice.value ?? '';

    if (!String(text).trim()) {
      console.warn('[ExamPage] Question option text is empty', {
        questionId: question?.id,
        questionText: question?.text,
        optionId: id,
        rawChoice: choice,
      });
    }

    return { ...choice, id, text: String(text) };
  });
}

function prepareExamSession(data) {
  const rawQuestions = Array.isArray(data?.questions) ? data.questions : [];

  console.log('[ExamPage] Raw exam start response', data);
  console.log('[ExamPage] Raw question data', rawQuestions);
  console.log('[ExamPage] questions length', rawQuestions.length);

  const parsedQuestions = rawQuestions.map((question, index) => {
    const parsedQuestion = {
      ...question,
      type: normalizeQuestionType(question),
      choices: normalizeChoices(question),
    };
    console.log('[ExamPage] Parsed Question', { index, question: parsedQuestion });
    return parsedQuestion;
  });

  if (parsedQuestions.length === 0) {
    throw new Error('Sınav soruları bulunamadı.');
  }

  return { ...data, questions: parsedQuestions };
}

function getExamStartError(err) {
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (err.message) return err.message;
  return 'Sınav başlatılamadı.';
}

// ── Soru navigasyon mini-dot'ları ──────────────────────────────────────────
function QuestionNav({ total, current, answers, onGo }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
      {Array.from({ length: total }).map((_, i) => {
        const answered = answers[i] && answers[i].length > 0;
        const isCur = i === current;
        return (
          <button
            key={i}
            onClick={() => onGo(i)}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              border: isCur ? '2px solid var(--tc-yellow)' : '2px solid var(--tc-border)',
              background: isCur
                ? 'var(--tc-yellow)'
                : answered ? 'rgba(74,222,128,0.15)' : 'var(--tc-surface2)',
              color: isCur ? 'var(--tc-navy)' : answered ? '#4ADE80' : 'var(--tc-muted)',
              fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

// ── Ana Bileşen ────────────────────────────────────────────────────────────
export default function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  // Aşama: 'loading' | 'ready' | 'started' | 'submitting' | 'error'
  const [phase, setPhase] = useState('loading');
  const [session, setSession] = useState(null);   // start API cevabı
  const [error, setError] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  // answers: { [questionIndex]: string[] }
  const [answers, setAnswers] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [flagged, setFlagged] = useState(new Set());
  const submittedRef = useRef(false);

  // Timer
  const timeLimitSec = phase === 'started' ? getRemainingSeconds(session) : 0;
  const { display: timerDisplay, pct: timerPct, urgent: timerUrgent } = useTimer(
    timeLimitSec,
    () => phase === 'started' && handleSubmit(true),
  );

  // ── Sınavı başlat ──
  const loadExam = useCallback(async () => {
    setPhase('loading');
    setError('');
    submittedRef.current = false;
    setAnswers({});
    setCurrentQ(0);
    try {
      const res = await examAPI.start(examId);
      setSession(prepareExamSession(res.data));
      setPhase('ready');
    } catch (err) {
      console.error('[ExamPage] Exam start failed', err);
      setError(getExamStartError(err));
      setPhase('error');
    }
  }, [examId]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  // ── Cevap seç/kaldır ──
  const handleToggle = useCallback((choiceId) => {
    const q = session?.questions?.[currentQ];
    if (!q) return;
    const questionType = normalizeQuestionType(q);
    const isMulti = questionType === 'MULTI_SELECT' || questionType === 'multi_select' || questionType === 'MULTIPLE_SELECT';

    setAnswers((prev) => {
      const cur = prev[currentQ] || [];
      if (isMulti) {
        return { ...prev, [currentQ]: cur.includes(choiceId) ? cur.filter((c) => c !== choiceId) : [...cur, choiceId] };
      }
      return { ...prev, [currentQ]: cur[0] === choiceId ? [] : [choiceId] };
    });
  }, [currentQ, session]);

  // ── Gönder ──
  const handleSubmit = async (autoSubmit = false) => {
    if (submitting || submittedRef.current || !session) return;
    submittedRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      const questions = session?.questions ?? [];
      const payload = {
        attempt_id: session.attempt_id,
        answers: questions.map((q, i) => ({
          question_id: q.id,
          selected_choices: answers[i] || [],
        })),
      };
      const res = await examAPI.submit(examId, payload);
      navigate(`/exams/${examId}/result`, { state: { result: res.data } });
    } catch (err) {
      const msg = err.response?.data?.detail;
      setSubmitError(typeof msg === 'string' ? msg : 'Gönderme başarısız. Tekrar deneyin.');
      submittedRef.current = false;
      setSubmitting(false);
    }
  };

  const toggleFlag = (idx) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const questions = session?.questions ?? [];
  const answeredCount = Object.values(answers).filter((a) => a && a.length > 0).length;
  const unansweredCount = questions.length - answeredCount;

  // ─────────────── RENDER ────────────────────────────────────────────────

  if (phase === 'loading') return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: '44px', height: '44px', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--tc-muted)' }}>Sınav hazırlanıyor…</p>
      </div>
    </div>
  );

  if (phase === 'error') return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card animate-fade-in-up" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '480px', width: '100%' }}>
        <XCircle size={48} color="#F87171" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--tc-text)', marginBottom: '0.5rem' }}>
          Sınav Başlatılamadı
        </h2>
        <p style={{ color: '#F87171', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{error}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate(-1)} className="btn-secondary">Geri Dön</button>
          <button onClick={loadExam} className="btn-primary">
            Tekrar Dene
          </button>
        </div>
      </div>
    </div>
  );

  if (phase === 'ready') return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card animate-fade-in-up" style={{ padding: '2.5rem', maxWidth: '520px', width: '100%' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 12px 32px rgba(124,58,237,0.3)' }}>
          <Trophy size={32} color="white" />
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tc-text)', textAlign: 'center', marginBottom: '0.5rem' }}>
          {session?.exam_title}
        </h1>
        <p style={{ color: 'var(--tc-muted)', textAlign: 'center', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Sınava başlamadan önce kuralları okuyun.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { icon: BookOpen, label: 'Soru Sayısı', val: `${questions.length} soru` },
            { icon: Clock, label: 'Süre', val: session?.time_limit_min > 0 ? `${session.time_limit_min} dakika` : 'Süresiz' },
            { icon: CheckCircle2, label: 'Geçme Notu', val: `%${session?.passing_score ?? 70}` },
            { icon: Trophy, label: 'Deneme', val: `${session?.attempt_no ?? 1}/${session?.max_attempts ?? 3}` },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="card" style={{ padding: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Icon size={18} color="var(--tc-yellow)" />
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--tc-muted)', fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--tc-text)', fontWeight: 700 }}>{val}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,209,0,0.06)', border: '1px solid rgba(255,209,0,0.15)', borderRadius: '10px', padding: '0.9rem 1.1rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--tc-muted)', lineHeight: 1.6 }}>
          ⚠️ Süre dolduğunda cevaplarınız otomatik gönderilir. Sınav sırasında sayfayı kapatmayın.
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => navigate(-1)} className="btn-ghost" style={{ flex: 1 }}>Vazgeç</button>
          <button onClick={() => setPhase('started')} className="btn-primary" style={{ flex: 2, fontSize: '1rem', padding: '0.85rem' }}>
            <Trophy size={18} /> Sınava Başla
          </button>
        </div>
      </div>
    </div>
  );

  // ── SINAV EKRANI ──────────────────────────────────────────────────────
  const q = questions[currentQ];
  if (!q) return null;
  const questionType = normalizeQuestionType(q);
  const isMulti = questionType === 'MULTI_SELECT' || questionType === 'multi_select' || questionType === 'MULTIPLE_SELECT';
  const selectedChoices = answers[currentQ] || [];
  const choices = q.choices || [];

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--tc-bg)' }}>
      {/* ── Top Bar ── */}
      <div style={{
        position: 'sticky', top: '64px', zIndex: 40,
        background: 'var(--tc-surface)',
        borderBottom: '1px solid var(--tc-border)',
        padding: '0.75rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--tc-muted)', fontWeight: 500, marginBottom: '0.2rem' }}>
            {session?.exam_title}
          </p>
          <div style={{ height: '6px', borderRadius: '99px', background: 'var(--tc-surface2)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '99px',
              width: `${((currentQ + 1) / questions.length) * 100}%`,
              background: 'linear-gradient(90deg, var(--tc-yellow), #E6BC00)',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: timerUrgent ? '#F87171' : 'var(--tc-text)', fontWeight: 700, fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums' }}>
          <Clock size={16} color={timerUrgent ? '#F87171' : 'var(--tc-muted)'} />
          {session?.time_limit_min > 0 ? timerDisplay : '∞'}
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--tc-muted)' }}>
          <span style={{ color: 'var(--tc-text)', fontWeight: 700 }}>{answeredCount}</span>/{questions.length} cevaplandı
        </div>
      </div>

      {/* ── İçerik ── */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 220px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Sol: Soru + Seçenekler */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Soru kartı */}
          <div className="card animate-fade-in" key={currentQ} style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--tc-yellow)' }}>
                  Soru {currentQ + 1} / {questions.length}
                </span>
                <QuestionTypeBadge type={questionType} />
              </div>
              <button
                onClick={() => toggleFlag(currentQ)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.3rem 0.6rem', borderRadius: '6px',
                  background: flagged.has(currentQ) ? 'rgba(251,191,36,0.15)' : 'transparent',
                  border: flagged.has(currentQ) ? '1px solid rgba(251,191,36,0.4)' : '1px solid var(--tc-border)',
                  cursor: 'pointer', fontSize: '0.75rem',
                  color: flagged.has(currentQ) ? '#FBBF24' : 'var(--tc-muted)',
                }}
              >
                <Flag size={13} /> {flagged.has(currentQ) ? 'İşaretlendi' : 'İşaretle'}
              </button>
            </div>

            <p style={{ fontSize: '1.05rem', color: 'var(--tc-text)', lineHeight: 1.65, fontWeight: 500 }}>
              {q.text}
            </p>
          </div>

          {/* Seçenekler */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {isMulti && (
              <p style={{ fontSize: '0.75rem', color: '#A78BFA', marginBottom: '0.25rem' }}>
                💡 Birden fazla seçenek işaretleyebilirsiniz.
              </p>
            )}
            {choices.map((choice) => (
              <ChoiceButton
                key={choice.id}
                choice={choice}
                selected={selectedChoices.includes(choice.id)}
                multiSelect={isMulti}
                onToggle={handleToggle}
              />
            ))}
          </div>

          {/* Alt navigasyon */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
            <button
              onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
              disabled={currentQ === 0}
              className="btn-secondary"
              style={{ opacity: currentQ === 0 ? 0.4 : 1, fontSize: '0.875rem' }}
            >
              <ChevronLeft size={16} /> Önceki
            </button>

            {currentQ < questions.length - 1 ? (
              <button onClick={() => setCurrentQ((p) => p + 1)} className="btn-primary" style={{ fontSize: '0.875rem' }}>
                Sonraki <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', fontSize: '0.875rem', padding: '0.6rem 1.25rem' }}
              >
                {submitting ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Send size={16} />}
                Sınavı Gönder
              </button>
            )}
          </div>

          {submitError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#F87171', fontSize: '0.825rem' }}>
              <AlertCircle size={15} />{submitError}
            </div>
          )}
        </div>

        {/* Sağ: Soru haritası */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '130px' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tc-text)', marginBottom: '1rem' }}>
              Soru Haritası
            </h3>
            <QuestionNav
              total={questions.length}
              current={currentQ}
              answers={answers}
              onGo={setCurrentQ}
            />
            <div className="divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[
                { color: 'var(--tc-yellow)', label: 'Aktif' },
                { color: '#4ADE80', label: 'Cevaplandı' },
                { color: 'var(--tc-muted)', label: 'Boş' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--tc-muted)' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="card" style={{ padding: '1rem', borderColor: 'rgba(251,191,36,0.25)', background: 'rgba(251,191,36,0.05)' }}>
              <p style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 600, marginBottom: '0.25rem' }}>
                ⚠️ {unansweredCount} boş soru
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--tc-muted)' }}>
                Boş sorular 0 puan alır.
              </p>
            </div>
          )}

          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', fontSize: '0.82rem', width: '100%' }}
          >
            {submitting ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Send size={14} />}
            Sınavı Bitir
          </button>
        </div>
      </div>
    </div>
  );
}
