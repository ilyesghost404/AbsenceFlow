--
-- PostgreSQL database dump
--

\restrict B5bEdDRdzrazlaG5jeB1EaqaUMh6JlwKxoCG9m9wlxg3q50gTAExjOvV0r7Afyz

-- Dumped from database version 18.4 (Debian 18.4-1+b1)
-- Dumped by pg_dump version 18.4 (Debian 18.4-1+b1)

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
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: absences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.absences (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    type character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status character varying(30) DEFAULT 'Pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    validated_at timestamp without time zone,
    document_url text,
    source character varying(30) DEFAULT 'employee_request'::character varying NOT NULL,
    CONSTRAINT valid_absence_dates CHECK ((end_date >= start_date)),
    CONSTRAINT valid_absence_source CHECK (((source)::text = ANY ((ARRAY['employee_request'::character varying, 'automatic'::character varying])::text[]))),
    CONSTRAINT valid_absence_type CHECK (((type)::text = ANY ((ARRAY['Vacation'::character varying, 'Sick Leave'::character varying, 'Training'::character varying, 'Other'::character varying])::text[]))),
    CONSTRAINT valid_status CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Validated'::character varying, 'Rejected'::character varying])::text[])))
);


ALTER TABLE public.absences OWNER TO postgres;

--
-- Name: absences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.absences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.absences_id_seq OWNER TO postgres;

--
-- Name: absences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.absences_id_seq OWNED BY public.absences.id;


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    actor_id integer,
    action_type character varying(50) NOT NULL,
    target_user_id integer,
    description text,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    browser character varying(100),
    device character varying(100)
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    date date NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    status character varying(30) DEFAULT 'Present'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    validation_status character varying(30) DEFAULT 'Pending'::character varying,
    justification_reason text,
    face_verified boolean DEFAULT false,
    qr_verified boolean DEFAULT false,
    face_confidence double precision,
    verification_method character varying(50),
    qr_session_id integer,
    device_information text,
    verification_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_attendance_status CHECK (((status)::text = ANY ((ARRAY['Present'::character varying, 'Late'::character varying, 'Absent'::character varying])::text[])))
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_verification_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_verification_tokens OWNER TO postgres;

--
-- Name: email_verification_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_verification_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_verification_tokens_id_seq OWNER TO postgres;

--
-- Name: email_verification_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_verification_tokens_id_seq OWNED BY public.email_verification_tokens.id;


--
-- Name: employee_leave_balance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_leave_balance (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    year integer NOT NULL,
    total_days integer DEFAULT 25 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_leave_balance OWNER TO postgres;

--
-- Name: employee_leave_balance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_leave_balance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_leave_balance_id_seq OWNER TO postgres;

--
-- Name: employee_leave_balance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_leave_balance_id_seq OWNED BY public.employee_leave_balance.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    matricule character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(150),
    phone character varying(20),
    "position" character varying(100),
    hire_date date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    department_id integer
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: face_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.face_profiles (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    registered_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'active'::character varying,
    face_enabled boolean DEFAULT true,
    face_registered_at timestamp without time zone,
    last_face_verification timestamp without time zone,
    face_embedding jsonb,
    embedding_version character varying(50) DEFAULT 'arcface_v1'::character varying,
    CONSTRAINT face_profiles_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'disabled'::character varying])::text[])))
);


ALTER TABLE public.face_profiles OWNER TO postgres;

--
-- Name: face_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.face_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.face_profiles_id_seq OWNER TO postgres;

--
-- Name: face_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.face_profiles_id_seq OWNED BY public.face_profiles.id;


