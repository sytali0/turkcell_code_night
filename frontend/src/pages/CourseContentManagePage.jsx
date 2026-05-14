import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, BookOpen, Layers, Loader2, Plus, Settings, Trophy } from 'lucide-react';
import { courseAPI } from '../api/axios';

const moduleInitial = { title: '', description: '', order_index: 1 };
const lessonInitial = { module_id: '', title: '', content: '', estimated_duration_min: 10, order_index: 1 };

export default function CourseContentManagePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [moduleForm, setModuleForm] = useState(moduleInitial);
  const [lessonForm, setLessonForm] = useState(lessonInitial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    const res = await courseAPI.detail(courseId);
    setCourse(res.data);
    const firstModule = res.data.modules?.[0]?.id || '';
    setLessonForm((prev) => ({ ...prev, module_id: prev.module_id || firstModule }));
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (err) {
        setError(err.response?.data?.detail || 'İçerik yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const addModule = async (event) => {
    event.preventDefault();
    if (!moduleForm.title.trim() || !moduleForm.description.trim() || !Number(moduleForm.order_index)) {
      setError('Modül başlığı, açıklaması ve sıra numarası zorunludur.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await courseAPI.createModule(courseId, { ...moduleForm, order_index: Number(moduleForm.order_index) });
      setModuleForm(moduleInitial);
      await load();
      setSuccess('Modül eklendi.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Modül eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const addLesson = async (event) => {
    event.preventDefault();
    if (!lessonForm.module_id || !lessonForm.title.trim() || !lessonForm.content.trim() || !Number(lessonForm.estimated_duration_min) || !Number(lessonForm.order_index)) {
      setError('Ders için modül, başlık, içerik, süre ve sıra numarası zorunludur.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await courseAPI.createLesson(lessonForm.module_id, {
        title: lessonForm.title,
        content: lessonForm.content,
        estimated_duration_min: Number(lessonForm.estimated_duration_min),
        order_index: Number(lessonForm.order_index),
      });
      setLessonForm((prev) => ({ ...lessonInitial, module_id: prev.module_id }));
      await load();
      setSuccess('Ders eklendi.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Ders eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 style={{ animation: 'spin 0.7s linear infinite' }} /></div>;

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '1.5rem', background: 'var(--tc-bg)' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--tc-text)', fontSize: '1.45rem', fontWeight: 800 }}>{course?.title}</h1>
        <p style={{ color: 'var(--tc-muted)', fontSize: '0.85rem', marginTop: '0.25rem', marginBottom: '1rem' }}>Modül ve ders yönetimi</p>
        {error && <div className="card" style={{ color: '#F87171', padding: '0.9rem', marginBottom: '1rem' }}><AlertCircle size={16} /> {error}</div>}
        {success && <div className="card" style={{ color: '#4ADE80', padding: '0.9rem', marginBottom: '1rem' }}>{success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 420px)', gap: '1rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {course?.modules?.map((mod) => (
              <div key={mod.id} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <Layers size={16} color="var(--tc-yellow)" />
                  <div>
                    <strong style={{ color: 'var(--tc-text)' }}>{mod.order}. {mod.title}</strong>
                    <p style={{ color: 'var(--tc-muted)', fontSize: '0.78rem' }}>{mod.description}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {mod.lessons?.map((lesson) => (
                    <div key={lesson.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.55rem 0.7rem', background: 'var(--tc-surface2)', borderRadius: '8px', color: 'var(--tc-muted)', fontSize: '0.8rem' }}>
                      <BookOpen size={14} color="var(--tc-yellow)" />
                      <span style={{ color: 'var(--tc-text)', flex: 1 }}>{lesson.order}. {lesson.title}</span>
                      {lesson.duration_minutes} dk
                    </div>
                  ))}
                  {mod.exams?.map((exam) => (
                    <div key={exam.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.55rem 0.7rem', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.16)', borderRadius: '8px', color: 'var(--tc-muted)', fontSize: '0.8rem' }}>
                      <Trophy size={14} color="#A78BFA" />
                      <span style={{ color: 'var(--tc-text)', flex: 1 }}>{exam.title}</span>
                      <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.55rem' }} onClick={() => navigate(`/instructor/exams/${exam.id}/questions`)}>
                        <Settings size={13} /> Sınav
                      </button>
                    </div>
                  ))}
                  {!mod.exams?.length && (
                    <button className="btn-secondary" style={{ fontSize: '0.8rem', justifyContent: 'center' }} onClick={() => navigate(`/instructor/modules/${mod.id}/exam`)}>
                      <Trophy size={14} /> Modül Sınavı Ekle
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <form onSubmit={addModule} className="card" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
              <h2 style={{ color: 'var(--tc-text)', fontSize: '1rem', fontWeight: 700 }}>Modül Ekle</h2>
              <input className="input-field" placeholder="Başlık" value={moduleForm.title} onChange={(e) => setModuleForm((p) => ({ ...p, title: e.target.value }))} />
              <textarea className="input-field" placeholder="Açıklama" rows={3} value={moduleForm.description} onChange={(e) => setModuleForm((p) => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
              <input className="input-field" type="number" min="1" placeholder="Sıra" value={moduleForm.order_index} onChange={(e) => setModuleForm((p) => ({ ...p, order_index: e.target.value }))} />
              <button className="btn-primary" disabled={saving}><Plus size={15} /> Modül Ekle</button>
            </form>

            <form onSubmit={addLesson} className="card" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
              <h2 style={{ color: 'var(--tc-text)', fontSize: '1rem', fontWeight: 700 }}>Ders Ekle</h2>
              <select className="input-field" value={lessonForm.module_id} onChange={(e) => setLessonForm((p) => ({ ...p, module_id: e.target.value }))}>
                <option value="">Modül seçin</option>
                {course?.modules?.map((mod) => <option key={mod.id} value={mod.id}>{mod.title}</option>)}
              </select>
              <input className="input-field" placeholder="Başlık" value={lessonForm.title} onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))} />
              <textarea className="input-field" placeholder="Metin içeriği" rows={5} value={lessonForm.content} onChange={(e) => setLessonForm((p) => ({ ...p, content: e.target.value }))} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
              <input className="input-field" type="number" min="1" placeholder="Tahmini süre" value={lessonForm.estimated_duration_min} onChange={(e) => setLessonForm((p) => ({ ...p, estimated_duration_min: e.target.value }))} />
              <input className="input-field" type="number" min="1" placeholder="Sıra" value={lessonForm.order_index} onChange={(e) => setLessonForm((p) => ({ ...p, order_index: e.target.value }))} />
              <button className="btn-primary" disabled={saving}><Plus size={15} /> Ders Ekle</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
