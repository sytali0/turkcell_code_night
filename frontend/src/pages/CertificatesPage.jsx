import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award, Calendar, BookOpen, ArrowRight, Loader2, AlertCircle, GraduationCap, Shield,
} from 'lucide-react';
import { certificateAPI } from '../api/axios';

function CertCard({ cert, onClick }) {
  const date = cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }) : '-';

  return (
    <div
      className="card animate-fade-in-up"
      style={{
        padding: 0, overflow: 'hidden', cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: '1px solid var(--tc-border)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,209,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Header gradient */}
      <div style={{
        background: 'linear-gradient(135deg, var(--tc-navy) 0%, #0A2A7A 60%, #1A3A8A 100%)',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circle */}
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '100px', height: '100px',
          borderRadius: '50%',
          background: 'rgba(255,209,0,0.08)',
          pointerEvents: 'none',
        }} />
        <div style={{
          width: '52px', height: '52px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, var(--tc-yellow), #E6BC00)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 16px rgba(255,209,0,0.4)',
        }}>
          <Award size={26} color="var(--tc-navy)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.68rem', color: 'rgba(255,209,0,0.7)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            Tamamlama Sertifikası
          </p>
          <h3 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cert.course_name}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--tc-muted)' }}>
            <GraduationCap size={14} color="var(--tc-yellow)" />
            <span style={{ color: 'var(--tc-text)' }}>{cert.user_name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--tc-muted)' }}>
            <Calendar size={14} color="var(--tc-yellow)" />
            <span>{date}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--tc-muted)' }}>
            <Shield size={12} color="#4ADE80" />
            <code style={{ fontFamily: 'monospace', color: '#4ADE80', fontSize: '0.72rem' }}>{cert.certificate_number}</code>
          </div>
        </div>

        <div style={{
          marginTop: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: '0.4rem', color: 'var(--tc-yellow)', fontSize: '0.8rem', fontWeight: 600,
        }}>
          Görüntüle <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const navigate = useNavigate();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await certificateAPI.my();
        setCerts(res.data || []);
      } catch (err) {
        setError(err.response?.data?.detail || 'Sertifikalar yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--tc-bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--tc-yellow), #E6BC00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={20} color="var(--tc-navy)" />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--tc-text)' }}>Sertifikalarım</h1>
            </div>
            <p style={{ color: 'var(--tc-muted)', fontSize: '0.875rem' }}>
              Tamamladığınız kurslar için kazandığınız sertifikalar.
            </p>
          </div>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.82rem' }}
            onClick={() => navigate('/courses')}
          >
            <BookOpen size={14} /> Kurslara Git
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 size={32} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--tc-yellow)' }} />
          </div>
        ) : error ? (
          <div className="card" style={{ padding: '1rem', color: '#F87171', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={18} /> {error}
          </div>
        ) : certs.length === 0 ? (
          <div className="card animate-fade-in-up" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(255,209,0,0.08)', border: '2px dashed rgba(255,209,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <Award size={32} color="var(--tc-muted)" />
            </div>
            <h3 style={{ color: 'var(--tc-text)', fontWeight: 700, marginBottom: '0.5rem' }}>Henüz sertifikanız yok</h3>
            <p style={{ color: 'var(--tc-muted)', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '360px', margin: '0 auto 1.5rem' }}>
              Bir kursu tüm dersleri tamamlayarak ve sınavları geçerek bitirdiğinizde sertifikanız otomatik oluşturulur.
            </p>
            <button className="btn-primary" onClick={() => navigate('/courses')}>
              <BookOpen size={15} /> Kurslara Gözat
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {certs.map((cert) => (
              <CertCard
                key={cert.id}
                cert={cert}
                onClick={() => navigate(`/certificates/${cert.certificate_number}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