--
-- Name: face_security_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.face_security_logs (
    id integer NOT NULL,
    employee_id integer,
    action character varying(50) NOT NULL,
    result character varying(50) NOT NULL,
    confidence double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.face_security_logs OWNER TO postgres;

--
-- Name: face_security_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.face_security_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.face_security_logs_id_seq OWNER TO postgres;

--
-- Name: face_security_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.face_security_logs_id_seq OWNED BY public.face_security_logs.id;


--
-- Name: holidays; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.holidays (
    id integer NOT NULL,
    holiday_date date NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(50) DEFAULT 'National'::character varying,
    recurring boolean DEFAULT false,
    description text,
    color character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.holidays OWNER TO postgres;

--
-- Name: holidays_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.holidays_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.holidays_id_seq OWNER TO postgres;

--
-- Name: holidays_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.holidays_id_seq OWNED BY public.holidays.id;


--
-- Name: login_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    login_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address character varying(45),
    success boolean DEFAULT true,
    logout_time timestamp without time zone,
    browser character varying(100),
    device character varying(100)
);


ALTER TABLE public.login_history OWNER TO postgres;

--
-- Name: login_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.login_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.login_history_id_seq OWNER TO postgres;

--
-- Name: login_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.login_history_id_seq OWNED BY public.login_history.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(150) NOT NULL,
    message text NOT NULL,
    type character varying(50),
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_id_seq OWNER TO postgres;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: qr_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qr_sessions (
    id integer NOT NULL,
    company_id integer DEFAULT 1,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.qr_sessions OWNER TO postgres;

--
-- Name: qr_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.qr_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.qr_sessions_id_seq OWNER TO postgres;

--
-- Name: qr_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.qr_sessions_id_seq OWNED BY public.qr_sessions.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_jti character varying(255) NOT NULL,
    ip_address character varying(45),
    browser character varying(100),
    device character varying(100),
    expires_at timestamp without time zone NOT NULL,
    last_activity timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_id_seq OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_settings (
    id integer NOT NULL,
    user_id integer,
    email_notifications boolean DEFAULT true,
    absence_notifications boolean DEFAULT true,
    holiday_notifications boolean DEFAULT true,
    report_notifications boolean DEFAULT true,
    theme character varying(20) DEFAULT 'light'::character varying,
    density character varying(20) DEFAULT 'comfortable'::character varying,
    sidebar_collapsed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    approval_notifications boolean DEFAULT true,
    compact_mode boolean DEFAULT false
);


ALTER TABLE public.user_settings OWNER TO postgres;

--
-- Name: user_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_settings_id_seq OWNER TO postgres;

--
-- Name: user_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_settings_id_seq OWNED BY public.user_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    employee_id integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    failed_attempts integer DEFAULT 0,
    locked_until timestamp without time zone,
    is_verified boolean DEFAULT false,
    two_factor_enabled boolean DEFAULT false,
    two_factor_type character varying(20),
    totp_secret character varying(255),
    password_changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'active'::character varying,
    account_status character varying(20) DEFAULT 'Active'::character varying,
    activation_token character varying(255),
    activation_token_expiry timestamp without time zone,
    activated_at timestamp without time zone,
    reset_password_code character varying(10),
    reset_password_code_expiry timestamp without time zone,
    reset_password_verified boolean DEFAULT false,
    face_id_enabled boolean DEFAULT false,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying, 'employee'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: absences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absences ALTER COLUMN id SET DEFAULT nextval('public.absences_id_seq'::regclass);


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: email_verification_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verification_tokens ALTER COLUMN id SET DEFAULT nextval('public.email_verification_tokens_id_seq'::regclass);


--
-- Name: employee_leave_balance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balance ALTER COLUMN id SET DEFAULT nextval('public.employee_leave_balance_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: face_profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.face_profiles ALTER COLUMN id SET DEFAULT nextval('public.face_profiles_id_seq'::regclass);


--
-- Name: face_security_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.face_security_logs ALTER COLUMN id SET DEFAULT nextval('public.face_security_logs_id_seq'::regclass);


--
-- Name: holidays id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays ALTER COLUMN id SET DEFAULT nextval('public.holidays_id_seq'::regclass);


--
-- Name: login_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_history ALTER COLUMN id SET DEFAULT nextval('public.login_history_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: qr_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_sessions ALTER COLUMN id SET DEFAULT nextval('public.qr_sessions_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: user_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_settings ALTER COLUMN id SET DEFAULT nextval('public.user_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: absences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.absences (id, employee_id, type, start_date, end_date, reason, status, created_at, validated_at, document_url, source) FROM stdin;
1	4	Sick Leave	2026-07-27	2026-07-31	mridh	Validated	2026-07-23 11:04:15.71188	2026-07-23 11:04:34.691306	\N	employee_request
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, actor_id, action_type, target_user_id, description, ip_address, created_at, browser, device) FROM stdin;
1	1	login	1	User 'ilyes' logged in	::ffff:127.0.0.1	2026-07-23 10:32:56.958205	Unknown Browser	Unknown OS
2	1	login	1	User 'ilyes' logged in	::1	2026-07-23 10:34:03.674644	Opera	Linux
3	1	login	1	User 'ilyes' logged in	::1	2026-07-23 10:43:01.24123	Opera	Linux
5	1	login	1	User 'ilyes' logged in	::1	2026-07-23 10:45:30.100744	Opera	Linux
4	1	user_created	\N	User 'ilyeshmid' created with role 'manager' by admin 'ilyes'. Activation email sent.	::1	2026-07-23 10:43:42.456834	\N	\N
6	1	user_deleted	\N	User 'ilyeshmid' deleted by 'ilyes'	::1	2026-07-23 10:45:50.324162	\N	\N
8	1	login	1	User 'ilyes' logged in	::1	2026-07-23 10:48:54.4017	Opera	Linux
9	1	login	1	User 'ilyes' logged in	::ffff:127.0.0.1	2026-07-23 10:49:45.525484	Unknown Browser	Unknown OS
11	1	login	1	User 'ilyes' logged in	::ffff:127.0.0.1	2026-07-23 10:50:14.033897	Unknown Browser	Unknown OS
14	1	login	1	User 'ilyes' logged in	::1	2026-07-23 10:51:09.359826	Opera	Linux
15	1	login	1	User 'ilyes' logged in	::1	2026-07-23 10:51:25.775808	Opera	Linux
7	1	user_created	\N	User 'ilyesM' created with role 'manager' by admin 'ilyes'. Activation email sent.	::1	2026-07-23 10:46:15.641994	\N	\N
16	1	user_deleted	\N	User 'ilyesM' deleted by 'ilyes'	::1	2026-07-23 10:51:40.401393	\N	\N
18	1	login	1	User 'ilyes' logged in	::ffff:127.0.0.1	2026-07-23 10:54:15.471368	Unknown Browser	Unknown OS
21	1	login	1	User 'ilyes' logged in	::1	2026-07-23 10:55:26.037453	Opera	Linux
23	1	login	1	User 'ilyes' logged in	::1	2026-07-23 10:55:57.555239	Opera	Linux
19	1	user_created	\N	User 'mgr_verified_1784800455491' created with role 'manager' by admin 'ilyes'.	::ffff:127.0.0.1	2026-07-23 10:54:15.568637	\N	\N
20	\N	login	\N	User 'mgr_verified_1784800455491' logged in	::ffff:127.0.0.1	2026-07-23 10:54:15.659228	Unknown Browser	Unknown OS
24	1	user_deleted	\N	User 'mgr_verified_1784800455491' deleted by 'ilyes'	::1	2026-07-23 10:56:00.602469	\N	\N
17	1	user_created	\N	User 'ilyes_manager' created with role 'manager' by admin 'ilyes'.	::1	2026-07-23 10:52:05.94006	\N	\N
22	\N	login	\N	User 'ilyes_manager' logged in	::1	2026-07-23 10:55:49.932793	Opera	Linux
25	1	user_deleted	\N	User 'ilyes_manager' deleted by 'ilyes'	::1	2026-07-23 10:56:02.319675	\N	\N
12	1	user_created	\N	User 'manager_fixed' created with role 'manager' by admin 'ilyes'.	::ffff:127.0.0.1	2026-07-23 10:50:14.12784	\N	\N
13	\N	login	\N	User 'manager_fixed' logged in	::ffff:127.0.0.1	2026-07-23 10:50:14.20429	Unknown Browser	Unknown OS
26	1	user_deleted	\N	User 'manager_fixed' deleted by 'ilyes'	::1	2026-07-23 10:56:04.060087	\N	\N
10	1	user_created	\N	User 'manager_test' created with role 'manager' by admin 'ilyes'. Activation email sent.	::ffff:127.0.0.1	2026-07-23 10:49:47.175444	\N	\N
27	1	user_deleted	\N	User 'manager_test' deleted by 'ilyes'	::1	2026-07-23 10:56:06.432023	\N	\N
28	1	login	1	User 'ilyes' logged in	::1	2026-07-23 10:58:38.97189	Opera	Linux
29	1	user_created	8	User 'ilyes_manager' created with role 'manager' by admin 'ilyes'.	::1	2026-07-23 10:59:15.910522	\N	\N
30	8	login	8	User 'ilyes_manager' logged in	::1	2026-07-23 11:00:16.846044	Opera	Linux
31	1	login	1	User 'ilyes' logged in	::1	2026-07-23 11:01:57.491481	Opera	Linux
32	1	user_created	9	User 'ilyes_benhmid' created with role 'employee' by admin 'ilyes'.	::1	2026-07-23 11:02:33.128053	\N	\N
33	9	login	9	User 'ilyes_benhmid' logged in	::1	2026-07-23 11:03:30.681988	Opera	Linux
34	8	login	8	User 'ilyes_manager' logged in	::1	2026-07-23 11:04:23.604684	Opera	Linux
35	9	login	9	User 'ilyes_benhmid' logged in	::1	2026-07-23 11:05:59.032163	Opera	Linux
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, employee_id, date, check_in, check_out, status, created_at, validation_status, justification_reason, face_verified, qr_verified, face_confidence, verification_method, qr_session_id, device_information, verification_timestamp) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, description, created_at, updated_at) FROM stdin;
1	Administration	System Administration & Management	2026-07-23 10:32:53.308415	2026-07-23 10:32:53.308415
2	IT	IT	2026-07-23 11:00:48.107473	2026-07-23 11:00:48.107473
\.


--
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_verification_tokens (id, user_id, token_hash, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: employee_leave_balance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_leave_balance (id, employee_id, year, total_days, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, matricule, first_name, last_name, email, phone, "position", hire_date, created_at, department_id) FROM stdin;
1	ADM001	Ilyes	Hmid	hmidilyes4442@gmail.com	\N	System Administrator	2026-07-23	2026-07-23 10:32:53.313132	1
2	TST001	Test	Employee	test@winsap.local	\N	Tester	2026-07-23	2026-07-23 10:50:21.701507	\N
4	EMP002	ilyes	benhmid	hmidilyes100@gmail.com	52225791	chef	2026-07-24	2026-07-23 11:01:38.796401	2
\.


--
-- Data for Name: face_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.face_profiles (id, employee_id, registered_at, updated_at, status, face_enabled, face_registered_at, last_face_verification, face_embedding, embedding_version) FROM stdin;
1	2	2026-07-23 10:50:26.21903	2026-07-23 10:50:26.21903	active	t	2026-07-23 10:50:26.21903	\N	[0.6280758149108692, 0.39471904135844793, 0.1883833361723366, 0.8965838778294888, 0.44754942095747996, 0.2207945210714889, 0.4099314375307963, 0.006921329391911923, 0.17323735609102864, 0.9887312429522929, 0.8589670707608095, 0.7276858821018505, 0.8227196574174136, 0.9634903215103864, 0.2556746477666443, 0.6943254500722702, 0.4046762694271253, 0.7988550787088265, 0.9134091449893882, 0.8465360393209795, 0.35728078060017177, 0.7438919831468, 0.9326467569207331, 0.0005801099039830504, 0.711848061932297, 0.4599998909388795, 0.41792233708421744, 0.4881624447994112, 0.1741729055398834, 0.9868416398806078, 0.702256249235289, 0.4662869238382288, 0.974511056149656, 0.2690359107088276, 0.12816424547240557, 0.4957994348302648, 0.3345453792844785, 0.5628440060516829, 0.3170350289930802, 0.3286395767325415, 0.2028943556223125, 0.8771986399106003, 0.11071345918602626, 0.06966411185998689, 0.35120896455717454, 0.47739114707518915, 0.3809598993250185, 0.647650568972895, 0.5844238185497185, 0.8568493030229548, 0.43238450608318413, 0.23137993310470784, 0.15681511055724273, 0.36146632562981285, 0.9333606485097694, 0.10263725009191649, 0.29556533652890427, 0.5540102553785675, 0.8159240589478994, 0.9508145667409763, 0.8726445422167006, 0.46643738234219345, 0.13077635013731215, 0.4844295544764464, 0.7939571984813981, 0.49381265470866376, 0.9100226600951571, 0.5215172856694357, 0.4776588786389351, 0.05880247837944863, 0.13697771278877557, 0.5136162859291181, 0.585146690545795, 0.1279056323948008, 0.19834834696109538, 0.8287261456134009, 0.6716063381455183, 0.011866985239124439, 0.3843610037638251, 0.6524710386959945, 0.8059455208699302, 0.1267209393751726, 0.5033773700699502, 0.5859170208339486, 0.3762910913054107, 0.935749066133315, 0.44375753321865086, 0.17257591440823972, 0.16606539078307947, 0.1885500209946167, 0.40789156531544557, 0.1606454183627647, 0.33767677435075794, 0.34331979262426504, 0.09448469878785604, 0.5434379301976834, 0.7824993559610272, 0.10299543713806325, 0.016422013854670015, 0.624368489602156, 0.026210619761217302, 0.5106343160650989, 0.920521907352423, 0.46400763086919294, 0.48165343987701814, 0.7303443809274217, 0.7429231999161393, 0.2626796103888105, 0.08693217267795594, 0.03186671312067335, 0.99722062103788, 0.543213544620372, 0.09441309256838737, 0.5007195561558974, 0.8327865960119444, 0.4838521698315954, 0.3434082237180459, 0.42798450665639454, 0.23743605925389732, 0.5837957580432916, 0.41870209693187355, 0.9975590711180417, 0.1860594432543713, 0.09249899137640627, 0.14278556243892204, 0.41076461692202737, 0.8981136867089892, 0.17173041724293325, 0.21622903470662558, 0.4484061516832294, 0.09347788360628029, 0.47152472919241595, 0.3460266849996376, 0.8466759885763908, 0.5437001041234144, 0.06072418210459818, 0.4025305377582471, 0.30123223625214324, 0.3134253593980416, 0.7149298983358777, 0.06903850593872096, 0.19961066063996746, 0.5204737966577885, 0.6381529669630445, 0.5588682486883639, 0.8333845106330567, 0.5371919664541315, 0.6330862039686159, 0.9085818245298628, 0.5944522408083133, 0.5617280003999356, 0.07606804585222093, 0.3540539471857481, 0.5620709388634917, 0.6245382179648692, 0.7851208266801603, 0.6245747548384417, 0.17402094396861034, 0.9724029654312026, 0.9162311846986175, 0.8186570126323317, 0.16104675184738249, 0.38694734668998465, 0.5884001090123665, 0.7764917851450839, 0.6193501720642464, 0.9970116203068833, 0.9411452493500937, 0.4409468766300596, 0.9246771841879217, 0.005149079966010439, 0.3145458388038549, 0.3879763123207087, 0.11950339994591774, 0.1244483450978614, 0.18093910027181703, 0.9370385251968962, 0.5255127284829623, 0.4923246015697027, 0.6599434988794312, 0.06989536020808151, 0.8079791626683125, 0.804790981677278, 0.7514301243005056, 0.9295512305914675, 0.36988216037961974, 0.2862229319329641, 0.8476853142284667, 0.3962526271143899, 0.864920542157226, 0.01440498031290638, 0.019047697764172256, 0.24323457054089026, 0.0681653226920722, 0.21084226425957597, 0.5094936671170373, 0.451818676777912, 0.5111326515282205, 0.38106853561152454, 0.24993716026020107, 0.5736641644868726, 0.9583119565868269, 0.9644327840895524, 0.37361268516527557, 0.2995563624134042, 0.34514478376113145, 0.4340304713264641, 0.7743264369158582, 0.4311108325997297, 0.4592330297293329, 0.48345081510785126, 0.18322624299031565, 0.43562999117759504, 0.7950919321331009, 0.010642367748801673, 0.08572052268564412, 0.8096861653306099, 0.9587027057345326, 0.9373336834234566, 0.6240760708968589, 0.7767667430098153, 0.696515312112091, 0.9128793017711408, 0.9408359132468468, 0.8519847111079839, 0.03297306722707383, 0.7394494335887896, 0.9584282936552218, 0.8625503279167592, 0.5856569690624704, 0.030125296929174206, 0.2894068771512328, 0.7834463739692189, 0.19045528133674328, 0.5937006993679332, 0.8807722657355764, 0.36165442041936646, 0.4772903657299544, 0.24333192079531796, 0.4948057210113458, 0.9226767629520327, 0.3569818483601763, 0.15592581813183648, 0.17793206172997855, 0.4741570293052345, 0.3097732195815872, 0.6216995311128707, 0.9164511239907611, 0.9194489265101068, 0.6370939774880979, 0.610357621789886, 0.5453102238272866, 0.6880412883954552, 0.5546793594355728, 0.5036202358047716, 0.20837374297051814, 0.9367004861869284, 0.04683635448142798, 0.866413501083753, 0.16109752611001937, 0.3630326577097568, 0.8702479205579793, 0.577230938655795, 0.8545720091949887, 0.506440613721453, 0.2288864115167678, 0.5889178728636224, 0.4723949230785196, 0.9519403118750258, 0.6872823409166406, 0.9345852970203986, 0.48758914898601236, 0.730060954329592, 0.06973634284392949, 0.5523927390289753, 0.8851845851906673, 0.1013529850181073, 0.28898891181302677, 0.10775712673189042, 0.1786753534458273, 0.26087277609763937, 0.02060680566398365, 0.499359633935182, 0.08325593906928341, 0.7941836872084924, 0.6040307603515214, 0.8522164280378636, 0.6609692469910317, 0.5424884529768446, 0.7692131880884584, 0.7624582709903653, 0.7730728100055625, 0.35743181283904923, 0.5329953535011938, 0.29217786772374044, 0.00945934692167194, 0.1317427647846201, 0.5990760003025156, 0.4102246546549986, 0.948000193997678, 0.7186986414175187, 0.6583610688230482, 0.28831044897426306, 0.4140400331127184, 0.46550015691017466, 0.8525106631781174, 0.04020841762832694, 0.1065946571700025, 0.5881045495859589, 0.05793541813057845, 0.777825161474756, 0.7899068612539779, 0.41253344933482217, 0.013088658897759231, 0.03311006852139664, 0.5376935612992857, 0.7032102597194793, 0.8901750884274561, 0.29873002861617803, 0.35801898240612595, 0.595269523414116, 0.38636811132494187, 0.9771605733219477, 0.7855923556834321, 0.18425549383551643, 0.9534643972902449, 0.3435251176348305, 0.0518757918045446, 0.4259832164896795, 0.8744915423814805, 0.045955505717680256, 0.549051445246453, 0.5948403026162088, 0.9227896895939497, 0.4699014482171848, 0.6035912106530774, 0.6054313742542924, 0.46137159615507595, 0.06489848926986164, 0.4221335698705123, 0.4001490003389102, 0.9092531067509725, 0.5162851859930023, 0.118495994586719, 0.5790572232869083, 0.6965623163732004, 0.9923729712041106, 0.28191232889095263, 0.8125316380265307, 0.5900121997733334, 0.4479291688808693, 0.7342604838058407, 0.5758629265340495, 0.8440642284826759, 0.4507682584717164, 0.29083930003480385, 0.0879767162628401, 0.6520279618465997, 0.7332614715446057, 0.4987562163482383, 0.29961640046293647, 0.5729200400950207, 0.4782939722797166, 0.7770946241003155, 0.5605503558739503, 0.8820637057676776, 0.8486343282547272, 0.10389508404152559, 0.9745217834768362, 0.672913111584232, 0.8622660085149455, 0.05005520403424579, 0.4473908706081644, 0.12330870413512895, 0.6573985541807482, 0.043431965991529986, 0.40993223136341894, 0.04231088293427243, 0.2592437418503414, 0.8720334282636479, 0.8056306035102331, 0.48170297328159906, 0.9207299197323834, 0.38578455795105115, 0.3886740320442541, 0.8510418946953271, 0.4228992267135766, 0.40861044685167824, 0.08159924309095068, 0.30093624510317163, 0.9252483496468912, 0.4917192292453221, 0.9782702230513572, 0.9679739998023426, 0.004404431446223711, 0.9222890264188359, 0.45712668832439163, 0.5368715601166919, 0.8985278729591729, 0.8079503335182269, 0.620716179821871, 0.2385039838193619, 0.9972076847344123, 0.5433985336491384, 0.21556130213518998, 0.4613508927439339, 0.8013804611172514, 0.8186187048794548, 0.7656330879384687, 0.9459767228617317, 0.13429213515317062, 0.49703105514068524, 0.45309438492453746, 0.19806733655445186, 0.8565405132529359, 0.3081676545967922, 0.31428441677159347, 0.041256913972103515, 0.8812700190499474, 0.5003730557168511, 0.08322804644698789, 0.7706988230835505, 0.3670365279333039, 0.25466774103407097, 0.9506620092313868, 0.07681961440056384, 0.4637584194066008, 0.3807550689302057, 0.8523341184253416, 0.4415120828435418, 0.8518325617289506, 0.8951089746312016, 0.1790533153725986, 0.1197835013043217, 0.38061002738664185, 0.21757832563617097, 0.003591935251875844, 0.29131799833632077, 0.5780792057129018, 0.40263542462411295, 0.4777889916440027, 0.23184098587555413, 0.7110711294252369, 0.7029158168645846, 0.9189890542626572, 0.8189834994707099, 0.4235163137813567, 0.24752404637363223, 0.6865451702775682, 0.19400401469948647, 0.8019040018016899, 0.4719067235368234, 0.11321755195419403, 0.839735233599435, 0.5735372718482075, 0.23887854490876548, 0.7077539092196723, 0.6618102944418828, 0.2751315059944146, 0.9583782080359478, 0.28379022868718673, 0.6483128182766585, 0.2460312636871782, 0.7869117644139771, 0.8641663988575106, 0.029836425518345533, 0.30352575665698156, 0.6731442093215055, 0.9648139584433869, 0.032095589955859594, 0.05772625657525088, 0.5032308726293961, 0.8845837620916307, 0.6102457040080314, 0.1939401998737702, 0.6742706303526349, 0.43618070454038926, 0.5604609606356731, 0.9847374096360045, 0.019096668602541667, 0.19597480207334583, 0.45246389746231297, 0.2186018778186356, 0.27071988649392487, 0.23959366228808132, 0.2944075107908686, 0.19601467445039156, 0.6132851710721323, 0.6791554703144197, 0.49510947539605665, 0.636804752240265, 0.8934129742192807, 0.2653492709484444, 0.6247993971516174, 0.008031710081979226, 0.5026145118018877, 0.5388071589586678, 0.3839651844747498, 0.7775589435671102, 0.0911935205180574, 0.42624065153379154, 0.05703275877728087, 0.8716091796056784, 0.06142841186710346, 0.4142260228161233, 0.7937746860690235, 0.11645898080035966, 0.02855310666878763, 0.8369682789134462, 0.08762058959639074, 0.09944544422775226, 0.5912568801054844]	arcface_v1
2	4	2026-07-23 11:03:09.38471	2026-07-23 11:03:09.38471	active	t	2026-07-23 11:03:09.38471	2026-07-23 11:03:51.403389	[-1.5859131813049316, -0.11489889770746231, 0.7313137650489807, 0.1829824447631836, 0.44900596141815186, -1.3877232074737549, -0.8336623907089233, -0.8863489627838135, -0.2827410399913788, 0.7846077084541321, -0.5781816244125366, -0.3032539486885071, -0.6610735654830933, -0.9025912880897522, 0.9889061450958252, -0.4208926558494568, 1.2299613952636719, 0.8875852823257446, 0.17212237417697906, 0.3440427780151367, 0.2687273621559143, -0.5747194886207581, -0.04018670320510864, -0.5112583637237549, 0.34749332070350647, -2.416970729827881, 0.16470980644226074, -0.7591455578804016, -1.0754055976867676, 0.21004825830459595, -0.1719876378774643, 0.0245017409324646, -0.966719388961792, -0.4582112431526184, 1.409924030303955, -0.9602665901184082, -0.9138845801353455, 2.736457586288452, 0.9150959253311157, 1.5699135065078735, 0.2090710550546646, 0.2765701115131378, 0.20528057217597961, 0.866989254951477, 0.11496730148792267, 0.7686004638671875, -1.4653412103652954, 0.6286226511001587, 0.7968865036964417, 1.7400411367416382, 0.09820520877838135, -0.40009939670562744, -1.1585299968719482, 0.7294803261756897, -1.301892876625061, 1.1676042079925537, 1.9911043643951416, 0.6854225397109985, 0.748003363609314, -0.16433897614479065, 1.743456482887268, 0.8763508796691895, -0.3316454291343689, 0.9244795441627502, 0.4306698441505432, -2.6275243759155273, -1.589035153388977, -1.3502857685089111, 0.30309829115867615, 0.047428689897060394, -0.8910847306251526, 0.1974371373653412, -0.38071733713150024, 0.16993877291679382, 1.4809962511062622, 0.7483381032943726, 0.6022773385047913, -0.6520012021064758, -1.5384788513183594, 0.9870487451553345, -0.3753170967102051, -1.5244948863983154, -0.0685049444437027, -0.3957372307777405, -0.4156949520111084, -0.32957619428634644, 0.1514582633972168, 1.5372097492218018, 1.4933353662490845, 1.0564510822296143, -2.0787620544433594, 1.555928111076355, -0.20411857962608337, -0.443774938583374, 2.5312371253967285, 0.1382320076227188, -0.04602509364485741, -0.5018721222877502, -1.2578755617141724, 0.7049803733825684, 0.7287363409996033, 0.03998430818319321, 0.6442528367042542, 1.1669436693191528, 0.9172623157501221, -0.8829720616340637, -0.34998127818107605, -0.02171790599822998, -0.6553100943565369, 0.34659796953201294, 2.2141106128692627, -2.435518741607666, 0.08156369626522064, -1.2876098155975342, 0.18813733756542206, -0.7999300956726074, 0.11451202630996704, 0.03989233821630478, 0.6898360848426819, -0.29479360580444336, 0.7047819495201111, 0.16065877676010132, -0.564103364944458, -1.1673094034194946, 0.1188599094748497, -1.0552937984466553, 1.4053165912628174, -1.4822779893875122, -0.5416420102119446, -0.9064536690711975, 1.4441804885864258, -0.4651241600513458, -0.4170134663581848, 0.19534650444984436, -1.2440190315246582, 0.2811272442340851, -1.49569571018219, -1.2483187913894653, 0.4131264090538025, -0.06941073387861252, 0.3473861813545227, 2.132359504699707, 1.503973126411438, 0.3723236918449402, 0.5836483836174011, 0.3726964592933655, -1.1043989658355713, 1.3887856006622314, -0.48232924938201904, 1.0331000089645386, 2.892496109008789, -0.8957369923591614, -0.4730226397514343, 0.005712856538593769, -0.42713505029678345, 0.7830827832221985, -1.2342076301574707, 0.8587534427642822, 0.6448805332183838, -0.54439777135849, 0.034093670547008514, -0.11514304578304291, -0.11917611956596375, 0.6262217164039612, 1.0023083686828613, 0.1266702264547348, 0.559544563293457, 0.2716500461101532, 0.7131373286247253, 0.5272555351257324, -1.0011711120605469, -0.6619073152542114, 0.15212133526802063, -0.8715378046035767, -1.852213978767395, -1.2779771089553833, 0.16402561962604523, 1.8588166236877441, -1.1401921510696411, -0.7773969173431396, 0.8285562992095947, -0.5205721855163574, 0.4564065933227539, 1.014816164970398, 0.7637303471565247, -0.11530187726020813, 0.29049214720726013, -1.2450053691864014, 0.6211016178131104, 1.2059741020202637, -0.5049317479133606, -0.7695543766021729, -0.22325031459331512, -1.1085398197174072, -0.15602421760559082, -1.3878147602081299, 1.1980394124984741, -0.19888043403625488, 0.045391105115413666, 1.6733702421188354, -0.6785024404525757, -1.614527940750122, -0.4524766802787781, 0.031809911131858826, 0.2745093107223511, -0.6507863402366638, -1.041995644569397, 0.004848465323448181, -0.22690381109714508, 0.32455897331237793, 2.0997042655944824, 0.04774146527051926, -1.1777207851409912, -0.5996465086936951, -2.9543824195861816, 3.305511236190796, -0.4169040024280548, -1.0105807781219482, -0.6784876585006714, -0.6202539205551147, -0.6972021460533142, -0.44847172498703003, 1.2631487846374512, 0.13587331771850586, 0.17783072590827942, -0.8453775644302368, -1.0328015089035034, -0.9797425270080566, -0.03270447254180908, 0.9830239415168762, -2.024759292602539, -0.4686398208141327, 2.271807909011841, -0.1832512617111206, 1.344992995262146, -0.15286751091480255, -1.1004480123519897, 1.180195927619934, 0.07629764825105667, 0.5041038990020752, -3.104149580001831, -0.8243098258972168, -1.4338027238845825, 0.4525575339794159, 0.45278462767601013, -0.7515726089477539, 0.6453324556350708, -1.446020483970642, -0.9374769330024719, 0.28992998600006104, 0.71538245677948, 0.1675688773393631, -0.7132608890533447, 0.05836748331785202, 1.3460302352905273, 0.0317995548248291, 0.05552992969751358, 0.41170454025268555, 1.4366495609283447, 0.4705253541469574, -0.3493973910808563, -0.633098304271698, -0.47433462738990784, 0.4681780934333801, 0.6624938249588013, -0.5483711957931519, 0.295256644487381, 1.2321350574493408, 0.6860144138336182, 1.1829514503479004, 1.217483401298523, 0.4154178202152252, 0.20802120864391327, -2.2851920127868652, 0.49978873133659363, -0.16926908493041992, 0.03169943392276764, 2.360884428024292, -1.6340659856796265, -1.5161492824554443, -1.143292784690857, 0.2658542990684509, -1.4310351610183716, -0.09103021025657654, -0.08257075399160385, 0.006948709487915039, -1.9464843273162842, -1.7043954133987427, -2.3143229484558105, 1.0243433713912964, -0.08661112189292908, 1.0061705112457275, 0.8368285894393921, 0.48665696382522583, 0.6725382804870605, 1.5313761234283447, 2.234431028366089, -0.297562837600708, -0.0005434602499008179, -0.12180635333061218, -0.846027135848999, -0.2428293228149414, -0.805637776851654, 0.8739944100379944, 0.514802873134613, -0.08844992518424988, 0.2888472378253937, 0.891550600528717, -1.1827178001403809, 2.044506549835205, -0.599120557308197, -0.5125565528869629, -1.269669771194458, 0.5652848482131958, -1.3548755645751953, -0.2272614985704422, -0.7905770540237427, -1.0149191617965698, -0.3685305118560791, 2.4186036586761475, 0.8830351233482361, 1.1726820468902588, -2.8860490322113037, 2.2933433055877686, 0.09649433195590973, 0.9973148107528687, 0.9009132385253906, 0.2923603057861328, -1.6774967908859253, 0.1986347734928131, -0.7076495885848999, -0.6363416314125061, 1.5420948266983032, 0.14455875754356384, 0.5913828611373901, 0.15106874704360962, 0.9986276030540466, 0.888077974319458, -2.490272283554077, -2.105900287628174, 1.3722338676452637, -0.07509471476078033, -0.4234482944011688, 0.07022753357887268, 0.3693752586841583, 1.0012329816818237, -0.15358901023864746, -1.2533811330795288, 0.6738699078559875, 0.7177741527557373, 0.43833598494529724, 1.9709062576293945, 1.7116103172302246, -0.48929768800735474, -0.22305715084075928, -0.21607813239097595, -0.7104055881500244, -2.1957149505615234, -1.0113377571105957, 0.612978994846344, 0.6908161044120789, 1.9280664920806885, 0.18665365874767303, -0.36035123467445374, -0.5633987188339233, -1.9785199165344238, -2.470189094543457, -0.9331491589546204, -0.9959620237350464, -0.7903980016708374, -0.9539519548416138, 0.504417896270752, -1.6817598342895508, -1.199714183807373, -0.8353612422943115, -0.8137217164039612, 0.19827304780483246, -0.6454787254333496, -1.337030053138733, -0.20297783613204956, -0.22126466035842896, 0.21147792041301727, -1.4029227495193481, -1.9774225950241089, 0.5106611251831055, -0.17095379531383514, 0.1328732967376709, 0.46512508392333984, -0.2300327569246292, -0.3226231038570404, 0.13058948516845703, -0.6459107995033264, -0.9858288764953613, 1.1052714586257935, -1.6436527967453003, -1.456579566001892, -0.7511023283004761, 0.7357884049415588, -0.1911245733499527, 0.8060967922210693, -0.028130412101745605, 0.315121054649353, -0.36451196670532227, -0.18207144737243652, 0.6620364785194397, -1.3947012424468994, -1.0680736303329468, 1.0779091119766235, 0.5692066550254822, 1.9844810962677002, 0.37200483679771423, 1.2016785144805908, -0.14936833083629608, 0.44663867354393005, -0.2098207175731659, -0.22813859581947327, 0.8100394606590271, 0.47982168197631836, -1.2498043775558472, -1.9166102409362793, -1.0284322500228882, -1.216421365737915, -1.4495964050292969, 0.3275776505470276, 0.5904659032821655, -0.6098500490188599, 0.8516067862510681, -0.3458670675754547, -1.3995000123977661, -0.376854807138443, -0.9812712073326111, 1.2706702947616577, -0.21186110377311707, 0.8170313835144043, 1.2823010683059692, -1.606273889541626, -0.7675206065177917, 1.2544260025024414, -0.3546389937400818, -0.17494401335716248, -0.9968233108520508, -0.34904947876930237, -1.6305168867111206, 0.8322029113769531, 0.10591557621955872, 0.9131674766540527, 0.27005577087402344, -2.027777671813965, 0.0745965987443924, 1.1193456649780273, -0.9257788062095642, -0.27668774127960205, -0.5455187559127808, 0.17717154324054718, 0.9974814653396606, 0.13862881064414978, 0.23697581887245178, 0.3067063093185425, 1.6314387321472168, 0.8481776714324951, -2.4907398223876953, 2.095686912536621, 0.734221875667572, 0.513390064239502, 0.6363534927368164, -0.6652121543884277, -0.11195342987775803, -0.46959248185157776, -0.5590783357620239, 1.0811463594436646, -0.03942137956619263, -0.9707385301589966, 0.2152194082736969, 1.2275789976119995, -0.4877026081085205, -0.21259629726409912, -0.7036083340644836, 0.4155898690223694, 2.1933276653289795, 0.11504129320383072, 1.2192442417144775, 0.8285234570503235, 3.1235790252685547, -0.06414197385311127, -0.40044569969177246, -1.479985237121582, -0.7960085272789001, -0.8133281469345093, 1.1512247323989868, -0.2646121680736542, 1.1954046487808228, 0.5633773803710938, -0.5364498496055603, 1.1989294290542603, -0.46516525745391846, 1.896446704864502, 1.199009656906128, -0.3547537326812744, 0.4326075315475464, 2.1321020126342773, -1.606157660484314, -0.3262730836868286, 0.028826728463172913, -0.501768946647644, -1.413576364517212, 1.063977837562561, 3.28531551361084, -0.40693673491477966, -1.5001564025878906, -0.705372154712677, 1.5176581144332886, 1.6434448957443237]	arcface_v1
\.


--
-- Data for Name: face_security_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.face_security_logs (id, employee_id, action, result, confidence, created_at) FROM stdin;
1	4	REGISTER	SUCCESS	\N	2026-07-23 11:03:09.390508
2	4	VERIFY	SUCCESS	92.56016422848981	2026-07-23 11:03:51.398891
\.


--
-- Data for Name: holidays; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.holidays (id, holiday_date, name, type, recurring, description, color, created_at) FROM stdin;
1	2026-07-30	aid	National	f	aid	blue	2026-07-23 11:05:10.953197
\.


--
-- Data for Name: login_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_history (id, user_id, login_time, ip_address, success, logout_time, browser, device) FROM stdin;
1	1	2026-07-23 10:32:56.955956	::ffff:127.0.0.1	t	\N	Unknown Browser	Unknown OS
2	1	2026-07-23 10:33:58.929026	::1	f	\N	Opera	Linux
3	1	2026-07-23 10:34:03.672521	::1	t	\N	Opera	Linux
4	1	2026-07-23 10:43:01.239803	::1	t	\N	Opera	Linux
5	1	2026-07-23 10:45:30.098935	::1	t	\N	Opera	Linux
6	1	2026-07-23 10:48:54.39986	::1	t	\N	Opera	Linux
7	1	2026-07-23 10:49:45.523475	::ffff:127.0.0.1	t	\N	Unknown Browser	Unknown OS
8	1	2026-07-23 10:50:14.031477	::ffff:127.0.0.1	t	\N	Unknown Browser	Unknown OS
10	1	2026-07-23 10:51:09.357362	::1	t	\N	Opera	Linux
11	1	2026-07-23 10:51:25.771956	::1	t	\N	Opera	Linux
12	1	2026-07-23 10:54:15.469844	::ffff:127.0.0.1	t	\N	Unknown Browser	Unknown OS
14	1	2026-07-23 10:55:26.034477	::1	t	\N	Opera	Linux
16	1	2026-07-23 10:55:57.554052	::1	t	\N	Opera	Linux
17	1	2026-07-23 10:58:38.969795	::1	t	\N	Opera	Linux
18	8	2026-07-23 11:00:16.844353	::1	t	\N	Opera	Linux
19	1	2026-07-23 11:01:57.488142	::1	t	\N	Opera	Linux
20	9	2026-07-23 11:03:30.680232	::1	t	\N	Opera	Linux
21	8	2026-07-23 11:04:23.603275	::1	t	\N	Opera	Linux
22	9	2026-07-23 11:05:59.029693	::1	t	\N	Opera	Linux
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, message, type, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (id, user_id, token_hash, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: qr_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.qr_sessions (id, company_id, token, expires_at, used, created_at) FROM stdin;
1	1	0c04619e9c3d4c7151e84cf3f67a8e3accc590623440dd59377cc8e99201cb1e	2026-07-23 10:51:26.289	t	2026-07-23 10:50:26.289922
2	1	71a5e9ee1d2ac3269b78fb8f918f226a2f02c82c74d3219787d36ec6e4daa9aa	2026-07-23 10:51:26.296	f	2026-07-23 10:50:26.296419
3	1	109902a440cc88e476f352d736b86f984ff1283e8084cd306786821d5f007f8f	2026-07-23 10:45:26.297	f	2026-07-23 10:50:26.29772
4	1	41b8afb17aa594c825af1a15cd681bed7382c3b06ce099c14133328aefdbc18d	2026-07-23 11:01:33.499	f	2026-07-23 11:00:33.500186
5	1	a5106f60165d314ff536f6d614c9c1b39a62c0d66fc8608517cdd64915dba534	2026-07-23 11:01:33.501	f	2026-07-23 11:00:33.501321
6	1	4904de614ad6d2673867fb8dab4373475a3d2c5225cde297120b61baf202590d	2026-07-23 11:06:42.852	f	2026-07-23 11:05:42.852224
7	1	21f7c1e8b4884103e6a7e217a5d197038fc14ed325da577662b7a70cd3c0c19b	2026-07-23 11:06:42.87	f	2026-07-23 11:05:42.871049
8	1	bd9d522377a2d78eee2df1e9e1bb860c6d9e365800ab871b39cc6f11563410b2	2026-07-23 11:06:46.233	f	2026-07-23 11:05:46.233197
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, user_id, token_jti, ip_address, browser, device, expires_at, last_activity, created_at) FROM stdin;
1	1	fde33aa9-440b-4603-bebe-3a9668cc0b37	::ffff:127.0.0.1	Unknown Browser	Unknown OS	2026-07-23 11:32:56	2026-07-23 10:32:56.963516	2026-07-23 10:32:56.963516
18	1	4f21eaab-9424-4052-83a9-fe700cafcf59	::1	Opera	Linux	2026-07-23 12:01:57	2026-07-23 11:03:13.091753	2026-07-23 11:01:57.494708
5	1	0493eeb7-25ee-4def-92f0-3e5d4ffe70be	::1	Opera	Linux	2026-07-23 11:48:54	2026-07-23 10:48:54.502368	2026-07-23 10:48:54.404287
6	1	7d53ac87-64c1-4cb9-9a8a-a93bd236dcd6	::ffff:127.0.0.1	Unknown Browser	Unknown OS	2026-07-23 11:49:45	2026-07-23 10:49:45.5444	2026-07-23 10:49:45.526994
7	1	679f7227-5cb4-4d2f-846a-3752297df31d	::ffff:127.0.0.1	Unknown Browser	Unknown OS	2026-07-23 11:50:14	2026-07-23 10:50:14.063012	2026-07-23 10:50:14.038733
2	1	5af20049-9be9-4814-8fa0-2aee9088468a	::1	Opera	Linux	2026-07-23 11:34:03	2026-07-23 10:34:22.569861	2026-07-23 10:34:03.677614
9	1	4a55cfba-3369-4c99-ad42-449889da4c7c	::1	Opera	Linux	2026-07-23 11:51:09	2026-07-23 10:51:09.505386	2026-07-23 10:51:09.361863
16	1	13fcc0cc-4ec3-4cb9-83c0-c0b976e97a59	::1	Opera	Linux	2026-07-23 11:58:38	2026-07-23 11:00:01.990447	2026-07-23 10:58:38.973985
21	9	297a071e-fe0d-49a5-80e9-3b82f97f1b99	::1	Opera	Linux	2026-07-23 12:05:59	2026-07-23 11:06:36.639469	2026-07-23 11:05:59.034213
3	1	aa27fbcc-72b1-4b29-908a-37ff0c9dde5f	::1	Opera	Linux	2026-07-23 11:43:01	2026-07-23 10:43:42.507998	2026-07-23 10:43:01.243383
15	1	eed8c306-44c9-4ad1-9bb4-9365889377dd	::1	Opera	Linux	2026-07-23 11:55:57	2026-07-23 10:56:08.112952	2026-07-23 10:55:57.557193
10	1	1549c8b1-189b-4732-9d2d-f5b37bbae6a3	::1	Opera	Linux	2026-07-23 11:51:25	2026-07-23 10:52:29.94354	2026-07-23 10:51:25.778106
11	1	10cfc646-e8ae-4c7c-9707-7146a0a937ea	::ffff:127.0.0.1	Unknown Browser	Unknown OS	2026-07-23 11:54:15	2026-07-23 10:54:15.499263	2026-07-23 10:54:15.476687
17	8	4bf341a7-7a50-4609-ad25-ae3c5d3b4f6c	::1	Opera	Linux	2026-07-23 12:00:16	2026-07-23 11:01:50.809029	2026-07-23 11:00:16.848264
13	1	049f3384-01d7-4633-9c4f-6053324974fd	::1	Opera	Linux	2026-07-23 11:55:26	2026-07-23 10:55:27.799542	2026-07-23 10:55:26.040921
4	1	a1d5ea29-e18f-49ad-aee2-9e3c9c300bab	::1	Opera	Linux	2026-07-23 11:45:30	2026-07-23 10:46:33.870673	2026-07-23 10:45:30.102721
20	8	0e66e606-1df0-4f71-9694-d17eb2f283dc	::1	Opera	Linux	2026-07-23 12:04:23	2026-07-23 11:05:46.225864	2026-07-23 11:04:23.608295
19	9	2bb9f1c1-4e4e-4936-9749-793dc6d0c8c2	::1	Opera	Linux	2026-07-23 12:03:30	2026-07-23 11:04:15.73843	2026-07-23 11:03:30.683918
\.


--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_settings (id, user_id, email_notifications, absence_notifications, holiday_notifications, report_notifications, theme, density, sidebar_collapsed, created_at, updated_at, approval_notifications, compact_mode) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, role, employee_id, is_active, created_at, updated_at, failed_attempts, locked_until, is_verified, two_factor_enabled, two_factor_type, totp_secret, password_changed_at, status, account_status, activation_token, activation_token_expiry, activated_at, reset_password_code, reset_password_code_expiry, reset_password_verified, face_id_enabled) FROM stdin;
8	ilyes_manager	hmidilyes607@gmail.com	$2b$10$nNYzR4qdl8fEkOvs47kuketS23AV2zcC00MqQhyGzieIVUqArcQu2	manager	\N	t	2026-07-23 10:59:14.276445	2026-07-23 11:04:23.600386	0	\N	t	f	\N	\N	2026-07-23 10:59:14.276445	active	Active	\N	\N	2026-07-23 10:59:56.026582	\N	\N	f	f
9	ilyes_benhmid	hmidilyes100@gmail.com	$2b$10$Tct/0RY.6cQVxJL7Ny5uh.0HMtfo7ldAwnwW95HsVe76Vnr6QLHTm	employee	4	t	2026-07-23 11:02:31.166284	2026-07-23 11:05:59.020558	0	\N	t	f	\N	\N	2026-07-23 11:02:31.166284	active	Active	\N	\N	2026-07-23 11:03:09.392787	\N	\N	f	f
1	ilyes	hmidilyes4442@gmail.com	$2b$10$DQtG47CGGoeFh7byPLxVp.0hh78OgSSvtXdIgppBrzdUhm/ngwH5G	admin	1	t	2026-07-23 10:32:53.380853	2026-07-23 11:01:57.44127	0	\N	t	f	\N	\N	2026-07-23 10:32:53.380853	active	Active	\N	\N	\N	\N	\N	f	f
\.


--
-- Name: absences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.absences_id_seq', 1, true);


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 35, true);


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 1, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 2, true);


