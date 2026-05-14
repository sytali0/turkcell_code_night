--
-- PostgreSQL database dump
--



-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

-- Started on 2026-05-14 22:26:16

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
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

--CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 902 (class 1247 OID 16442)
-- Name: course_level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.course_level AS ENUM (
    'beginner',
    'intermediate',
    'advanced'
);


ALTER TYPE public.course_level OWNER TO postgres;

--
-- TOC entry 899 (class 1247 OID 16434)
-- Name: course_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.course_status AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE public.course_status OWNER TO postgres;

--
-- TOC entry 905 (class 1247 OID 16450)
-- Name: question_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.question_type AS ENUM (
    'MULTIPLE_CHOICE',
    'TRUE_FALSE',
    'MULTI_SELECT'
);


ALTER TYPE public.question_type OWNER TO postgres;

--
-- TOC entry 896 (class 1247 OID 16427)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'student',
    'instructor',
    'admin'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 229 (class 1259 OID 16656)
-- Name: certificates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    certificate_number character varying(100) NOT NULL,
    certificate_url text,
    issued_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.certificates OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16704)
-- Name: course_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    rating integer NOT NULL,
    review_text text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_course_reviews_rating CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.course_reviews OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16483)
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instructor_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100),
    level public.course_level DEFAULT 'beginner'::public.course_level NOT NULL,
    cover_image_url text,
    estimated_duration_min integer,
    status public.course_status DEFAULT 'draft'::public.course_status NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16571)
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    enrolled_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone,
    progress_percent integer DEFAULT 0 NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    CONSTRAINT chk_enrollments_progress CHECK (((progress_percent >= 0) AND (progress_percent <= 100)))
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16612)
-- Name: exam_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exam_id uuid NOT NULL,
    started_at timestamp without time zone DEFAULT now() NOT NULL,
    finished_at timestamp without time zone,
    score numeric(5,2),
    is_passed boolean DEFAULT false,
    attempt_no integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_exam_attempts_attempt_no CHECK ((attempt_no > 0)),
    CONSTRAINT chk_exam_attempts_score CHECK (((score IS NULL) OR ((score >= (0)::numeric) AND (score <= (100)::numeric))))
);


ALTER TABLE public.exam_attempts OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16533)
-- Name: exams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    time_limit_min integer NOT NULL,
    passing_score integer NOT NULL,
    question_count integer DEFAULT 10 NOT NULL,
    shuffle boolean DEFAULT true NOT NULL,
    max_attempts integer DEFAULT 3 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_exams_max_attempts CHECK ((max_attempts > 0)),
    CONSTRAINT chk_exams_passing_score CHECK (((passing_score >= 0) AND (passing_score <= 100))),
    CONSTRAINT chk_exams_question_count CHECK ((question_count > 0)),
    CONSTRAINT chk_exams_time_limit CHECK ((time_limit_min > 0))
);


ALTER TABLE public.exams OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16679)
-- Name: lesson_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lesson_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    user_id uuid NOT NULL,
    parent_comment_id uuid,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lesson_comments OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16593)
-- Name: lesson_completions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lesson_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lesson_id uuid NOT NULL,
    completed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lesson_completions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16517)
-- Name: lessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    video_url text,
    estimated_duration_min integer,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lessons OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16501)
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16473)
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    gsm_number character varying(20) NOT NULL,
    code character varying(10) DEFAULT '1234'::character varying NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    expires_at timestamp without time zone DEFAULT (now() + '00:10:00'::interval) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.otp_codes OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16555)
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exam_id uuid NOT NULL,
    type public.question_type NOT NULL,
    text text NOT NULL,
    options jsonb NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16634)
-- Name: user_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    attempt_id uuid NOT NULL,
    question_id uuid NOT NULL,
    selected_options jsonb NOT NULL,
    is_correct boolean,
    earned_point numeric(5,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_answers OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16457)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(255) NOT NULL,
    gsm_number character varying(20) NOT NULL,
    email character varying(255),
    password_hash text,
    role public.user_role DEFAULT 'student'::public.user_role NOT NULL,
    bio text,
    expertise text,
    interests text,
    is_gsm_verified boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4939 (class 2606 OID 16666)
-- Name: certificates certificates_certificate_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_certificate_number_key UNIQUE (certificate_number);


--
-- TOC entry 4941 (class 2606 OID 16664)
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- TOC entry 4947 (class 2606 OID 16714)
-- Name: course_reviews course_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT course_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 4915 (class 2606 OID 16495)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- TOC entry 4925 (class 2606 OID 16580)
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- TOC entry 4933 (class 2606 OID 16623)
-- Name: exam_attempts exam_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_attempts
    ADD CONSTRAINT exam_attempts_pkey PRIMARY KEY (id);


--
-- TOC entry 4921 (class 2606 OID 16549)
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- TOC entry 4945 (class 2606 OID 16688)
-- Name: lesson_comments lesson_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_comments
    ADD CONSTRAINT lesson_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4929 (class 2606 OID 16599)
