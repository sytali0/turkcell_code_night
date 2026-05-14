const courses = [
  {
    id: "ai-basics",
    title: "Yapay Zeka Temelleri",
    category: "Teknoloji",
    level: "Başlangıç",
    instructor: "Ayşe Demir",
    duration: "4 saat",
    description: "Turkcell ekipleri için yapay zeka kavramları, kullanım alanları ve sorumlu AI pratikleri.",
    modules: [
      {
        id: "ai-m1",
        title: "AI'a Giriş",
        description: "Temel kavramlar ve gerçek kullanım senaryoları.",
        lessons: [
          {
            id: "ai-l1",
            title: "AI, ML ve GenAI farkları",
            minutes: 18,
            content:
              "Yapay zeka, makinelerin insan benzeri karar verme ve örüntü tanıma yeteneklerini kapsar. Makine öğrenmesi veriden öğrenen modelleri, üretken yapay zeka ise yeni metin, görsel veya kod üretebilen sistemleri ifade eder.\n\nBu derste kavramları Turkcell müşteri deneyimi, ağ optimizasyonu ve eğitim senaryoları üzerinden ayırıyoruz."
          },
          {
            id: "ai-l2",
            title: "Sorumlu AI ilkeleri",
            minutes: 16,
            content:
              "Sorumlu AI; şeffaflık, güvenlik, veri mahremiyeti ve adil karar verme ilkelerine dayanır. Eğitim platformlarında öğrencinin verisi en az işlenmeli, sınav sonuçları açıklanabilir olmalı ve model destekli öneriler kullanıcıya net gösterilmelidir."
          },
          {
            id: "ai-l3",
            title: "Kurumsal AI kullanım alanları",
            minutes: 22,
            content:
              "Kurumsal kullanım alanları arasında çağrı merkezi destek asistanları, kişiselleştirilmiş kurs önerileri, otomatik özetleme, belge sınıflandırma ve operasyonel tahminleme bulunur."
          }
        ],
        exam: {
          id: "ai-e1",
          title: "AI'a Giriş Sınavı",
          timeLimitSeconds: 180,
          passingScore: 70,
          maxAttempts: 3,
          questions: [
            {
              id: "q1",
              type: "MULTIPLE_CHOICE",
              text: "Makine öğrenmesini en iyi hangi ifade açıklar?",
              options: [
                { id: "a", text: "Veriden örüntü öğrenen sistemler", correct: true },
                { id: "b", text: "Sadece elle yazılmış kurallar", correct: false },
                { id: "c", text: "Sadece grafik tasarım araçları", correct: false },
                { id: "d", text: "Donanım izleme protokolü", correct: false }
              ]
            },
            {
              id: "q2",
              type: "TRUE_FALSE",
              text: "Sorumlu AI, veri mahremiyetini ve açıklanabilirliği önemser.",
              options: [
                { id: "true", text: "Doğru", correct: true },
                { id: "false", text: "Yanlış", correct: false }
              ]
            },
            {
              id: "q3",
              type: "MULTI_SELECT",
              text: "Aşağıdakilerden hangileri kurumsal AI kullanım alanıdır?",
              options: [
                { id: "a", text: "Çağrı merkezi destek asistanı", correct: true },
                { id: "b", text: "Kurs öneri sistemi", correct: true },
                { id: "c", text: "Belge sınıflandırma", correct: true },
                { id: "d", text: "Veritabanını tamamen silme", correct: false }
              ]
            }
          ]
        }
      },
      {
        id: "ai-m2",
        title: "Prompt Tasarımı",
        description: "Etkili yönerge oluşturma ve kalite kontrol.",
        lessons: [
          { id: "ai-l4", title: "Bağlam verme", minutes: 20, content: "İyi bir prompt; rol, görev, bağlam, kısıt ve çıktı formatını açıkça belirtir. Bu yapı modelin doğru sınırlar içinde daha tutarlı yanıt üretmesini sağlar." },
          { id: "ai-l5", title: "Değerlendirme kriterleri", minutes: 18, content: "Yanıtları doğruluk, uygulanabilirlik, güvenlik ve tutarlılık açısından değerlendirmek gerekir. Demo için kısa kontrol listeleri yeterli olur." },
          { id: "ai-l6", title: "İyileştirme döngüsü", minutes: 17, content: "Prompt geliştirme tek seferlik değil, ölçme ve düzeltme içeren bir döngüdür. Örnek çıktılar üzerinden net kısıtlar eklenir." }
        ],
        exam: {
          id: "ai-e2",
          title: "Prompt Tasarımı Sınavı",
          timeLimitSeconds: 180,
          passingScore: 70,
          maxAttempts: 3,
          questions: [
            { id: "q1", type: "MULTIPLE_CHOICE", text: "İyi prompt hangi bilgiyi içermelidir?", options: [{ id: "a", text: "Görev ve çıktı formatı", correct: true }, { id: "b", text: "Sadece tek kelime", correct: false }, { id: "c", text: "Rastgele örnekler", correct: false }, { id: "d", text: "Boş mesaj", correct: false }] },
            { id: "q2", type: "TRUE_FALSE", text: "Promptlar örnek çıktılarla iyileştirilebilir.", options: [{ id: "true", text: "Doğru", correct: true }, { id: "false", text: "Yanlış", correct: false }] }
          ]
        }
      }
    ]
  },
  {
    id: "cyber",
    title: "Siber Güvenlik Farkındalığı",
    category: "Güvenlik",
    level: "Orta",
    instructor: "Mert Kaya",
    duration: "5 saat",
    description: "Kimlik avı, parola güvenliği ve kurum içi güvenlik davranışları için pratik eğitim.",
    modules: [
      {
        id: "cy-m1",
        title: "Temel Tehditler",
        description: "Saldırı türlerini tanıma.",
        lessons: [
          { id: "cy-l1", title: "Kimlik avı", minutes: 15, content: "Kimlik avı saldırıları kullanıcıyı sahte bağlantı, form veya eklerle kandırmayı hedefler. Alan adı, dil hatası ve aciliyet baskısı önemli ipuçlarıdır." },
          { id: "cy-l2", title: "Parola hijyeni", minutes: 14, content: "Benzersiz parola, çok faktörlü doğrulama ve parola yöneticisi kullanımı hesap güvenliğini ciddi biçimde artırır." },
          { id: "cy-l3", title: "Cihaz güvenliği", minutes: 20, content: "Güncellemeler, ekran kilidi ve kurumsal cihaz politikaları veri sızıntısı riskini azaltır." }
        ],
        exam: {
          id: "cy-e1",
          title: "Temel Tehditler Sınavı",
          timeLimitSeconds: 180,
          passingScore: 70,
          maxAttempts: 3,
          questions: [
            { id: "q1", type: "MULTIPLE_CHOICE", text: "Kimlik avında en yaygın amaç nedir?", options: [{ id: "a", text: "Kullanıcı bilgilerini ele geçirmek", correct: true }, { id: "b", text: "Ekran parlaklığını artırmak", correct: false }, { id: "c", text: "Pil tasarrufu sağlamak", correct: false }, { id: "d", text: "Dosya sıkıştırmak", correct: false }] },
            { id: "q2", type: "TRUE_FALSE", text: "MFA hesap güvenliğini artırır.", options: [{ id: "true", text: "Doğru", correct: true }, { id: "false", text: "Yanlış", correct: false }] }
          ]
        }
      }
    ]
  },
  {
    id: "data",
    title: "Veri Okuryazarlığı",
    category: "Analitik",
    level: "Başlangıç",
    instructor: "Zeynep Arslan",
    duration: "3 saat",
    description: "Veriyi yorumlama, metrik seçimi ve basit dashboard okuma becerileri.",
    modules: [
      {
        id: "dt-m1",
        title: "Metriklerle Çalışmak",
        description: "Doğru metriği seçme ve yorumlama.",
        lessons: [
          { id: "dt-l1", title: "Metrik nedir?", minutes: 14, content: "Metrik, bir hedefin durumunu ölçen sayısal göstergedir. İyi metrik karar almaya yardımcı olur ve bağlamıyla birlikte okunur." },
          { id: "dt-l2", title: "Oran ve trend", minutes: 19, content: "Tekil sayılar yerine oranlar ve zaman içindeki trendler daha sağlıklı yorum üretir. Ani sıçramalar veri kalitesi açısından da incelenmelidir." },
          { id: "dt-l3", title: "Dashboard okuma", minutes: 22, content: "Dashboardlar karar için sinyal üretir. Kullanıcı, filtreleri, tarih aralığını ve karşılaştırma bazını kontrol etmelidir." }
        ],
        exam: {
          id: "dt-e1",
          title: "Metriklerle Çalışmak Sınavı",
          timeLimitSeconds: 180,
          passingScore: 70,
          maxAttempts: 3,
          questions: [
            { id: "q1", type: "MULTIPLE_CHOICE", text: "İyi metrik ne sağlar?", options: [{ id: "a", text: "Karar almaya yardımcı sinyal", correct: true }, { id: "b", text: "Her zaman tek başına kesin cevap", correct: false }, { id: "c", text: "Sadece renk seçimi", correct: false }, { id: "d", text: "Parola saklama", correct: false }] },
            { id: "q2", type: "TRUE_FALSE", text: "Dashboard okurken tarih aralığı kontrol edilmelidir.", options: [{ id: "true", text: "Doğru", correct: true }, { id: "false", text: "Yanlış", correct: false }] }
          ]
        }
      }
    ]
  }
];

