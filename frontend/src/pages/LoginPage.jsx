import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { authAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';

function defaultPathForRole(role) {
  if (role === 'instructor') return '/instructor/courses';
  if (role === 'admin') return '/admin/courses';
  return '/';
}

function normalizePhoneInput(value) {
  const cleaned = value.replace(/[\s\-()]/g, '');
  return cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
}

function InputGroup({ label, id, icon: Icon, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label htmlFor={id} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tc-muted)', letterSpacing: '0.04em' }}>
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
          style={{ paddingLeft: Icon ? '2.5rem' : '1rem', borderColor: error ? '#F87171' : undefined }}
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

function SelectGroup({ label, id, error, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label htmlFor={id} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tc-muted)', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <select
        id={id}
        className="input-field"
        style={{ borderColor: error ? '#F87171' : undefined }}
        {...props}
      >
        {children}
      </select>
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
      <span>Demo OTP kodu: <strong>1234</strong></span>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, user } = useAuth();

  const [mode, setMode] = useState('login');
  const [registerStep, setRegisterStep] = useState('details');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    phone_number: '',
    otp_code: '',
    full_name: '',
    role: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || defaultPathForRole(user?.role);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, location.state, navigate, user]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setRegisterStep('details');
    setError('');
    setSuccess('');
    setFieldErrors({});
    setForm((prev) => ({ ...prev, otp_code: '' }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  const validate = () => {
    const errors = {};
    const phone = normalizePhoneInput(form.phone_number);
    const requiresOtp = mode === 'login' || registerStep === 'otp';

    if (!phone) errors.phone_number = 'GSM numarası zorunludur';
    else if (!/^(05[0-9]{9}|90[5][0-9]{9})$/.test(phone)) {
      errors.phone_number = 'Geçerli bir Turkcell GSM numarası girin';
    }

    if (mode === 'register') {
      if (!form.full_name.trim()) errors.full_name = 'Ad Soyad zorunludur';
      if (!form.role) errors.role = 'Rol seçimi zorunludur';
    }

    if (requiresOtp) {
      if (!form.otp_code.trim()) errors.otp_code = 'OTP kodu zorunludur';
      else if (!/^[0-9]{4}$/.test(form.otp_code)) errors.otp_code = 'OTP 4 haneli olmalıdır';
    }

    return errors;
  };

  const finishWithToken = (token, nextUser) => {
    login(token, nextUser);
    const from = location.state?.from?.pathname || defaultPathForRole(nextUser?.role);
    navigate(from, { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (mode === 'register' && registerStep === 'details') {
      setRegisterStep('otp');
      setSuccess('OTP doğrulama adımına geçildi. Demo kodu: 1234');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const phone = normalizePhoneInput(form.phone_number);

      if (mode === 'register') {
        await authAPI.verifyOtp({ phone_number: phone, otp_code: form.otp_code });
        const registerRes = await authAPI.register({
          phone_number: phone,
          otp_code: form.otp_code,
          full_name: form.full_name,
          role: form.role,
        });

        if (registerRes.data.access_token) {
          finishWithToken(registerRes.data.access_token, registerRes.data.user);
          return;
        }

        const loginRes = await authAPI.login({ phone_number: phone, otp_code: form.otp_code });
        finishWithToken(loginRes.data.access_token, loginRes.data.user);
        return;
      }

      const res = await authAPI.login({ phone_number: phone, otp_code: form.otp_code });
      finishWithToken(res.data.access_token, res.data.user);
    } catch (err) {
      const fallback = mode === 'register'
        ? 'Kayıt başarısız. Bilgileri kontrol edin.'
        : 'Giriş başarısız. Bilgileri kontrol edin.';
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : fallback);
    } finally {
      setLoading(false);
    }
  };

  const isRegisterOtp = mode === 'register' && registerStep === 'otp';

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

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--tc-text)', letterSpacing: '-0.03em', marginBottom: '0.4rem' }}>
            Edu<span style={{ color: 'var(--tc-yellow)' }}>Cell</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--tc-muted)' }}>
            {mode === 'login' ? 'Hesabına giriş yap' : isRegisterOtp ? 'OTP doğrulama' : 'Yeni hesap oluştur'}
          </p>
        </div>

        <div
          style={{
            background: 'var(--tc-surface)',
            border: '1px solid var(--tc-border)',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--tc-surface2)', padding: '0.25rem', borderRadius: '12px', marginBottom: '1.75rem' }}>
            {[
              { key: 'login', label: 'Giriş Yap' },
              { key: 'register', label: 'Kayıt Ol' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                type="button"
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: mode === key ? 'var(--tc-yellow)' : 'transparent',
                  color: mode === key ? 'var(--tc-navy)' : 'var(--tc-muted)',
                  boxShadow: mode === key ? '0 2px 8px rgba(255,209,0,0.25)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'register' && !isRegisterOtp && (
              <>
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
                <SelectGroup
                  label="ROL"
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  error={fieldErrors.role}
                >
                  <option value="">Rol seçin</option>
                  <option value="student">Öğrenci</option>
                  <option value="instructor">Eğitmen</option>
                  <option value="admin">Admin</option>
                </SelectGroup>
              </>
            )}

            {!isRegisterOtp && (
              <InputGroup
                label="GSM NUMARASI"
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
            )}

            {isRegisterOtp && (
              <div style={{ padding: '0.85rem 1rem', border: '1px solid var(--tc-border)', borderRadius: '10px', background: 'var(--tc-surface2)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--tc-muted)', marginBottom: '0.25rem' }}>GSM</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--tc-text)', fontWeight: 700 }}>{form.phone_number}</p>
              </div>
            )}

            {(mode === 'login' || isRegisterOtp) && (
              <>
                <InputGroup
                  label="OTP KODU"
                  id="otp_code"
                  name="otp_code"
                  icon={KeyRound}
                  type="text"
                  placeholder="1234"
                  value={form.otp_code}
                  onChange={handleChange}
                  error={fieldErrors.otp_code}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={4}
                />
                <OtpHint />
              </>
            )}

            {error && (
              <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem 0.9rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#F87171', fontSize: '0.825rem' }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                {error}
              </div>
            )}

            {success && (
              <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0.9rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', color: '#4ADE80', fontSize: '0.825rem' }}>
                <CheckCircle2 size={15} />
                {success}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {isRegisterOtp && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setRegisterStep('details');
                    setSuccess('');
                    setError('');
                  }}
                  style={{ flex: 1 }}
                >
                  <ArrowLeft size={16} /> Geri
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, width: '100%', padding: '0.8rem' }}>
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                    İşleniyor...
                  </>
                ) : mode === 'register' && !isRegisterOtp ? (
                  <>
                    OTP'ye Geç <ArrowRight size={16} />
                  </>
                ) : mode === 'register' ? (
                  <>
                    <Sparkles size={16} /> Hesap Oluştur
                  </>
                ) : (
                  <>
                    Giriş Yap <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--tc-muted)' }}>
          {mode === 'login' ? (
            <>
              Hesabın yok mu?{' '}
              <button onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tc-yellow)', fontWeight: 600, fontSize: 'inherit', padding: 0 }}>
                Kayıt ol
              </button>
            </>
          ) : (
            <>
              Zaten hesabın var mı?{' '}
              <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tc-yellow)', fontWeight: 600, fontSize: 'inherit', padding: 0 }}>
                Giriş yap
              </button>
            </>
          )}
        </p>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.72rem', color: '#334155' }}>
          © 2026 Turkcell CodeNight · EduCell Platformu
        </p>
      </div>
    </div>
  );
}
