import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Edit3, Loader2, Plus, Save, Trash2, Trophy } from 'lucide-react';
import { examAPI } from '../api/axios';

const QUESTION_TYPES = [
  { value: 'MULTIPLE_CHOICE', label: 'Çoktan Seçmeli' },
  { value: 'TRUE_FALSE', label: 'Doğru / Yanlış' },
  { value: 'MULTI_SELECT', label: 'Çoklu Seçim' },
];

function defaultOptions(type) {
  if (type === 'TRUE_FALSE') {
    return [
      { id: 'A', text: 'Doğru', is_correct: true },
      { id: 'B', text: 'Yanlış', is_correct: false },
    ];
  }
  return ['A', 'B', 'C', 'D'].map((id, index) => ({
    id,
    text: '',
    is_correct: type === 'MULTI_SELECT' ? index === 0 : index === 0,
  }));
}

function normalizeType(type) {
  if (type === 'multiple_choice') return 'MULTIPLE_CHOICE';
  if (type === 'true_false') return 'TRUE_FALSE';
  if (type === 'multi_select' || type === 'MULTIPLE_SELECT') return 'MULTI_SELECT';
  return type || 'MULTIPLE_CHOICE';
}

function initialQuestion(orderIndex = 1) {
  return {
    text: '',
    question_type: 'MULTIPLE_CHOICE',
    order_index: orderIndex,
    points: 1,
    explanation: '',
    options: defaultOptions('MULTIPLE_CHOICE'),
  };
}

function toQuestionForm(question) {
  const type = normalizeType(question.type || question.question_type);
  const options = (question.options || question.choices || defaultOptions(type)).map((option, index) => ({
    id: option.id || String.fromCharCode(65 + index),
    text: option.text || '',
    is_correct: Boolean(option.is_correct),
  }));
  return {
    id: question.id,
    text: question.text || '',
    question_type: type,
    order_index: question.order_index || question.order || 1,
    points: question.points || question.options?.[0]?.points || 1,
    explanation: question.explanation || question.options?.find((item) => item.explanation)?.explanation || '',
    options,
  };
}