const state = {
  view: "catalog",
  query: "",
  category: "Tümü",
  level: "Tümü",
  selectedCourseId: courses[0].id,
  selectedLessonId: courses[0].modules[0].lessons[0].id,
  enrolled: new Set([courses[0].id]),
  completedLessons: new Set(),
  passedExams: new Set(),
  attempts: {},
  activeExam: null,
  answers: {},
  currentQuestionIndex: 0,
  lastResult: null,
  timerId: null
};

const app = document.querySelector("#app");

function selectedCourse() {
  return courses.find((course) => course.id === state.selectedCourseId) || courses[0];
}

function allLessons(course) {
  return course.modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id })));
}

function selectedLesson() {
  const course = selectedCourse();
  return allLessons(course).find((lesson) => lesson.id === state.selectedLessonId) || allLessons(course)[0];
}

function lessonProgress(course) {
  const lessons = allLessons(course);
  const done = lessons.filter((lesson) => state.completedLessons.has(lesson.id)).length;
  return Math.round((done / lessons.length) * 100);
}

function moduleUnlocked(course, moduleIndex) {
  if (moduleIndex === 0) return true;
  const previousExamId = course.modules[moduleIndex - 1].exam.id;
  return state.passedExams.has(previousExamId);
}

function moduleLessonsDone(module) {
  return module.lessons.every((lesson) => state.completedLessons.has(lesson.id));
}

