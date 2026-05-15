"""2.5: LessonViewPage CommentSection + CourseDetailPage rating section patch"""

import re

# ============================================================
# 1. LessonViewPage.jsx — CommentSection yeniden yaz
# ============================================================
lv_path = "frontend/src/pages/LessonViewPage.jsx"
lv = open(lv_path, "r", encoding="utf-8").read()

# import satırına commentAPI ekle
old_imp = "import { courseAPI, lessonAPI, progressAPI } from '../api/axios';"
new_imp = "import { courseAPI, lessonAPI, progressAPI, commentAPI } from '../api/axios';"
if old_imp in lv:
    lv = lv.replace(old_imp, new_imp, 1)
    print("[OK] LessonViewPage import updated")

# CommentSection bileşenini bul ve değiştir
OLD_CS_START = "function CommentSection({ lessonId }) {"
OLD_CS_END   = "\n}\n\nexport default function LessonViewPage"

start_idx = lv.find(OLD_CS_START)
end_idx   = lv.find(OLD_CS_END)

if start_idx != -1 and end_idx != -1:
    NEW_CS = '''function StarBadge({ role }) {
  const labels = { student: 'Öğrenci', instructor: 'Eğitmen', admin: 'Admin' };
  const colors = { student: 'rgba(255,209,0,0.15)', instructor: 'rgba(99,102,241,0.2)', admin: 'rgba(239,68,68,0.15)' };
  const textColors = { student: 'var(--tc-yellow)', instructor: '#A78BFA', admin: '#F87171' };
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
      background: colors[role] || 'rgba(255,255,255,0.08)', color: textColors[role] || 'var(--tc-muted)' }}>
      {labels[role] || role}
    </span>
  );
}

function CommentSection({ lessonId, userRole }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [replyContent, setReplyContent] = useState({});
  const [replyOpen, setReplyOpen] = useState({});
  const [error, setError] = useState('');

  const loadComments = () => {
    commentAPI.list(lessonId).then(r => setComments(r.data || [])).catch(() => {});
  };

  useEffect(() => { if (lessonId) loadComments(); }, [lessonId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true); setError('');
    try {
      await commentAPI.add(lessonId, { content });
      setContent(''); loadComments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Yorum gönderilemedi.');
    } finally { setSending(false); }
  };

  const handleReply = async (commentId) => {
    const txt = replyContent[commentId] || '';
    if (!txt.trim()) return;
    try {
      await commentAPI.reply(commentId, { content: txt });
      setReplyContent(p => ({ ...p, [commentId]: '' }));
      setReplyOpen(p => ({ ...p, [commentId]: false }));
      loadComments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Cevap gönderilemedi.');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Yorumu silmek istiyor musunuz?')) return;
    try { await commentAPI.delete(commentId); loadComments(); }
    catch (err) { setError(err.response?.data?.detail || 'Silinemedi.'); }
  };

  const fmtDate = (iso) => new Date(iso).toLocaleDateString('tr-TR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tc-text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MessageSquare size={18} color="var(--tc-yellow)" /> Yorumlar
        {comments.length > 0 && <span style={{ fontSize: '0.75rem', background: 'var(--tc-yellow)', color: 'var(--tc-navy)', borderRadius: '999px', padding: '1px 8px', fontWeight: 700 }}>{comments.length}</span>}
      </h3>

      {/* Yorum listesi */}
      {comments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {comments.map(c => (
            <div key={c.id} style={{ border: '1px solid var(--tc-border)', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Ana yorum */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--tc-navy-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--tc-yellow)' }}>{c.authorName?.[0]?.toUpperCase() || '?'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tc-text)' }}>{c.authorName}</span>
                      <span style={{ marginLeft: '0.4rem' }}><StarBadge role={c.authorRole} /></span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--tc-muted)' }}>{fmtDate(c.createdAt)}</span>
                    {c.isOwn && (
                      <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F87171', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '6px' }} title="Sil">✕</button>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--tc-text)', lineHeight: 1.6, margin: 0 }}>{c.content}</p>
                {/* Eğitmen cevapla butonu */}
                {userRole === 'instructor' && c.replies?.length === 0 && (
                  <button onClick={() => setReplyOpen(p => ({ ...p, [c.id]: !p[c.id] }))}
                    style={{ marginTop: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--tc-yellow)', fontWeight: 600 }}>
                    {replyOpen[c.id] ? 'İptal' : '↳ Cevapla'}
                  </button>
                )}
              </div>

              {/* Cevap formu — eğitmen */}
              {userRole === 'instructor' && replyOpen[c.id] && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.05)', borderTop: '1px solid var(--tc-border)', display: 'flex', gap: '0.5rem' }}>
                  <input className="input-field" style={{ flex: 1, fontSize: '0.85rem' }} placeholder="Cevabınızı yazın…"
                    value={replyContent[c.id] || ''} onChange={e => setReplyContent(p => ({ ...p, [c.id]: e.target.value }))} />
                  <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }} onClick={() => handleReply(c.id)}>
                    Gönder
                  </button>
                </div>
              )}

              {/* Cevaplar */}
              {c.replies?.map(r => (
                <div key={r.id} style={{ padding: '0.85rem 1rem 0.85rem 1.75rem', background: r.isInstructorReply ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--tc-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    {r.isInstructorReply && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(99,102,241,0.25)', color: '#A78BFA', borderRadius: '6px', padding: '2px 7px' }}>👨‍🏫 Eğitmen Cevabı</span>
                    )}
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tc-text)' }}>{r.authorName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--tc-muted)', marginLeft: 'auto' }}>{fmtDate(r.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--tc-text)', margin: 0, lineHeight: 1.5 }}>{r.content}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Yorum ekleme formu — student ve instructor */}
      {(userRole === 'student' || userRole === 'instructor') && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <textarea className="input-field" style={{ minHeight: '90px', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.875rem' }}
            placeholder="Bu ders hakkında soru veya yorum yaz…" value={content} onChange={e => setContent(e.target.value)} />
          {error && <p style={{ fontSize: '0.8rem', color: '#F87171' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={sending || !content.trim()} style={{ fontSize: '0.85rem' }}>
              {sending ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Send size={15} />} Gönder
            </button>
          </div>
        </form>
      )}

      {comments.length === 0 && userRole !== 'student' && userRole !== 'instructor' && (
        <p style={{ color: 'var(--tc-muted)', fontSize: '0.875rem', textAlign: 'center' }}>Henüz yorum yok.</p>
      )}
    </div>
  );
}'''

    lv = lv[:start_idx] + NEW_CS + lv[end_idx:]
    print("[OK] CommentSection rewritten")