-- Name: lesson_completions lesson_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_completions
    ADD CONSTRAINT lesson_completions_pkey PRIMARY KEY (id);


--
-- TOC entry 4919 (class 2606 OID 16527)
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- TOC entry 4917 (class 2606 OID 16511)
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- TOC entry 4913 (class 2606 OID 16482)
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- TOC entry 4923 (class 2606 OID 16565)
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- TOC entry 4943 (class 2606 OID 16668)
-- Name: certificates uq_certificates_user_course; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT uq_certificates_user_course UNIQUE (user_id, course_id);


--
-- TOC entry 4949 (class 2606 OID 16716)
-- Name: course_reviews uq_course_reviews_user_course; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT uq_course_reviews_user_course UNIQUE (user_id, course_id);


--
-- TOC entry 4927 (class 2606 OID 16582)
-- Name: enrollments uq_enrollments_user_course; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT uq_enrollments_user_course UNIQUE (user_id, course_id);


--
-- TOC entry 4931 (class 2606 OID 16601)
-- Name: lesson_completions uq_lesson_completions_user_lesson; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_completions
    ADD CONSTRAINT uq_lesson_completions_user_lesson UNIQUE (user_id, lesson_id);


--
-- TOC entry 4935 (class 2606 OID 16645)
-- Name: user_answers uq_user_answers_attempt_question; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answers
    ADD CONSTRAINT uq_user_answers_attempt_question UNIQUE (attempt_id, question_id);


--
-- TOC entry 4937 (class 2606 OID 16643)
-- Name: user_answers user_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answers
    ADD CONSTRAINT user_answers_pkey PRIMARY KEY (id);


--
-- TOC entry 4907 (class 2606 OID 16472)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4909 (class 2606 OID 16470)
-- Name: users users_gsm_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_gsm_number_key UNIQUE (gsm_number);


--
-- TOC entry 4911 (class 2606 OID 16468)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4963 (class 2606 OID 16674)
-- Name: certificates fk_certificates_course; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT fk_certificates_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4964 (class 2606 OID 16669)
-- Name: certificates fk_certificates_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT fk_certificates_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4968 (class 2606 OID 16722)
-- Name: course_reviews fk_course_reviews_course; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT fk_course_reviews_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4969 (class 2606 OID 16717)
-- Name: course_reviews fk_course_reviews_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT fk_course_reviews_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4950 (class 2606 OID 16496)
-- Name: courses fk_courses_instructor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT fk_courses_instructor FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4955 (class 2606 OID 16588)
-- Name: enrollments fk_enrollments_course; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4956 (class 2606 OID 16583)
-- Name: enrollments fk_enrollments_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4959 (class 2606 OID 16629)
-- Name: exam_attempts fk_exam_attempts_exam; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_attempts
    ADD CONSTRAINT fk_exam_attempts_exam FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- TOC entry 4960 (class 2606 OID 16624)
-- Name: exam_attempts fk_exam_attempts_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_attempts
    ADD CONSTRAINT fk_exam_attempts_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4953 (class 2606 OID 16550)
-- Name: exams fk_exams_module; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT fk_exams_module FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- TOC entry 4965 (class 2606 OID 16689)
-- Name: lesson_comments fk_lesson_comments_lesson; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_comments
    ADD CONSTRAINT fk_lesson_comments_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- TOC entry 4966 (class 2606 OID 16699)
-- Name: lesson_comments fk_lesson_comments_parent; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_comments
    ADD CONSTRAINT fk_lesson_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES public.lesson_comments(id) ON DELETE CASCADE;


--
-- TOC entry 4967 (class 2606 OID 16694)
-- Name: lesson_comments fk_lesson_comments_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_comments
    ADD CONSTRAINT fk_lesson_comments_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4957 (class 2606 OID 16607)
-- Name: lesson_completions fk_lesson_completions_lesson; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_completions
    ADD CONSTRAINT fk_lesson_completions_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- TOC entry 4958 (class 2606 OID 16602)
-- Name: lesson_completions fk_lesson_completions_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_completions
    ADD CONSTRAINT fk_lesson_completions_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4952 (class 2606 OID 16528)
-- Name: lessons fk_lessons_module; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- TOC entry 4951 (class 2606 OID 16512)
-- Name: modules fk_modules_course; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT fk_modules_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4954 (class 2606 OID 16566)
-- Name: questions fk_questions_exam; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT fk_questions_exam FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- TOC entry 4961 (class 2606 OID 16646)
-- Name: user_answers fk_user_answers_attempt; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answers
    ADD CONSTRAINT fk_user_answers_attempt FOREIGN KEY (attempt_id) REFERENCES public.exam_attempts(id) ON DELETE CASCADE;


--
-- TOC entry 4962 (class 2606 OID 16651)
-- Name: user_answers fk_user_answers_question; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answers
    ADD CONSTRAINT fk_user_answers_question FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


-- Completed on 2026-05-14 22:26:16

--
-- PostgreSQL database dump complete
--


