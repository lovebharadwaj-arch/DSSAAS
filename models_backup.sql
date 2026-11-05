--
-- PostgreSQL database dump
--

\restrict mFACj06n7GZ2qyC7S27Ie2FQNsMkBQ69YE9EqDUaPfpzwLW83h6HxZMp5fFiXUc

-- Dumped from database version 16.15 (Homebrew)
-- Dumped by pg_dump version 16.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: models; Type: TABLE; Schema: public; Owner: love
--

CREATE TABLE public.models (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    analysis_job_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    algorithm character varying(100) NOT NULL,
    task_type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'registered'::character varying NOT NULL,
    artifact_key text,
    metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT models_status_check CHECK (((status)::text = ANY ((ARRAY['registered'::character varying, 'training'::character varying, 'ready'::character varying, 'failed'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.models OWNER TO love;

--
-- Data for Name: models; Type: TABLE DATA; Schema: public; Owner: love
--

COPY public.models (id, organization_id, analysis_job_id, name, algorithm, task_type, status, artifact_key, metrics, created_at, updated_at) FROM stdin;
6e57759f-873f-452f-b210-3012307c45be	0659ea55-65a5-46e2-945f-27dd2a286d1f	2100127c-da2f-42e6-bb46-0590ee3a1965	iris.csv classification model	random_forest	classification	ready	306e2f58-9067-44df-9a5f-4327255f2314	{"accuracy": 0.9, "f1_weighted": 0.8997493734335839, "recall_weighted": 0.9, "precision_weighted": 0.9023569023569025}	2026-11-03 12:55:04.721969+05:30	2026-11-03 12:55:04.721969+05:30
a9730552-9b32-4bbc-ae55-5ce32246db92	0659ea55-65a5-46e2-945f-27dd2a286d1f	fcd6048d-540d-4dd6-97ea-4bf140ab622e	iris.csv regression model	random_forest	regression	ready	1c745af2-fead-4296-9d52-59887afb7934	{"r2": 0.6023590011717985, "mae": 0.33826559523809413, "mse": 0.27447832679114664, "rmse": 0.5239067920834265}	2026-11-03 13:27:13.178303+05:30	2026-11-03 13:27:13.178303+05:30
39ff81ce-87fa-4828-88ac-3f2edf091e77	0659ea55-65a5-46e2-945f-27dd2a286d1f	450addd4-2a78-4ebc-80b4-69fdf297dd58	iris.csv regression model	random_forest	regression	ready	b181c1b8-de5f-4a3e-8d6d-f442dc11b419	{"r2": 0.8711659330748579, "mae": 0.24628240079365174, "mse": 0.0889298619295281, "rmse": 0.29821110296152303}	2026-11-03 16:29:41.722739+05:30	2026-11-03 16:29:41.722739+05:30
f7b36359-edc4-46c6-8169-8ba29b618fe6	0659ea55-65a5-46e2-945f-27dd2a286d1f	50ee1816-136d-4f2d-9028-ad0cac9a75e8	corrected_corrected_real_2016_air.csv regression model	random_forest	regression	ready	ac2bd53f-67a4-4edc-a656-c11dfac92062	{"r2": 0.8824374002433052, "mae": 1.932263636363789, "mse": 6.412076386364739, "rmse": 2.532207808684891}	2026-11-03 16:54:29.384868+05:30	2026-11-03 16:54:29.384868+05:30
d154f5fe-d021-4bd5-9387-b8c337195d59	0659ea55-65a5-46e2-945f-27dd2a286d1f	a5f5f181-33b2-4741-b5ea-838b0da3e78e	corrected_corrected_real_2016_air.csv regression model	random_forest	regression	ready	b3a6427d-d7ba-42d4-b271-478bb217afa6	{"r2": 0.5034414734991537, "mae": 0.37872972972972957, "mse": 0.3899417162162161, "rmse": 0.6244531337227928}	2026-11-04 10:05:24.468671+05:30	2026-11-04 10:05:24.468671+05:30
01d3ef51-35d7-4129-91ec-fa01856380b8	0659ea55-65a5-46e2-945f-27dd2a286d1f	fb1bee06-a581-4072-aab9-c42b30ca8930	corrected_corrected_real_2016_air.csv regression model	random_forest	regression	ready	980d407e-0176-45aa-9b96-ee7198a1ee5e	{"r2": 0.7734697281988614, "mae": 5.054999999999999, "mse": 59.1718912162162, "rmse": 7.692326775184229}	2026-11-04 10:06:14.0863+05:30	2026-11-04 10:06:14.0863+05:30
6f9aa410-5efc-443f-b9b6-49aa0e36df13	0659ea55-65a5-46e2-945f-27dd2a286d1f	48514d70-f10f-49d1-97b5-fd6f4aaa9a22	corrected_corrected_real_2016_air.csv regression model	random_forest	regression	ready	f4ad0825-71cc-478a-b695-0634c4bb2d38	{"r2": 0.869321134229488, "mae": 2.0852282608696804, "mse": 7.1503924293489165, "rmse": 2.674021770545056}	2026-11-04 11:30:51.532881+05:30	2026-11-04 11:30:51.532881+05:30
3d6aa175-72c3-455a-b7bf-84d1a8adce63	0659ea55-65a5-46e2-945f-27dd2a286d1f	535f348f-31cd-45ea-b585-97e4ce26f29e	iris.csv regression model	random_forest	regression	ready	ebd794cb-2168-4542-8bb7-8758af7cb9d2	{"r2": 0.9708437240798109, "mae": 0.2642378968253983, "mse": 0.09555645474220628, "rmse": 0.30912207093995453}	2026-11-04 11:36:16.47305+05:30	2026-11-04 11:36:16.47305+05:30
01d2e01e-e04a-4550-97a6-3905147776fe	0659ea55-65a5-46e2-945f-27dd2a286d1f	5421744c-5728-4ba9-8ce7-ccfb19b476d2	iris.csv classification model	random_forest	classification	ready	b8cc73f7-bd19-4265-a7e1-b7e37ccb9da7	{"accuracy": 0.9333333333333333, "f1_weighted": 0.9333333333333333, "recall_weighted": 0.9333333333333333, "precision_weighted": 0.9333333333333333}	2026-11-04 11:44:41.156506+05:30	2026-11-04 11:44:41.156506+05:30
\.


--
-- Name: models models_pkey; Type: CONSTRAINT; Schema: public; Owner: love
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_pkey PRIMARY KEY (id);


--
-- Name: idx_models_org_created; Type: INDEX; Schema: public; Owner: love
--

CREATE INDEX idx_models_org_created ON public.models USING btree (organization_id, created_at DESC);


--
-- Name: models models_analysis_job_id_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: love
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_analysis_job_id_organization_id_fkey FOREIGN KEY (analysis_job_id, organization_id) REFERENCES public.analysis_jobs(id, organization_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict mFACj06n7GZ2qyC7S27Ie2FQNsMkBQ69YE9EqDUaPfpzwLW83h6HxZMp5fFiXUc

