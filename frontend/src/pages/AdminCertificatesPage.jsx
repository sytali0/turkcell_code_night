import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award, Search, Loader2, AlertCircle, Calendar, User,
  BookOpen, TrendingUp, Shield, ChevronRight,
} from 'lucide-react';
import { certificateAPI } from '../api/axios';

function StatCard({ label, value, color = 'var(--tc-yellow)' }) {
  return (
    <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
      <p style={{ fontSize: '2rem', fontWeight: 800, color, marginBottom: '0.25rem' }}>{value}</p>
      <p style={{ fontSize: '0.78rem', color: 'var(--tc-muted)', fontWeight: 500 }}>{label}</p>
    </div>
  );
}

export default function AdminCertificatesPage() {
  const navigate = useNavigate();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await certificateAPI.adminList();
        setCerts(res.data.certificates || []);
      } catch (err) {
        setError(err.response?.data?.detail || 'Sertifikalar yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = certs.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.userName?.toLowerCase().includes(q) ||
      c.courseName?.toLowerCase().includes(q) ||
      c.certificateNumber?.toLowerCase().includes(q)
    );
  });

  // Stats
  const uniqueCourses = new Set(certs.map((c) => c.courseId)).size;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = certs.filter((c) => c.issuedAt?.slice(0, 10) === today).length;

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--tc-bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--tc-yellow), #E6BC00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} color="var(--tc-navy)" />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--tc-text)' }}>Sertifika Yönetimi</h1>
          </div>
          <p style={{ color: 'var(--tc-muted)', fontSize: '0.875rem' }}>
            Sistemdeki tüm sertifikaları görüntüleyin ve doğrulayın.
          </p>
        </div>

        {/* Stats */}
        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard label="Toplam Sertifika" value={certs.length} />
            <StatCard label="Kurs Çeşidi" value={uniqueCourses} color="#60A5FA" />
            <StatCard label="Bugün Verilen" value={todayCount} color="#4ADE80" />
          </div>
        )}

        {/* Search */}
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={16} color="var(--tc-muted)" />
          <input
            type="text"
            placeholder="İsim, kurs veya sertifika numarası..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: 'var(--tc-text)', fontSize: '0.9rem', outline: 'none',
            }}
          />
          {search && (
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tc-muted)', fontSize: '0.8rem' }}
              onClick={() => setSearch('')}
            >
              Temizle
            </button>
          )}
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
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <Award size={36} color="var(--tc-muted)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--tc-muted)' }}>
              {search ? 'Arama sonucu bulunamadı.' : 'Henüz sertifika yok.'}
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1.5fr 1fr 40px',
              padding: '0.75rem 1.25rem',
              background: 'var(--tc-surface2)',
              borderBottom: '1px solid var(--tc-border)',
              fontSize: '0.72rem', fontWeight: 700,
              color: 'var(--tc-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              <span>Öğrenci</span>
              <span>Kurs</span>
              <span>Sertifika No</span>
              <span>Tarih</span>
              <span></span>
            </div>
            {/* Rows */}
            {filtered.map((cert) => {
              const d = cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('tr-TR') : '-';
              return (
                <div
                  key={cert.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 1.5fr 1fr 40px',
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--tc-border)',
                    alignItems: 'center',
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tc-surface2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => navigate(`/verify-certificate?number=${cert.certificateNumber}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--tc-yellow), #E6BC00)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={14} color="var(--tc-navy)" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--tc-text)', fontWeight: 600 }}>{cert.userName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BookOpen size={13} color="var(--tc-muted)" />
                    <span style={{ fontSize: '0.82rem', color: 'var(--tc-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cert.courseName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Shield size={12} color="#4ADE80" />
                    <code style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#4ADE80' }}>{cert.certificateNumber}</code>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={12} color="var(--tc-muted)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--tc-muted)' }}>{d}</span>
                  </div>
                  <ChevronRight size={16} color="var(--tc-muted)" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
