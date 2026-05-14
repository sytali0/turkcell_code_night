# EduCell Frontend

Bu klasor, CodeNight EduCell case'i icin ilk frontend prototipidir. Su an backend beklemeden demo akisini gostermek icin mock data ile calisir.

## Calistirma

```bash
cd frontend
python -m http.server 5173 --bind 127.0.0.1
```

Tarayicida:

```text
http://127.0.0.1:5173/index.html
```

## Ilk kapsam

- Kurs katalogu, arama ve filtreleme
- Kursa kaydolma
- Sol modül/ders agaci ile ders goruntuleme
- Ders tamamlama ve modül ilerleme gostergesi
- Kilitli modül akisi
- Zamanli sinav ekrani
- Tek secim, dogru/yanlis ve coklu secim soru tipleri
- Kismi puanlama dahil sonuc ekrani

## Backend baglanti noktalari

Mock data daha sonra su endpointlerle degistirilebilir:

- `GET /api/v1/courses`
- `POST /api/v1/courses/:id/enroll`
- `GET /api/v1/courses/:id/curriculum`
- `PATCH /api/v1/lessons/:id/complete`
- `POST /api/v1/exams/:id/start`
- `POST /api/v1/exams/:id/submit`
- `GET /api/v1/exams/:id/result`
