import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Shield, CheckCircle2, XCircle, Search, Loader2,
  GraduationCap, Award, Calendar, User,
} from 'lucide-react';
import { certificateAPI } from '../api/axios';

export default function VerifyCertificatePage() {
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get('number') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // URL'de number parametresi varsa otomatik doğrula
  useEffect(() => {
    const num = searchParams.get('number');
    if (num && num.trim()) {
      handleVerify(num.trim());
    }
  }, []);

  const handleVerify = async (certNum) => {
    const target = (certNum ?? input).trim();
    if (!target) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await certificateAPI.verify(target);
      setResult(res.data);
    } catch (err) {
      setResult({
        valid: false,
        certificateNumber: target,
        message: err.response?.data?.detail || 'Sertifika bulunamadı veya geçersiz.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify(input);
  };

  const date = result?.issuedAt ? new Date(result.issuedAt).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }) : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--tc-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3rem 1.5rem',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2.5rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'var(--tc-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GraduationCap size={22} color="var(--tc-navy)" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--tc-text)' }}>
          Edu<span style={{ color: 'var(--tc-yellow)' }}>Cell</span>
          <span style={{ fontSize: '0.62rem', color: 'var(--tc-muted)', fontWeight: 400, marginLeft: '5px' }}>by Turkcell</span>
        </span>
      </div>

      <div style={{ width: '100%', maxWidth: '560px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '64px', height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(255,209,0,0.15), rgba(255,209,0,0.05))',
            border: '2px solid rgba(255,209,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <Shield size={30} color="var(--tc-yellow)" />
          </div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--tc-text)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Sertifika Doğrulama
          </h1>
          <p style={{ color: 'var(--tc-muted)', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
            EduCell sertifikasının geçerliliğini doğrulamak için sertifika numarasını girin.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--tc-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Sertifika Numarası
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="EDUCELL-2026-XXXXXX"
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1.5px solid var(--tc-border)',
                background: 'var(--tc-surface2)',
                color: 'var(--tc-text)',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--tc-yellow)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--tc-border)')}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !input.trim()}
              style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}
            >
              {loading ? (
                <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <><Search size={15} /> Doğrula</>
              )}
            </button>
          </div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--tc-muted)' }}>
            Örnek: <code style={{ fontFamily: 'monospace', color: 'var(--tc-yellow)' }}>EDUCELL-2026-A8F42C</code>
          </p>
        </form>

        {/* Result */}
        {searched && !loading && result && (
          <div
            className="card animate-fade-in-up"
            style={{
              marginTop: '1.25rem',
              padding: 0,
              overflow: 'hidden',
              border: result.valid
                ? '1.5px solid rgba(74,222,128,0.3)'
                : '1.5px solid rgba(248,113,113,0.3)',
            }}
          >
            {/* Status bar */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: result.valid
                ? 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(74,222,128,0.04))'
                : 'linear-gradient(135deg, rgba(248,113,113,0.1), rgba(248,113,113,0.04))',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              {result.valid ? (
                <CheckCircle2 size={22} color="#4ADE80" />
              ) : (
                <XCircle size={22} color="#F87171" />
              )}
              <div>
                <p style={{ fontWeight: 700, color: result.valid ? '#4ADE80' : '#F87171', fontSize: '0.95rem' }}>
                  {result.valid ? '✅ Sertifika Geçerli' : '❌ Geçersiz Sertifika'}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--tc-muted)', marginTop: '0.1rem' }}>
                  {result.message}
                </p>
              </div>
            </div>

            {/* Details */}
            {result.valid && (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { icon: <User size={15} color="var(--tc-yellow)" />, label: 'Sertifika Sahibi', value: result.userName },
                  { icon: <Award size={15} color="var(--tc-yellow)" />, label: 'Kurs', value: result.courseName },
                  { icon: <Calendar size={15} color="var(--tc-yellow)" />, label: 'Verilme Tarihi', value: date },
                  { icon: <Shield size={15} color="#4ADE80" />, label: 'Sertifika No', value: result.certificateNumber, mono: true, color: '#4ADE80' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ marginTop: '2px' }}>{item.icon}</div>
                    <div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--tc-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.15rem' }}>
                        {item.label}
                      </p>
                      <p style={{
                        fontWeight: 700,
                        color: item.color || 'var(--tc-text)',
                        fontFamily: item.mono ? 'monospace' : 'inherit',
                        fontSize: item.mono ? '0.85rem' : '0.95rem',
                      }}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--tc-muted)' }}>
          Bu sayfa kamuya açıktır. Giriş gerektirmez.
        </p>
      </div>
    </div>
  );
}