else:
    print(f"[WARN] CommentSection bounds not found: start={start_idx}, end={end_idx}")

# CommentSection'ı çağıran yere userRole prop'u ekle
# <CommentSection lessonId={activeLesson.id} />
old_cs_call = "<CommentSection lessonId={activeLesson.id} />"
new_cs_call = "<CommentSection lessonId={activeLesson.id} userRole={user?.role} />"
if old_cs_call in lv:
    lv = lv.replace(old_cs_call, new_cs_call, 1)
    print("[OK] CommentSection call updated with userRole")

# useAuth import ekle
old_auth_imp = "import { courseAPI, lessonAPI, progressAPI, commentAPI } from '../api/axios';"
new_auth_imp = "import { courseAPI, lessonAPI, progressAPI, commentAPI } from '../api/axios';\nimport { useAuth } from '../context/AuthContext';"
if "useAuth" not in lv and old_auth_imp in lv:
    lv = lv.replace(old_auth_imp, new_auth_imp, 1)
    print("[OK] useAuth import added")

# LessonViewPage fonksiyonunda useAuth() kullanımı ekle
old_fn_start = "export default function LessonViewPage() {\n  const { courseId } = useParams();"
new_fn_start = "export default function LessonViewPage() {\n  const { courseId } = useParams();\n  const { user } = useAuth();"
if "const { user } = useAuth();" not in lv and old_fn_start in lv:
    lv = lv.replace(old_fn_start, new_fn_start, 1)
    print("[OK] useAuth() usage added")

open(lv_path, "w", encoding="utf-8").write(lv)
print(f"[OK] LessonViewPage.jsx written ({len(lv)} bytes)")
print("Done.")
