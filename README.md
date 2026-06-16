This project was carried out physically with teamwork for the competition within the scope of the 2026 Turkcell codenight event. [Turkcell](https://turkcell.com.tr)

(Bu proje 2026 Turkcell codenight etkinliği kapsamında yarışma için fiziksel olarak takım çalışması ile yapılmıştır.)
EN:
🎓 EduCell - Turkcell CodeNight 2026

EduCell is an online learning platform that brings Turkcell's digital education vision to life through a secure, scalable, and intelligent infrastructure. More than just a course delivery website, the platform is powered by a robust Examination and Assessment Engine operating behind the scenes.

🚀 Project Overview

EduCell is a comprehensive educational ecosystem where users can consume hierarchical learning content organized as Courses → Modules → Lessons, participate in time-restricted examinations with server-side validation, receive automatic partial grading, and earn digitally generated certificates upon successful completion.

🛠 Technology Stack
Backend: Python (FastAPI)
Database: PostgreSQL (SQLAlchemy ORM)
Frontend: HTML, JavaScript
Authentication: JWT (JSON Web Token) based Role-Based Access Control (Instructor, Student, Administrator)
🏗 Architectural Decisions and Data Flow
Isolated Examination Service

Exam duration management and score calculations are handled entirely within the backend service layer. The client is never trusted; answer options are randomized before delivery, and correct answers are removed from the payload to ensure exam integrity.

Partial Scoring Algorithm

A mathematical model is employed for multiple-choice questions to provide fair grading based on the proportion of correctly selected options, enabling automatic partial credit allocation.

Layered API Design

The application follows a modular architecture separated into Routers, Services, and Models, resulting in a maintainable, scalable, and loosely coupled codebase.

⚙️ Installation and Setup
Backend:
Clone the repository: git clone `https://github.com/sytali0/turkcell_code_night`
Install the required dependencies: `pip install -r requirements.txt`
Start the development server: `uvicorn main:app --reload`
Access the API documentation (Swagger): `http://localhost:8000/docs`

Frontend:
Navigate to the frontend directory: `cd frontend`
Install the dependencies: `npm install`
Launch the application: `npm run dev`

👥 Team: Uykusuzlar (Insomniacs)
Erencan Yılmaz – API Architect & Algorithm Developer
Buğra Yolaçar – Database & Backend Architect
Seyit Ali Arslan – Frontend Developer
----------------------------------------------------------------------------------------------------------------
TR:
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
Repoyu klonlayın: `git clone https://github.com/sytali0/turkcell_code_night`
Gerekli paketleri yükleyin: `pip install -r requirements.txt`
Sunucuyu başlatın: `uvicorn main:app --reload`
API Dokümantasyonu (Swagger): Tarayıcıda `http://localhost:8000/docs` adresine gidin.
Frontend
Frontend dizinine gidin: `cd frontend`
Bağımlılıkları yükleyin: `npm install`
Uygulamayı başlatın: `npm run dev`

👥 Takım: Uykusuzlar
Erencan Yılmaz - API Architect & Algoritma Geliştirici
Buğra Yolaçar - Database & Backend Mimarı
Seyit Ali Arslan - Frontend Developer
