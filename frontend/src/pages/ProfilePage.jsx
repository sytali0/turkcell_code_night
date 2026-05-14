import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Save, User } from 'lucide-react';
import { authAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';

function roleLabel(role) {
  const labels = {
    student: 'Öğrenci',
    instructor: 'Eğitmen',
    admin: 'Admin',
  };
  return labels[role] || role || 'Kullanıcı';
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tc-muted)', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: '0.75rem', color: '#F87171', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const location = useLocation();
  const { user, updateUser, refreshUser } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    expertise: '',
    interests: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        bio: user.bio || '',
        expertise: user.expertise || '',
        interests: user.interests || '',
      });
    }
  }, [user]);

  useEffect(() => {
    refreshUser().catch(() => undefined);
  }, [refreshUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.full_name.trim()) {
      setFieldErrors({ full_name: 'Ad alanı boş bırakılamaz' });
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        full_name: form.full_name,
        bio: form.bio,
        expertise: user?.role === 'instructor' ? form.expertise : null,
        interests: user?.role === 'student' ? form.interests : null,
      };
      const res = await authAPI.updateMe(payload);
      updateUser(res.data);
      setSuccess('Profil bilgileri güncellendi.');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Profil güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div className="card animate-fade-in-up" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'var(--tc-yellow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User size={24} color="var(--tc-navy)" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--tc-text)', marginBottom: '0.2rem' }}>
                Profil
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--tc-muted)' }}>
                {roleLabel(user?.role)} hesabı
              </p>
            </div>
          </div>

          {location.state?.unauthorized && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0.9rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#F87171', fontSize: '0.825rem', marginBottom: '1rem' }}>
              <AlertCircle size={15} /> Bu sayfaya erişim için rolünüz yetkili değil.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="AD" error={fieldErrors.full_name}>
              <input
                className="input-field"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Ad Soyad"
                style={{ borderColor: fieldErrors.full_name ? '#F87171' : undefined }}
              />
            </Field>

            <Field label="BİYOGRAFİ">
              <textarea
                className="input-field"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Kısa biyografiniz"
                rows={4}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </Field>

            {user?.role === 'instructor' && (
              <Field label="UZMANLIK ALANLARI">
                <textarea
                  className="input-field"
                  name="expertise"
                  value={form.expertise}
                  onChange={handleChange}
                  placeholder="Python, Siber Güvenlik, Mobil Geliştirme"
                  rows={3}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </Field>
            )}

            {user?.role === 'student' && (
              <Field label="İLGİ ALANLARI">
                <textarea
                  className="input-field"
                  name="interests"
                  value={form.interests}
                  onChange={handleChange}
                  placeholder="Yazılım, veri bilimi, mobil uygulama"
                  rows={3}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </Field>
            )}

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0.9rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#F87171', fontSize: '0.825rem' }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            {success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0.9rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', color: '#4ADE80', fontSize: '0.825rem' }}>
                <CheckCircle2 size={15} /> {success}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? (
                  <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                ) : (
                  <Save size={16} />
                )}
                Kaydet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