export default function ExamQuestionsPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(initialQuestion());
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const nextOrder = useMemo(() => questions.length + 1, [questions.length]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await examAPI.questions(examId);
      setExam(res.data.exam);
      setQuestions(res.data.questions || []);
      setForm((prev) => (editingId ? prev : initialQuestion((res.data.questions?.length || 0) + 1)));
    } catch (err) {
      setError(err.response?.data?.detail || 'Sorular yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [examId, editingId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateType = (type) => {
    setForm((prev) => ({ ...prev, question_type: type, options: defaultOptions(type) }));
  };

  const updateOption = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? { ...option, [field]: value } : option)),
    }));
  };

  const updateCorrect = (index, checked) => {
    setForm((prev) => {
      const singleAnswer = prev.question_type === 'MULTIPLE_CHOICE' || prev.question_type === 'TRUE_FALSE';
      return {
        ...prev,
        options: prev.options.map((option, i) => ({
          ...option,
          is_correct: singleAnswer ? i === index : i === index ? checked : option.is_correct,
        })),
      };
    });
  };

  const validate = () => {
    if (!form.text.trim()) return 'Soru metni zorunludur.';
    if (Number(form.order_index) < 1) return 'Soru sırası en az 1 olmalıdır.';
    if (Number(form.points) <= 0) return 'Puan 0’dan büyük olmalıdır.';
    const filledOptions = form.options.filter((option) => option.text.trim());
    const correctCount = form.options.filter((option) => option.is_correct).length;
    if (form.question_type === 'MULTIPLE_CHOICE' && filledOptions.length !== 4) return 'Çoktan seçmeli soruda tam 4 şık olmalıdır.';
    if (form.question_type === 'MULTIPLE_CHOICE' && correctCount !== 1) return 'Çoktan seçmeli soruda tek doğru cevap seçin.';
    if (form.question_type === 'TRUE_FALSE' && form.options.length !== 2) return 'Doğru/Yanlış sorusunda iki seçenek olmalıdır.';
    if (form.question_type === 'TRUE_FALSE' && correctCount !== 1) return 'Doğru/Yanlış sorusunda tek doğru cevap seçin.';
    if (form.question_type === 'MULTI_SELECT' && filledOptions.length < 2) return 'Çoklu seçim sorusunda en az 2 şık olmalıdır.';
    if (form.question_type === 'MULTI_SELECT' && correctCount < 1) return 'Çoklu seçim sorusunda en az 1 doğru cevap seçin.';
    return '';
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialQuestion(nextOrder));
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    const payload = {
      text: form.text.trim(),
      question_type: form.question_type,
      order_index: Number(form.order_index),
      points: Number(form.points),
      explanation: form.explanation.trim(),
      options: form.options.map((option) => ({
        id: option.id,
        text: option.text.trim(),
        is_correct: Boolean(option.is_correct),
      })),
    };

    try {
      if (editingId) {
        await examAPI.updateQuestion(editingId, payload);
        setSuccess('Soru güncellendi.');
      } else {
        await examAPI.createQuestion(examId, payload);
        setSuccess('Soru eklendi.');
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Soru kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const editQuestion = (question) => {
    const normalized = toQuestionForm(question);
    setEditingId(question.id);
    setForm(normalized);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeQuestion = async (questionId) => {
    if (!window.confirm('Bu soruyu silmek istiyor musunuz?')) return;
    setError('');
    try {
      await examAPI.deleteQuestion(questionId);
      setSuccess('Soru silindi.');
      if (editingId === questionId) resetForm();
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Soru silinemedi.');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '1.5rem', background: 'var(--tc-bg)' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} className="btn-ghost" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={15} /> Geri
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(340px, 440px)', gap: '1rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ color: 'var(--tc-text)', fontSize: '1.35rem', fontWeight: 800 }}>{exam?.title}</h1>
                <p style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {exam?.course_title} · {exam?.module_title} · {questions.length} soru
                </p>
              </div>
              <button className="btn-secondary" onClick={() => navigate(`/instructor/exams/${examId}/edit`)}>
                <Trophy size={15} /> Ayarlar
              </button>
            </div>

            {error && <div className="card" style={{ padding: '0.8rem', color: '#F87171', display: 'flex', gap: '0.5rem' }}><AlertCircle size={16} />{error}</div>}
            {success && <div className="card" style={{ padding: '0.8rem', color: '#4ADE80', display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} />{success}</div>}

            {questions.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--tc-muted)' }}>
                Henüz soru eklenmemiş.
              </div>
            ) : questions.map((question) => (
              <div key={question.id} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <span className="badge badge-yellow">{question.order_index || question.order}. {normalizeType(question.type)}</span>
                    <h3 style={{ color: 'var(--tc-text)', fontSize: '0.98rem', marginTop: '0.55rem', lineHeight: 1.5 }}>{question.text}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn-secondary" onClick={() => editQuestion(question)} style={{ fontSize: '0.78rem' }}><Edit3 size={13} /> Düzenle</button>
                    <button className="btn-ghost" onClick={() => removeQuestion(question.id)} style={{ fontSize: '0.78rem', color: '#F87171' }}><Trash2 size={13} /> Sil</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.8rem' }}>
                  {(question.options || []).map((option) => (
                    <div key={option.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.6rem', background: 'var(--tc-surface2)', borderRadius: '8px', color: option.is_correct ? '#4ADE80' : 'var(--tc-muted)', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 700 }}>{option.id}</span>
                      <span style={{ flex: 1, color: 'var(--tc-text)' }}>{option.text}</span>
                      {option.is_correct && <CheckCircle2 size={14} />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="card" style={{ padding: '1rem', display: 'grid', gap: '0.75rem', position: 'sticky', top: '84px' }}>
            <h2 style={{ color: 'var(--tc-text)', fontSize: '1rem', fontWeight: 700 }}>
              {editingId ? 'Soruyu Düzenle' : 'Soru Ekle'}
            </h2>

            <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
              Soru Tipi
              <select className="input-field" value={form.question_type} onChange={(e) => updateType(e.target.value)} style={{ marginTop: '0.35rem' }}>
                {QUESTION_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </label>

            <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
              Soru Metni
              <textarea className="input-field" rows={4} value={form.text} onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))} style={{ marginTop: '0.35rem', resize: 'vertical', fontFamily: 'inherit' }} />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                Sıra
                <input className="input-field" type="number" min="1" value={form.order_index} onChange={(e) => setForm((prev) => ({ ...prev, order_index: e.target.value }))} style={{ marginTop: '0.35rem' }} />
              </label>
              <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                Puan
                <input className="input-field" type="number" min="0.1" step="0.1" value={form.points} onChange={(e) => setForm((prev) => ({ ...prev, points: e.target.value }))} style={{ marginTop: '0.35rem' }} />
              </label>
            </div>

            <div style={{ display: 'grid', gap: '0.55rem' }}>
              {form.options.map((option, index) => (
                <div key={option.id} style={{ display: 'grid', gridTemplateColumns: '26px minmax(0, 1fr) 28px', gap: '0.45rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--tc-yellow)', fontWeight: 800, fontSize: '0.82rem' }}>{option.id}</span>
                  <input
                    className="input-field"
                    value={option.text}
                    disabled={form.question_type === 'TRUE_FALSE'}
                    placeholder={`${option.id} şıkkı`}
                    onChange={(e) => updateOption(index, 'text', e.target.value)}
                  />
                  <input
                    type={form.question_type === 'MULTI_SELECT' ? 'checkbox' : 'radio'}
                    name="correct-option"
                    checked={option.is_correct}
                    onChange={(e) => updateCorrect(index, e.target.checked)}
                  />
                </div>
              ))}
            </div>

            <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
              Açıklama / Geri Bildirim
              <textarea className="input-field" rows={3} value={form.explanation} onChange={(e) => setForm((prev) => ({ ...prev, explanation: e.target.value }))} style={{ marginTop: '0.35rem', resize: 'vertical', fontFamily: 'inherit' }} />
            </label>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {editingId && <button type="button" className="btn-secondary" onClick={resetForm} style={{ flex: 1 }}>Vazgeç</button>}
              <button className="btn-primary" disabled={saving} style={{ flex: 2 }}>
                {saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : editingId ? <Save size={15} /> : <Plus size={15} />}
                {editingId ? 'Kaydet' : 'Soru Ekle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