--
-- Name: email_verification_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_verification_tokens_id_seq', 1, false);


--
-- Name: employee_leave_balance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_leave_balance_id_seq', 1, false);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 4, true);


--
-- Name: face_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.face_profiles_id_seq', 2, true);


--
-- Name: face_security_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.face_security_logs_id_seq', 2, true);


--
-- Name: holidays_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.holidays_id_seq', 1, true);


--
-- Name: login_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.login_history_id_seq', 22, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- Name: qr_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.qr_sessions_id_seq', 8, true);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 21, true);


--
-- Name: user_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_settings_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 9, true);


--
-- Name: absences absences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absences
    ADD CONSTRAINT absences_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: employee_leave_balance employee_leave_balance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balance
    ADD CONSTRAINT employee_leave_balance_pkey PRIMARY KEY (id);


--
-- Name: employees employees_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_key UNIQUE (email);


--
-- Name: employees employees_matricule_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_matricule_key UNIQUE (matricule);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: face_profiles face_profiles_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.face_profiles
    ADD CONSTRAINT face_profiles_employee_id_key UNIQUE (employee_id);


--
-- Name: face_profiles face_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.face_profiles
    ADD CONSTRAINT face_profiles_pkey PRIMARY KEY (id);


--
-- Name: face_security_logs face_security_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.face_security_logs
    ADD CONSTRAINT face_security_logs_pkey PRIMARY KEY (id);