function categories() {
  return ["Tümü", ...new Set(courses.map((course) => course.category))];
}

function levels() {
  return ["Tümü", ...new Set(courses.map((course) => course.level))];
}

function render() {
  app.innerHTML = `
    <div class="app-shell">
      ${renderTopbar()}
      <main class="page">${renderView()}</main>
    </div>
  `;
  bindEvents();
}

function renderTopbar() {
  const tabs = [
    ["catalog", "Katalog"],
    ["learn", "Ders"],
    ["dashboard", "İlerleme"]
  ];
  return `
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">E</span>
        <span>EduCell</span>
      </div>
      <nav class="nav-tabs">
        ${tabs
          .map(([id, label]) => `<button class="tab ${state.view === id ? "active" : ""}" data-view="${id}">${label}</button>`)
          .join("")}
      </nav>
    </header>
  `;
}

function renderView() {
  if (state.view === "learn") return renderLearning();
  if (state.view === "exam") return renderExam();
  if (state.view === "result") return renderResult();
  if (state.view === "dashboard") return renderDashboard();
  return renderCatalog();
}

function renderCatalog() {
  const filtered = courses.filter((course) => {
    const matchesQuery = `${course.title} ${course.description} ${course.instructor}`.toLowerCase().includes(state.query.toLowerCase());
    const matchesCategory = state.category === "Tümü" || course.category === state.category;
    const matchesLevel = state.level === "Tümü" || course.level === state.level;
    return matchesQuery && matchesCategory && matchesLevel;
  });

  return `
    <section>
      <div class="toolbar">
        <input class="field" data-field="query" value="${state.query}" placeholder="Kurs, eğitmen veya konu ara" />
        <select class="field" data-field="category">
          ${categories().map((category) => `<option ${category === state.category ? "selected" : ""}>${category}</option>`).join("")}
        </select>
        <select class="field" data-field="level">
          ${levels().map((level) => `<option ${level === state.level ? "selected" : ""}>${level}</option>`).join("")}
        </select>
      </div>
      <div class="catalog-grid">
        ${filtered.map((course, index) => renderCourseCard(course, index)).join("") || `<div class="card empty">Sonuç bulunamadı.</div>`}
      </div>
    </section>
  `;
}

