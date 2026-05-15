path = "frontend/src/pages/CourseDetailPage.jsx"
content = open(path, "r", encoding="utf-8").read()

# Fix 1: imports
if "reviewAPI" not in content:
    old1 = "import { courseAPI } from '../api/axios';"
    old2 = "import { progressAPI } from '../api/axios';"
    if old1 in content and old2 in content:
        content = content.replace(old1, "", 1)
        content = content.replace(old2, "import { courseAPI, progressAPI, reviewAPI } from '../api/axios';", 1)
        print("[OK] imports merged")
    elif "progressAPI" in content:
        content = content.replace("import { progressAPI } from '../api/axios';", "import { progressAPI, reviewAPI } from '../api/axios';", 1)
        print("[OK] reviewAPI added to progressAPI import")
    else:
        print("[WARN] import not found")
else:
    print("[SKIP] reviewAPI already imported")

# Fix 2: Star icon
if "Star," not in content:
    old_icons = "Clock, Loader2, Zap, Award, TrendingUp,"
    new_icons = "Clock, Loader2, Zap, Award, TrendingUp, Star, MessageSquare, Send,"
    if old_icons in content:
        content = content.replace(old_icons, new_icons, 1)
        print("[OK] icons added")

# Fix 3: State
if "ratingSummary" not in content:
    old_s = "  const [progress, setProgress] = useState(null);"
    new_s = """  const [progress, setProgress] = useState(null);
  const [ratingSummary, setRatingSummary] = useState({ avgRating: 0, reviewCount: 0 });
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [ratingInput, setRatingInput] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');"""
    if old_s in content:
        content = content.replace(old_s, new_s, 1)
        print("[OK] rating state added")

# Fix 4: useEffect + handler
if "2.5: Rating summary" not in content:
    old_e = "  const handleEnroll = async () => {"
    new_e = """  useEffect(() => {
    if (!courseId) return;
    reviewAPI.ratingSummary(courseId).then(r => setRatingSummary(r.data)).catch(() => {});
    reviewAPI.list(courseId).then(r => setReviews(r.data || [])).catch(() => {});
    if (user?.role === 'student') {
      reviewAPI.my(courseId).then(r => {
        if (r.data?.exists) { setMyReview(r.data); setRatingInput(r.data.rating); setReviewText(r.data.reviewText || ''); }
      }).catch(() => {});
    }
  }, [courseId, user]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!ratingInput) return;
    setSubmittingReview(true); setReviewMsg('');
    try {
      await reviewAPI.rate(courseId, { rating: ratingInput, review_text: reviewText });
      setReviewMsg('Degerlendirildi!');
      const [s, l, m] = await Promise.all([reviewAPI.ratingSummary(courseId), reviewAPI.list(courseId), reviewAPI.my(courseId)]);
      setRatingSummary(s.data); setReviews(l.data || []);
      if (m.data?.exists) setMyReview(m.data);
      setTimeout(() => setReviewMsg(''), 3000);
    } catch (err) { setReviewMsg(err.response?.data?.detail || 'Kaydedilemedi.'); }
    finally { setSubmittingReview(false); }
  };

  const handleEnroll = async () => {"""
    if old_e in content:
        content = content.replace(old_e, new_e, 1)
        print("[OK] review useEffect + handler added")

# Fix 5: JSX rating section — dosya sonuna ekle
RATING_JSX = """
        {/* 2.5: Rating & Review */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <MessageSquare size={18} color="var(--tc-yellow)" />
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tc-text)', margin: 0 }}>Degerlendirmeler</h2>
            {ratingSummary.reviewCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
                <Star size={15} color="#FBBF24" fill="#FBBF24" />
                <span style={{ fontWeight: 800, color: 'var(--tc-text)', fontSize: '0.95rem' }}>{ratingSummary.avgRating.toFixed(1)}</span>
                <span style={{ color: 'var(--tc-muted)', fontSize: '0.8rem' }}>({ratingSummary.reviewCount} degerlendirme)</span>
              </div>
            )}
          </div>
          {user?.role === 'student' && course?.enrolled && (
            <form onSubmit={handleReviewSubmit} style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--tc-border)', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tc-text)', marginBottom: '0.6rem' }}>{myReview ? 'Guncelleyin' : 'Kursu Degerlendirin'}</p>
              <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem' }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setRatingInput(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                    <Star size={24} color="#FBBF24" fill={n <= ratingInput ? '#FBBF24' : 'transparent'} strokeWidth={1.5} />
                  </button>
                ))}
                {ratingInput > 0 && <span style={{ fontSize: '0.8rem', color: 'var(--tc-muted)', alignSelf: 'center', marginLeft: '0.25rem' }}>{ratingInput}/5</span>}
              </div>
              <textarea className="input-field" style={{ minHeight: '75px', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.875rem', marginBottom: '0.6rem' }}
                placeholder="Yorumunuz (istege bagli)..." value={reviewText} onChange={e => setReviewText(e.target.value)} />
              {reviewMsg && <p style={{ fontSize: '0.8rem', color: '#4ADE80', marginBottom: '0.5rem' }}>{reviewMsg}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={!ratingInput || submittingReview} style={{ fontSize: '0.85rem' }}>
                  {submittingReview ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Send size={15} />}
                  {myReview ? 'Guncelle' : 'Degerlendir'}
                </button>
              </div>
            </form>
          )}
          {reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reviews.map(r => (
                <div key={r.id} style={{ padding: '0.9rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--tc-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {[1,2,3,4,5].map(n => <Star key={n} size={13} color="#FBBF24" fill={n <= r.rating ? '#FBBF24' : 'transparent'} strokeWidth={1.5} />)}
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tc-text)', marginLeft: '0.25rem' }}>{r.authorName}</span>
                      {r.isOwn && <span style={{ fontSize: '0.65rem', background: 'rgba(255,209,0,0.15)', color: 'var(--tc-yellow)', borderRadius: '6px', padding: '1px 6px' }}>Siz</span>}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--tc-muted)' }}>{new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                  {r.reviewText && <p style={{ fontSize: '0.85rem', color: 'var(--tc-muted)', margin: 0, lineHeight: 1.5 }}>{r.reviewText}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--tc-muted)', fontSize: '0.875rem', textAlign: 'center' }}>Henuz degerlendirme yok.</p>
          )}
        </div>"""

# </div></div></div> den önce ekle (son üç kapanma)
# Dosyanın sonunu bul
if "2.5: Rating & Review" not in content:
    # Son return'deki kapanışı bul
    last_close = content.rfind("      </div>\n    </div>\n  );\n}")
    if last_close != -1:
        insert_at = last_close + len("      </div>")
        content = content[:insert_at] + "\n" + RATING_JSX + "\n" + content[insert_at:]
        print("[OK] rating JSX injected")
    else:
        # simpler fallback
        last_close2 = content.rfind("      </div>\n    </div>\n  );\n}")
        print(f"[WARN] footer not found. File ends with: {repr(content[-300:])}")
else:
    print("[SKIP] rating JSX already present")

open(path, "w", encoding="utf-8").write(content)
print("[OK] CourseDetailPage.jsx saved")
