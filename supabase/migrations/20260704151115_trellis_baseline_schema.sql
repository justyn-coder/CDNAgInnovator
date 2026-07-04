--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.10 (Homebrew)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agtech_companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agtech_companies (
    id integer NOT NULL,
    name text NOT NULL,
    website text,
    description text,
    stage text,
    sectors text[],
    province text[],
    source text,
    program_ids integer[],
    founder_name text,
    founder_linkedin text,
    outreach_status text DEFAULT 'pending'::text,
    outreach_track text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: agtech_companies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agtech_companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agtech_companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agtech_companies_id_seq OWNED BY public.agtech_companies.id;


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id integer NOT NULL,
    name text NOT NULL,
    organization text,
    role_title text,
    track text[],
    relationship_depth text,
    email text,
    phone text,
    linkedin text,
    location text,
    professional_background text,
    communication_style text,
    how_we_met text,
    priority text,
    status text DEFAULT 'active'::text,
    jtbd text,
    what_they_offer text,
    what_they_need text,
    mutual_value text,
    intro_path text,
    follow_up_cadence text,
    next_action text,
    next_action_date date,
    tags text[],
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    ref_tag text,
    last_touch_date date,
    outreach_status text,
    outreach_sent_at timestamp with time zone,
    outreach_type text,
    outreach_link text,
    outreach_notes text,
    contact_type text,
    meeting_notes jsonb DEFAULT '[]'::jsonb,
    my_personal_notes text,
    source_docs text[] DEFAULT '{}'::text[],
    hubspot_id text,
    still_valid boolean DEFAULT true,
    last_reviewed_at timestamp with time zone,
    influences_how text,
    CONSTRAINT contacts_relationship_depth_check CHECK (((relationship_depth IS NULL) OR (relationship_depth = ANY (ARRAY['cold'::text, 'warm'::text, 'active'::text, 'close'::text, 'partner'::text]))))
);


--
-- Name: interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interactions (
    id integer NOT NULL,
    contact_id integer NOT NULL,
    interaction_type text NOT NULL,
    summary text,
    date date NOT NULL,
    next_step text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT interactions_type_check CHECK ((interaction_type = ANY (ARRAY['email'::text, 'call'::text, 'meeting'::text, 'show_encounter'::text, 'linkedin'::text, 'text'::text, 'intro'::text, 'referral'::text])))
);


--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;


