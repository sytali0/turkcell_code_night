import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Save, Trophy } from 'lucide-react';
import { examAPI } from '../api/axios';

const initialForm = {
  title: '',
  description: '',
  time_limit_min: 20,
  passing_score: 60,
  question_count: 10,
  shuffle: false,
  max_attempts: 3,
};

function toForm(exam) {
  return {
    title: exam?.title || '',
    description: exam?.description || '',
    time_limit_min: exam?.time_limit_min || exam?.durationMinutes || 20,
    passing_score: exam?.passing_score || exam?.passingScore || 60,
    question_count: exam?.question_count || exam?.questionCount || 10,
    shuffle: Boolean(exam?.shuffle ?? exam?.shuffleQuestions ?? false),
    max_attempts: exam?.max_attempts || exam?.maxAttempts || 3,
  };
}

export default function ExamManagePage() {
  const { moduleId, examId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [exam, setExam] = useState(null);
  const [moduleInfo, setModuleInfo] = useState(null);
  const [loading, setLoading] = useState(Boolean(moduleId || examId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (moduleId) {
          const res = await examAPI.moduleExam(moduleId);
          setModuleInfo(res.data.module);
          if (res.data.exam) {
            setExam(res.data.exam);
            setForm(toForm(res.data.exam));
          }
        } else if (examId) {
          const res = await examAPI.questions(examId);
          setExam(res.data.exam);
          setForm(toForm(res.data.exam));
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Sınav bilgisi yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [moduleId, examId]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.title.trim()) return 'Sınav başlığı zorunludur.';
    if (Number(form.time_limit_min) < 1) return 'Süre limiti 1 dakikadan büyük olmalıdır.';
    if (Number(form.passing_score) < 0 || Number(form.passing_score) > 100) return 'Geçme notu 0-100 arasında olmalıdır.';
    if (Number(form.question_count) < 1) return 'Soru sayısı en az 1 olmalıdır.';
    if (Number(form.max_attempts) < 1) return 'Deneme hakkı en az 1 olmalıdır.';
    return '';
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
      title: form.title.trim(),
      description: form.description.trim(),
      time_limit_min: Number(form.time_limit_min),
      passing_score: Number(form.passing_score),
      question_count: Number(form.question_count),
      shuffle: Boolean(form.shuffle),
      max_attempts: Number(form.max_attempts),
    };

    try {
      const res = exam?.id || examId
        ? await examAPI.update(exam?.id || examId, payload)
        : await examAPI.createForModule(moduleId, payload);
      setExam(res.data);
      setSuccess('Sınav ayarları kaydedildi.');
      setTimeout(() => navigate(`/instructor/exams/${res.data.id}/questions`), 500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Sınav kaydedilemedi.');
    } finally {
      setSaving(false);
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
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} className="btn-ghost" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={15} /> Geri
        </button>

        <form onSubmit={submit} className="card animate-fade-in-up" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Trophy size={22} color="var(--tc-yellow)" />
            <div>
              <h1 style={{ color: 'var(--tc-text)', fontSize: '1.35rem', fontWeight: 800 }}>
                {exam?.id || examId ? 'Sınav Ayarlarını Düzenle' : 'Modül Sınavı Oluştur'}
              </h1>
              <p style={{ color: 'var(--tc-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                {moduleInfo?.title || exam?.module_title || 'Modül'} için sınav konfigürasyonu
              </p>
            </div>
          </div>

          {error && <div className="card" style={{ padding: '0.8rem', color: '#F87171', display: 'flex', gap: '0.5rem' }}><AlertCircle size={16} />{error}</div>}
          {success && <div className="card" style={{ padding: '0.8rem', color: '#4ADE80', display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} />{success}</div>}

          <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            Başlık
            <input className="input-field" value={form.title} onChange={(e) => update('title', e.target.value)} style={{ marginTop: '0.35rem' }} />
          </label>

          <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            Açıklama
            <textarea className="input-field" rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} style={{ marginTop: '0.35rem', resize: 'vertical', fontFamily: 'inherit' }} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.8rem' }}>
            <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
              Süre (dk)
              <input className="input-field" type="number" min="1" value={form.time_limit_min} onChange={(e) => update('time_limit_min', e.target.value)} style={{ marginTop: '0.35rem' }} />
            </label>
            <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
              Geçme Notu (%)
              <input className="input-field" type="number" min="0" max="100" value={form.passing_score} onChange={(e) => update('passing_score', e.target.value)} style={{ marginTop: '0.35rem' }} />
            </label>
            <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
              Soru Sayısı
              <input className="input-field" type="number" min="1" value={form.question_count} onChange={(e) => update('question_count', e.target.value)} style={{ marginTop: '0.35rem' }} />
            </label>
            <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
              Deneme Hakkı
              <input className="input-field" type="number" min="1" value={form.max_attempts} onChange={(e) => update('max_attempts', e.target.value)} style={{ marginTop: '0.35rem' }} />
            </label>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--tc-text)', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={form.shuffle} onChange={(e) => update('shuffle', e.target.checked)} />
            Soruları karıştır
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
            {exam?.id && (
              <button type="button" className="btn-secondary" onClick={() => navigate(`/instructor/exams/${exam.id}/questions`)}>
                Soruları Yönet
              </button>
            )}
            <button className="btn-primary" disabled={saving}>
              {saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Save size={15} />}
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
