import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { courseAPI } from '../api/axios';

const initialForm = {
  title: '',
  description: '',
  category: '',
  level: 'beginner',
  coverImageUrl: '',
  estimatedDuration: '',
  status: 'draft',
};

export default function CourseFormPage({ mode }) {
  const isAdmin = mode === 'admin';
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(Boolean(courseId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        const res = await courseAPI.detail(courseId);
        setForm({
          title: res.data.title || '',
          description: res.data.description || '',
          category: res.data.category || '',
          level: res.data.level || 'beginner',
          coverImageUrl: res.data.coverImageUrl || res.data.cover_url || '',
          estimatedDuration: res.data.estimatedDuration || '',
          status: res.data.status || 'draft',
        });
      } catch (err) {
        setError(err.response?.data?.detail || 'Kurs bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const validate = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Başlık zorunludur';
    if (!form.description.trim()) errors.description = 'Açıklama zorunludur';
    if (!form.category.trim()) errors.category = 'Kategori zorunludur';
    if (!form.level) errors.level = 'Seviye zorunludur';
    if (!Number(form.estimatedDuration) || Number(form.estimatedDuration) <= 0) errors.estimatedDuration = 'Tahmini süre sayı olmalıdır';
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = { ...form, estimatedDuration: Number(form.estimatedDuration) };
      if (courseId) await courseAPI.update(courseId, payload);
      else {
        const res = await courseAPI.create(payload);
        navigate(`/instructor/courses/${res.data.course_id}/modules`, { replace: true });
        return;
      }
      navigate(isAdmin ? '/admin/courses' : '/instructor/courses', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Kurs kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const change = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  if (loading) return <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 style={{ animation: 'spin 0.7s linear infinite' }} /></div>;

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '1.5rem', background: 'var(--tc-bg)' }}>
      <div className="card animate-fade-in-up" style={{ maxWidth: '760px', margin: '0 auto', padding: '1.5rem' }}>
        <h1 style={{ color: 'var(--tc-text)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem' }}>
          {courseId ? 'Kurs Düzenle' : 'Yeni Kurs Oluştur'}
        </h1>
        {error && <div style={{ color: '#F87171', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}><AlertCircle size={16} />{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          {[
            ['title', 'Başlık'],
            ['category', 'Kategori'],
            ['coverImageUrl', 'Kapak Görseli URL'],
            ['estimatedDuration', 'Tahmini Süre (dk)'],
          ].map(([name, label]) => (
            <div key={name}>
              <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>{label}</label>
              <input className="input-field" name={name} value={form[name]} onChange={change} style={{ marginTop: '0.35rem', borderColor: fieldErrors[name] ? '#F87171' : undefined }} />
              {fieldErrors[name] && <p style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '0.3rem' }}>{fieldErrors[name]}</p>}
            </div>
          ))}
          <div>
            <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Açıklama</label>
            <textarea className="input-field" name="description" value={form.description} onChange={change} rows={4} style={{ marginTop: '0.35rem', resize: 'vertical', fontFamily: 'inherit', borderColor: fieldErrors.description ? '#F87171' : undefined }} />
            {fieldErrors.description && <p style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '0.3rem' }}>{fieldErrors.description}</p>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Seviye</label>
              <select className="input-field" name="level" value={form.level} onChange={change} style={{ marginTop: '0.35rem' }}>
                <option value="beginner">Başlangıç</option>
                <option value="intermediate">Orta</option>
                <option value="advanced">İleri</option>
              </select>
            </div>
            <div>
              <label style={{ color: 'var(--tc-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Durum</label>
              <select className="input-field" name="status" value={form.status} onChange={change} style={{ marginTop: '0.35rem' }}>
                <option value="draft">Taslak</option>
                <option value="published">Yayında</option>
                <option value="archived">Arşivlenmiş</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate(isAdmin ? '/admin/courses' : '/instructor/courses')}>Vazgeç</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Save size={16} />} Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
}