--
-- Name: gap_explanations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gap_explanations (
    province text NOT NULL,
    category text NOT NULL,
    stage text DEFAULT 'All'::text NOT NULL,
    mode text DEFAULT 'founder'::text NOT NULL,
    response jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.interactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.interactions_id_seq OWNED BY public.interactions.id;


--
-- Name: journey_interests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journey_interests (
    id integer NOT NULL,
    journey_id uuid NOT NULL,
    program_id integer NOT NULL,
    program_name text NOT NULL,
    status text NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT journey_interests_status_check CHECK ((status = ANY (ARRAY['interested'::text, 'applied'::text, 'dismissed'::text])))
);


--
-- Name: journey_interests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.journey_interests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: journey_interests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.journey_interests_id_seq OWNED BY public.journey_interests.id;


--
-- Name: knowledge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge (
    id integer NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    province text[] DEFAULT '{}'::text[],
    category text,
    source text DEFAULT 'internal'::text,
    confidence text DEFAULT 'high'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: knowledge_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.knowledge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: knowledge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knowledge_id_seq OWNED BY public.knowledge.id;


--
-- Name: page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_views (
    id integer NOT NULL,
    ref text,
    path text NOT NULL,
    query_params jsonb,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: page_views_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.page_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: page_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.page_views_id_seq OWNED BY public.page_views.id;


--
-- Name: portal_access_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_access_log (
    id bigint NOT NULL,
    org text NOT NULL,
    person text NOT NULL,
    event_type text DEFAULT 'view'::text NOT NULL,
    path text,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_hash text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: portal_access_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_access_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_access_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_access_log_id_seq OWNED BY public.portal_access_log.id;


--
-- Name: portal_feature_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_feature_requests (
    id bigint NOT NULL,
    org text NOT NULL,
    person text NOT NULL,
    prompt text NOT NULL,
    mockup_html text,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    visibility text DEFAULT 'team'::text NOT NULL,
    CONSTRAINT portal_feature_requests_visibility_check CHECK ((visibility = ANY (ARRAY['private'::text, 'team'::text])))
);


--
-- Name: portal_feature_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_feature_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_feature_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_feature_requests_id_seq OWNED BY public.portal_feature_requests.id;


--
-- Name: portal_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_feedback (
    id bigint NOT NULL,
    org text NOT NULL,
    person text NOT NULL,
    topic text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    visibility text DEFAULT 'private'::text NOT NULL,
    page_path text,
    CONSTRAINT portal_feedback_visibility_check CHECK ((visibility = ANY (ARRAY['private'::text, 'team'::text])))
);


--
-- Name: portal_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_feedback_id_seq OWNED BY public.portal_feedback.id;


--
-- Name: portal_feedback_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_feedback_replies (
    id bigint NOT NULL,
    feedback_id bigint NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: portal_feedback_replies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_feedback_replies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_feedback_replies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_feedback_replies_id_seq OWNED BY public.portal_feedback_replies.id;


--
-- Name: portal_orgs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_orgs (
    slug text NOT NULL,
    display_name text NOT NULL,
    theme_color text DEFAULT '#1B4332'::text NOT NULL,
    logo_url text,
    banner_text text,
    tour_variant text DEFAULT 'partner'::text NOT NULL,
    portal_password text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT portal_orgs_tour_variant_check CHECK ((tour_variant = ANY (ARRAY['partner'::text, 'advisor'::text])))
);


--
-- Name: portal_people; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_people (
    org text NOT NULL,
    person text NOT NULL,
    display_name text NOT NULL,
    role text,
    email text,
    first_seen_at timestamp with time zone,
    last_seen_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    home_eyebrow text,
    home_subheading text,
    home_hero_callout text,
    card_order text[] DEFAULT ARRAY['programs'::text, 'sandbox'::text, 'priority'::text, 'feedback'::text],
    portal_type text DEFAULT 'operator'::text NOT NULL,
    founder_profile jsonb,
    CONSTRAINT portal_people_portal_type_check CHECK ((portal_type = ANY (ARRAY['operator'::text, 'founder'::text, 'investor'::text, 'advisor'::text, 'connector'::text])))
);


--
-- Name: portal_priority_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_priority_votes (
    org text NOT NULL,
    person text NOT NULL,
    program_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: programs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.programs (
    id integer NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    description text,
    use_case text[],
    province text[],
    website text,
    "national" boolean DEFAULT false,
    ag_food_primary boolean,
    stage text[],
    production_systems text[],
    tech_domains text[],
    cohort_based boolean,
    intake_frequency text,
    funding_type text,
    funding_stage_label text,
    funding_max_cad integer,
    mandate_stage text[],
    mentorship boolean,
    capacity_notes text,
    status text DEFAULT 'unverified'::text,
    verified_at date,
    verified_by text,
    claimed boolean DEFAULT false,
    source text DEFAULT 'manual'::text,
    notes text,
    confidence text DEFAULT 'high'::text,
    deadline_notes text,
    featured boolean DEFAULT false,
    created_at date DEFAULT CURRENT_DATE NOT NULL,
    international boolean DEFAULT false NOT NULL,
    cross_border boolean DEFAULT false NOT NULL,
    url_audit_status text DEFAULT 'pending'::text,
    url_audit_note text,
    url_audited_at timestamp with time zone,
    event_start_date date,
    event_end_date date,
    application_deadline date,
    date_verified boolean DEFAULT false,
    date_source text,
    event_location text,
    event_city text,
    event_format text,
    registration_url text,
    registration_deadline date,
    event_cost_min integer,
    event_cost_max integer,
    event_cost_note text,
    expected_attendance_min integer,
    expected_attendance_max integer,
    CONSTRAINT programs_confidence_check CHECK ((confidence = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text, 'community'::text])))
);


--
-- Name: programs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.programs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: programs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.programs_id_seq OWNED BY public.programs.id;


--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limits (
    id bigint NOT NULL,
    ip text NOT NULL,
    endpoint text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rate_limits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.rate_limits ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rate_limits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: saved_journeys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_journeys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text,
    description text NOT NULL,
    stage text NOT NULL,
    provinces text[] NOT NULL,
    need text NOT NULL,
    sector text,
    company_url text,
    product_type text,
    expansion_provinces text[],
    completed_programs text[],
    pathway_data jsonb NOT NULL,
    notify_new_programs boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone,
    access_count integer DEFAULT 0,
    status text DEFAULT 'active'::text,
    last_summary_text text,
    last_summary_at timestamp with time zone
);


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submissions (
    id integer NOT NULL,
    program_name text NOT NULL,
    best_for text NOT NULL,
    submitter_name text NOT NULL,
    submitter_email text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.submissions_id_seq OWNED BY public.submissions.id;


--
-- Name: trellis_personas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trellis_personas (
    id text NOT NULL,
    persona_type text NOT NULL,
    name text NOT NULL,
    organization text,
    role_title text,
    location text,
    background text,
    how_we_know text,
    daily_reality text,
    pains jsonb,
    gains jsonb,
    jtbd jsonb,
    trellis_scenario text,
    success_metric text,
    rubric_scores jsonb,
    rubric_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: agtech_companies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agtech_companies ALTER COLUMN id SET DEFAULT nextval('public.agtech_companies_id_seq'::regclass);


--
-- Name: contacts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts ALTER COLUMN id SET DEFAULT nextval('public.contacts_id_seq'::regclass);


--
-- Name: interactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions ALTER COLUMN id SET DEFAULT nextval('public.interactions_id_seq'::regclass);


--
-- Name: journey_interests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journey_interests ALTER COLUMN id SET DEFAULT nextval('public.journey_interests_id_seq'::regclass);


--
-- Name: knowledge id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge ALTER COLUMN id SET DEFAULT nextval('public.knowledge_id_seq'::regclass);


--
-- Name: page_views id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views ALTER COLUMN id SET DEFAULT nextval('public.page_views_id_seq'::regclass);


--
-- Name: portal_access_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_access_log ALTER COLUMN id SET DEFAULT nextval('public.portal_access_log_id_seq'::regclass);


--
-- Name: portal_feature_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_feature_requests ALTER COLUMN id SET DEFAULT nextval('public.portal_feature_requests_id_seq'::regclass);


--
-- Name: portal_feedback id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_feedback ALTER COLUMN id SET DEFAULT nextval('public.portal_feedback_id_seq'::regclass);


--
-- Name: portal_feedback_replies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_feedback_replies ALTER COLUMN id SET DEFAULT nextval('public.portal_feedback_replies_id_seq'::regclass);


--
-- Name: programs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programs ALTER COLUMN id SET DEFAULT nextval('public.programs_id_seq'::regclass);


--
-- Name: submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions ALTER COLUMN id SET DEFAULT nextval('public.submissions_id_seq'::regclass);


--
-- Name: agtech_companies agtech_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agtech_companies
    ADD CONSTRAINT agtech_companies_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: gap_explanations gap_explanations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gap_explanations
    ADD CONSTRAINT gap_explanations_pkey PRIMARY KEY (province, category, stage, mode);


--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_pkey PRIMARY KEY (id);


--
-- Name: journey_interests journey_interests_journey_id_program_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journey_interests
    ADD CONSTRAINT journey_interests_journey_id_program_id_key UNIQUE (journey_id, program_id);


--
-- Name: journey_interests journey_interests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journey_interests
    ADD CONSTRAINT journey_interests_pkey PRIMARY KEY (id);


--
-- Name: knowledge knowledge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge
    ADD CONSTRAINT knowledge_pkey PRIMARY KEY (id);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: portal_access_log portal_access_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_access_log
    ADD CONSTRAINT portal_access_log_pkey PRIMARY KEY (id);


--
-- Name: portal_feature_requests portal_feature_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_feature_requests
    ADD CONSTRAINT portal_feature_requests_pkey PRIMARY KEY (id);


--
-- Name: portal_feedback portal_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_feedback
    ADD CONSTRAINT portal_feedback_pkey PRIMARY KEY (id);


--
-- Name: portal_feedback_replies portal_feedback_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_feedback_replies
    ADD CONSTRAINT portal_feedback_replies_pkey PRIMARY KEY (id);


--
-- Name: portal_orgs portal_orgs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_orgs
    ADD CONSTRAINT portal_orgs_pkey PRIMARY KEY (slug);


--
-- Name: portal_people portal_people_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_people
    ADD CONSTRAINT portal_people_pkey PRIMARY KEY (org, person);


--
-- Name: portal_priority_votes portal_priority_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_priority_votes
    ADD CONSTRAINT portal_priority_votes_pkey PRIMARY KEY (org, person, program_id);


--
-- Name: programs programs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (id);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id);


--
-- Name: saved_journeys saved_journeys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_journeys
    ADD CONSTRAINT saved_journeys_pkey PRIMARY KEY (id);


--
-- Name: saved_journeys saved_journeys_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_journeys
    ADD CONSTRAINT saved_journeys_token_key UNIQUE (token);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: trellis_personas trellis_personas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trellis_personas
    ADD CONSTRAINT trellis_personas_pkey PRIMARY KEY (id);


--
-- Name: idx_contacts_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_priority ON public.contacts USING btree (priority);


--
-- Name: idx_contacts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_status ON public.contacts USING btree (status);


--
-- Name: idx_contacts_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_tags ON public.contacts USING gin (tags);


--
-- Name: idx_contacts_track; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_track ON public.contacts USING gin (track);


--
-- Name: idx_interactions_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_contact_id ON public.interactions USING btree (contact_id);


--
-- Name: idx_interactions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_date ON public.interactions USING btree (date DESC);


--
-- Name: idx_journey_interests_journey; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journey_interests_journey ON public.journey_interests USING btree (journey_id);


--
-- Name: idx_journey_interests_program; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journey_interests_program ON public.journey_interests USING btree (program_id);


--
-- Name: idx_page_views_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_created_at ON public.page_views USING btree (created_at);


--
-- Name: idx_page_views_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_ref ON public.page_views USING btree (ref);


--
-- Name: idx_portal_access_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_access_created ON public.portal_access_log USING btree (created_at DESC);


--
-- Name: idx_portal_access_org_person; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_access_org_person ON public.portal_access_log USING btree (org, person, created_at DESC);


--
-- Name: idx_portal_feature_requests_org_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_feature_requests_org_created ON public.portal_feature_requests USING btree (org, created_at DESC);


--
-- Name: idx_portal_feedback_org_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_feedback_org_created ON public.portal_feedback USING btree (org, created_at DESC);


--
-- Name: idx_portal_feedback_replies_fb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_feedback_replies_fb ON public.portal_feedback_replies USING btree (feedback_id);


--
-- Name: idx_programs_app_deadline; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_programs_app_deadline ON public.programs USING btree (application_deadline) WHERE (application_deadline IS NOT NULL);


--
-- Name: idx_programs_event_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_programs_event_start ON public.programs USING btree (event_start_date) WHERE (event_start_date IS NOT NULL);


--
-- Name: idx_rate_limits_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limits_lookup ON public.rate_limits USING btree (ip, endpoint, "timestamp");


--
-- Name: idx_saved_journeys_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_journeys_email ON public.saved_journeys USING btree (email);


--
-- Name: idx_saved_journeys_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_journeys_status ON public.saved_journeys USING btree (status) WHERE (status = 'active'::text);


--
-- Name: idx_saved_journeys_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_saved_journeys_token ON public.saved_journeys USING btree (token);


--
-- Name: knowledge_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX knowledge_category_idx ON public.knowledge USING btree (category);


--
-- Name: knowledge_province_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX knowledge_province_idx ON public.knowledge USING gin (province);


--
-- Name: knowledge_tags_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX knowledge_tags_idx ON public.knowledge USING gin (tags);


--
-- Name: programs_name_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX programs_name_trgm_idx ON public.programs USING gin (name extensions.gin_trgm_ops);


--
-- Name: contacts contacts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_contacts_updated_at();


--
-- Name: rate_limits trigger_cleanup_rate_limits; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_cleanup_rate_limits AFTER INSERT ON public.rate_limits FOR EACH STATEMENT EXECUTE FUNCTION public.cleanup_rate_limits();


--
-- Name: interactions interactions_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: journey_interests journey_interests_journey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journey_interests
    ADD CONSTRAINT journey_interests_journey_id_fkey FOREIGN KEY (journey_id) REFERENCES public.saved_journeys(id) ON DELETE CASCADE;


--
-- Name: journey_interests journey_interests_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journey_interests
    ADD CONSTRAINT journey_interests_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);


--
-- Name: portal_feedback_replies portal_feedback_replies_feedback_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_feedback_replies
    ADD CONSTRAINT portal_feedback_replies_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.portal_feedback(id) ON DELETE CASCADE;


--
-- Name: agtech_companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agtech_companies ENABLE ROW LEVEL SECURITY;

--
-- Name: trellis_personas anon_read_trellis_personas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_read_trellis_personas ON public.trellis_personas FOR SELECT TO anon USING (true);


--
-- Name: rate_limits anon_select_rate_limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_select_rate_limits ON public.rate_limits FOR SELECT TO anon USING (true);


--
-- Name: contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: interactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

--
-- Name: journey_interests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journey_interests ENABLE ROW LEVEL SECURITY;

--
-- Name: knowledge; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.knowledge ENABLE ROW LEVEL SECURITY;

--
-- Name: page_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

--
-- Name: programs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

--
-- Name: rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_journeys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_journeys ENABLE ROW LEVEL SECURITY;

--
-- Name: submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: trellis_personas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trellis_personas ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