--
-- Name: holidays holidays_holiday_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_holiday_date_key UNIQUE (holiday_date);


--
-- Name: holidays holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);


--
-- Name: login_history login_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_history
    ADD CONSTRAINT login_history_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: qr_sessions qr_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_sessions
    ADD CONSTRAINT qr_sessions_pkey PRIMARY KEY (id);


--
-- Name: attendance unique_employee_daily_attendance; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT unique_employee_daily_attendance UNIQUE (employee_id, date);


--
-- Name: employee_leave_balance unique_employee_year; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balance
    ADD CONSTRAINT unique_employee_year UNIQUE (employee_id, year);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_id_key UNIQUE (employee_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_absences_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_absences_source ON public.absences USING btree (source);


--
-- Name: idx_face_profiles_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_face_profiles_employee_id ON public.face_profiles USING btree (employee_id);


--
-- Name: idx_face_security_logs_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_face_security_logs_employee_id ON public.face_security_logs USING btree (employee_id);


--
-- Name: idx_qr_sessions_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_sessions_token ON public.qr_sessions USING btree (token);


--
-- Name: employee_leave_balance update_employee_leave_balance_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_employee_leave_balance_updated_at BEFORE UPDATE ON public.employee_leave_balance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_settings update_user_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_logs activity_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: activity_logs activity_logs_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: attendance attendance_qr_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_qr_session_id_fkey FOREIGN KEY (qr_session_id) REFERENCES public.qr_sessions(id) ON DELETE SET NULL;


--
-- Name: email_verification_tokens email_verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: employee_leave_balance employee_leave_balance_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balance
    ADD CONSTRAINT employee_leave_balance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: face_profiles face_profiles_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.face_profiles
    ADD CONSTRAINT face_profiles_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: face_security_logs face_security_logs_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.face_security_logs
    ADD CONSTRAINT face_security_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: attendance fk_attendance_employee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: absences fk_employee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absences
    ADD CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: login_history login_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_history
    ADD CONSTRAINT login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict B5bEdDRdzrazlaG5jeB1EaqaUMh6JlwKxoCG9m9wlxg3q50gTAExjOvV0r7Afyz

