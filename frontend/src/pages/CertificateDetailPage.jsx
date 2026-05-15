import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award, Calendar, GraduationCap, Shield, Share2, Printer,
  ArrowLeft, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { certificateAPI } from '../api/axios';

export default function CertificateDetailPage() {
  const { certificateNumber } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await certificateAPI.detail(certificateNumber);
        setCert(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Sertifika yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [certificateNumber]);

  const handleShare = () => {
    const url = `${window.location.origin}/verify-certificate?number=${certificateNumber}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePrint = () => window.print();

  const date = cert?.issued_at ? new Date(cert.issued_at).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }) : '-';

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
      <Loader2 size={36} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--tc-yellow)' }} />
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1.5rem' }}>
      <div className="card" style={{ padding: '1.5rem', color: '#F87171', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <AlertCircle size={22} /> {error}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--tc-bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Back + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => navigate('/certificates')}
          >
            <ArrowLeft size={14} /> Geri Dön
          </button>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={handlePrint}
            >
              <Printer size={14} /> Yazdır
            </button>
            <button
              className="btn-primary"
              style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={handleShare}
            >
              {copied ? <><CheckCircle2 size={14} /> Kopyalandı!</> : <><Share2 size={14} /> Paylaş</>}
            </button>
          </div>
        </div>

        {/* Certificate Card */}
        <div
          id="certificate-card"
          className="card"
          style={{
            padding: 0, overflow: 'hidden',
            border: '2px solid rgba(255,209,0,0.3)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
          }}
        >
          {/* Top banner */}
          <div style={{
            background: 'linear-gradient(135deg, var(--tc-navy) 0%, #0A2244 50%, #0D2B5E 100%)',
            padding: '2.5rem 2.5rem 2rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decoration circles */}
            {[[-60, -60, 200], [null, -60, 180, { right: '-60px' }]].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: typeof _ === 'object' ? _[0] ?? undefined : _[0],
                left: i === 0 ? '-60px' : undefined,
                right: i === 1 ? '-60px' : undefined,
                width: '200px', height: '200px',
                borderRadius: '50%',
                background: 'rgba(255,209,0,0.05)',
                pointerEvents: 'none',
              }} />
            ))}

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'var(--tc-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={22} color="var(--tc-navy)" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                Edu<span style={{ color: 'var(--tc-yellow)' }}>Cell</span>
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 400, marginLeft: '4px' }}>by Turkcell</span>
              </span>
            </div>

            {/* Award icon */}
            <div style={{
              width: '80px', height: '80px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, var(--tc-yellow), #E6BC00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 8px 32px rgba(255,209,0,0.4)',
            }}>
              <Award size={42} color="var(--tc-navy)" strokeWidth={1.5} />
            </div>

            <p style={{ fontSize: '0.75rem', color: 'rgba(255,209,0,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.75rem' }}>
              Bu belge onaylar ki
            </p>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              {cert?.user_name}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              aşağıdaki kursu başarıyla tamamlamıştır
            </p>
          </div>

          {/* Course name */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,209,0,0.08), rgba(255,209,0,0.03))',
            borderTop: '1px solid rgba(255,209,0,0.15)',
            borderBottom: '1px solid rgba(255,209,0,0.15)',
            padding: '1.75rem 2.5rem',
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--tc-text)', lineHeight: 1.4 }}>
              {cert?.course_name}
            </h2>
          </div>

          {/* Details */}
          <div style={{ padding: '2rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--tc-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Verildiği Tarih
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--tc-text)' }}>
                  <Calendar size={15} color="var(--tc-yellow)" />
                  <span style={{ fontWeight: 600 }}>{date}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--tc-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Sertifika No
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={15} color="#4ADE80" />
                  <code style={{ fontFamily: 'monospace', color: '#4ADE80', fontSize: '0.85rem', fontWeight: 700 }}>
                    {cert?.certificate_number}
                  </code>
                </div>
              </div>
            </div>

            {/* Verify link */}
            <div style={{
              marginTop: '1.5rem',
              padding: '0.875rem 1.25rem',
              borderRadius: '10px',
              background: 'rgba(74,222,128,0.06)',
              border: '1px solid rgba(74,222,128,0.15)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <CheckCircle2 size={18} color="#4ADE80" />
              <div>
                <p style={{ fontSize: '0.8rem', color: '#4ADE80', fontWeight: 600 }}>Doğrulanmış Sertifika</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--tc-muted)', marginTop: '0.1rem' }}>
                  Doğrulama adresi:{' '}
                  <a
                    href={`/verify-certificate?number=${cert?.certificate_number}`}
                    style={{ color: 'var(--tc-yellow)', textDecoration: 'none' }}
                    target="_blank"
                    rel="noreferrer"
                  >
                    /verify-certificate?number={cert?.certificate_number}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
