--
-- PostgreSQL database dump
--



-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES ('49055e86-c266-4074-9ee6-ac9fb6cbecd8', 'Admin Kullanıcı', '905551111111', 'admin@educell.com', '123456_hash', 'admin', 'Platform yöneticisi', NULL, NULL, true, '2026-05-14 20:08:00.58135', '2026-05-14 20:08:00.58135');
INSERT INTO public.users VALUES ('e773a287-b046-427b-beb5-36d0aaf08ec2', 'Eğitmen Kullanıcı', '905552222222', 'egitmen@educell.com', '123456_hash', 'instructor', 'Yazılım ve yapay zeka eğitmeni', 'Python, Yapay Zeka, Backend', NULL, true, '2026-05-14 20:08:00.58135', '2026-05-14 20:08:00.58135');
INSERT INTO public.users VALUES ('f097a785-040e-4017-9064-cb6f62354cf2', 'Öğrenci Kullanıcı', '905553333333', 'ogrenci@educell.com', '123456_hash', 'student', 'EduCell öğrencisi', NULL, 'Python, Mobil Uygulama, Veri Bilimi', true, '2026-05-14 20:08:00.58135', '2026-05-14 20:08:00.58135');


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.courses VALUES ('aad553fa-4455-4f1c-8002-91c66644f7a5', 'e773a287-b046-427b-beb5-36d0aaf08ec2', 'Python Temelleri', 'Sıfırdan Python programlama öğrenme kursu.', 'Yazılım', 'beginner', 'https://example.com/python-cover.jpg', 180, 'published', 1, '2026-05-14 20:09:04.197771', '2026-05-14 20:09:04.197771');


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.certificates VALUES ('17ebb788-e8d1-4883-acc0-55d039846902', 'f097a785-040e-4017-9064-cb6f62354cf2', 'aad553fa-4455-4f1c-8002-91c66644f7a5', 'EDUCELL-2026-0001', 'https://example.com/certificates/EDUCELL-2026-0001.pdf', '2026-05-14 20:16:12.233246');


--
-- Data for Name: course_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.enrollments VALUES ('26e25ed1-a470-4a5d-ade4-28a7e5dd5fa7', 'f097a785-040e-4017-9064-cb6f62354cf2', 'aad553fa-4455-4f1c-8002-91c66644f7a5', '2026-05-14 20:11:59.533502', '2026-05-14 20:15:45.183911', 100, 'completed');


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.modules VALUES ('11c6b025-ba43-4c55-b7ec-6c39d3914e0b', 'aad553fa-4455-4f1c-8002-91c66644f7a5', 'Python''a Giriş', 'Python programlama diline giriş modülü.', 1, '2026-05-14 20:10:22.524046', '2026-05-14 20:10:22.524046');


--
-- Data for Name: exams; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.exams VALUES ('2a1ed4a8-f3e5-4b2f-87a9-7368aa91470c', '11c6b025-ba43-4c55-b7ec-6c39d3914e0b', 'Python''a Giriş Sınavı', 'Python temel kavramlarını ölçen modül sonu sınavı.', 15, 70, 3, true, 3, '2026-05-14 20:11:16.397699', '2026-05-14 20:11:16.397699');


