# EduCell

Turkcell CodeNight 2026 EduCell case'i icin cevrimici egitim ve sinav platformu.

## Mevcut durum

- `frontend/` klasorunde mock data ile calisan ilk web prototipi bulunur.
- Backend/API kodlari eklendiginde frontend mock akistan REST endpointlerine baglanacak sekilde ilerletilecektir.

## Frontend calistirma

```bash
cd frontend
python -m http.server 5173 --bind 127.0.0.1
```

Tarayicida:

```text
http://127.0.0.1:5173/index.html
```

## Beklenen API endpointleri

- `GET /api/v1/courses`
- `POST /api/v1/courses/:id/enroll`
- `GET /api/v1/courses/:id/curriculum`
- `PATCH /api/v1/lessons/:id/complete`
- `POST /api/v1/exams/:id/start`
- `POST /api/v1/exams/:id/submit`
- `GET /api/v1/exams/:id/result`
- `GET /api/v1/certificates/:number/verify`