function renderCourseCard(course, index) {
  const enrolled = state.enrolled.has(course.id);
  const progress = lessonProgress(course);
  return `
    <article class="card course-card">
      <div class="cover alt-${index % 3}">
        <span class="badge">${course.category}</span>
        <span>${course.level}</span>
      </div>
      <div class="course-body">
        <div>
          <h2 class="course-title">${course.title}</h2>
          <div class="course-meta">
            <span>${course.instructor}</span>
            <span>${course.duration}</span>
            <span>${course.modules.length} modül</span>
          </div>
        </div>
        <p class="muted">${course.description}</p>
        <div class="progress-wrap">
          <div class="progress-meta"><span>Kurs ilerlemesi</span><strong>${progress}%</strong></div>
          <div class="progress"><span style="width:${progress}%"></span></div>
        </div>
        <div class="actions">
          <button class="btn ${enrolled ? "secondary" : ""}" data-enroll="${course.id}">${enrolled ? "Kayıtlı" : "Kursa kaydol"}</button>
          <button class="btn warning" data-open-course="${course.id}">Derse geç</button>
        </div>
      </div>
    </article>
  `;
}

function renderLearning() {
  const course = selectedCourse();
  const lesson = selectedLesson();
  return `
    <section class="learning-layout">
      <aside class="card sidebar">
        <h2 class="section-title">${course.title}</h2>
        <div class="progress-wrap">
          <div class="progress-meta"><span>Kurs ilerlemesi</span><strong>${lessonProgress(course)}%</strong></div>
          <div class="progress"><span style="width:${lessonProgress(course)}%"></span></div>
        </div>
        ${course.modules.map((module, index) => renderModule(module, index, course)).join("")}
      </aside>
      <article class="card content-panel">
        <div class="lesson-content">
          <div>
            <p class="muted">${course.category} / ${lesson.minutes} dk</p>
            <h1>${lesson.title}</h1>
          </div>
          <div class="lesson-copy">
            ${lesson.content.split("\n\n").map((paragraph) => `<p>${paragraph}</p>`).join("")}
          </div>
          <div class="actions">
            <button class="btn" data-complete="${lesson.id}">${state.completedLessons.has(lesson.id) ? "Tamamlandı" : "Dersi tamamla"}</button>
          </div>
          <div class="comment-box">
            <strong>Ders yorumları</strong>
            <div class="comment"><strong>Öğrenci:</strong> Bu konuyu gerçek müşteri deneyimi senaryosunda nasıl ölçeriz?</div>
            <div class="comment"><strong>Eğitmen:</strong> Modül sonunda kısa bir metrik matrisiyle örneklendiriyoruz.</div>
          </div>
        </div>
      </article>
    </section>
  `;
}

function renderModule(module, index, course) {
  const unlocked = moduleUnlocked(course, index);
  const canStartExam = unlocked && moduleLessonsDone(module);
  return `
    <div class="module">
      <div class="module-head">
        <div>
          <h3 class="module-title">${index + 1}. ${module.title}</h3>
          <span class="muted">${module.description}</span>
        </div>
        ${unlocked ? "" : `<span class="lock">Kilitli</span>`}
      </div>
      <div class="lesson-list">
        ${module.lessons
          .map(
            (lesson) => `
              <button class="lesson-item ${lesson.id === state.selectedLessonId ? "active" : ""} ${state.completedLessons.has(lesson.id) ? "done" : ""}" data-lesson="${lesson.id}" ${unlocked ? "" : "disabled"}>
                <span>${lesson.title}</span>
                <span>${state.completedLessons.has(lesson.id) ? "✓" : `${lesson.minutes} dk`}</span>
              </button>
            `
          )
          .join("")}
        <button class="lesson-item" data-start-exam="${module.exam.id}" ${canStartExam ? "" : "disabled"}>
          <span>${module.exam.title}</span>
          <span>${state.passedExams.has(module.exam.id) ? "Geçildi" : "Sınav"}</span>
        </button>
      </div>
    </div>
  `;
}

function findExam(examId) {
  for (const course of courses) {
    for (const module of course.modules) {
      if (module.exam.id === examId) return { course, module, exam: module.exam };
    }
  }
  return null;
}

