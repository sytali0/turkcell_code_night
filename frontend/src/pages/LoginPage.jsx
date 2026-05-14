import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Phone,
  KeyRound,
  User,
  GraduationCap,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { authAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';

// ── Küçük yardımcı bileşenler ─────────────────────────────────────────────

function InputGroup({ label, id, icon: Icon, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label
        htmlFor={id}
        style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tc-muted)', letterSpacing: '0.04em' }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon
            size={16}
            style={{
              position: 'absolute',
              left: '0.9rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: error ? '#F87171' : 'var(--tc-muted)',
              pointerEvents: 'none',
            }}
          />
        )}
        <input
          id={id}
          className="input-field"
          style={{
            paddingLeft: Icon ? '2.5rem' : '1rem',
            borderColor: error ? '#F87171' : undefined,
          }}
          {...props}
        />
      </div>
      {error && (
        <p style={{ fontSize: '0.75rem', color: '#F87171', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function OtpHint() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 0.9rem',
        background: 'rgba(255,209,0,0.08)',
        border: '1px solid rgba(255,209,0,0.2)',
        borderRadius: '8px',
        fontSize: '0.78rem',
        color: 'var(--tc-yellow)',
      }}
    >
      <ShieldCheck size={14} />
      <span>Demo OTP kodu: <strong>1234</strong> (SMS simülasyonu)</span>
    </div>
  );
}

// ── Ana bileşen ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Zaten giriş yapmışsa ana sayfaya at
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    phone_number: '',
    otp_code: '',
    full_name: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.phone_number.trim()) errs.phone_number = 'Telefon numarası zorunludur';
    else if (!/^0[5][0-9]{9}$/.test(form.phone_number.replace(/\s/g, '')))
      errs.phone_number = "Geçerli bir Türkiye numarası girin (05XX...)";
    if (!form.otp_code.trim()) errs.otp_code = 'OTP kodu zorunludur';
    else if (!/^\d{4,6}$/.test(form.otp_code)) errs.otp_code = '4-6 haneli sayısal kod girin';
    if (mode === 'register' && !form.full_name.trim()) errs.full_name = 'Ad Soyad zorunludur';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'register') {
        // Kayıt
        await authAPI.register({
          phone_number: form.phone_number.replace(/\s/g, ''),
          otp_code: form.otp_code,
          full_name: form.full_name,
        });
        setSuccess('Kayıt başarılı! Giriş yapılıyor…');
        // Kayıt sonrası otomatik giriş dene
        const loginRes = await authAPI.login({
          phone_number: form.phone_number.replace(/\s/g, ''),
          otp_code: form.otp_code,
        });
        const { access_token, token_type } = loginRes.data;
        login(access_token, { phone_number: form.phone_number, full_name: form.full_name });
        navigate('/', { replace: true });
      } else {
        // Giriş
        const res = await authAPI.login({
          phone_number: form.phone_number.replace(/\s/g, ''),
          otp_code: form.otp_code,
        });
        const { access_token } = res.data;
        login(access_token, { phone_number: form.phone_number });
        navigate('/', { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (mode === 'register' ? 'Kayıt başarısız. Bilgileri kontrol edin.' : 'Giriş başarısız. Bilgileri kontrol edin.');
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setFieldErrors({});
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Arka plan dekoratif elementler ── */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(0,31,91,0.5) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255,209,0,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="animate-fade-in-up"
        style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}
      >
        {/* ── Logo & Başlık ── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, var(--tc-yellow) 0%, #E6BC00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 12px 32px rgba(255,209,0,0.3)',
            }}
          >
            <GraduationCap size={32} color="var(--tc-navy)" strokeWidth={2.5} />
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--tc-text)',
              letterSpacing: '-0.03em',
              marginBottom: '0.4rem',
            }}
          >
            Edu<span style={{ color: 'var(--tc-yellow)' }}>Cell</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--tc-muted)' }}>
            {mode === 'login' ? 'Hesabına giriş yap' : 'Yeni hesap oluştur'}
          </p>
        </div>

        {/* ── Kart ── */}
        <div
          style={{
            background: 'var(--tc-surface)',
            border: '1px solid var(--tc-border)',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}
        >
          {/* ── Tab switcher ── */}
          <div
            style={{
              display: 'flex',
              gap: '0.25rem',
              background: 'var(--tc-surface2)',
              padding: '0.25rem',
              borderRadius: '12px',
              marginBottom: '1.75rem',
            }}
          >
            {[
              { key: 'login', label: 'Giriş Yap' },
              { key: 'register', label: 'Kayıt Ol' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: mode === key ? 'var(--tc-yellow)' : 'transparent',
                  color: mode === key ? 'var(--tc-navy)' : 'var(--tc-muted)',
                  boxShadow: mode === key ? '0 2px 8px rgba(255,209,0,0.25)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'register' && (
              <div className="animate-fade-in-up">
                <InputGroup
                  label="AD SOYAD"
                  id="full_name"
                  name="full_name"
                  icon={User}
                  type="text"
                  placeholder="Ali Yılmaz"
                  value={form.full_name}
                  onChange={handleChange}
                  error={fieldErrors.full_name}
                  autoComplete="name"
                />
              </div>
            )}

            <InputGroup
              label="TELEFON NUMARASI"
              id="phone_number"
              name="phone_number"
              icon={Phone}
              type="tel"
              placeholder="05321234567"
              value={form.phone_number}
              onChange={handleChange}
              error={fieldErrors.phone_number}
              autoComplete="tel"
              inputMode="numeric"
            />

            <InputGroup
              label="OTP KODU"
              id="otp_code"
              name="otp_code"
              icon={KeyRound}
              type="text"
              placeholder="••••"
              value={form.otp_code}
              onChange={handleChange}
              error={fieldErrors.otp_code}
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
            />

            <OtpHint />

            {/* ── Hata mesajı ── */}
            {error && (
              <div
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.75rem 0.9rem',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '10px',
                  color: '#F87171',
                  fontSize: '0.825rem',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                {error}
              </div>
            )}

            {/* ── Başarı mesajı ── */}
            {success && (
              <div
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 0.9rem',
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: '10px',
                  color: '#4ADE80',
                  fontSize: '0.825rem',
                }}
              >
                <CheckCircle2 size={15} />
                {success}
              </div>
            )}

            {/* ── Submit butonu ── */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.25rem', padding: '0.8rem' }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                  {mode === 'register' ? 'Kayıt yapılıyor…' : 'Giriş yapılıyor…'}
                </>
              ) : (
                <>
                  {mode === 'register' ? (
                    <>
                      <Sparkles size={16} />
                      Hesap Oluştur
                    </>
                  ) : (
                    <>
                      Giriş Yap
                      <ArrowRight size={16} />
                    </>
                  )}
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Alt bilgi ── */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--tc-muted)' }}>
          {mode === 'login' ? (
            <>
              Hesabın yok mu?{' '}
              <button
                onClick={() => switchMode('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--tc-yellow)',
                  fontWeight: 600,
                  fontSize: 'inherit',
                  padding: 0,
                }}
              >
                Kayıt ol
              </button>
            </>
          ) : (
            <>
              Zaten hesabın var mı?{' '}
              <button
                onClick={() => switchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--tc-yellow)',
                  fontWeight: 600,
                  fontSize: 'inherit',
                  padding: 0,
                }}
              >
                Giriş yap
              </button>
            </>
          )}
        </p>

        {/* ── Turkcell branding ── */}
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.72rem', color: '#334155' }}>
          © 2026 Turkcell CodeNight · EduCell Platformu
        </p>
      </div>
    </div>
  );
}