--
-- Data for Name: exam_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.exam_attempts VALUES ('a94efe28-8276-4bcd-8238-8a9fbcea1872', 'f097a785-040e-4017-9064-cb6f62354cf2', '2a1ed4a8-f3e5-4b2f-87a9-7368aa91470c', '2026-05-14 20:14:32.539265', '2026-05-14 20:15:27.318982', 100.00, true, 1, '2026-05-14 20:14:32.539265');
INSERT INTO public.exam_attempts VALUES ('b341defe-eaa3-4217-95e7-f0e4c95ed406', 'f097a785-040e-4017-9064-cb6f62354cf2', '2a1ed4a8-f3e5-4b2f-87a9-7368aa91470c', '2026-05-14 21:32:32.645077', '2026-05-14 21:35:14.658286', 0.00, false, 2, '2026-05-14 21:32:32.645077');
INSERT INTO public.exam_attempts VALUES ('b0021532-1f49-445f-a9d5-12392dcb3763', 'f097a785-040e-4017-9064-cb6f62354cf2', '2a1ed4a8-f3e5-4b2f-87a9-7368aa91470c', '2026-05-14 21:49:22.752968', '2026-05-14 21:49:28.963346', 100.00, true, 3, '2026-05-14 21:49:22.752968');


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.lessons VALUES ('a75a403c-1f85-4d27-a13a-00c29515ac64', '11c6b025-ba43-4c55-b7ec-6c39d3914e0b', 'Python Nedir?', 'Python; okunabilirliği yüksek, kolay öğrenilen ve çok amaçlı bir programlama dilidir.', 'https://example.com/python-nedir', 20, 1, '2026-05-14 20:10:52.326169', '2026-05-14 20:10:52.326169');
INSERT INTO public.lessons VALUES ('fa6a13f1-9f87-4885-82bf-f59f68fdc3ab', '11c6b025-ba43-4c55-b7ec-6c39d3914e0b', 'Python Kurulumu', 'Bu derste Python kurulumu ve geliştirme ortamı hazırlanır.', 'https://example.com/python-kurulum', 25, 2, '2026-05-14 20:10:52.326169', '2026-05-14 20:10:52.326169');
INSERT INTO public.lessons VALUES ('8e37a76d-a7d2-47cc-9767-4ba4066bdbbe', '11c6b025-ba43-4c55-b7ec-6c39d3914e0b', 'İlk Python Programı', 'Bu derste ekrana çıktı verme ve temel kod yapısı anlatılır.', 'https://example.com/ilk-python-programi', 30, 3, '2026-05-14 20:10:52.326169', '2026-05-14 20:10:52.326169');


--
-- Data for Name: lesson_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: lesson_completions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.lesson_completions VALUES ('4850aad6-ad8f-4044-bc20-6110f1da6d37', 'f097a785-040e-4017-9064-cb6f62354cf2', 'a75a403c-1f85-4d27-a13a-00c29515ac64', '2026-05-14 20:13:43.943739');
INSERT INTO public.lesson_completions VALUES ('e8946649-5d03-4c42-b697-478f4abca13d', 'f097a785-040e-4017-9064-cb6f62354cf2', 'fa6a13f1-9f87-4885-82bf-f59f68fdc3ab', '2026-05-14 20:13:43.943739');
INSERT INTO public.lesson_completions VALUES ('dfab8077-8387-422e-88d0-8a3ea5dc7813', 'f097a785-040e-4017-9064-cb6f62354cf2', '8e37a76d-a7d2-47cc-9767-4ba4066bdbbe', '2026-05-14 20:13:43.943739');


--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.questions VALUES ('4cf2a1d2-0dd4-4a62-bf1d-6f3d6418419f', '2a1ed4a8-f3e5-4b2f-87a9-7368aa91470c', 'MULTIPLE_CHOICE', 'Python hangi tür bir dildir?', '[{"id": "A", "text": "Programlama dili", "is_correct": true}, {"id": "B", "text": "Veritabanı sistemi", "is_correct": false}, {"id": "C", "text": "İşletim sistemi", "is_correct": false}, {"id": "D", "text": "Donanım parçası", "is_correct": false}]', 1, '2026-05-14 20:11:41.771181', '2026-05-14 20:11:41.771181');
INSERT INTO public.questions VALUES ('5096c29a-5ec7-476e-9737-c478a921b17a', '2a1ed4a8-f3e5-4b2f-87a9-7368aa91470c', 'TRUE_FALSE', 'Python sadece web geliştirme için kullanılır.', '[{"id": "TRUE", "text": "Doğru", "is_correct": false}, {"id": "FALSE", "text": "Yanlış", "is_correct": true}]', 2, '2026-05-14 20:11:41.771181', '2026-05-14 20:11:41.771181');
INSERT INTO public.questions VALUES ('7dee5e65-6335-4fe5-9e3e-e88257724894', '2a1ed4a8-f3e5-4b2f-87a9-7368aa91470c', 'MULTI_SELECT', 'Python hangi alanlarda kullanılabilir?', '[{"id": "A", "text": "Yapay zeka", "is_correct": true}, {"id": "B", "text": "Web geliştirme", "is_correct": true}, {"id": "C", "text": "Veri analizi", "is_correct": true}, {"id": "D", "text": "Sadece oyun konsolu üretimi", "is_correct": false}]', 3, '2026-05-14 20:11:41.771181', '2026-05-14 20:11:41.771181');