function startExam(examId) {
  const found = findExam(examId);
  if (!found) return;
  const attemptCount = state.attempts[examId] || 0;
  if (attemptCount >= found.exam.maxAttempts) return;
  state.activeExam = {
    ...found,
    remainingSeconds: found.exam.timeLimitSeconds
  };
  state.answers = {};
  state.currentQuestionIndex = 0;
  state.view = "exam";
  window.clearInterval(state.timerId);
  state.timerId = window.setInterval(tickExamTimer, 1000);
  render();
}

function tickExamTimer() {
  if (!state.activeExam) return;
  state.activeExam.remainingSeconds -= 1;
  if (state.activeExam.remainingSeconds <= 0) {
    submitExam();
  } else {
    const timer = document.querySelector("[data-timer]");
    if (timer) timer.textContent = formatTime(state.activeExam.remainingSeconds);
  }
}

function renderExam() {
  const active = state.activeExam;
  if (!active) return `<div class="card empty">Aktif sınav yok.</div>`;
  const question = active.exam.questions[state.currentQuestionIndex];
  const selected = state.answers[question.id] || [];
  return `
    <section class="card exam-panel">
      <div class="exam-head">
        <div>
          <p class="muted">${active.module.title}</p>
          <h1 class="section-title">${active.exam.title}</h1>
        </div>
        <div class="timer" data-timer>${formatTime(active.remainingSeconds)}</div>
      </div>
      <div class="question-nav">
        ${active.exam.questions
          .map(
            (item, index) => `
              <button class="q-dot ${index === state.currentQuestionIndex ? "active" : ""} ${(state.answers[item.id] || []).length ? "answered" : ""}" data-question-index="${index}">
                ${index + 1}
              </button>
            `
          )
          .join("")}
      </div>
      <div>
        <p class="muted">Soru ${state.currentQuestionIndex + 1} / ${active.exam.questions.length}</p>
        <h2>${question.text}</h2>
      </div>
      <div class="options">
        ${question.options.map((option) => renderOption(question, option, selected)).join("")}
      </div>
      <div class="actions">
        <button class="btn secondary" data-prev-question ${state.currentQuestionIndex === 0 ? "disabled" : ""}>Önceki</button>
        <button class="btn secondary" data-next-question ${state.currentQuestionIndex === active.exam.questions.length - 1 ? "disabled" : ""}>Sonraki</button>
        <button class="btn warning" data-submit-exam>Sınavı gönder</button>
      </div>
    </section>
  `;
}

