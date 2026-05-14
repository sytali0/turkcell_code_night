import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BarChart2, BookOpen, Filter, Loader2, RefreshCw, Trophy } from 'lucide-react';
import { examAPI } from '../api/axios';

export default function AdminExamsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', course: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await examAPI.adminStats();
        setItems(res.data.exams || []);
        setStats(res.data.stats || null);
      } catch (err) {
        setError(err.response?.data?.detail || 'Sınav istatistikleri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const courses = useMemo(() => [...new Set(items.map((item) => item.course_title).filter(Boolean))], [items]);
  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !search
        || item.title?.toLowerCase().includes(search)
        || item.course_title?.toLowerCase().includes(search)
        || item.module_title?.toLowerCase().includes(search);
      const matchesCourse = !filters.course || item.course_title === filters.course;
      return matchesSearch && matchesCourse;
    });
  }, [filters, items]);

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '1.5rem', background: 'var(--tc-bg)' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ color: 'var(--tc-text)', fontSize: '1.5rem', fontWeight: 800 }}>Admin Sınav Yönetimi</h1>
            <p style={{ color: 'var(--tc-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Kurs, modül, deneme ve başarı oranlarını izleyin.
            </p>
          </div>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
            {[
              ['Toplam Sınav', stats.totalExams],
              ['Toplam Deneme', stats.totalAttempts],
            ].map(([label, value]) => (
              <div key={label} className="card" style={{ padding: '1rem' }}>
                <BarChart2 size={16} color="var(--tc-yellow)" />
                <p style={{ color: 'var(--tc-muted)', fontSize: '0.75rem', marginTop: '0.4rem' }}>{label}</p>
                <strong style={{ color: 'var(--tc-text)', fontSize: '1.25rem' }}>{value}</strong>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
          <Filter size={15} color="var(--tc-muted)" />
          <input className="input-field" style={{ maxWidth: '260px' }} placeholder="Sınav, kurs veya modül ara" value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} />
          <select className="input-field" style={{ maxWidth: '220px' }} value={filters.course} onChange={(e) => setFilters((prev) => ({ ...prev, course: e.target.value }))}>
            <option value="">Tüm Kurslar</option>
            {courses.map((course) => <option key={course} value={course}>{course}</option>)}
          </select>
          <button className="btn-ghost" onClick={() => setFilters({ search: '', course: '' })}><RefreshCw size={14} /> Temizle</button>
        </div>

        {error && <div className="card" style={{ padding: '0.9rem', color: '#F87171', display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}><AlertCircle size={16} />{error}</div>}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 style={{ animation: 'spin 0.7s linear infinite' }} /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
            {filtered.map((exam) => (
              <div key={exam.id} className="card animate-fade-in-up" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Trophy size={17} color="var(--tc-yellow)" />
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ color: 'var(--tc-text)', fontSize: '1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exam.title}</h3>
                    <p style={{ color: 'var(--tc-muted)', fontSize: '0.76rem' }}>{exam.course_title} · {exam.module_title}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {[
                    ['Deneme', exam.attempt_count],
                    ['Ortalama', `%${exam.average_score}`],
                    ['Geçme', `%${exam.pass_rate}`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: 'var(--tc-surface2)', borderRadius: '8px', padding: '0.65rem', textAlign: 'center' }}>
                      <strong style={{ color: 'var(--tc-text)', fontSize: '0.95rem' }}>{value}</strong>
                      <p style={{ color: 'var(--tc-muted)', fontSize: '0.68rem', marginTop: '0.15rem' }}>{label}</p>
                    </div>
                  ))}
                </div>

                <p style={{ color: 'var(--tc-muted)', fontSize: '0.78rem' }}>
                  {exam.question_count} soru · {exam.time_limit_min} dk · Geçme notu %{exam.passing_score} · {exam.max_attempts} deneme
                </p>

                <button className="btn-secondary" onClick={() => navigate(`/instructor/exams/${exam.id}/questions`)}>
                  <BookOpen size={14} /> Soruları Gör
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