--
-- Data for Name: user_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_answers VALUES ('7dcfd8a1-26d6-408d-a639-4a7c9d965c95', 'a94efe28-8276-4bcd-8238-8a9fbcea1872', '4cf2a1d2-0dd4-4a62-bf1d-6f3d6418419f', '["A"]', true, 1.00, '2026-05-14 20:15:09.37626');
INSERT INTO public.user_answers VALUES ('ecd501f8-35ba-4be1-b709-3fea0ef5ff66', 'a94efe28-8276-4bcd-8238-8a9fbcea1872', '5096c29a-5ec7-476e-9737-c478a921b17a', '["FALSE"]', true, 1.00, '2026-05-14 20:15:09.37626');
INSERT INTO public.user_answers VALUES ('ca85352b-c098-4de9-895b-36b47ff77a91', 'a94efe28-8276-4bcd-8238-8a9fbcea1872', '7dee5e65-6335-4fe5-9e3e-e88257724894', '["A", "B", "C"]', true, 1.00, '2026-05-14 20:15:09.37626');
INSERT INTO public.user_answers VALUES ('438c1e84-63f5-416f-a727-a5ed911122de', 'b341defe-eaa3-4217-95e7-f0e4c95ed406', '4cf2a1d2-0dd4-4a62-bf1d-6f3d6418419f', '[]', false, 0.00, '2026-05-14 21:35:14.657772');
INSERT INTO public.user_answers VALUES ('fd684820-a92d-4b0e-b850-763d3971a531', 'b341defe-eaa3-4217-95e7-f0e4c95ed406', '5096c29a-5ec7-476e-9737-c478a921b17a', '[]', false, 0.00, '2026-05-14 21:35:14.658055');
INSERT INTO public.user_answers VALUES ('cee8e0be-e54b-4738-bfd5-e48d89fbbf8b', 'b341defe-eaa3-4217-95e7-f0e4c95ed406', '7dee5e65-6335-4fe5-9e3e-e88257724894', '[]', false, 0.00, '2026-05-14 21:35:14.658182');
INSERT INTO public.user_answers VALUES ('8e66c825-068d-4839-9df2-bf7939cc3425', 'b0021532-1f49-445f-a9d5-12392dcb3763', '4cf2a1d2-0dd4-4a62-bf1d-6f3d6418419f', '["A"]', true, 1.00, '2026-05-14 21:49:28.962849');
INSERT INTO public.user_answers VALUES ('9fdfb180-5746-4ed3-8936-03fbf96b291d', 'b0021532-1f49-445f-a9d5-12392dcb3763', '5096c29a-5ec7-476e-9737-c478a921b17a', '["FALSE"]', true, 1.00, '2026-05-14 21:49:28.963084');
INSERT INTO public.user_answers VALUES ('00669f41-086a-49b0-b694-e6179214e396', 'b0021532-1f49-445f-a9d5-12392dcb3763', '7dee5e65-6335-4fe5-9e3e-e88257724894', '["A", "B", "C"]', true, 1.00, '2026-05-14 21:49:28.963244');


--
-- PostgreSQL database dump complete
--