function renderOption(question, option, selected) {
  const type = question.type === "MULTI_SELECT" ? "checkbox" : "radio";
  return `
    <label class="option">
      <input type="${type}" name="${question.id}" value="${option.id}" ${selected.includes(option.id) ? "checked" : ""} data-answer="${question.id}" />
      <span>${option.text}</span>
    </label>
  `;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.max(totalSeconds % 60, 0).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function submitExam() {
  if (!state.activeExam) return;
  window.clearInterval(state.timerId);
  const { exam } = state.activeExam;
  const feedback = exam.questions.map((question) => {
    const selected = state.answers[question.id] || [];
    const correctIds = question.options.filter((option) => option.correct).map((option) => option.id);
    const score = scoreQuestion(question, selected, correctIds);
    return {
      question: question.text,
      selected,
      correctIds,
      score,
      correct: score === 1
    };
  });
  const rawScore = feedback.reduce((sum, item) => sum + item.score, 0);
  const percent = Math.round((rawScore / exam.questions.length) * 100);
  const passed = percent >= exam.passingScore;
  state.attempts[exam.id] = (state.attempts[exam.id] || 0) + 1;
  if (passed) state.passedExams.add(exam.id);
  state.lastResult = { percent, passed, feedback, examId: exam.id, title: exam.title };
  state.activeExam = null;
  state.view = "result";
  render();
}

function scoreQuestion(question, selected, correctIds) {
  if (question.type === "MULTI_SELECT") {
    const correctSelected = selected.filter((id) => correctIds.includes(id)).length;
    const wrongSelected = selected.filter((id) => !correctIds.includes(id)).length;
    if (wrongSelected > 0) return 0;
    return correctSelected / correctIds.length;
  }
  return selected.length === 1 && selected[0] === correctIds[0] ? 1 : 0;
}

function renderResult() {
  const result = state.lastResult;
  if (!result) return `<div class="card empty">Henüz sonuç yok.</div>`;
  const correct = result.feedback.filter((item) => item.correct).length;
  const partial = result.feedback.filter((item) => !item.correct && item.score > 0).length;
  const wrong = result.feedback.length - correct - partial;
  return `
    <section class="card summary-panel">
      <p class="muted">${result.title}</p>
      <h1 class="section-title">${result.passed ? "Sınav geçildi" : "Tekrar dene"}</h1>
      <div class="result-grid">
        <div class="metric"><span>Puan</span><strong>${result.percent}</strong></div>
        <div class="metric"><span>Doğru</span><strong>${correct}</strong></div>
        <div class="metric"><span>Yanlış / Kısmi</span><strong>${wrong} / ${partial}</strong></div>
      </div>
      <div class="feedback">
        ${result.feedback
          .map(
            (item, index) => `
              <div class="feedback-item ${item.correct ? "good" : "bad"}">
                <strong>${index + 1}. ${item.question}</strong>
                <p class="muted">Soru puanı: ${Math.round(item.score * 100)}%</p>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="actions" style="margin-top:16px">
        <button class="btn" data-view="learn">Derse dön</button>
        <button class="btn secondary" data-view="dashboard">İlerlemeyi gör</button>
      </div>
    </section>
  `;
}

function renderDashboard() {
  const enrolledCourses = courses.filter((course) => state.enrolled.has(course.id));
  return `
    <section class="card summary-panel">
      <h1 class="section-title">Öğrenci ilerlemesi</h1>
      <div class="result-grid">
        <div class="metric"><span>Kayıtlı kurs</span><strong>${enrolledCourses.length}</strong></div>
        <div class="metric"><span>Tamamlanan ders</span><strong>${state.completedLessons.size}</strong></div>
        <div class="metric"><span>Geçilen sınav</span><strong>${state.passedExams.size}</strong></div>
      </div>
      <div class="feedback">
        ${enrolledCourses
          .map(
            (course) => `
              <div class="feedback-item">
                <strong>${course.title}</strong>
                <div class="progress-wrap" style="margin-top:10px">
                  <div class="progress-meta"><span>Kurs ilerlemesi</span><strong>${lessonProgress(course)}%</strong></div>
                  <div class="progress"><span style="width:${lessonProgress(course)}%"></span></div>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  document.querySelectorAll("[data-field]").forEach((field) => {
    field.addEventListener("input", () => {
      state[field.dataset.field] = field.value;
      render();
    });
  });

  document.querySelectorAll("[data-enroll]").forEach((button) => {
    button.addEventListener("click", () => {
      state.enrolled.add(button.dataset.enroll);
      render();
    });
  });

  document.querySelectorAll("[data-open-course]").forEach((button) => {
    button.addEventListener("click", () => {
      const course = courses.find((item) => item.id === button.dataset.openCourse);
      state.selectedCourseId = course.id;
      state.selectedLessonId = allLessons(course)[0].id;
      state.enrolled.add(course.id);
      state.view = "learn";
      render();
    });
  });

  document.querySelectorAll("[data-lesson]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedLessonId = button.dataset.lesson;
      render();
    });
  });

  document.querySelectorAll("[data-complete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.completedLessons.add(button.dataset.complete);
      render();
    });
  });

  document.querySelectorAll("[data-start-exam]").forEach((button) => {
    button.addEventListener("click", () => startExam(button.dataset.startExam));
  });

  document.querySelectorAll("[data-question-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentQuestionIndex = Number(button.dataset.questionIndex);
      render();
    });
  });

  document.querySelectorAll("[data-answer]").forEach((input) => {
    input.addEventListener("change", () => {
      const questionId = input.dataset.answer;
      const question = state.activeExam.exam.questions.find((item) => item.id === questionId);
      if (question.type === "MULTI_SELECT") {
        const selected = new Set(state.answers[questionId] || []);
        if (input.checked) selected.add(input.value);
        else selected.delete(input.value);
        state.answers[questionId] = [...selected];
      } else {
        state.answers[questionId] = [input.value];
      }
      render();
    });
  });

  const prev = document.querySelector("[data-prev-question]");
  if (prev) {
    prev.addEventListener("click", () => {
      state.currentQuestionIndex = Math.max(0, state.currentQuestionIndex - 1);
      render();
    });
  }

  const next = document.querySelector("[data-next-question]");
  if (next) {
    next.addEventListener("click", () => {
      state.currentQuestionIndex = Math.min(state.activeExam.exam.questions.length - 1, state.currentQuestionIndex + 1);
      render();
    });
  }

  const submit = document.querySelector("[data-submit-exam]");
  if (submit) submit.addEventListener("click", submitExam);
}

render();
