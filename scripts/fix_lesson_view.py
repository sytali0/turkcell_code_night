path = "frontend/src/pages/LessonViewPage.jsx"
content = open(path, "r", encoding="utf-8").read()

# 1. Add logic to check if all lessons are completed
old_active_exam_check = "          {activeExam ? ("
new_active_exam_check = """          {activeExam ? (() => {
              const moduleLessons = curriculum?.modules?.find(m => m.id === activeExam.module_id)?.lessons || [];
              const isAllLessonsCompleted = moduleLessons.length > 0 && moduleLessons.every(l => completedIds.has(l.id));
              
              return (
"""

if old_active_exam_check in content and "isAllLessonsCompleted" not in content:
    content = content.replace(old_active_exam_check, new_active_exam_check, 1)

# 2. Update the Sınava Başla button
old_button = """                <button onClick={() => navigate(`/exams/${activeExam.id}`)} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.75rem 2rem' }}>
                  <Trophy size={16} /> Sınava Başla
                </button>"""

new_button = """                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  {!isAllLessonsCompleted && (
                    <div style={{ color: '#F87171', fontSize: '0.85rem', background: 'rgba(239,68,68,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                      Bu modülün sınavına girebilmek için önce modüldeki tüm dersleri tamamlamalısınız.
                    </div>
                  )}
                  <button 
                    onClick={() => navigate(`/exams/${activeExam.id}`)} 
                    className="btn-primary" 
                    disabled={!isAllLessonsCompleted}
                    style={{ fontSize: '0.9rem', padding: '0.75rem 2rem', opacity: !isAllLessonsCompleted ? 0.5 : 1 }}
                  >
                    <Trophy size={16} /> Sınava Başla
                  </button>
                </div>"""

if old_button in content and "isAllLessonsCompleted" not in content: # Because we already injected new_active_exam_check which contains the variable name. Oh wait, my string replace condition above.
    pass

# Let's do it safer.

path2 = "frontend/src/pages/LessonViewPage.jsx"
content2 = open(path2, "r", encoding="utf-8").read()

if "isAllLessonsCompleted" not in content2:
    old_full = """          {activeExam ? (
            <div className="card animate-fade-in-up" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 12px 32px rgba(124,58,237,0.3)' }}>
                <Trophy size={32} color="white" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tc-text)', marginBottom: '0.5rem' }}>{activeExam.title}</h2>
              <p style={{ color: 'var(--tc-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                {activeExam.question_count} soru · {activeExam.time_limit_min} dakika · Geçme notu: %{activeExam.passing_score}
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => navigate(`/exams/${activeExam.id}`)} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.75rem 2rem' }}>
                  <Trophy size={16} /> Sınava Başla
                </button>
                <button onClick={() => navigate(`/exams/${activeExam.id}/result`)} className="btn-secondary" style={{ fontSize: '0.9rem' }}>
                  Sonuçları Gör
                </button>
              </div>
            </div>
          ) :"""

    new_full = """          {activeExam ? (() => {
            const moduleLessons = curriculum?.modules?.find(m => m.id === activeExam.module_id)?.lessons || [];
            const isAllLessonsCompleted = moduleLessons.length > 0 && moduleLessons.every(l => completedIds.has(l.id));
            
            return (
              <div className="card animate-fade-in-up" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 12px 32px rgba(124,58,237,0.3)' }}>
                  <Trophy size={32} color="white" />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tc-text)', marginBottom: '0.5rem' }}>{activeExam.title}</h2>
                <p style={{ color: 'var(--tc-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  {activeExam.question_count} soru · {activeExam.time_limit_min} dakika · Geçme notu: %{activeExam.passing_score}
                </p>
                
                {!isAllLessonsCompleted && (
                  <div style={{ color: '#F87171', fontSize: '0.85rem', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'inline-block' }}>
                    Bu modülün sınavına girebilmek için önce modüldeki tüm dersleri tamamlamalısınız.
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => navigate(`/exams/${activeExam.id}`)} 
                    className="btn-primary" 
                    disabled={!isAllLessonsCompleted}
                    style={{ fontSize: '0.9rem', padding: '0.75rem 2rem', opacity: !isAllLessonsCompleted ? 0.5 : 1 }}
                  >
                    <Trophy size={16} /> Sınava Başla
                  </button>
                  <button onClick={() => navigate(`/exams/${activeExam.id}/result`)} className="btn-secondary" style={{ fontSize: '0.9rem' }}>
                    Sonuçları Gör
                  </button>
                </div>
              </div>
            );
          })() :"""

    if old_full in content2:
        content2 = content2.replace(old_full, new_full, 1)
        open(path2, "w", encoding="utf-8").write(content2)
        print("[OK] Frontend logic added.")
    else:
        print("[WARN] Could not find frontend block")
else:
    print("[SKIP] Already patched.")
