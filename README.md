🎓 EduCell - Turkcell CodeNight 2026
EduCell, Turkcell'in dijital eğitim vizyonunu hayata geçiren; güvenli, ölçeklenebilir ve akıllı bir çevrimiçi öğrenme platformudur. Bu proje, sadece bir kurs izleme sitesi değil, arka planda çalışan güçlü bir "Sınav ve Değerlendirme Motoru" ile donatılmıştır.
🚀 Proje Özeti
Kullanıcıların hiyerarşik yapıdaki (Kurs → Modül → Ders) eğitim içeriklerini tüketebildiği, süre kısıtlamalı ve server-side doğrulanan sınavlara girebildiği, otomatik kısmi puanlama ve dijital sertifika üretimi sunan uçtan uca bir eğitim ekosistemidir.
🛠 Teknoloji Yığını (Tech Stack)
Backend: Python (FastAPI)
Veritabanı: PostgreSQL (SQLAlchemy ORM)
Frontend: HTML-JS
Kimlik Doğrulama: JWT (JSON Web Token) tabanlı Rol Bazlı Erişim (Eğitmen, Öğrenci, Admin)
🏗 Mimari Kararlar ve Veri Akışı
İzole Sınav Servisi: Sınav süresi kontrolü ve puan hesaplamaları tamamen servis katmanında (Backend) yapılmıştır. İstemciye asla güvenilmez; sorular gönderilirken şıklar karıştırılır ve doğru cevaplar payload'dan silinir.
Kısmi Puanlama Algoritması: Çoklu seçimli sorularda matematiksel bir model kullanılarak, kullanıcının seçtiği doğru şık oranında adil puanlama yapılır.
Katmanlı API Tasarımı: Routers, Services ve Models olarak ayrılan yapı sayesinde birbirine bağımlı olmayan, sürdürülebilir bir kod tabanı oluşturulmuştur.
⚙️ Kurulum ve Çalıştırma
Backend
Repoyu klonlayın: `git clone [BURAYA GITHUB LINKI GELECEK]`
Gerekli paketleri yükleyin: `pip install -r requirements.txt`
Sunucuyu başlatın: `uvicorn main:app --reload`
API Dokümantasyonu (Swagger): Tarayıcıda `http://localhost:8000/docs` adresine gidin.
Frontend
Frontend dizinine gidin: `cd frontend`
Bağımlılıkları yükleyin: `npm install`
Uygulamayı başlatın: `npm run dev`
📸 Ekran Görüntüleri

👥 Takım: [Takım Adınızı Yazın]
Erencan Yılmaz - API Architect & Algoritma Geliştirici
Buğra Yolaçar - Database & Backend Mimarı
Seyit Ali Arslan - Frontend Developer
