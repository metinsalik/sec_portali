--
-- PostgreSQL database dump
--

\restrict WT4HGh54hvukvlh2dhBQkF4flLm7q4hxb1eEC404oVY26JPAhCAxTZmrnt8e6tZ

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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
-- Name: ActivityLog; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."ActivityLog" (
    id integer NOT NULL,
    action text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    details text,
    "facilityId" text NOT NULL,
    username text NOT NULL
);


ALTER TABLE public."ActivityLog" OWNER TO isguser;

--
-- Name: ActivityLog_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."ActivityLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ActivityLog_id_seq" OWNER TO isguser;

--
-- Name: ActivityLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."ActivityLog_id_seq" OWNED BY public."ActivityLog".id;


--
-- Name: AdministrativeFine; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."AdministrativeFine" (
    id integer NOT NULL,
    year integer NOT NULL,
    "specialistAndPhysicianVery" double precision NOT NULL,
    "specialistAndPhysicianDanger" double precision NOT NULL,
    "specialistAndPhysicianLess" double precision NOT NULL,
    "dspVeryDangerous" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AdministrativeFine" OWNER TO isguser;

--
-- Name: AdministrativeFine_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."AdministrativeFine_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."AdministrativeFine_id_seq" OWNER TO isguser;

--
-- Name: AdministrativeFine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."AdministrativeFine_id_seq" OWNED BY public."AdministrativeFine".id;


--
-- Name: Assignment; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."Assignment" (
    id integer NOT NULL,
    "facilityId" text NOT NULL,
    "professionalId" integer,
    "employerRepId" integer,
    type text NOT NULL,
    "durationMinutes" integer NOT NULL,
    "isFullTime" boolean DEFAULT false NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    status text NOT NULL,
    "costType" text,
    "unitPrice" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Assignment" OWNER TO isguser;

--
-- Name: Assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."Assignment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Assignment_id_seq" OWNER TO isguser;

--
-- Name: Assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."Assignment_id_seq" OWNED BY public."Assignment".id;


--
-- Name: Category; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."Category" (
    id integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Category" OWNER TO isguser;

--
-- Name: Category_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."Category_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Category_id_seq" OWNER TO isguser;

--
-- Name: Category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."Category_id_seq" OWNED BY public."Category".id;


--
-- Name: Department; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."Department" (
    id integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Department" OWNER TO isguser;

--
-- Name: Department_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."Department_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Department_id_seq" OWNER TO isguser;

--
-- Name: Department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."Department_id_seq" OWNED BY public."Department".id;


--
-- Name: EmergencyCode; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."EmergencyCode" (
    id integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EmergencyCode" OWNER TO isguser;

--
-- Name: EmergencyCode_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."EmergencyCode_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."EmergencyCode_id_seq" OWNER TO isguser;

--
-- Name: EmergencyCode_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."EmergencyCode_id_seq" OWNED BY public."EmergencyCode".id;


--
-- Name: EmployeeCountHistory; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."EmployeeCountHistory" (
    id integer NOT NULL,
    "facilityId" text NOT NULL,
    count integer NOT NULL,
    "effectiveDate" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EmployeeCountHistory" OWNER TO isguser;

--
-- Name: EmployeeCountHistory_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."EmployeeCountHistory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."EmployeeCountHistory_id_seq" OWNER TO isguser;

--
-- Name: EmployeeCountHistory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."EmployeeCountHistory_id_seq" OWNED BY public."EmployeeCountHistory".id;


--
-- Name: EmployerRepresentative; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."EmployerRepresentative" (
    id integer NOT NULL,
    "fullName" text NOT NULL,
    title text,
    phone text,
    email text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    username text
);


ALTER TABLE public."EmployerRepresentative" OWNER TO isguser;

--
-- Name: EmployerRepresentative_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."EmployerRepresentative_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."EmployerRepresentative_id_seq" OWNER TO isguser;

--
-- Name: EmployerRepresentative_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."EmployerRepresentative_id_seq" OWNED BY public."EmployerRepresentative".id;


--
-- Name: ExtraordinaryIncident; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."ExtraordinaryIncident" (
    id integer NOT NULL,
    "facilityId" text NOT NULL,
    "categoryId" integer NOT NULL,
    "rootCauseId" integer NOT NULL,
    "departmentId" integer NOT NULL,
    "locationDetail" text NOT NULL,
    "incidentDate" timestamp(3) without time zone NOT NULL,
    "interventionRequired" boolean NOT NULL,
    "interventionTime" timestamp(3) without time zone,
    "controlTime" timestamp(3) without time zone NOT NULL,
    "supportReceived" boolean NOT NULL,
    "supportUnitId" integer,
    "announcementMade" boolean NOT NULL,
    "emergencyCodeId" integer,
    "serviceInterrupted" boolean NOT NULL,
    "interruptionDuration" double precision,
    "evacuatedStaffCount" integer DEFAULT 0 NOT NULL,
    "evacuatedPatientCount" integer DEFAULT 0 NOT NULL,
    "injuredCount" integer DEFAULT 0 NOT NULL,
    "deceasedCount" integer DEFAULT 0 NOT NULL,
    summary text NOT NULL,
    "causeDetail" text NOT NULL,
    "detectedEffect" text NOT NULL,
    observations text NOT NULL,
    "actionsTaken" text NOT NULL,
    "resultEvaluation" text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    attachments jsonb
);


ALTER TABLE public."ExtraordinaryIncident" OWNER TO isguser;

--
-- Name: ExtraordinaryIncident_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."ExtraordinaryIncident_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ExtraordinaryIncident_id_seq" OWNER TO isguser;

--
-- Name: ExtraordinaryIncident_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."ExtraordinaryIncident_id_seq" OWNED BY public."ExtraordinaryIncident".id;


--
-- Name: Facility; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."Facility" (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    city text,
    "commercialTitle" text,
    "dangerClass" text DEFAULT 'Az Tehlikeli'::text NOT NULL,
    district text,
    email text,
    "employeeCount" integer DEFAULT 0 NOT NULL,
    "fullAddress" text,
    "naceCode" text,
    phone text,
    "sgkNumber" text,
    "shortName" text,
    "taxNumber" text,
    "taxOffice" text,
    type text,
    website text
);


ALTER TABLE public."Facility" OWNER TO isguser;

--
-- Name: FacilityBuilding; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."FacilityBuilding" (
    id integer NOT NULL,
    "facilityId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "bedCapacity" integer,
    "buildingFloors" integer,
    "buildingHeight" double precision,
    "closedArea" double precision,
    "constructionYear" integer,
    "gardenArea" double precision,
    "parkingArea" double precision,
    "structureFloors" integer,
    "structureHeight" double precision
);


ALTER TABLE public."FacilityBuilding" OWNER TO isguser;

--
-- Name: FacilityBuilding_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."FacilityBuilding_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FacilityBuilding_id_seq" OWNER TO isguser;

--
-- Name: FacilityBuilding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."FacilityBuilding_id_seq" OWNED BY public."FacilityBuilding".id;


--
-- Name: IncidentCategory; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."IncidentCategory" (
    id integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."IncidentCategory" OWNER TO isguser;

--
-- Name: IncidentCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."IncidentCategory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."IncidentCategory_id_seq" OWNER TO isguser;

--
-- Name: IncidentCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."IncidentCategory_id_seq" OWNED BY public."IncidentCategory".id;


--
-- Name: IncidentRootCause; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."IncidentRootCause" (
    id integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."IncidentRootCause" OWNER TO isguser;

--
-- Name: IncidentRootCause_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."IncidentRootCause_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."IncidentRootCause_id_seq" OWNER TO isguser;

--
-- Name: IncidentRootCause_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."IncidentRootCause_id_seq" OWNED BY public."IncidentRootCause".id;


--
-- Name: IncidentSupportUnit; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."IncidentSupportUnit" (
    id integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."IncidentSupportUnit" OWNER TO isguser;

--
-- Name: IncidentSupportUnit_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."IncidentSupportUnit_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."IncidentSupportUnit_id_seq" OWNER TO isguser;

--
-- Name: IncidentSupportUnit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."IncidentSupportUnit_id_seq" OWNED BY public."IncidentSupportUnit".id;


--
-- Name: MonthlyAccidentData; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."MonthlyAccidentData" (
    id integer NOT NULL,
    "facilityId" text NOT NULL,
    month text NOT NULL,
    "mainEmployerData" jsonb NOT NULL,
    "subContractorData" jsonb NOT NULL,
    "internData" jsonb NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MonthlyAccidentData" OWNER TO isguser;

--
-- Name: MonthlyAccidentData_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."MonthlyAccidentData_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."MonthlyAccidentData_id_seq" OWNER TO isguser;

--
-- Name: MonthlyAccidentData_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."MonthlyAccidentData_id_seq" OWNED BY public."MonthlyAccidentData".id;


--
-- Name: MonthlyHRData; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."MonthlyHRData" (
    id integer NOT NULL,
    "facilityId" text NOT NULL,
    month text NOT NULL,
    "mainEmployerData" jsonb NOT NULL,
    "subContractorData" jsonb NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MonthlyHRData" OWNER TO isguser;

--
-- Name: MonthlyHRData_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."MonthlyHRData_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."MonthlyHRData_id_seq" OWNER TO isguser;

--
-- Name: MonthlyHRData_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."MonthlyHRData_id_seq" OWNED BY public."MonthlyHRData".id;


--
-- Name: NotebookItem; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."NotebookItem" (
    id integer NOT NULL,
    "pageId" integer NOT NULL,
    "authorType" text NOT NULL,
    "authorName" text NOT NULL,
    content text NOT NULL,
    "categoryId" integer NOT NULL,
    "subCategoryId" integer,
    "departmentId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotebookItem" OWNER TO isguser;

--
-- Name: NotebookItem_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."NotebookItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."NotebookItem_id_seq" OWNER TO isguser;

--
-- Name: NotebookItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."NotebookItem_id_seq" OWNED BY public."NotebookItem".id;


--
-- Name: NotebookPage; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."NotebookPage" (
    id integer NOT NULL,
    "facilityId" text NOT NULL,
    year integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "documentUrl" text,
    status text DEFAULT 'Eksik'::text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "documentUploadedAt" timestamp(3) without time zone,
    "isArchived" boolean DEFAULT false NOT NULL,
    "isLocked" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."NotebookPage" OWNER TO isguser;

--
-- Name: NotebookPage_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."NotebookPage_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."NotebookPage_id_seq" OWNER TO isguser;

--
-- Name: NotebookPage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."NotebookPage_id_seq" OWNED BY public."NotebookPage".id;


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."Notification" (
    id integer NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    module text DEFAULT 'SYSTEM'::text NOT NULL,
    "targetRole" text,
    username text,
    "isRead" boolean DEFAULT false NOT NULL,
    link text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Notification" OWNER TO isguser;

--
-- Name: NotificationConfig; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."NotificationConfig" (
    id integer NOT NULL,
    code text NOT NULL,
    module text NOT NULL,
    description text,
    "emailEnabled" boolean DEFAULT true NOT NULL,
    "appEnabled" boolean DEFAULT true NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationConfig" OWNER TO isguser;

--
-- Name: NotificationConfig_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."NotificationConfig_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."NotificationConfig_id_seq" OWNER TO isguser;

--
-- Name: NotificationConfig_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."NotificationConfig_id_seq" OWNED BY public."NotificationConfig".id;


--
-- Name: NotificationTemplate; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."NotificationTemplate" (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    module text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationTemplate" OWNER TO isguser;

--
-- Name: NotificationTemplate_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."NotificationTemplate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."NotificationTemplate_id_seq" OWNER TO isguser;

--
-- Name: NotificationTemplate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."NotificationTemplate_id_seq" OWNED BY public."NotificationTemplate".id;


--
-- Name: Notification_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."Notification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Notification_id_seq" OWNER TO isguser;

--
-- Name: Notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."Notification_id_seq" OWNED BY public."Notification".id;


--
-- Name: OSGBCompany; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."OSGBCompany" (
    id integer NOT NULL,
    name text NOT NULL,
    contact text,
    phone text,
    email text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    city text,
    district text
);


ALTER TABLE public."OSGBCompany" OWNER TO isguser;

--
-- Name: OSGBCompany_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."OSGBCompany_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."OSGBCompany_id_seq" OWNER TO isguser;

--
-- Name: OSGBCompany_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."OSGBCompany_id_seq" OWNED BY public."OSGBCompany".id;


--
-- Name: Professional; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."Professional" (
    id integer NOT NULL,
    "fullName" text NOT NULL,
    "employmentType" text NOT NULL,
    "osgbName" text,
    "titleClass" text NOT NULL,
    "certificateNo" text,
    "certificateDate" timestamp(3) without time zone,
    phone text,
    email text,
    "unitPrice" double precision,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    username text
);


ALTER TABLE public."Professional" OWNER TO isguser;

--
-- Name: Professional_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."Professional_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Professional_id_seq" OWNER TO isguser;

--
-- Name: Professional_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."Professional_id_seq" OWNED BY public."Professional".id;


--
-- Name: Reconciliation; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."Reconciliation" (
    id integer NOT NULL,
    "facilityId" text NOT NULL,
    "osgbCompanyId" integer NOT NULL,
    month text NOT NULL,
    amount double precision,
    note text,
    status text DEFAULT 'Beklemede'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "calculatedAmount" double precision,
    "calculationDetails" jsonb,
    difference double precision,
    "invoiceAmount" double precision
);


ALTER TABLE public."Reconciliation" OWNER TO isguser;

--
-- Name: Reconciliation_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."Reconciliation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Reconciliation_id_seq" OWNER TO isguser;

--
-- Name: Reconciliation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."Reconciliation_id_seq" OWNED BY public."Reconciliation".id;


--
-- Name: ReportTemplate; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."ReportTemplate" (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    module text NOT NULL,
    "documentNo" text,
    "revisionNo" text,
    "releaseDate" timestamp(3) without time zone,
    content jsonb NOT NULL,
    orientation text DEFAULT 'PORTRAIT'::text NOT NULL,
    "logoUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ReportTemplate" OWNER TO isguser;

--
-- Name: ReportTemplate_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."ReportTemplate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ReportTemplate_id_seq" OWNER TO isguser;

--
-- Name: ReportTemplate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."ReportTemplate_id_seq" OWNED BY public."ReportTemplate".id;


--
-- Name: RiskAuditLog; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."RiskAuditLog" (
    id text NOT NULL,
    "riskId" text NOT NULL,
    action text NOT NULL,
    details text,
    "changedFields" jsonb,
    username text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RiskAuditLog" OWNER TO isguser;

--
-- Name: RiskCategorySetting; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."RiskCategorySetting" (
    id integer NOT NULL,
    "facilityId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RiskCategorySetting" OWNER TO isguser;

--
-- Name: RiskCategorySetting_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."RiskCategorySetting_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RiskCategorySetting_id_seq" OWNER TO isguser;

--
-- Name: RiskCategorySetting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."RiskCategorySetting_id_seq" OWNED BY public."RiskCategorySetting".id;


--
-- Name: RiskDepartment; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."RiskDepartment" (
    id integer NOT NULL,
    "facilityId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    code text
);


ALTER TABLE public."RiskDepartment" OWNER TO isguser;

--
-- Name: RiskDepartmentSetting; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."RiskDepartmentSetting" (
    id integer NOT NULL,
    "facilityId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RiskDepartmentSetting" OWNER TO isguser;

--
-- Name: RiskDepartmentSetting_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."RiskDepartmentSetting_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RiskDepartmentSetting_id_seq" OWNER TO isguser;

--
-- Name: RiskDepartmentSetting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."RiskDepartmentSetting_id_seq" OWNED BY public."RiskDepartmentSetting".id;


--
-- Name: RiskDepartment_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."RiskDepartment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RiskDepartment_id_seq" OWNER TO isguser;

--
-- Name: RiskDepartment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."RiskDepartment_id_seq" OWNED BY public."RiskDepartment".id;


--
-- Name: RiskExpertFacility; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."RiskExpertFacility" (
    "expertUsername" text NOT NULL,
    "facilityId" text NOT NULL
);


ALTER TABLE public."RiskExpertFacility" OWNER TO isguser;

--
-- Name: RiskLifecycle; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."RiskLifecycle" (
    id text NOT NULL,
    "departmentId" integer NOT NULL,
    "riskNo" integer NOT NULL,
    "riskCategory" text NOT NULL,
    "subCategory" text,
    area text NOT NULL,
    method text DEFAULT 'Fine Kinney'::text NOT NULL,
    activity text NOT NULL,
    hazard text NOT NULL,
    "riskDescription" text NOT NULL,
    "initialCondition" text,
    "initialImage" text,
    "initialProb" double precision NOT NULL,
    "initialFreq" double precision,
    "initialSev" double precision NOT NULL,
    "initialScore" double precision NOT NULL,
    "initialLevel" text NOT NULL,
    "firstActionPlan" text,
    "actionsTaken" text,
    "actionDate" timestamp(3) without time zone,
    "actionBy" text,
    "actionImage" text,
    "followUpMeasure" text,
    "extraImprovement" text,
    "finalProb" double precision,
    "finalFreq" double precision,
    "finalSev" double precision,
    "finalScore" double precision,
    "finalLevel" text,
    status text DEFAULT 'ACIK_TEHLIKE'::text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "affectedPeople" text,
    "controlResponsible" text,
    "controlResult" text,
    "detectionDate" timestamp(3) without time zone,
    "dueDate" timestamp(3) without time zone,
    "effectivenessMethod" text,
    "impactDamage" text,
    "improvementResponsible" text,
    legislation text,
    "postImprovementDueDate" timestamp(3) without time zone,
    "postImprovementResponsible" text
);


ALTER TABLE public."RiskLifecycle" OWNER TO isguser;

--
-- Name: RiskSubCategorySetting; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."RiskSubCategorySetting" (
    id integer NOT NULL,
    name text NOT NULL,
    "categoryId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RiskSubCategorySetting" OWNER TO isguser;

--
-- Name: RiskSubCategorySetting_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."RiskSubCategorySetting_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RiskSubCategorySetting_id_seq" OWNER TO isguser;

--
-- Name: RiskSubCategorySetting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."RiskSubCategorySetting_id_seq" OWNED BY public."RiskSubCategorySetting".id;


--
-- Name: Role; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."Role" (
    id integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Role" OWNER TO isguser;

--
-- Name: Role_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."Role_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Role_id_seq" OWNER TO isguser;

--
-- Name: Role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."Role_id_seq" OWNED BY public."Role".id;


--
-- Name: SmtpSettings; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."SmtpSettings" (
    id integer DEFAULT 1 NOT NULL,
    host text NOT NULL,
    port integer NOT NULL,
    "user" text NOT NULL,
    pass text NOT NULL,
    secure boolean DEFAULT false NOT NULL,
    "fromEmail" text NOT NULL,
    "fromName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SmtpSettings" OWNER TO isguser;

--
-- Name: SubCategory; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."SubCategory" (
    id integer NOT NULL,
    name text NOT NULL,
    "categoryId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SubCategory" OWNER TO isguser;

--
-- Name: SubCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."SubCategory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SubCategory_id_seq" OWNER TO isguser;

--
-- Name: SubCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."SubCategory_id_seq" OWNED BY public."SubCategory".id;


--
-- Name: SystemSettings; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."SystemSettings" (
    id integer NOT NULL,
    year integer NOT NULL,
    "seriousAccidentDays" integer DEFAULT 4 NOT NULL,
    "includeSaturday" boolean DEFAULT true NOT NULL,
    "dailyWorkHours" double precision DEFAULT 7.5 NOT NULL,
    "monthlyWorkDays" jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SystemSettings" OWNER TO isguser;

--
-- Name: SystemSettings_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."SystemSettings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SystemSettings_id_seq" OWNER TO isguser;

--
-- Name: SystemSettings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."SystemSettings_id_seq" OWNED BY public."SystemSettings".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."User" (
    username text NOT NULL,
    "fullName" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "employmentType" text,
    "osgbName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    department text,
    email text,
    phone text,
    title text
);


ALTER TABLE public."User" OWNER TO isguser;

--
-- Name: UserFacility; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."UserFacility" (
    username text NOT NULL,
    "facilityId" text NOT NULL
);


ALTER TABLE public."UserFacility" OWNER TO isguser;

--
-- Name: UserRole; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."UserRole" (
    username text NOT NULL,
    "roleId" integer NOT NULL
);


ALTER TABLE public."UserRole" OWNER TO isguser;

--
-- Name: WorkflowAlarm; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."WorkflowAlarm" (
    id integer NOT NULL,
    "taskId" integer NOT NULL,
    "alarmDate" timestamp(3) without time zone NOT NULL,
    "alarmType" text NOT NULL,
    "isSent" boolean DEFAULT false NOT NULL,
    "sentAt" timestamp(3) without time zone,
    "createdBy" text NOT NULL
);


ALTER TABLE public."WorkflowAlarm" OWNER TO isguser;

--
-- Name: WorkflowAlarm_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."WorkflowAlarm_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkflowAlarm_id_seq" OWNER TO isguser;

--
-- Name: WorkflowAlarm_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."WorkflowAlarm_id_seq" OWNED BY public."WorkflowAlarm".id;


--
-- Name: WorkflowCategory; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."WorkflowCategory" (
    id integer NOT NULL,
    name text NOT NULL,
    color text,
    icon text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WorkflowCategory" OWNER TO isguser;

--
-- Name: WorkflowCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."WorkflowCategory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkflowCategory_id_seq" OWNER TO isguser;

--
-- Name: WorkflowCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."WorkflowCategory_id_seq" OWNED BY public."WorkflowCategory".id;


--
-- Name: WorkflowDepartment; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."WorkflowDepartment" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "managerId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WorkflowDepartment" OWNER TO isguser;

--
-- Name: WorkflowDepartment_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."WorkflowDepartment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkflowDepartment_id_seq" OWNER TO isguser;

--
-- Name: WorkflowDepartment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."WorkflowDepartment_id_seq" OWNED BY public."WorkflowDepartment".id;


--
-- Name: WorkflowNotificationSettings; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."WorkflowNotificationSettings" (
    id integer NOT NULL,
    "userId" text NOT NULL,
    "telegramChatId" text,
    "whatsappNumber" text,
    "notifyOnAssign" boolean DEFAULT true NOT NULL,
    "notifyOnStatusChange" boolean DEFAULT true NOT NULL,
    "notifyOnAlarm" boolean DEFAULT true NOT NULL,
    "notifyOnComment" boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkflowNotificationSettings" OWNER TO isguser;

--
-- Name: WorkflowNotificationSettings_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."WorkflowNotificationSettings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkflowNotificationSettings_id_seq" OWNER TO isguser;

--
-- Name: WorkflowNotificationSettings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."WorkflowNotificationSettings_id_seq" OWNED BY public."WorkflowNotificationSettings".id;


--
-- Name: WorkflowTag; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."WorkflowTag" (
    id integer NOT NULL,
    name text NOT NULL,
    color text
);


ALTER TABLE public."WorkflowTag" OWNER TO isguser;

--
-- Name: WorkflowTag_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."WorkflowTag_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkflowTag_id_seq" OWNER TO isguser;

--
-- Name: WorkflowTag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."WorkflowTag_id_seq" OWNED BY public."WorkflowTag".id;


--
-- Name: WorkflowTask; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."WorkflowTask" (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    priority text DEFAULT 'MEDIUM'::text NOT NULL,
    status text DEFAULT 'BEKLIYOR'::text NOT NULL,
    "categoryId" integer,
    "departmentId" integer,
    "createdBy" text NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "alarmDate" timestamp(3) without time zone,
    "isPool" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkflowTask" OWNER TO isguser;

--
-- Name: WorkflowTaskAssignment; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."WorkflowTaskAssignment" (
    id integer NOT NULL,
    "taskId" integer NOT NULL,
    "userId" text NOT NULL,
    role text DEFAULT 'ASSIGNEE'::text NOT NULL,
    "assignedBy" text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone
);


ALTER TABLE public."WorkflowTaskAssignment" OWNER TO isguser;

--
-- Name: WorkflowTaskAssignment_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."WorkflowTaskAssignment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkflowTaskAssignment_id_seq" OWNER TO isguser;

--
-- Name: WorkflowTaskAssignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."WorkflowTaskAssignment_id_seq" OWNED BY public."WorkflowTaskAssignment".id;


--
-- Name: WorkflowTaskComment; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."WorkflowTaskComment" (
    id integer NOT NULL,
    "taskId" integer NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WorkflowTaskComment" OWNER TO isguser;

--
-- Name: WorkflowTaskComment_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."WorkflowTaskComment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkflowTaskComment_id_seq" OWNER TO isguser;

--
-- Name: WorkflowTaskComment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."WorkflowTaskComment_id_seq" OWNED BY public."WorkflowTaskComment".id;


--
-- Name: WorkflowTaskHistory; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."WorkflowTaskHistory" (
    id integer NOT NULL,
    "taskId" integer NOT NULL,
    "changedBy" text NOT NULL,
    "oldStatus" text,
    "newStatus" text,
    note text,
    "changedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WorkflowTaskHistory" OWNER TO isguser;

--
-- Name: WorkflowTaskHistory_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."WorkflowTaskHistory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkflowTaskHistory_id_seq" OWNER TO isguser;

--
-- Name: WorkflowTaskHistory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."WorkflowTaskHistory_id_seq" OWNED BY public."WorkflowTaskHistory".id;


--
-- Name: WorkflowTaskTag; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."WorkflowTaskTag" (
    "taskId" integer NOT NULL,
    "tagId" integer NOT NULL
);


ALTER TABLE public."WorkflowTaskTag" OWNER TO isguser;

--
-- Name: WorkflowTask_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."WorkflowTask_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkflowTask_id_seq" OWNER TO isguser;

--
-- Name: WorkflowTask_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."WorkflowTask_id_seq" OWNED BY public."WorkflowTask".id;


--
-- Name: WorkflowUserRole; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."WorkflowUserRole" (
    id integer NOT NULL,
    "userId" text NOT NULL,
    "moduleRole" text NOT NULL,
    "departmentId" integer,
    "reportsTo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkflowUserRole" OWNER TO isguser;

--
-- Name: WorkflowUserRole_id_seq; Type: SEQUENCE; Schema: public; Owner: isguser
--

CREATE SEQUENCE public."WorkflowUserRole_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkflowUserRole_id_seq" OWNER TO isguser;

--
-- Name: WorkflowUserRole_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: isguser
--

ALTER SEQUENCE public."WorkflowUserRole_id_seq" OWNED BY public."WorkflowUserRole".id;


--
-- Name: ActivityLog id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."ActivityLog" ALTER COLUMN id SET DEFAULT nextval('public."ActivityLog_id_seq"'::regclass);


--
-- Name: AdministrativeFine id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."AdministrativeFine" ALTER COLUMN id SET DEFAULT nextval('public."AdministrativeFine_id_seq"'::regclass);


--
-- Name: Assignment id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Assignment" ALTER COLUMN id SET DEFAULT nextval('public."Assignment_id_seq"'::regclass);


--
-- Name: Category id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Category" ALTER COLUMN id SET DEFAULT nextval('public."Category_id_seq"'::regclass);


--
-- Name: Department id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Department" ALTER COLUMN id SET DEFAULT nextval('public."Department_id_seq"'::regclass);


--
-- Name: EmergencyCode id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."EmergencyCode" ALTER COLUMN id SET DEFAULT nextval('public."EmergencyCode_id_seq"'::regclass);


--
-- Name: EmployeeCountHistory id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."EmployeeCountHistory" ALTER COLUMN id SET DEFAULT nextval('public."EmployeeCountHistory_id_seq"'::regclass);


--
-- Name: EmployerRepresentative id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."EmployerRepresentative" ALTER COLUMN id SET DEFAULT nextval('public."EmployerRepresentative_id_seq"'::regclass);


--
-- Name: ExtraordinaryIncident id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."ExtraordinaryIncident" ALTER COLUMN id SET DEFAULT nextval('public."ExtraordinaryIncident_id_seq"'::regclass);


--
-- Name: FacilityBuilding id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."FacilityBuilding" ALTER COLUMN id SET DEFAULT nextval('public."FacilityBuilding_id_seq"'::regclass);


--
-- Name: IncidentCategory id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."IncidentCategory" ALTER COLUMN id SET DEFAULT nextval('public."IncidentCategory_id_seq"'::regclass);


--
-- Name: IncidentRootCause id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."IncidentRootCause" ALTER COLUMN id SET DEFAULT nextval('public."IncidentRootCause_id_seq"'::regclass);


--
-- Name: IncidentSupportUnit id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."IncidentSupportUnit" ALTER COLUMN id SET DEFAULT nextval('public."IncidentSupportUnit_id_seq"'::regclass);


--
-- Name: MonthlyAccidentData id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."MonthlyAccidentData" ALTER COLUMN id SET DEFAULT nextval('public."MonthlyAccidentData_id_seq"'::regclass);


--
-- Name: MonthlyHRData id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."MonthlyHRData" ALTER COLUMN id SET DEFAULT nextval('public."MonthlyHRData_id_seq"'::regclass);


--
-- Name: NotebookItem id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."NotebookItem" ALTER COLUMN id SET DEFAULT nextval('public."NotebookItem_id_seq"'::regclass);


--
-- Name: NotebookPage id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."NotebookPage" ALTER COLUMN id SET DEFAULT nextval('public."NotebookPage_id_seq"'::regclass);


--
-- Name: Notification id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Notification" ALTER COLUMN id SET DEFAULT nextval('public."Notification_id_seq"'::regclass);


--
-- Name: NotificationConfig id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."NotificationConfig" ALTER COLUMN id SET DEFAULT nextval('public."NotificationConfig_id_seq"'::regclass);


--
-- Name: NotificationTemplate id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."NotificationTemplate" ALTER COLUMN id SET DEFAULT nextval('public."NotificationTemplate_id_seq"'::regclass);


--
-- Name: OSGBCompany id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."OSGBCompany" ALTER COLUMN id SET DEFAULT nextval('public."OSGBCompany_id_seq"'::regclass);


--
-- Name: Professional id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Professional" ALTER COLUMN id SET DEFAULT nextval('public."Professional_id_seq"'::regclass);


--
-- Name: Reconciliation id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Reconciliation" ALTER COLUMN id SET DEFAULT nextval('public."Reconciliation_id_seq"'::regclass);


--
-- Name: ReportTemplate id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."ReportTemplate" ALTER COLUMN id SET DEFAULT nextval('public."ReportTemplate_id_seq"'::regclass);


--
-- Name: RiskCategorySetting id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskCategorySetting" ALTER COLUMN id SET DEFAULT nextval('public."RiskCategorySetting_id_seq"'::regclass);


--
-- Name: RiskDepartment id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskDepartment" ALTER COLUMN id SET DEFAULT nextval('public."RiskDepartment_id_seq"'::regclass);


--
-- Name: RiskDepartmentSetting id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskDepartmentSetting" ALTER COLUMN id SET DEFAULT nextval('public."RiskDepartmentSetting_id_seq"'::regclass);


--
-- Name: RiskSubCategorySetting id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskSubCategorySetting" ALTER COLUMN id SET DEFAULT nextval('public."RiskSubCategorySetting_id_seq"'::regclass);


--
-- Name: Role id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Role" ALTER COLUMN id SET DEFAULT nextval('public."Role_id_seq"'::regclass);


--
-- Name: SubCategory id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."SubCategory" ALTER COLUMN id SET DEFAULT nextval('public."SubCategory_id_seq"'::regclass);


--
-- Name: SystemSettings id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."SystemSettings" ALTER COLUMN id SET DEFAULT nextval('public."SystemSettings_id_seq"'::regclass);


--
-- Name: WorkflowAlarm id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowAlarm" ALTER COLUMN id SET DEFAULT nextval('public."WorkflowAlarm_id_seq"'::regclass);


--
-- Name: WorkflowCategory id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowCategory" ALTER COLUMN id SET DEFAULT nextval('public."WorkflowCategory_id_seq"'::regclass);


--
-- Name: WorkflowDepartment id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowDepartment" ALTER COLUMN id SET DEFAULT nextval('public."WorkflowDepartment_id_seq"'::regclass);


--
-- Name: WorkflowNotificationSettings id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowNotificationSettings" ALTER COLUMN id SET DEFAULT nextval('public."WorkflowNotificationSettings_id_seq"'::regclass);


--
-- Name: WorkflowTag id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTag" ALTER COLUMN id SET DEFAULT nextval('public."WorkflowTag_id_seq"'::regclass);


--
-- Name: WorkflowTask id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTask" ALTER COLUMN id SET DEFAULT nextval('public."WorkflowTask_id_seq"'::regclass);


--
-- Name: WorkflowTaskAssignment id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTaskAssignment" ALTER COLUMN id SET DEFAULT nextval('public."WorkflowTaskAssignment_id_seq"'::regclass);


--
-- Name: WorkflowTaskComment id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTaskComment" ALTER COLUMN id SET DEFAULT nextval('public."WorkflowTaskComment_id_seq"'::regclass);


--
-- Name: WorkflowTaskHistory id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTaskHistory" ALTER COLUMN id SET DEFAULT nextval('public."WorkflowTaskHistory_id_seq"'::regclass);


--
-- Name: WorkflowUserRole id; Type: DEFAULT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowUserRole" ALTER COLUMN id SET DEFAULT nextval('public."WorkflowUserRole_id_seq"'::regclass);


--
-- Data for Name: ActivityLog; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."ActivityLog" (id, action, "createdAt", details, "facilityId", username) FROM stdin;
1	Aylık Personel Verisi Güncellendi	2026-04-24 20:44:31.852	2026-04 dönemi için personel verileri girildi/güncellendi.	GOP-DIYALIZ-MER	admin
2	Aylık Personel Verisi Güncellendi	2026-04-24 20:49:34.549	2026-01 dönemi için personel verileri girildi/güncellendi.	GOP-DIYALIZ-MER	metin.salik
3	Aylık Personel Verisi Güncellendi	2026-04-24 20:50:55.334	2026-01 dönemi için personel verileri girildi/güncellendi.	İSU-LIV-TOPKAP	metin.salik
4	Aylık Personel Verisi Güncellendi	2026-04-24 20:51:00.235	2026-04 dönemi için personel verileri girildi/güncellendi.	GOP-DIYALIZ-MER	admin
5	Aylık Personel Verisi Güncellendi	2026-04-24 20:53:17.546	2026-04 dönemi için personel verileri girildi/güncellendi.	MLP-MERKEZ	murat.bakal
6	Aylık Personel Verisi Güncellendi	2026-04-24 20:59:11.721	2026-01 dönemi için personel verileri girildi/güncellendi.	MLP-MERKEZ	murat.bakal
7	Aylık Personel Verisi Güncellendi	2026-04-24 20:59:41.245	2026-04 dönemi için personel verileri girildi/güncellendi.	GOP-DIYALIZ-MER	admin
8	Yeni Defter Kaydı Eklendi	2026-04-24 21:38:06.294	Acil Durum Yönetimi kategorisinde yeni bir tespit/öneri eklendi.	MLP-MERKEZ	admin
9	Yeni Defter Sayfası Eklendi	2026-04-25 19:40:02.693	25.04.2026 tarihli sayfaya 2 madde eklendi.	GOP-DIYALIZ-MER	metin.salik
10	Yeni Defter Sayfası Eklendi	2026-04-25 19:54:58.35	01.04.2026 tarihli sayfaya 1 madde eklendi.	LIV-VADI	metin.salik
11	Defter Sayfası Silindi	2026-04-25 20:10:42.026	25.04.2026 tarihli kayıt arşive taşındı.	GOP-DIYALIZ-MER	metin.salik
12	Yeni Defter Sayfası Eklendi	2026-04-25 20:13:02.184	25.04.2026 tarihli sayfaya 2 madde eklendi.	LIV-GAZIANTEP	metin.salik
13	Defter Sayfası Güncellendi	2026-04-25 20:13:34.04	25.04.2026 tarihli sayfa güncellendi.	LIV-GAZIANTEP	metin.salik
14	Yeni Defter Sayfası Eklendi	2026-04-25 20:15:40.144	01.04.2026 tarihli sayfaya 2 madde eklendi.	MLP-AR-GE	murat.bakal
15	Defter Sayfası Güncellendi	2026-04-25 20:21:27.209	01.04.2026 tarihli sayfa güncellendi.	MLP-AR-GE	murat.bakal
16	Atama Sonlandırıldı	2026-04-27 06:31:50.383	DSP tipi atama sonlandırıldı.	MP-ADANA	metin.salik
17	Atama Sonlandırıldı	2026-04-27 06:31:53.267	DSP tipi atama sonlandırıldı.	MP-ADANA	metin.salik
18	Atama Sonlandırıldı	2026-04-27 06:31:53.704	DSP tipi atama sonlandırıldı.	MP-ADANA	metin.salik
19	Çalışan Sayısı Güncellendi	2026-04-27 06:32:38.296	Çalışan sayısı 347 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-ADANA	metin.salik
20	Yeni Atama Yapıldı	2026-04-27 06:47:59.453	Hekim tipi atama yapıldı. (11700 dk)	LIV-ANKARA	metin.salik
21	Atama Sonlandırıldı	2026-04-27 06:50:52.618	Hekim tipi atama sonlandırıldı.	LIV-ANKARA	metin.salik
22	Çalışan Sayısı Güncellendi	2026-04-27 06:51:41.197	Çalışan sayısı 472 olarak güncellendi. (Yürürlük: 24.04.2026)	LIV-ANKARA	metin.salik
23	Yeni Atama Yapıldı	2026-04-27 06:59:24.585	IGU tipi atama yapıldı. (8240 dk)	MP-ANKARA	metin.salik
24	Atama Sonlandırıldı	2026-04-27 07:00:47.813	IGU tipi atama sonlandırıldı.	MP-ANKARA	metin.salik
25	Çalışan Sayısı Güncellendi	2026-04-27 07:04:10.352	Çalışan sayısı 366 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-ANKARA	metin.salik
26	Yeni Atama Yapıldı	2026-04-27 07:15:42.273	IGU tipi atama yapıldı. (11700 dk)	MP-ANTALYA	metin.salik
27	Atama Sonlandırıldı	2026-04-27 07:17:42.876	IGU tipi atama sonlandırıldı.	MP-ANTALYA	metin.salik
28	Çalışan Sayısı Güncellendi	2026-04-27 07:18:18.005	Çalışan sayısı 707 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-ANTALYA	metin.salik
29	Çalışan Sayısı Güncellendi	2026-04-27 07:27:22.013	Çalışan sayısı 93 olarak güncellendi. (Yürürlük: 24.04.2026)	MLP-AR-GE	metin.salik
30	Çalışan Sayısı Güncellendi	2026-04-27 07:28:53.552	Çalışan sayısı 197 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-ATASEHIR	metin.salik
31	Çalışan Sayısı Güncellendi	2026-04-27 07:30:03.63	Çalışan sayısı 750 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-BAHCELIEVLER	metin.salik
32	Çalışan Sayısı Güncellendi	2026-04-27 07:33:03.986	Çalışan sayısı 515 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-BURSA	metin.salik
33	Yeni Atama Yapıldı	2026-04-27 07:40:10.773	Hekim tipi atama yapıldı. (75 dk)	MP-CANAKKALE	metin.salik
34	Atama Sonlandırıldı	2026-04-27 07:40:45.929	Hekim tipi atama sonlandırıldı.	MP-CANAKKALE	metin.salik
35	Çalışan Sayısı Güncellendi	2026-04-27 07:46:02.424	Çalışan sayısı 52 olarak güncellendi. (Yürürlük: 24.04.2026)	MLP-CAGRI-MERKE	metin.salik
36	Yeni Atama Yapıldı	2026-04-27 07:49:24.552	IGU tipi atama yapıldı. (500 dk)	MLP-CAGRI-MERKE	metin.salik
37	Yeni Atama Yapıldı	2026-04-27 07:50:23.697	Hekim tipi atama yapıldı. (385 dk)	MLP-CAGRI-MERKE	metin.salik
38	Çalışan Sayısı Güncellendi	2026-04-27 07:57:07.597	Çalışan sayısı 62 olarak güncellendi. (Yürürlük: 24.04.2026)	GOP-DIYALIZ-MER	metin.salik
39	Yeni Atama Yapıldı	2026-04-27 07:58:30.574	IGU tipi atama yapıldı. (1240 dk)	GOP-DIYALIZ-MER	metin.salik
40	Yeni Atama Yapıldı	2026-04-27 07:59:20.116	Hekim tipi atama yapıldı. (660 dk)	GOP-DIYALIZ-MER	metin.salik
41	Yeni Atama Yapıldı	2026-04-27 08:01:32.095	DSP tipi atama yapıldı. (11700 dk)	GOP-DIYALIZ-MER	metin.salik
42	Çalışan Sayısı Güncellendi	2026-04-27 08:04:24.805	Çalışan sayısı 265 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-FATIH	metin.salik
43	Çalışan Sayısı Güncellendi	2026-04-27 08:15:53.118	Çalışan sayısı 573 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-FLORYA	metin.salik
44	Yeni Atama Yapıldı	2026-04-27 08:21:06.137	IGU tipi atama yapıldı. (11700 dk)	LIV-GAZIANTEP	metin.salik
45	Çalışan Sayısı Güncellendi	2026-04-27 08:22:29.438	Çalışan sayısı 363 olarak güncellendi. (Yürürlük: 24.04.2026)	LIV-GAZIANTEP	metin.salik
46	Çalışan Sayısı Güncellendi	2026-04-27 08:23:47.277	Çalışan sayısı 363 olarak güncellendi. (Yürürlük: 24.04.2026)	LIV-GAZIANTEP	metin.salik
47	Atama Sonlandırıldı	2026-04-27 08:24:24.486	IGU tipi atama sonlandırıldı.	LIV-GAZIANTEP	metin.salik
48	Çalışan Sayısı Güncellendi	2026-04-27 08:25:34.932	Çalışan sayısı 433 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-GEBZE	metin.salik
49	Çalışan Sayısı Güncellendi	2026-04-27 08:29:02.489	Çalışan sayısı 573 olarak güncellendi. (Yürürlük: 24.04.2026)	İSU-MP-GAZIOSM	metin.salik
50	Yeni Atama Yapıldı	2026-04-27 08:30:54.082	IGU tipi atama yapıldı. (6000 dk)	İSU-MP-GAZIOSM	metin.salik
51	Çalışan Sayısı Güncellendi	2026-04-27 08:33:04.379	Çalışan sayısı 704 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-GOZTEPE	metin.salik
52	Yeni Atama Yapıldı	2026-04-27 08:36:04.477	IGU tipi atama yapıldı. (130 dk)	MLP-İGA	metin.salik
53	Yeni Atama Yapıldı	2026-04-27 08:36:57.858	Hekim tipi atama yapıldı. (65 dk)	MLP-İGA	metin.salik
54	Atama Sonlandırıldı	2026-04-27 08:37:11.127	IGU tipi atama sonlandırıldı.	MLP-İGA	metin.salik
55	Çalışan Sayısı Güncellendi	2026-04-27 08:38:21.196	Çalışan sayısı 35 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-İNCEK	metin.salik
56	Atama Sonlandırıldı	2026-04-27 08:40:39.434	Hekim tipi atama sonlandırıldı.	MP-İNCEK	metin.salik
57	Çalışan Sayısı Güncellendi	2026-04-27 08:45:24.975	Çalışan sayısı 40 olarak güncellendi. (Yürürlük: 24.04.2026)	İSTINYE-DENT	metin.salik
58	Yeni Atama Yapıldı	2026-04-27 08:46:11.207	IGU tipi atama yapıldı. (800 dk)	İSTINYE-DENT	metin.salik
59	Atama Sonlandırıldı	2026-04-27 08:46:50.699	IGU tipi atama sonlandırıldı.	İSTINYE-DENT	metin.salik
60	Yeni Atama Yapıldı	2026-04-27 08:47:44.931	Hekim tipi atama yapıldı. (400 dk)	İSTINYE-DENT	metin.salik
61	Çalışan Sayısı Güncellendi	2026-04-27 08:58:50.703	Çalışan sayısı 738 olarak güncellendi. (Yürürlük: 24.04.2026)	İSU-LIV-BAHCES	metin.salik
62	Atama Sonlandırıldı	2026-04-27 09:00:07.767	Hekim tipi atama sonlandırıldı.	İSU-LIV-BAHCES	metin.salik
63	Atama Sonlandırıldı	2026-04-27 09:01:40.688	IGU tipi atama sonlandırıldı.	İSU-LIV-BAHCES	metin.salik
64	Çalışan Sayısı Güncellendi	2026-04-27 09:03:33.831	Çalışan sayısı 679 olarak güncellendi. (Yürürlük: 24.04.2026)	İSU-TIP-FAKULT	metin.salik
65	Yeni Atama Yapıldı	2026-04-27 09:05:02.457	Hekim tipi atama yapıldı. (10000 dk)	İSU-TIP-FAKULT	metin.salik
66	Yeni Atama Yapıldı	2026-04-27 09:05:54.115	DSP tipi atama yapıldı. (11700 dk)	İSU-TIP-FAKULT	metin.salik
67	Çalışan Sayısı Güncellendi	2026-04-27 09:11:03.967	Çalışan sayısı 205 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-İZMIR	metin.salik
68	Çalışan Sayısı Güncellendi	2026-04-27 09:14:48.895	Çalışan sayısı 594 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-KOCAELI	metin.salik
69	Yeni Atama Yapıldı	2026-04-27 09:15:57.73	IGU tipi atama yapıldı. (3960 dk)	VM-MP-KOCAELI	metin.salik
70	Çalışan Sayısı Güncellendi	2026-04-27 09:17:21.055	Çalışan sayısı 448 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-MALTEPE	metin.salik
71	Çalışan Sayısı Güncellendi	2026-04-27 09:19:45.757	Çalışan sayısı 415 olarak güncellendi. (Yürürlük: 24.04.2026)	MLP-MERKEZ	metin.salik
72	Yeni Atama Yapıldı	2026-04-27 09:20:41.742	IGU tipi atama yapıldı. (11700 dk)	MLP-MERKEZ	metin.salik
73	Yeni Atama Yapıldı	2026-04-27 09:21:32.129	Hekim tipi atama yapıldı. (2350 dk)	MLP-MERKEZ	metin.salik
74	Çalışan Sayısı Güncellendi	2026-04-27 09:24:55.423	Çalışan sayısı 477 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-MERSIN	metin.salik
75	Çalışan Sayısı Güncellendi	2026-04-27 09:28:06.838	Çalışan sayısı 238 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-İSTANBUL-ON	metin.salik
76	Yeni Atama Yapıldı	2026-04-27 09:29:54.9	DSP tipi atama yapıldı. (11700 dk)	MP-İSTANBUL-ON	metin.salik
77	Çalışan Sayısı Güncellendi	2026-04-27 09:30:35.514	Çalışan sayısı 353 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-ORDU	metin.salik
78	Çalışan Sayısı Güncellendi	2026-04-27 09:32:09.836	Çalışan sayısı 775 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-PENDIK	metin.salik
79	Çalışan Sayısı Güncellendi	2026-04-27 09:35:18.325	Çalışan sayısı 222 olarak güncellendi. (Yürürlük: 24.04.2026)	LIV-SAMSUN	metin.salik
80	Çalışan Sayısı Güncellendi	2026-04-27 10:27:43.29	Çalışan sayısı 726 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-SAMSUN	metin.salik
81	Yeni Atama Yapıldı	2026-04-27 10:29:34.51	IGU tipi atama yapıldı. (11700 dk)	VM-MP-SAMSUN	metin.salik
82	Çalışan Sayısı Güncellendi	2026-04-27 10:30:48.849	Çalışan sayısı 349 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-SEYHAN	metin.salik
83	Yeni Atama Yapıldı	2026-04-27 10:32:51.807	IGU tipi atama yapıldı. (3920 dk)	MP-SEYHAN	metin.salik
84	Çalışan Sayısı Güncellendi	2026-04-27 10:36:09.274	Çalışan sayısı 280 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-TEM	metin.salik
85	Yeni Atama Yapıldı	2026-04-27 10:37:55.847	IGU tipi atama yapıldı. (1240 dk)	MP-TEM	metin.salik
86	Çalışan Sayısı Güncellendi	2026-04-27 10:44:31.866	Çalışan sayısı 278 olarak güncellendi. (Yürürlük: 24.04.2026)	İSU-LIV-TOPKAP	metin.salik
87	Yeni Atama Yapıldı	2026-04-27 10:45:52.459	IGU tipi atama yapıldı. (11700 dk)	İSU-LIV-TOPKAP	metin.salik
88	Yeni Atama Yapıldı	2026-04-27 10:47:44.882	DSP tipi atama yapıldı. (11700 dk)	İSU-LIV-TOPKAP	metin.salik
89	Yeni Atama Yapıldı	2026-04-27 10:50:40.856	IGU tipi atama yapıldı. (10 dk)	MLP-KARADENIZ-I	metin.salik
90	Çalışan Sayısı Güncellendi	2026-04-27 10:53:24.114	Çalışan sayısı 311 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-KARADENIZ	metin.salik
91	Çalışan Sayısı Güncellendi	2026-04-27 10:55:41.297	Çalışan sayısı 264 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-YILDIZLI	metin.salik
92	Yeni Atama Yapıldı	2026-04-27 10:56:48.624	IGU tipi atama yapıldı. (3000 dk)	MP-YILDIZLI	metin.salik
93	Çalışan Sayısı Güncellendi	2026-04-27 10:58:21.03	Çalışan sayısı 652 olarak güncellendi. (Yürürlük: 24.04.2026)	LIV-ULUS	metin.salik
94	Çalışan Sayısı Güncellendi	2026-04-27 11:01:17.969	Çalışan sayısı 572 olarak güncellendi. (Yürürlük: 24.04.2026)	LIV-VADI	metin.salik
95	Yeni Atama Yapıldı	2026-04-27 11:04:21.026	IGU tipi atama yapıldı. (260 dk)	MLP-VADI-İDARI	metin.salik
96	Atama Sonlandırıldı	2026-04-27 11:04:33.007	IGU tipi atama sonlandırıldı.	MLP-VADI-İDARI	metin.salik
97	Çalışan Sayısı Güncellendi	2026-06-01 05:54:04.678	Çalışan sayısı 469 olarak güncellendi. (Yürürlük: 23.05.2026)	MP-ANKARA	metin.salik
98	Çalışan Sayısı Güncellendi	2026-06-01 06:11:33.302	Çalışan sayısı 553 olarak güncellendi. (Yürürlük: 23.05.2026)	VM-MP-FLORYA	metin.salik
99	Atama Sonlandırıldı	2026-06-01 06:14:31.978	IGU tipi atama sonlandırıldı.	VM-MP-FLORYA	metin.salik
100	Yeni Atama Yapıldı	2026-06-01 06:15:57.461	IGU tipi atama yapıldı. (11700 dk)	VM-MP-FLORYA	metin.salik
101	Çalışan Sayısı Güncellendi	2026-06-01 06:25:42.034	Çalışan sayısı 343 olarak güncellendi. (Yürürlük: 23.05.2026)	MP-ADANA	metin.salik
102	Çalışan Sayısı Güncellendi	2026-06-01 06:27:37.049	Çalışan sayısı 474 olarak güncellendi. (Yürürlük: 23.05.2026)	LIV-ANKARA	metin.salik
103	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 62 yapıldı.	GOP-DIYALIZ-MER	metin.salik
104	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 44 yapıldı.	İSTINYE-DENT	metin.salik
105	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 731 yapıldı.	İSU-LIV-BAHCES	metin.salik
106	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 282 yapıldı.	İSU-LIV-TOPKAP	metin.salik
107	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 559 yapıldı.	İSU-MP-GAZIOSM	metin.salik
108	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 697 yapıldı.	İSU-TIP-FAKULT	metin.salik
109	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 474 yapıldı.	LIV-ANKARA	metin.salik
110	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 356 yapıldı.	LIV-GAZIANTEP	metin.salik
111	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 224 yapıldı.	LIV-SAMSUN	metin.salik
112	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 655 yapıldı.	LIV-ULUS	metin.salik
113	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 577 yapıldı.	LIV-VADI	metin.salik
114	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 1 yapıldı.	MLP-ANKARA-DEPO	metin.salik
115	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 1 yapıldı.	MLP-ANTALYA-KON	metin.salik
116	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 95 yapıldı.	MLP-AR-GE	metin.salik
117	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 50 yapıldı.	MLP-CAGRI-MERKE	metin.salik
118	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 13 yapıldı.	MLP-İGA	metin.salik
119	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 2 yapıldı.	MLP-KARADENIZ-I	metin.salik
120	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 420 yapıldı.	MLP-MERKEZ	metin.salik
121	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 4 yapıldı.	MLP-MERKEZ-DEPO	metin.salik
122	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 4 yapıldı.	MLP-SAMSUN-LIV-	metin.salik
123	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 0 yapıldı.	MLP-VADI-İDARI	metin.salik
124	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 26 yapıldı.	MLP-VADI-OFIS	metin.salik
125	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 343 yapıldı.	MP-ADANA	metin.salik
126	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 469 yapıldı.	MP-ANKARA	metin.salik
127	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 707 yapıldı.	MP-ANTALYA	metin.salik
128	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 200 yapıldı.	MP-ATASEHIR	metin.salik
129	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 741 yapıldı.	MP-BAHCELIEVLER	metin.salik
130	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 5 yapıldı.	MP-CANAKKALE	metin.salik
131	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 441 yapıldı.	MP-GEBZE	metin.salik
132	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 706 yapıldı.	MP-GOZTEPE	metin.salik
133	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 16 yapıldı.	MP-İNCEK	metin.salik
134	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 246 yapıldı.	MP-İSTANBUL-ON	metin.salik
135	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 208 yapıldı.	MP-İZMIR	metin.salik
136	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 307 yapıldı.	MP-KARADENIZ	metin.salik
137	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 346 yapıldı.	MP-ORDU	metin.salik
138	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 345 yapıldı.	MP-SEYHAN	metin.salik
139	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 283 yapıldı.	MP-TEM	metin.salik
140	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 248 yapıldı.	MP-TOKAT	metin.salik
141	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 261 yapıldı.	MP-YILDIZLI	metin.salik
142	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 359 yapıldı.	VM-MP-ANKARA	metin.salik
143	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 506 yapıldı.	VM-MP-BURSA	metin.salik
144	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 266 yapıldı.	VM-MP-FATIH	metin.salik
145	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 553 yapıldı.	VM-MP-FLORYA	metin.salik
146	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 591 yapıldı.	VM-MP-KOCAELI	metin.salik
147	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 459 yapıldı.	VM-MP-MALTEPE	metin.salik
148	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 469 yapıldı.	VM-MP-MERSIN	metin.salik
149	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 759 yapıldı.	VM-MP-PENDIK	metin.salik
150	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 726 yapıldı.	VM-MP-SAMSUN	metin.salik
151	Atama Sonlandırıldı	2026-06-01 07:04:27.284	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik
152	Atama Sonlandırıldı	2026-06-01 07:04:28.726	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik
153	Atama Sonlandırıldı	2026-06-01 07:04:29.647	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik
154	Atama Sonlandırıldı	2026-06-01 07:04:30.077	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik
155	Atama Sonlandırıldı	2026-06-01 07:04:30.241	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik
156	Atama Sonlandırıldı	2026-06-01 07:04:30.442	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik
157	Atama Sonlandırıldı	2026-06-01 07:04:30.819	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik
158	Atama Sonlandırıldı	2026-06-01 07:04:30.991	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik
159	Atama Sonlandırıldı	2026-06-01 07:08:10.743	DSP tipi atama sonlandırıldı.	GOP-DIYALIZ-MER	metin.salik
160	Atama Sonlandırıldı	2026-06-01 07:19:51.931	IGU tipi atama sonlandırıldı.	VM-MP-FATIH	metin.salik
161	Yeni Atama Yapıldı	2026-06-01 07:22:02.426	IGU tipi atama yapıldı. (720 dk)	VM-MP-FATIH	metin.salik
162	Yeni Atama Yapıldı	2026-06-01 07:22:07.076	IGU tipi atama yapıldı. (720 dk)	VM-MP-FATIH	metin.salik
163	Atama Sonlandırıldı	2026-06-01 07:22:26.649	IGU tipi atama sonlandırıldı.	VM-MP-FATIH	metin.salik
164	Atama Sonlandırıldı	2026-06-01 07:51:30.638	Hekim tipi atama sonlandırıldı.	MLP-İGA	metin.salik
165	Atama Sonlandırıldı	2026-06-01 07:56:25.588	DSP tipi atama sonlandırıldı.	İSU-TIP-FAKULT	metin.salik
166	Yeni Atama Yapıldı	2026-06-01 08:02:24.013	IGU tipi atama yapıldı. (11700 dk)	İSU-LIV-BAHCES	metin.salik
167	Atama Sonlandırıldı	2026-06-01 08:11:16.276	DSP tipi atama sonlandırıldı.	VM-MP-MALTEPE	metin.salik
168	Yeni Atama Yapıldı	2026-06-01 08:21:50.476	IGU tipi atama yapıldı. (440 dk)	VM-MP-PENDIK	metin.salik
169	Atama Sonlandırıldı	2026-06-01 08:23:12.286	IGU tipi atama sonlandırıldı.	VM-MP-PENDIK	metin.salik
170	Yeni Atama Yapıldı	2026-06-01 10:21:16.352	DSP tipi atama yapıldı. (11700 dk)	MP-TOKAT	metin.salik
171	Yeni Atama Yapıldı	2026-06-01 10:26:47.234	Hekim tipi atama yapıldı. (100 dk)	MLP-KARADENIZ-I	metin.salik
172	Atama Sonlandırıldı	2026-06-01 10:30:26.809	DSP tipi atama sonlandırıldı.	MP-YILDIZLI	metin.salik
173	Atama Sonlandırıldı	2026-06-01 10:46:18.576	IGU tipi atama sonlandırıldı.	MP-İNCEK	metin.salik
174	Atama Sonlandırıldı	2026-06-01 10:46:24.691	Hekim tipi atama sonlandırıldı.	MP-İNCEK	metin.salik
175	Atama Sonlandırıldı	2026-06-01 10:46:31.261	DSP tipi atama sonlandırıldı.	MP-İNCEK	metin.salik
176	Yeni Atama Yapıldı	2026-06-01 11:24:51.108	DSP tipi atama yapıldı. (5920 dk)	MP-YILDIZLI	metin.salik
177	Atama Sonlandırıldı	2026-06-01 11:29:24.346	Nesibe ÖMÜR'in MP Yıldızlı tesisindeki DSP ataması 01.06.2026 tarihinde Metin Salık tarafından sonlandırıldı.	MP-YILDIZLI	metin.salik
178	Yeni Atama Yapıldı	2026-06-01 11:29:44.588	19.05.2026 tarihinde Nesibe ÖMÜR - DSP tipi atama yapıldı. (5290 dk.) işlemi yapan Metin Salık	MP-YILDIZLI	metin.salik
179	Atama Sonlandırıldı	2026-06-01 11:50:35.732	Nesibe ÖMÜR'in MP Yıldızlı tesisindeki DSP ataması 01.06.2026 tarihinde Metin Salık tarafından sonlandırıldı.	MP-YILDIZLI	metin.salik
180	Yeni Atama Yapıldı	2026-06-01 11:50:57.957	19.05.2026 tarihinde Nesibe ÖMÜR - DSP tipi atama yapıldı. (5290 dk.)	MP-YILDIZLI	metin.salik
181	Yeni Atama Yapıldı	2026-06-01 11:52:33.811	01.06.2026 tarihinde Alptekin Akyazı - IGU tipi atama yapıldı. (3000 dk.)	MP-YILDIZLI	metin.salik
182	Atama Sonlandırıldı	2026-06-01 11:52:52.685	Alptekin Akyazı'in MP Yıldızlı tesisindeki IGU ataması 01.06.2026 tarihinde Metin Salık tarafından sonlandırıldı.	MP-YILDIZLI	metin.salik
\.


--
-- Data for Name: AdministrativeFine; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."AdministrativeFine" (id, year, "specialistAndPhysicianVery", "specialistAndPhysicianDanger", "specialistAndPhysicianLess", "dspVeryDangerous", "createdAt", "updatedAt") FROM stdin;
1	2026	33789	222526	166894	166791	2026-04-27 11:23:18.479	2026-04-27 11:23:18.479
\.


--
-- Data for Name: Assignment; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."Assignment" (id, "facilityId", "professionalId", "employerRepId", type, "durationMinutes", "isFullTime", "startDate", "endDate", status, "costType", "unitPrice", "createdAt", "updatedAt") FROM stdin;
3	LIV-GAZIANTEP	75	\N	Hekim	7400	f	2024-09-27 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.487	2026-04-24 08:05:01.487
4	LIV-GAZIANTEP	111	\N	DSP	11700	t	2025-05-30 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.487	2026-04-24 08:05:01.487
5	LIV-ANKARA	8	\N	IGU	11700	t	2024-02-10 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.488	2026-04-24 08:05:01.488
6	LIV-ANKARA	9	\N	IGU	11700	t	2025-01-11 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.489	2026-04-24 08:05:01.489
8	LIV-ANKARA	110	\N	DSP	11700	t	2024-11-13 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.49	2026-04-24 08:05:01.49
9	LIV-ULUS	13	\N	IGU	11700	t	2025-07-14 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.491	2026-04-24 08:05:01.491
10	LIV-ULUS	14	\N	IGU	11700	t	2025-08-11 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.492	2026-04-24 08:05:01.492
11	LIV-ULUS	15	\N	IGU	11700	t	2025-08-26 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.492	2026-04-24 08:05:01.492
12	LIV-ULUS	77	\N	Hekim	10000	f	2025-10-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.493	2026-04-24 08:05:01.493
13	LIV-ULUS	112	\N	DSP	11700	t	2023-01-13 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.494	2026-04-24 08:05:01.494
14	MLP-AR-GE	141	\N	IGU	1100	f	2025-09-24 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.495	2026-04-24 08:05:01.495
15	MLP-AR-GE	142	\N	Hekim	525	f	2025-11-30 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.496	2026-04-24 08:05:01.496
16	MP-ADANA	18	\N	IGU	11700	t	2025-02-25 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.499	2026-04-24 08:05:01.499
17	MP-ADANA	146	\N	IGU	7200	f	2026-02-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.5	2026-04-24 08:05:01.5
20	MP-ATASEHIR	25	\N	IGU	11700	t	2025-01-02 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.502	2026-04-24 08:05:01.502
21	MP-ATASEHIR	84	\N	Hekim	11700	t	2026-01-16 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.503	2026-04-24 08:05:01.503
22	MP-ATASEHIR	119	\N	DSP	11700	t	2025-03-18 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.504	2026-04-24 08:05:01.504
23	MP-BAHCELIEVLER	26	\N	IGU	11700	t	2025-01-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.504	2026-04-24 08:05:01.504
24	MP-BAHCELIEVLER	27	\N	IGU	11700	t	2025-01-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.505	2026-04-24 08:05:01.505
25	MP-BAHCELIEVLER	28	\N	IGU	11700	t	2025-11-05 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.506	2026-04-24 08:05:01.506
26	MP-BAHCELIEVLER	29	\N	IGU	4500	f	2026-01-16 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.507	2026-04-24 08:05:01.507
27	MP-BAHCELIEVLER	85	\N	Hekim	11700	t	2024-06-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.508	2026-04-24 08:05:01.508
28	MP-BAHCELIEVLER	120	\N	DSP	11700	t	2023-11-21 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.509	2026-04-24 08:05:01.509
29	MP-GOZTEPE	33	\N	IGU	11700	t	2025-02-25 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.509	2026-04-24 08:05:01.509
30	MP-GOZTEPE	32	\N	IGU	11700	t	2025-03-07 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.51	2026-04-24 08:05:01.51
31	MP-GOZTEPE	34	\N	IGU	11700	t	2025-01-15 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.511	2026-04-24 08:05:01.511
32	MP-GOZTEPE	87	\N	Hekim	11700	t	2025-01-21 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.512	2026-04-24 08:05:01.512
33	MP-GOZTEPE	122	\N	DSP	11700	t	2024-08-21 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.513	2026-04-24 08:05:01.513
34	MP-KARADENIZ	41	\N	IGU	11700	t	2024-08-23 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.514	2026-04-24 08:05:01.514
37	MP-KARADENIZ	126	\N	DSP	11700	t	2022-12-01 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.518	2026-04-24 08:05:01.518
38	MP-ORDU	36	\N	IGU	11700	t	2025-09-30 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.518	2026-04-24 08:05:01.518
39	MP-ORDU	37	\N	IGU	4600	f	2025-09-30 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.519	2026-04-24 08:05:01.519
40	MP-ORDU	89	\N	Hekim	5580	f	2024-08-02 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.52	2026-04-24 08:05:01.52
41	MP-ORDU	124	\N	DSP	11700	t	2026-01-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.521	2026-04-24 08:05:01.521
42	MP-CANAKKALE	21	\N	IGU	200	f	2025-09-05 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.521	2026-04-24 08:05:01.521
44	MP-CANAKKALE	116	\N	DSP	2850	f	2022-12-21 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.523	2026-04-24 08:05:01.523
49	VM-MP-BURSA	46	\N	IGU	11700	t	2025-05-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.529	2026-04-24 08:05:01.529
50	VM-MP-BURSA	47	\N	IGU	11700	t	2025-05-13 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.53	2026-04-24 08:05:01.53
51	VM-MP-BURSA	96	\N	Hekim	7875	f	2022-11-23 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.53	2026-04-24 08:05:01.53
53	VM-MP-FLORYA	49	\N	IGU	11700	t	2025-10-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.532	2026-04-24 08:05:01.532
54	VM-MP-FLORYA	50	\N	IGU	9000	f	2025-06-18 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.532	2026-04-24 08:05:01.532
56	VM-MP-FLORYA	98	\N	Hekim	11700	t	2025-05-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.534	2026-04-24 08:05:01.534
57	VM-MP-FLORYA	132	\N	DSP	11700	t	2025-02-11 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.534	2026-04-24 08:05:01.534
58	VM-MP-MERSIN	56	\N	IGU	11700	t	2024-01-22 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.535	2026-04-24 08:05:01.535
59	VM-MP-MERSIN	57	\N	IGU	11700	t	2024-11-19 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.536	2026-04-24 08:05:01.536
60	VM-MP-MERSIN	101	\N	Hekim	11700	t	2025-01-27 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.536	2026-04-24 08:05:01.536
61	VM-MP-MERSIN	136	\N	DSP	11000	f	2023-02-27 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.537	2026-04-24 08:05:01.537
62	VM-MP-PENDIK	58	\N	IGU	11700	t	2023-06-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.538	2026-04-24 08:05:01.538
63	VM-MP-PENDIK	60	\N	IGU	11700	t	2025-07-08 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.54	2026-04-24 08:05:01.54
64	VM-MP-PENDIK	61	\N	IGU	11700	t	2025-07-08 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.541	2026-04-24 08:05:01.541
66	VM-MP-PENDIK	102	\N	Hekim	11700	t	2024-01-25 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.542	2026-04-24 08:05:01.542
67	VM-MP-PENDIK	103	\N	Hekim	1845	f	2025-03-25 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.543	2026-04-24 08:05:01.543
19	MP-ADANA	114	\N	DSP	11700	t	2026-01-05 00:00:00	2026-03-16 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.501	2026-04-27 06:31:53.704
7	LIV-ANKARA	74	\N	Hekim	7290	f	2025-02-03 00:00:00	2026-02-23 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.49	2026-04-27 06:50:52.618
43	MP-CANAKKALE	140	\N	Hekim	75	f	2026-01-16 00:00:00	2026-01-05 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.522	2026-04-27 07:40:45.929
65	VM-MP-PENDIK	59	\N	IGU	4000	f	2025-07-17 00:00:00	2026-04-27 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.542	2026-06-01 08:23:12.286
1	LIV-GAZIANTEP	10	\N	IGU	11700	t	2025-01-06 00:00:00	2026-02-02 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.484	2026-04-27 08:24:24.486
48	MP-İNCEK	117	\N	DSP	220	f	2024-04-03 00:00:00	2026-06-01 00:00:00	Sona Erdi	Saatlik	\N	2026-04-24 08:05:01.528	2026-06-01 10:46:31.261
47	MP-İNCEK	82	\N	Hekim	1605	f	2025-10-16 00:00:00	2026-01-28 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.525	2026-04-27 08:40:39.434
46	MP-İNCEK	81	\N	Hekim	330	f	2025-11-07 00:00:00	2026-06-01 00:00:00	Sona Erdi	Saatlik	\N	2026-04-24 08:05:01.524	2026-06-01 10:46:24.691
35	MP-KARADENIZ	42	\N	IGU	2480	f	2026-01-06 00:00:00	\N	Aktif	Saatlik	\N	2026-04-24 08:05:01.515	2026-06-01 10:26:21.058
55	VM-MP-FLORYA	51	\N	IGU	11700	t	2025-10-06 00:00:00	2026-04-01 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.533	2026-06-01 06:14:31.978
2	LIV-GAZIANTEP	11	\N	IGU	4240	f	2025-02-10 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.486	2026-06-01 07:31:18.29
36	MP-KARADENIZ	93	\N	Hekim	10500	f	2024-06-04 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.516	2026-06-01 10:25:48.284
45	MP-İNCEK	22	\N	IGU	640	f	2025-11-07 00:00:00	2026-06-01 00:00:00	Sona Erdi	Saatlik	\N	2026-04-24 08:05:01.523	2026-06-01 10:46:18.576
68	VM-MP-PENDIK	137	\N	DSP	11700	t	2022-12-01 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.544	2026-04-24 08:05:01.544
70	İSU-LIV-BAHCES	2	\N	IGU	11700	t	2026-01-16 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.545	2026-04-24 08:05:01.545
71	İSU-LIV-BAHCES	3	\N	IGU	11700	t	2026-01-16 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.546	2026-04-24 08:05:01.546
72	İSU-LIV-BAHCES	67	\N	Hekim	11700	t	2024-12-25 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.547	2026-04-24 08:05:01.547
74	İSU-LIV-BAHCES	107	\N	DSP	11700	t	2023-07-03 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.548	2026-04-24 08:05:01.548
75	İSU-MP-GAZIOSM	5	\N	IGU	11700	t	2022-11-30 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.549	2026-04-24 08:05:01.549
76	İSU-MP-GAZIOSM	6	\N	IGU	11700	t	2025-12-10 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.55	2026-04-24 08:05:01.55
77	İSU-MP-GAZIOSM	7	\N	IGU	11700	t	2025-01-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.55	2026-04-24 08:05:01.55
78	İSU-MP-GAZIOSM	70	\N	Hekim	11700	t	2022-12-02 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.552	2026-04-24 08:05:01.552
79	İSU-MP-GAZIOSM	71	\N	Hekim	870	f	2022-12-03 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.554	2026-04-24 08:05:01.554
80	İSU-MP-GAZIOSM	108	\N	DSP	11700	t	2025-06-27 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.555	2026-04-24 08:05:01.555
81	LIV-SAMSUN	12	\N	IGU	11700	t	2025-01-08 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.556	2026-04-24 08:05:01.556
82	LIV-SAMSUN	76	\N	Hekim	11700	t	2024-06-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.556	2026-04-24 08:05:01.556
83	LIV-VADI	16	\N	IGU	11700	t	2025-02-19 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.557	2026-04-24 08:05:01.557
84	LIV-VADI	17	\N	IGU	11700	t	2025-05-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.558	2026-04-24 08:05:01.558
86	LIV-VADI	78	\N	Hekim	9000	f	2024-05-25 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.559	2026-04-24 08:05:01.559
87	LIV-VADI	113	\N	DSP	11700	t	2025-06-11 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.56	2026-04-24 08:05:01.56
88	MLP-MERKEZ	141	\N	IGU	10600	f	2023-09-23 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.56	2026-04-24 08:05:01.56
90	MLP-VADI-OFIS	142	\N	Hekim	450	f	2025-10-03 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.562	2026-04-24 08:05:01.562
93	İSU-LIV-TOPKAP	4	\N	IGU	11700	t	2025-09-11 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.564	2026-04-24 08:05:01.564
95	İSU-TIP-FAKULT	147	\N	IGU	11700	t	2026-02-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.565	2026-04-24 08:05:01.565
96	İSU-TIP-FAKULT	149	\N	IGU	11700	t	2026-02-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.566	2026-04-24 08:05:01.566
97	İSU-TIP-FAKULT	148	\N	IGU	11700	t	2026-02-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.567	2026-04-24 08:05:01.567
98	MP-ANKARA	19	\N	IGU	11700	t	2025-11-18 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.567	2026-04-24 08:05:01.567
100	MP-ANKARA	80	\N	Hekim	8100	f	2023-09-18 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.569	2026-04-24 08:05:01.569
101	MP-ANKARA	115	\N	DSP	11700	t	2026-01-15 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.569	2026-04-24 08:05:01.569
102	MP-ANTALYA	23	\N	IGU	11700	t	2026-01-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.57	2026-04-24 08:05:01.57
104	MP-ANTALYA	83	\N	Hekim	11700	t	2023-05-31 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.572	2026-04-24 08:05:01.572
105	MP-ANTALYA	118	\N	DSP	11700	t	2022-11-19 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.573	2026-04-24 08:05:01.573
106	MP-GEBZE	30	\N	IGU	11700	t	2025-01-28 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.574	2026-04-24 08:05:01.574
107	MP-GEBZE	31	\N	IGU	11700	t	2025-01-03 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.575	2026-04-24 08:05:01.575
109	MP-GEBZE	121	\N	DSP	11700	t	2025-05-02 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.577	2026-04-24 08:05:01.577
111	MP-İSTANBUL-ON	105	\N	Hekim	11700	t	2026-01-10 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.579	2026-04-24 08:05:01.579
112	MP-İZMIR	35	\N	IGU	11700	t	2024-08-07 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.579	2026-04-24 08:05:01.579
115	MP-SEYHAN	38	\N	IGU	11700	t	2024-07-01 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.581	2026-04-24 08:05:01.581
116	MP-SEYHAN	90	\N	Hekim	5250	f	2023-04-07 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.582	2026-04-24 08:05:01.582
117	MP-SEYHAN	125	\N	DSP	11700	t	2024-07-19 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.583	2026-04-24 08:05:01.583
118	MP-TEM	39	\N	IGU	11700	t	2025-09-08 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.583	2026-04-24 08:05:01.583
120	MP-TEM	145	\N	DSP	11700	t	2026-01-28 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.585	2026-04-24 08:05:01.585
121	MP-TOKAT	40	\N	IGU	11700	t	2023-06-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.585	2026-04-24 08:05:01.585
122	MP-TOKAT	92	\N	Hekim	4260	f	2024-04-23 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.586	2026-04-24 08:05:01.586
123	MP-YILDIZLI	43	\N	IGU	11700	t	2022-12-01 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.587	2026-04-24 08:05:01.587
124	MP-YILDIZLI	94	\N	Hekim	4110	f	2025-05-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.587	2026-04-24 08:05:01.587
126	VM-MP-ANKARA	44	\N	IGU	11700	t	2025-04-22 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.589	2026-04-24 08:05:01.589
128	VM-MP-ANKARA	95	\N	Hekim	5490	f	2025-04-03 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.59	2026-04-24 08:05:01.59
129	VM-MP-ANKARA	128	\N	DSP	7320	f	2025-07-18 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.591	2026-04-24 08:05:01.591
130	VM-MP-FATIH	48	\N	IGU	11700	t	2024-01-11 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.591	2026-04-24 08:05:01.591
133	VM-MP-FATIH	130	\N	DSP	11700	t	2024-09-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.593	2026-04-24 08:05:01.593
134	VM-MP-FATIH	131	\N	DSP	11700	t	2025-06-27 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.594	2026-04-24 08:05:01.594
103	MP-ANTALYA	24	\N	IGU	11700	t	2026-01-06 00:00:00	2026-03-13 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.571	2026-04-27 07:17:42.876
108	MP-GEBZE	86	\N	Hekim	6600	f	2025-12-23 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.575	2026-06-01 07:46:47.277
94	İSU-LIV-TOPKAP	69	\N	Hekim	4230	f	2025-10-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.564	2026-06-01 07:58:29.031
91	MLP-İGA	144	\N	IGU	140	f	2024-03-26 00:00:00	2026-03-06 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.563	2026-04-27 08:37:11.127
92	İSTINYE-DENT	66	\N	IGU	840	f	2025-04-16 00:00:00	2026-03-12 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.563	2026-04-27 08:46:50.699
69	İSU-LIV-BAHCES	1	\N	IGU	11700	t	2026-01-15 00:00:00	2026-04-21 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.545	2026-04-27 09:01:40.688
114	MP-İZMIR	123	\N	DSP	3150	f	2025-11-05 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.581	2026-04-27 09:13:33.811
113	MP-İZMIR	88	\N	Hekim	3150	f	2024-07-18 00:00:00	\N	Aktif	Saatlik	\N	2026-04-24 08:05:01.58	2026-04-27 09:13:16.069
125	MP-YILDIZLI	127	\N	DSP	5920	f	2023-01-11 00:00:00	2026-05-19 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.588	2026-06-01 10:30:26.809
119	MP-TEM	69	\N	Hekim	4245	f	2025-09-08 00:00:00	\N	Aktif	Saatlik	\N	2026-04-24 08:05:01.584	2026-06-01 10:18:22.314
110	MP-İSTANBUL-ON	65	\N	IGU	9840	f	2026-01-05 00:00:00	\N	Aktif	Saatlik	\N	2026-04-24 08:05:01.578	2026-06-01 08:15:24.186
89	MLP-VADI-OFIS	144	\N	IGU	260	f	2025-02-04 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.561	2026-04-27 11:04:58.97
127	VM-MP-ANKARA	45	\N	IGU	4360	f	2025-04-22 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.589	2026-06-01 06:39:30.921
132	VM-MP-FATIH	97	\N	Hekim	4500	f	2025-10-07 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.593	2026-06-01 07:19:15.141
131	VM-MP-FATIH	139	\N	IGU	400	f	2026-01-29 00:00:00	2026-04-27 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.592	2026-06-01 07:19:51.931
85	LIV-VADI	138	\N	IGU	2880	f	2025-02-05 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.558	2026-06-01 10:35:42.896
135	VM-MP-KOCAELI	52	\N	IGU	11700	t	2026-01-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.595	2026-04-24 08:05:01.595
136	VM-MP-KOCAELI	53	\N	IGU	11700	t	2026-01-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.595	2026-04-24 08:05:01.595
137	VM-MP-KOCAELI	99	\N	Hekim	11700	t	2025-02-07 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.596	2026-04-24 08:05:01.596
138	VM-MP-KOCAELI	133	\N	DSP	11700	t	2022-12-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.597	2026-04-24 08:05:01.597
139	VM-MP-MALTEPE	54	\N	IGU	11700	t	2025-07-04 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.597	2026-04-24 08:05:01.597
141	VM-MP-MALTEPE	100	\N	Hekim	11700	t	2025-09-25 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.599	2026-04-24 08:05:01.599
143	VM-MP-MALTEPE	135	\N	DSP	11700	t	2025-07-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.6	2026-04-24 08:05:01.6
144	VM-MP-SAMSUN	62	\N	IGU	11700	t	2025-10-23 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.601	2026-04-24 08:05:01.601
145	VM-MP-SAMSUN	63	\N	IGU	11700	t	2022-11-29 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.602	2026-04-24 08:05:01.602
146	VM-MP-SAMSUN	64	\N	IGU	11700	t	2025-01-17 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.602	2026-04-24 08:05:01.602
147	VM-MP-SAMSUN	104	\N	Hekim	11700	t	2025-03-11 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.603	2026-04-24 08:05:01.603
18	MP-ADANA	79	\N	Hekim	11700	t	2026-01-05 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.501	2026-04-27 06:30:09.426
148	LIV-ANKARA	150	\N	Hekim	11700	t	2026-02-25 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 06:47:59.453	2026-04-27 06:47:59.453
99	MP-ANKARA	20	\N	IGU	7800	f	2025-11-18 00:00:00	2026-02-01 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.568	2026-04-27 07:00:47.813
150	MP-ANTALYA	152	\N	IGU	11700	t	2026-03-17 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 07:15:42.273	2026-04-27 07:15:42.273
151	MP-CANAKKALE	153	\N	Hekim	75	f	2026-01-27 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 07:40:10.773	2026-04-27 07:40:10.773
152	MLP-CAGRI-MERKE	154	\N	IGU	500	f	2026-03-06 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 07:49:24.552	2026-04-27 07:49:24.552
153	MLP-CAGRI-MERKE	142	\N	Hekim	385	f	2023-07-25 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 07:50:23.697	2026-04-27 07:50:23.697
154	GOP-DIYALIZ-MER	155	\N	IGU	1240	f	2026-04-27 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 07:58:30.574	2026-04-27 07:58:30.574
155	GOP-DIYALIZ-MER	73	\N	Hekim	660	f	2024-03-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 07:59:20.116	2026-04-27 07:59:20.116
157	LIV-GAZIANTEP	157	\N	IGU	11700	t	2026-04-27 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 08:21:06.137	2026-04-27 08:21:06.137
158	İSU-MP-GAZIOSM	158	\N	IGU	6000	f	2026-04-27 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 08:30:54.082	2026-04-27 08:30:54.082
159	MLP-İGA	159	\N	IGU	130	f	2026-03-06 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 08:36:04.477	2026-04-27 08:36:04.477
161	İSTINYE-DENT	155	\N	IGU	800	f	2026-04-14 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 08:46:11.207	2026-04-27 08:46:11.207
162	İSTINYE-DENT	103	\N	Hekim	400	f	2026-03-02 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 08:47:44.931	2026-04-27 08:47:44.931
73	İSU-LIV-BAHCES	68	\N	Hekim	1995	f	2024-11-07 00:00:00	2026-04-18 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.548	2026-04-27 09:00:07.767
163	İSU-TIP-FAKULT	73	\N	Hekim	10000	f	2023-07-26 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 09:05:02.457	2026-04-27 09:05:02.457
165	VM-MP-KOCAELI	158	\N	IGU	3960	f	2026-04-09 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 09:15:57.73	2026-04-27 09:15:57.73
140	VM-MP-MALTEPE	55	\N	IGU	8080	f	2025-07-22 00:00:00	\N	Aktif	Saatlik	\N	2026-04-24 08:05:01.598	2026-04-27 09:17:48.339
166	MLP-MERKEZ	143	\N	IGU	11700	t	2024-09-17 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 09:20:41.742	2026-04-27 09:20:41.742
167	MLP-MERKEZ	142	\N	Hekim	2350	f	2022-11-30 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 09:21:32.129	2026-04-27 09:21:32.129
168	MP-İSTANBUL-ON	161	\N	DSP	11700	t	2026-04-03 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 09:29:54.9	2026-04-27 09:29:54.9
169	VM-MP-SAMSUN	162	\N	IGU	11700	t	2026-04-11 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 10:29:34.51	2026-04-27 10:29:34.51
172	İSU-LIV-TOPKAP	165	\N	IGU	11700	t	2026-04-24 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 10:45:52.459	2026-04-27 10:45:52.459
174	MLP-KARADENIZ-I	167	\N	IGU	40	f	2026-02-02 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 10:50:40.856	2026-04-27 10:51:00.508
176	MLP-VADI-İDARI	144	\N	IGU	260	f	2026-04-27 00:00:00	2026-04-27 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-27 11:04:21.026	2026-04-27 11:04:33.007
149	MP-ANKARA	151	\N	IGU	8760	f	2026-04-27 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 06:59:24.585	2026-06-01 06:08:25.05
177	VM-MP-FLORYA	169	\N	IGU	11700	t	2026-04-08 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-01 06:15:57.461	2026-06-01 06:15:57.461
179	VM-MP-FATIH	170	\N	IGU	720	f	2026-05-08 00:00:00	2026-06-01 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-06-01 07:22:07.076	2026-06-01 07:22:26.649
160	MLP-İGA	160	\N	Hekim	65	f	2026-03-06 00:00:00	2026-05-08 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-27 08:36:57.858	2026-06-01 07:51:30.638
164	İSU-TIP-FAKULT	109	\N	DSP	11700	t	2023-02-06 00:00:00	2026-05-19 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-27 09:05:54.115	2026-06-01 07:56:25.588
173	İSU-LIV-TOPKAP	166	\N	DSP	5640	f	2026-02-10 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 10:47:44.882	2026-06-01 07:58:41.996
180	İSU-LIV-BAHCES	171	\N	IGU	11700	t	2026-05-13 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-01 08:02:24.013	2026-06-01 08:02:24.013
52	VM-MP-BURSA	129	\N	DSP	11700	t	2022-11-23 00:00:00	2026-05-19 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.531	2026-06-01 07:04:30.991
156	GOP-DIYALIZ-MER	156	\N	DSP	11700	t	2026-04-27 00:00:00	2026-05-19 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-27 08:01:32.095	2026-06-01 07:08:10.743
178	VM-MP-FATIH	170	\N	IGU	720	f	2026-05-08 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-01 07:22:02.426	2026-06-01 07:22:02.426
142	VM-MP-MALTEPE	134	\N	DSP	11700	t	2023-08-23 00:00:00	2026-05-19 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.599	2026-06-01 08:11:16.276
181	VM-MP-PENDIK	172	\N	IGU	440	f	2026-05-15 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-01 08:21:50.476	2026-06-01 08:21:50.476
170	MP-SEYHAN	163	\N	IGU	3800	f	2026-03-05 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 10:32:51.807	2026-06-01 09:21:44.124
171	MP-TEM	164	\N	IGU	1320	f	2026-02-13 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 10:37:55.847	2026-06-01 09:23:32.035
182	MP-TOKAT	173	\N	DSP	11700	t	2026-05-22 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-01 10:21:16.352	2026-06-01 10:21:16.352
183	MLP-KARADENIZ-I	93	\N	Hekim	100	f	2026-05-14 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-01 10:26:47.234	2026-06-01 10:26:47.234
184	MP-YILDIZLI	127	\N	DSP	5920	f	2026-05-10 00:00:00	2026-06-01 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-06-01 11:24:51.108	2026-06-01 11:29:24.346
185	MP-YILDIZLI	127	\N	DSP	5290	f	2026-05-19 00:00:00	2026-06-01 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-06-01 11:29:44.585	2026-06-01 11:50:35.732
186	MP-YILDIZLI	127	\N	DSP	5290	f	2026-05-19 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-01 11:50:57.949	2026-06-01 11:50:57.949
187	MP-YILDIZLI	168	\N	IGU	3000	f	2026-06-01 00:00:00	2026-06-01 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-06-01 11:52:33.805	2026-06-01 11:52:52.685
175	MP-YILDIZLI	168	\N	IGU	3000	f	2026-02-20 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 10:56:48.624	2026-06-01 11:51:55.113
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."Category" (id, name, "createdAt", "updatedAt") FROM stdin;
1	Acil Durum Yönetimi	2026-04-24 21:01:25.586	2026-04-24 21:01:25.586
2	Alt Yapı Sistemleri	2026-04-24 21:02:01.65	2026-04-24 21:02:01.65
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."Department" (id, name, "createdAt", "updatedAt") FROM stdin;
1	Üst Yönetim	2026-04-24 20:17:15.883	2026-04-24 20:17:15.883
2	Teknik Hizmetler Müdürlüğü	2026-04-24 21:02:31.616	2026-04-24 21:02:31.616
3	İdari İşler ve Otelcilik Hizmetleri Müdürlüğü	2026-04-24 21:02:49.671	2026-04-24 21:02:49.671
\.


--
-- Data for Name: EmergencyCode; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."EmergencyCode" (id, name, "createdAt", "updatedAt") FROM stdin;
1	Kırmızı Kod	2026-04-25 20:51:02.551	2026-04-25 20:51:02.551
2	Turuncu Kod	2026-04-25 20:51:09.976	2026-04-25 20:51:09.976
3	Pembe Kod	2026-04-25 20:51:18.606	2026-04-25 20:51:18.606
4	Gri Kod	2026-04-25 20:51:24.508	2026-04-25 20:51:24.508
5	Siyah Kod	2026-04-25 20:51:33.607	2026-04-25 20:51:33.607
6	Mor Kod	2026-04-25 20:51:44.159	2026-04-25 20:51:44.159
7	Sarı Kod	2026-04-25 20:51:53.235	2026-04-25 20:51:53.235
8	Turkuaz Kod	2026-04-25 20:51:59.906	2026-04-25 20:51:59.906
9	Beyaz Kod	2026-04-25 20:52:05.704	2026-04-25 20:52:05.704
10	Mavi Kod	2026-04-25 20:52:13.342	2026-04-25 20:52:13.342
11	Kırmızı Kod (Yangın)	2026-04-25 20:53:22.159	2026-04-25 20:53:22.159
12	Mavi Kod (Resüsitasyon)	2026-04-25 20:53:22.17	2026-04-25 20:53:22.17
13	Pembe Kod (Bebek/Çocuk Kaçırma)	2026-04-25 20:53:22.175	2026-04-25 20:53:22.175
14	Beyaz Kod (Şiddet)	2026-04-25 20:53:22.181	2026-04-25 20:53:22.181
15	Sarı Kod (Tahliye)	2026-04-25 20:53:22.185	2026-04-25 20:53:22.185
16	Turuncu Kod (Kimyasal Sızıntı)	2026-04-25 20:53:22.19	2026-04-25 20:53:22.19
\.


--
-- Data for Name: EmployeeCountHistory; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."EmployeeCountHistory" (id, "facilityId", count, "effectiveDate", "createdAt") FROM stdin;
1	MP-ADANA	347	2026-04-24 00:00:00	2026-04-27 06:32:38.296
2	LIV-ANKARA	472	2026-04-24 00:00:00	2026-04-27 06:51:41.197
3	VM-MP-ANKARA	366	2026-04-24 00:00:00	2026-04-27 07:04:10.352
4	MP-ANTALYA	707	2026-04-24 00:00:00	2026-04-27 07:18:18.005
5	MLP-AR-GE	93	2026-04-24 00:00:00	2026-04-27 07:27:22.013
6	MP-ATASEHIR	197	2026-04-24 00:00:00	2026-04-27 07:28:53.552
7	MP-BAHCELIEVLER	750	2026-04-24 00:00:00	2026-04-27 07:30:03.63
8	VM-MP-BURSA	515	2026-04-24 00:00:00	2026-04-27 07:33:03.986
9	MLP-CAGRI-MERKE	52	2026-04-24 00:00:00	2026-04-27 07:46:02.424
10	GOP-DIYALIZ-MER	62	2026-04-24 00:00:00	2026-04-27 07:57:07.597
11	VM-MP-FATIH	265	2026-04-24 00:00:00	2026-04-27 08:04:24.805
12	VM-MP-FLORYA	573	2026-04-24 00:00:00	2026-04-27 08:15:53.118
13	LIV-GAZIANTEP	363	2026-04-24 00:00:00	2026-04-27 08:22:29.438
14	LIV-GAZIANTEP	363	2026-04-24 00:00:00	2026-04-27 08:23:47.277
15	MP-GEBZE	433	2026-04-24 00:00:00	2026-04-27 08:25:34.932
16	İSU-MP-GAZIOSM	573	2026-04-24 00:00:00	2026-04-27 08:29:02.489
17	MP-GOZTEPE	704	2026-04-24 00:00:00	2026-04-27 08:33:04.379
18	MP-İNCEK	35	2026-04-24 00:00:00	2026-04-27 08:38:21.196
19	İSTINYE-DENT	40	2026-04-24 00:00:00	2026-04-27 08:45:24.975
20	İSU-LIV-BAHCES	738	2026-04-24 00:00:00	2026-04-27 08:58:50.703
21	İSU-TIP-FAKULT	679	2026-04-24 00:00:00	2026-04-27 09:03:33.831
22	MP-İZMIR	205	2026-04-24 00:00:00	2026-04-27 09:11:03.967
23	VM-MP-KOCAELI	594	2026-04-24 00:00:00	2026-04-27 09:14:48.895
24	VM-MP-MALTEPE	448	2026-04-24 00:00:00	2026-04-27 09:17:21.055
25	MLP-MERKEZ	415	2026-04-24 00:00:00	2026-04-27 09:19:45.757
26	VM-MP-MERSIN	477	2026-04-24 00:00:00	2026-04-27 09:24:55.423
27	MP-İSTANBUL-ON	238	2026-04-24 00:00:00	2026-04-27 09:28:06.838
28	MP-ORDU	353	2026-04-24 00:00:00	2026-04-27 09:30:35.514
29	VM-MP-PENDIK	775	2026-04-24 00:00:00	2026-04-27 09:32:09.836
30	LIV-SAMSUN	222	2026-04-24 00:00:00	2026-04-27 09:35:18.325
31	VM-MP-SAMSUN	726	2026-04-24 00:00:00	2026-04-27 10:27:43.29
32	MP-SEYHAN	349	2026-04-24 00:00:00	2026-04-27 10:30:48.849
33	MP-TEM	280	2026-04-24 00:00:00	2026-04-27 10:36:09.274
34	İSU-LIV-TOPKAP	278	2026-04-24 00:00:00	2026-04-27 10:44:31.866
35	MP-KARADENIZ	311	2026-04-24 00:00:00	2026-04-27 10:53:24.114
36	MP-YILDIZLI	264	2026-04-24 00:00:00	2026-04-27 10:55:41.297
37	LIV-ULUS	652	2026-04-24 00:00:00	2026-04-27 10:58:21.03
38	LIV-VADI	572	2026-04-24 00:00:00	2026-04-27 11:01:17.969
39	MP-ANKARA	469	2026-05-23 00:00:00	2026-06-01 05:54:04.678
40	VM-MP-FLORYA	553	2026-05-23 00:00:00	2026-06-01 06:11:33.302
41	MP-ADANA	343	2026-05-23 00:00:00	2026-06-01 06:25:42.034
42	LIV-ANKARA	474	2026-05-23 00:00:00	2026-06-01 06:27:37.049
43	GOP-DIYALIZ-MER	62	2026-05-23 00:00:00	2026-06-01 06:59:09.595
44	İSTINYE-DENT	44	2026-05-23 00:00:00	2026-06-01 06:59:09.595
45	İSU-LIV-BAHCES	731	2026-05-23 00:00:00	2026-06-01 06:59:09.595
46	İSU-LIV-TOPKAP	282	2026-05-23 00:00:00	2026-06-01 06:59:09.595
47	İSU-MP-GAZIOSM	559	2026-05-23 00:00:00	2026-06-01 06:59:09.595
48	İSU-TIP-FAKULT	697	2026-05-23 00:00:00	2026-06-01 06:59:09.595
49	LIV-ANKARA	474	2026-05-23 00:00:00	2026-06-01 06:59:09.595
50	LIV-GAZIANTEP	356	2026-05-23 00:00:00	2026-06-01 06:59:09.595
51	LIV-SAMSUN	224	2026-05-23 00:00:00	2026-06-01 06:59:09.595
52	LIV-ULUS	655	2026-05-23 00:00:00	2026-06-01 06:59:09.595
53	LIV-VADI	577	2026-05-23 00:00:00	2026-06-01 06:59:09.595
54	MLP-ANKARA-DEPO	1	2026-05-23 00:00:00	2026-06-01 06:59:09.595
55	MLP-ANTALYA-KON	1	2026-05-23 00:00:00	2026-06-01 06:59:09.595
56	MLP-AR-GE	95	2026-05-23 00:00:00	2026-06-01 06:59:09.595
57	MLP-CAGRI-MERKE	50	2026-05-23 00:00:00	2026-06-01 06:59:09.595
58	MLP-İGA	13	2026-05-23 00:00:00	2026-06-01 06:59:09.595
59	MLP-KARADENIZ-I	2	2026-05-23 00:00:00	2026-06-01 06:59:09.595
60	MLP-MERKEZ	420	2026-05-23 00:00:00	2026-06-01 06:59:09.595
61	MLP-MERKEZ-DEPO	4	2026-05-23 00:00:00	2026-06-01 06:59:09.595
62	MLP-SAMSUN-LIV-	4	2026-05-23 00:00:00	2026-06-01 06:59:09.595
63	MLP-VADI-İDARI	0	2026-05-23 00:00:00	2026-06-01 06:59:09.595
64	MLP-VADI-OFIS	26	2026-05-23 00:00:00	2026-06-01 06:59:09.595
65	MP-ADANA	343	2026-05-23 00:00:00	2026-06-01 06:59:09.595
66	MP-ANKARA	469	2026-05-23 00:00:00	2026-06-01 06:59:09.595
67	MP-ANTALYA	707	2026-05-23 00:00:00	2026-06-01 06:59:09.595
68	MP-ATASEHIR	200	2026-05-23 00:00:00	2026-06-01 06:59:09.595
69	MP-BAHCELIEVLER	741	2026-05-23 00:00:00	2026-06-01 06:59:09.595
70	MP-CANAKKALE	5	2026-05-23 00:00:00	2026-06-01 06:59:09.595
71	MP-GEBZE	441	2026-05-23 00:00:00	2026-06-01 06:59:09.595
72	MP-GOZTEPE	706	2026-05-23 00:00:00	2026-06-01 06:59:09.595
73	MP-İNCEK	16	2026-05-23 00:00:00	2026-06-01 06:59:09.595
74	MP-İSTANBUL-ON	246	2026-05-23 00:00:00	2026-06-01 06:59:09.595
75	MP-İZMIR	208	2026-05-23 00:00:00	2026-06-01 06:59:09.595
76	MP-KARADENIZ	307	2026-05-23 00:00:00	2026-06-01 06:59:09.595
77	MP-ORDU	346	2026-05-23 00:00:00	2026-06-01 06:59:09.595
78	MP-SEYHAN	345	2026-05-23 00:00:00	2026-06-01 06:59:09.595
79	MP-TEM	283	2026-05-23 00:00:00	2026-06-01 06:59:09.595
80	MP-TOKAT	248	2026-05-23 00:00:00	2026-06-01 06:59:09.595
81	MP-YILDIZLI	261	2026-05-23 00:00:00	2026-06-01 06:59:09.595
82	VM-MP-ANKARA	359	2026-05-23 00:00:00	2026-06-01 06:59:09.595
83	VM-MP-BURSA	506	2026-05-23 00:00:00	2026-06-01 06:59:09.595
84	VM-MP-FATIH	266	2026-05-23 00:00:00	2026-06-01 06:59:09.595
85	VM-MP-FLORYA	553	2026-05-23 00:00:00	2026-06-01 06:59:09.595
86	VM-MP-KOCAELI	591	2026-05-23 00:00:00	2026-06-01 06:59:09.595
87	VM-MP-MALTEPE	459	2026-05-23 00:00:00	2026-06-01 06:59:09.595
88	VM-MP-MERSIN	469	2026-05-23 00:00:00	2026-06-01 06:59:09.595
89	VM-MP-PENDIK	759	2026-05-23 00:00:00	2026-06-01 06:59:09.595
90	VM-MP-SAMSUN	726	2026-05-23 00:00:00	2026-06-01 06:59:09.595
\.


--
-- Data for Name: EmployerRepresentative; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."EmployerRepresentative" (id, "fullName", title, phone, email, "isActive", "createdAt", "updatedAt", username) FROM stdin;
\.


--
-- Data for Name: ExtraordinaryIncident; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."ExtraordinaryIncident" (id, "facilityId", "categoryId", "rootCauseId", "departmentId", "locationDetail", "incidentDate", "interventionRequired", "interventionTime", "controlTime", "supportReceived", "supportUnitId", "announcementMade", "emergencyCodeId", "serviceInterrupted", "interruptionDuration", "evacuatedStaffCount", "evacuatedPatientCount", "injuredCount", "deceasedCount", summary, "causeDetail", "detectedEffect", observations, "actionsTaken", "resultEvaluation", "createdBy", "createdAt", "updatedAt", attachments) FROM stdin;
1	LIV-GAZIANTEP	5	9	2	Jeneratör Alanı"	2026-04-15 18:10:00	t	2026-04-15 18:20:00	2026-04-15 18:30:00	t	1	f	\N	f	0	0	0	0	0	Deneme Deneme 	Deneme Deneme Deneme Deneme 	Deneme Deneme Deneme Deneme Deneme Deneme Deneme Deneme 	Deneme Deneme Deneme Deneme Deneme Deneme Deneme Deneme Deneme Deneme Deneme Deneme 	Deneme Deneme Deneme Deneme Deneme Deneme Deneme Deneme 	Deneme Deneme Deneme Deneme Deneme Deneme 	metin.salik	2026-04-25 20:56:00.573	2026-04-25 20:56:00.573	\N
\.


--
-- Data for Name: Facility; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."Facility" (id, name, "isActive", "createdAt", "updatedAt", city, "commercialTitle", "dangerClass", district, email, "employeeCount", "fullAddress", "naceCode", phone, "sgkNumber", "shortName", "taxNumber", "taxOffice", type, website) FROM stdin;
GOP-DIYALIZ-MER	GOP Diyaliz Merkezi	t	2026-04-24 08:05:01.46	2026-06-01 06:59:09.595	İstanbul	Bileşim Turizm İnşaat San. ve Tic. A.S Özel Gaziosmanpaşa Diyaliz Merkezi Şubesi	Tehlikeli	İstanbul	\N	62	Yenidoğan Mah.Erka Balata Sk. No:6C	\N	\N	286220606108001203425-76/000	\N	\N	\N	Tıp Merkezi	\N
İSTINYE-DENT	İstinye Dent	t	2026-04-24 08:05:01.465	2026-06-01 06:59:09.595	İstanbul		Tehlikeli	İstanbul	\N	44	Ayazağa, Defne Sk. No:1 D:34408,	\N	\N	\N	\N	\N	\N	Hastane	\N
İSU-LIV-BAHCES	İSÜ Liv Bahçeşehir	t	2026-04-24 08:05:01.479	2026-06-01 06:59:09.595	İstanbul	İstinye Üniversitesi	Çok Tehlikeli	İstanbul	\N	731	Aşık Veysel, Süleyman Demirel Cd. No:1, 34517	\N	\N	\N	\N	\N	\N	Hastane	\N
İSU-LIV-TOPKAP	İSÜ Liv Topkapı	t	2026-04-24 08:05:01.479	2026-06-01 06:59:09.595	İstanbul	İstinye Üniversitesi	Çok Tehlikeli	İstanbul	\N	282	Maltepe Mah Edirne Çırpıcı Yolu Sk. No:9, 34010	\N	\N	\N	\N	\N	\N	Hastane	\N
İSU-MP-GAZIOSM	İSÜ MP Gaziosmanpaşa	t	2026-04-24 08:05:01.478	2026-06-01 06:59:09.595	İstanbul	İstinye Üniversitesi	Çok Tehlikeli	İstanbul	\N	559	Merkez, Çukurçeşme Cd. No:57 D:59, 34250	\N	\N	\N	\N	\N	\N	Hastane	\N
İSU-TIP-FAKULT	İSÜ Tıp Fakültesi	t	2026-04-24 08:05:01.478	2026-06-01 06:59:09.595	İstanbul	İstinye Üniversitesi	Çok Tehlikeli	İstanbul	\N	697	Merkez, Çukurçeşme Cd. No:51, 34245	\N	\N	\N	\N	\N	\N	Hastane	\N
LIV-ANKARA	Liv Ankara	t	2026-04-24 08:05:01.478	2026-06-01 06:59:09.595	Ankara	MS Sağlık Hizmetleri Ticaret Anonim Şirketi	Çok Tehlikeli	Ankara	\N	474	Kavaklıdere, Bestekar Sok. No:8 06680	\N	\N	\N	\N	\N	\N	Hastane	\N
LIV-GAZIANTEP	Liv Gaziantep	t	2026-04-24 08:05:01.477	2026-06-01 06:59:09.595	Gaziantep	MLP Gaziantep Sağlık Hizmetleri Anonim Şirketi	Çok Tehlikeli	Gaziantep	\N	356	Seyrantepe, Abdulkadir Konukoğlu Cd No:1 27080	\N	\N	\N	\N	\N	\N	Hastane	\N
LIV-SAMSUN	Liv Samsun	t	2026-04-24 08:05:01.477	2026-06-01 06:59:09.595	Samsun	Samsun Medikal Grup Özel Sağlık Hizm. A.Ş.	Çok Tehlikeli	Samsun	\N	224	Hançerli, Fatih Sultan Mehmet Cd No:155 55020	\N	\N	\N	\N	\N	\N	Hastane	\N
LIV-ULUS	Liv Ulus	t	2026-04-24 08:05:01.476	2026-06-01 06:59:09.595	İstanbul	MLP Sağlık Hizmetleri Anonim Şirketi	Çok Tehlikeli	İstanbul	\N	655	Ahmet Adnan Saygun Cad. Canan Sok. No:5 34340	\N	\N	\N	\N	\N	\N	Hastane	\N
LIV-VADI	Liv Vadi	t	2026-04-24 08:05:01.476	2026-06-01 06:59:09.595	İstanbul	Samsun Medikal Grup Özel Sağlık Hizm. A.Ş.	Çok Tehlikeli	İstanbul	\N	577	Ayazağa Mahallesi, Kemerburgaz Caddesi, Vadistanbul Park Etabı, 7F Blok 34396	\N	\N	\N	\N	\N	\N	Hastane	\N
MLP-ANKARA-DEPO	MLP Ankara Depo	t	2026-04-24 08:05:01.461	2026-06-01 06:59:09.595	Ankara		Tehlikeli	Ankara	\N	1	Çamlıca Mh.Bağdat Cad. Dış Kapı No:83 İç Kapı No:17	\N	\N	\N	\N	\N	\N	Depo	\N
MLP-ANTALYA-KON	MLP Antalya Konuk Evi	t	2026-04-24 08:05:01.458	2026-06-01 06:59:09.595	Antalya	28610010115235780072046-152	Az Tehlikeli	Antalya	\N	1	Güzeloba Mah. 2157 Sk. Dış Kapı No:11	\N	\N	\N	\N	\N	\N	Ofis	\N
MLP-AR-GE	MLP AR-GE	t	2026-04-24 08:05:01.464	2026-06-01 06:59:09.595			Az Tehlikeli		\N	95		\N	\N	\N	\N	\N	\N	Ofis	\N
MLP-CAGRI-MERKE	MLP Çağrı Merkezi	t	2026-04-24 08:05:01.463	2026-06-01 06:59:09.595			Az Tehlikeli		\N	50		\N	\N	\N	\N	\N	\N	Çağrı Merkezi	\N
MLP-İGA	MLP İGA	t	2026-04-24 08:05:01.461	2026-06-01 06:59:09.595			Az Tehlikeli		\N	13		\N	\N	\N	\N	\N	\N	Ofis	\N
MLP-KARADENIZ-I	MLP Karadeniz İdari	t	2026-04-24 08:05:01.459	2026-06-01 06:59:09.595			Az Tehlikeli		\N	2		\N	\N	\N	\N	\N	\N	Ofis	\N
MLP-MERKEZ	MLP Merkez	t	2026-04-24 08:05:01.464	2026-06-01 06:59:09.595			Az Tehlikeli		\N	420		\N	\N	\N	\N	\N	\N	Ofis	\N
MLP-MERKEZ-DEPO	MLP Merkez Depo	t	2026-04-24 08:05:01.462	2026-06-01 06:59:09.595			Tehlikeli		\N	4		\N	\N	\N	\N	\N	\N	Depo	\N
MLP-SAMSUN-LIV-	MLP Samsun Liv İdari	t	2026-04-24 08:05:01.46	2026-06-01 06:59:09.595	Samsun	Hançerli Mah. Dervişzade Sk. Dış Kapı No:6 İç Kapı No:13	Çok Tehlikeli	Samsun	\N	4	Hançerli Mah. Dervişzade Sk. Dış Kapı No:6 İç Kapı No:13	\N	\N	28610010111679150551844-000	\N	\N	\N	Ofis	\N
MLP-VADI-OFIS	MLP Vadi Ofis	t	2026-04-24 08:05:01.463	2026-06-01 06:59:09.595			Az Tehlikeli		\N	26		\N	\N	\N	\N	\N	\N	Ofis	\N
MP-ADANA	MP Adana	t	2026-04-24 08:05:01.476	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	343		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-ANKARA	MP Ankara	t	2026-04-24 08:05:01.475	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	469		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-ANTALYA	MP Antalya	t	2026-04-24 08:05:01.474	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	707		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-ATASEHIR	MP Ataşehir	t	2026-04-24 08:05:01.474	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	200		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-BAHCELIEVLER	MP Bahçelievler	t	2026-04-24 08:05:01.474	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	741		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-CANAKKALE	MP Çanakkale	t	2026-04-24 08:05:01.473	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	5		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-GEBZE	MP Gebze	t	2026-04-24 08:05:01.473	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	441		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-GOZTEPE	MP Göztepe	t	2026-04-24 08:05:01.472	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	706		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-İSTANBUL-ON	MP İstanbul Onkoloji	t	2026-04-24 08:05:01.465	2026-06-01 06:59:09.595	İstanbul	MLP Sağlık Hizmetleri Anonim Şirketi	Çok Tehlikeli	İstanbul	\N	246	Cevizli, Talatpaşa Cd. B Blok No:75/0	\N	\N	\N	\N	\N	\N	Hastane	\N
MP-İZMIR	MP İzmir	t	2026-04-24 08:05:01.472	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	208		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-KARADENIZ	MP Karadeniz	t	2026-04-24 08:05:01.47	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	307		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-ORDU	MP Ordu	t	2026-04-24 08:05:01.472	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	346		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-SEYHAN	MP Seyhan	t	2026-04-24 08:05:01.471	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	345		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-TEM	MP Tem	t	2026-04-24 08:05:01.471	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	283		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-TOKAT	MP Tokat	t	2026-04-24 08:05:01.47	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	248		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-YILDIZLI	MP Yıldızlı	t	2026-04-24 08:05:01.47	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	261		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-ANKARA	VM MP Ankara	t	2026-04-24 08:05:01.469	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	359		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-BURSA	VM MP Bursa	t	2026-04-24 08:05:01.469	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	506		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-FATIH	VM MP Fatih	t	2026-04-24 08:05:01.468	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	266		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-FLORYA	VM MP Florya	t	2026-04-24 08:05:01.468	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	553		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-KOCAELI	VM MP Kocaeli	t	2026-04-24 08:05:01.467	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	591		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-MALTEPE	VM MP Maltepe	t	2026-04-24 08:05:01.467	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	459		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-MERSIN	VM MP Mersin	t	2026-04-24 08:05:01.466	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	469		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-PENDIK	VM MP Pendik	t	2026-04-24 08:05:01.466	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	759		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-SAMSUN	VM MP Samsun	t	2026-04-24 08:05:01.465	2026-06-01 06:59:09.595			Çok Tehlikeli		\N	726		\N	\N	\N	\N	\N	\N	Hastane	\N
MLP-VADI-İDARI	MLP Vadi İdari	f	2026-04-24 08:05:01.463	2026-06-01 10:44:41.19			Az Tehlikeli		\N	0		\N	\N	\N	\N	\N	\N	Ofis	\N
MP-İNCEK	MP İncek	f	2026-04-24 08:05:01.475	2026-06-01 10:46:44.7			Çok Tehlikeli		\N	0		\N	\N	\N	\N	\N	\N	Hastane	\N
\.


--
-- Data for Name: FacilityBuilding; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."FacilityBuilding" (id, "facilityId", name, "createdAt", "updatedAt", "bedCapacity", "buildingFloors", "buildingHeight", "closedArea", "constructionYear", "gardenArea", "parkingArea", "structureFloors", "structureHeight") FROM stdin;
\.


--
-- Data for Name: IncidentCategory; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."IncidentCategory" (id, name, "createdAt", "updatedAt") FROM stdin;
2	Deprem	2026-04-25 20:46:34.294	2026-04-25 20:46:34.294
3	Elektrik Kesintisi (Uzun Süreli)	2026-04-25 20:46:43.59	2026-04-25 20:46:43.59
4	Hastane Çevresinde olan olaylar	2026-04-25 20:46:51.336	2026-04-25 20:46:51.336
5	Asansör Arızası	2026-04-25 20:47:06.444	2026-04-25 20:47:06.444
6	Hırsızlık	2026-04-25 20:47:13.789	2026-04-25 20:47:13.789
7	İnşaat/Renovasyon Kaynaklı Olaylar	2026-04-25 20:47:21.554	2026-04-25 20:47:21.554
8	İntihar	2026-04-25 20:47:29.163	2026-04-25 20:47:29.163
9	Kavga/Şiddet	2026-04-25 20:47:36.065	2026-04-25 20:47:36.065
10	Tehlikeli Madde Yayılımı	2026-04-25 20:47:43.163	2026-04-25 20:47:43.163
11	Medikal Gaz Kesintisi	2026-04-25 20:47:49.448	2026-04-25 20:47:49.448
12	Pandemi	2026-04-25 20:47:55.059	2026-04-25 20:47:55.059
13	Patlama	2026-04-25 20:48:01.347	2026-04-25 20:48:01.347
14	Sabotaj	2026-04-25 20:48:07.012	2026-04-25 20:48:07.012
15	Sel/Su Baskını	2026-04-25 20:48:13.669	2026-04-25 20:48:13.669
16	Silahlı Saldırı	2026-04-25 20:48:24.041	2026-04-25 20:48:24.041
17	Yangın	2026-04-25 20:48:30.179	2026-04-25 20:48:30.179
18	Yapısal Unsurlara Dair Olaylar	2026-04-25 20:48:36.731	2026-04-25 20:48:36.731
19	Diğer	2026-04-25 20:48:40.749	2026-04-25 20:48:40.749
\.


--
-- Data for Name: IncidentRootCause; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."IncidentRootCause" (id, name, "createdAt", "updatedAt") FROM stdin;
1	Yapısal / İnşai Nedenler	2026-04-25 20:48:49.962	2026-04-25 20:48:49.962
2	Farkındalık Eksikliği	2026-04-25 20:48:56.735	2026-04-25 20:48:56.735
3	Mekanik Ekipman Kaynaklı Nedenler	2026-04-25 20:49:03.143	2026-04-25 20:49:03.143
4	Elektronik/Elektromekanik Ekipman Kaynaklı Nedenler	2026-04-25 20:49:10.432	2026-04-25 20:49:10.432
5	Sigara	2026-04-25 20:49:18.881	2026-04-25 20:49:18.881
6	Medikal Cihaz Arızası	2026-04-25 20:49:26.034	2026-04-25 20:49:26.034
7	Personel Eksikliği	2026-04-25 20:49:33.294	2026-04-25 20:49:33.294
8	Elektrikli el aletleri	2026-04-25 20:49:41.758	2026-04-25 20:49:41.758
9	Doğal Afet	2026-04-25 20:49:48.667	2026-04-25 20:49:48.667
10	Gaz Kaçağı	2026-04-25 20:49:55.892	2026-04-25 20:49:55.892
11	Diğer	2026-04-25 20:50:01.362	2026-04-25 20:50:01.362
\.


--
-- Data for Name: IncidentSupportUnit; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."IncidentSupportUnit" (id, name, "createdAt", "updatedAt") FROM stdin;
1	İç destek	2026-04-25 20:50:14.847	2026-04-25 20:50:14.847
2	İtfaiye	2026-04-25 20:50:21.861	2026-04-25 20:50:21.861
3	Polis	2026-04-25 20:50:29.15	2026-04-25 20:50:29.15
4	AFAD	2026-04-25 20:50:35.754	2026-04-25 20:50:35.754
5	Belediye	2026-04-25 20:50:42.623	2026-04-25 20:50:42.623
6	TENMAK	2026-04-25 20:50:50.446	2026-04-25 20:50:50.446
7	Diğer	2026-04-25 20:50:55.195	2026-04-25 20:50:55.195
\.


--
-- Data for Name: MonthlyAccidentData; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."MonthlyAccidentData" (id, "facilityId", month, "mainEmployerData", "subContractorData", "internData", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MonthlyHRData; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."MonthlyHRData" (id, "facilityId", month, "mainEmployerData", "subContractorData", "createdBy", "createdAt", "updatedAt") FROM stdin;
2	GOP-DIYALIZ-MER	2026-01	{"gender": {"male": 76, "female": 146}, "workHours": 43290, "newJoiners": 45, "deptChangers": 0, "totalWorkers": 222, "specialPolicy": {"chronic": 0, "interns": 0, "disabled": 6, "pregnant": 1}}	{"gender": {"male": 47, "female": 44}, "workHours": 17745, "newJoiners": 0, "deptChangers": 0, "totalWorkers": 91, "specialPolicy": {"chronic": 0, "interns": 0, "disabled": 6, "pregnant": 0}}	metin.salik	2026-04-24 20:49:34.54	2026-04-24 20:49:34.54
3	İSU-LIV-TOPKAP	2026-01	{"gender": {"male": 76, "female": 146}, "workHours": 43290, "newJoiners": 45, "deptChangers": 0, "totalWorkers": 222, "specialPolicy": {"chronic": 0, "interns": 0, "disabled": 6, "pregnant": 1}}	{"gender": {"male": 47, "female": 44}, "workHours": 17745, "newJoiners": 0, "deptChangers": 0, "totalWorkers": 91, "specialPolicy": {"chronic": 0, "interns": 0, "disabled": 6, "pregnant": 0}}	metin.salik	2026-04-24 20:50:55.326	2026-04-24 20:50:55.326
4	MLP-MERKEZ	2026-04	{"gender": {"male": 200, "female": 250}, "workHours": 87750, "newJoiners": 50, "deptChangers": 5, "totalWorkers": 450, "specialPolicy": {"chronic": 0, "interns": 0, "disabled": 15, "pregnant": 5}}	{"gender": {"male": 26, "female": 174}, "workHours": 39000, "newJoiners": 15, "deptChangers": 3, "totalWorkers": 200, "specialPolicy": {"chronic": 0, "interns": 0, "disabled": 9, "pregnant": 5}}	murat.bakal	2026-04-24 20:53:17.541	2026-04-24 20:53:17.541
5	MLP-MERKEZ	2026-01	{"gender": {"male": 0, "female": 0}, "workHours": 0, "newJoiners": 0, "deptChangers": 0, "totalWorkers": 0, "specialPolicy": {"chronic": 0, "interns": 0, "disabled": 0, "pregnant": 0}}	{"gender": {"male": 0, "female": 0}, "workHours": 0, "newJoiners": 0, "deptChangers": 0, "totalWorkers": 0, "specialPolicy": {"chronic": 0, "interns": 0, "disabled": 0, "pregnant": 0}}	murat.bakal	2026-04-24 20:59:11.714	2026-04-24 20:59:11.714
1	GOP-DIYALIZ-MER	2026-04	{"gender": {"male": 60, "female": 40}, "workHours": 19500, "newJoiners": 56, "deptChangers": 2, "totalWorkers": 100, "specialPolicy": {"chronic": 3, "interns": 4, "disabled": 2, "pregnant": 1}}	{"gender": {"male": 30, "female": 20}, "workHours": 9750, "newJoiners": 0, "deptChangers": 0, "totalWorkers": 50, "specialPolicy": {"chronic": 1, "interns": 2, "disabled": 1, "pregnant": 0}}	admin	2026-04-24 20:44:31.845	2026-04-24 20:59:41.235
\.


--
-- Data for Name: NotebookItem; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."NotebookItem" (id, "pageId", "authorType", "authorName", content, "categoryId", "subCategoryId", "departmentId", "createdAt", "updatedAt") FROM stdin;
3	1	UZMAN	Metin Salık	Deneme	1	\N	2	2026-04-25 19:40:26.361	2026-04-25 19:40:26.361
4	1	UZMAN	Metin Salık	Deneme 2	2	\N	3	2026-04-25 19:40:26.361	2026-04-25 19:40:26.361
5	2	DOKTOR		Deneme 1	2	3	3	2026-04-25 19:54:58.319	2026-04-25 19:54:58.319
8	3	UZMAN	Hüseyin Kağan UYSAL	Deneme 111	1	2	1	2026-04-25 20:13:34.038	2026-04-25 20:13:34.038
9	3	UZMAN	Hüseyin Kağan UYSAL	Deneme 2222	2	4	2	2026-04-25 20:13:34.038	2026-04-25 20:13:34.038
12	4	UZMAN	Murat BAKAL	Acil Durum Ekiplerinin yeniden düzenlemesi ve gerekli olan eğitimlerin planlanması sağlanmaldır.	1	2	2	2026-04-25 20:21:27.188	2026-04-25 20:21:27.188
13	4	UZMAN	Murat BAKAL	Havalandırma ölçümlerinin yapılması ve gerekli olan raporlar sonrasında düzenlemelerin sağlanarak alanın steril hale getirilmesi.	2	4	2	2026-04-25 20:21:27.188	2026-04-25 20:21:27.188
\.


--
-- Data for Name: NotebookPage; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."NotebookPage" (id, "facilityId", year, date, "documentUrl", status, "createdBy", "createdAt", "updatedAt", "documentUploadedAt", "isArchived", "isLocked") FROM stdin;
2	LIV-VADI	2026	2026-04-01 00:00:00	\N	Eksik	metin.salik	2026-04-25 19:54:58.319	2026-04-25 19:54:58.319	\N	f	f
1	GOP-DIYALIZ-MER	2026	2026-04-25 00:00:00	/uploads/notebooks/document-1777146026298-91622271.pdf	Tamamlandı	metin.salik	2026-04-25 19:40:02.666	2026-04-25 20:10:41.998	\N	t	f
3	LIV-GAZIANTEP	2026	2026-04-25 00:00:00	/uploads/notebooks/document-1777148014026-492419380.pdf	Tamamlandı	metin.salik	2026-04-25 20:13:02.162	2026-04-25 20:13:34.038	2026-04-25 20:13:34.037	f	f
4	MLP-AR-GE	2026	2026-04-01 00:00:00	/uploads/notebooks/document-1777148487175-313374006.pdf	Tamamlandı	murat.bakal	2026-04-25 20:15:40.136	2026-04-25 20:21:27.188	2026-04-25 20:21:27.187	f	f
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."Notification" (id, title, message, type, module, "targetRole", username, "isRead", link, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: NotificationConfig; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."NotificationConfig" (id, code, module, description, "emailEnabled", "appEnabled", priority, "updatedAt") FROM stdin;
\.


--
-- Data for Name: NotificationTemplate; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."NotificationTemplate" (id, code, name, module, subject, body, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OSGBCompany; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."OSGBCompany" (id, name, contact, phone, email, "isActive", "createdAt", "updatedAt", city, district) FROM stdin;
1	Anadolu OSGB				t	2026-04-24 08:05:01.38	2026-04-24 08:05:01.38		
2	KASS OSGB				t	2026-04-24 08:05:01.382	2026-04-24 08:05:01.382		
3	Lider OSGB				t	2026-04-24 08:05:01.383	2026-04-24 08:05:01.383		
4	Modern Teknik Tıp OSGB				t	2026-04-24 08:05:01.384	2026-04-24 08:05:01.384		
5	Özhan Erkal OSGB				t	2026-04-24 08:05:01.384	2026-04-24 08:05:01.384		
6	Öztürk OSGB				t	2026-04-24 08:05:01.385	2026-04-24 08:05:01.385		
7	Sare OSGB				t	2026-04-24 08:05:01.385	2026-04-24 08:05:01.385		
8	Derece OSGB				t	2026-04-27 07:47:35.521	2026-04-27 07:47:35.521		
9	İhtisas OSGB				t	2026-04-27 10:31:35.772	2026-04-27 10:31:35.772		
\.


--
-- Data for Name: Professional; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."Professional" (id, "fullName", "employmentType", "osgbName", "titleClass", "certificateNo", "certificateDate", phone, email, "unitPrice", "isActive", "createdAt", "updatedAt", username) FROM stdin;
1	Tuğba KARATAŞ	OSGB Kadrosu	Modern Teknik Tıp OSGB	A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.392	2026-04-24 08:05:01.392	\N
2	Derya MALKOÇ	Tesis Kadrosu		B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.394	2026-04-24 08:05:01.394	\N
3	Doğan Can GÜNEŞ	OSGB Kadrosu	Modern Teknik Tıp OSGB	C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.395	2026-04-24 08:05:01.395	\N
4	Metin SALIK	Tesis Kadrosu		A Sınıfı IGU	İGU-287183	2025-12-22 00:00:00	05417262919	metin.salik@isu.edu.tr	0	t	2026-04-24 08:05:01.395	2026-04-24 08:05:01.395	\N
5	Hüseyin Buğra TORLAK	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.396	2026-04-24 08:05:01.396	\N
6	Nihal KIRKBEŞOĞLU	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.396	2026-04-24 08:05:01.396	\N
7	Eyüp SARI	Tesis Kadrosu		B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.397	2026-04-24 08:05:01.397	\N
8	Sümeyra KILIÇ	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.397	2026-04-24 08:05:01.397	\N
9	Erkan YÜKSEL	Tesis Kadrosu		B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.398	2026-04-24 08:05:01.398	\N
10	Hüseyin Kağan UYSAL	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.399	2026-04-24 08:05:01.399	\N
11	Yaşar POLAT	OSGB Kadrosu	Sare OSGB	B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.399	2026-04-24 08:05:01.399	\N
12	Murat YILMAZ	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.4	2026-04-24 08:05:01.4	\N
13	Metin ÇAVDAR	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.4	2026-04-24 08:05:01.4	\N
14	Canan TEKİN	Tesis Kadrosu		B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.401	2026-04-24 08:05:01.401	\N
15	Tunahan NAMOĞLU	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.401	2026-04-24 08:05:01.401	\N
17	Dolunay KURU	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.402	2026-04-24 08:05:01.402	\N
18	Filiz CURA	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.403	2026-04-24 08:05:01.403	\N
19	Güneş AYANOĞLU	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.403	2026-04-24 08:05:01.403	\N
20	Tuğçe ÖZTÜRK	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.404	2026-04-24 08:05:01.404	\N
21	Seray ÖZKAN	OSGB Kadrosu	Özhan Erkal OSGB	A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.404	2026-04-24 08:05:01.404	\N
22	Sema Çiğdem KARAKUŞ	OSGB Kadrosu	Öztürk OSGB	A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.404	2026-04-24 08:05:01.404	\N
23	Sezen KAHYA	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.405	2026-04-24 08:05:01.405	\N
24	Doruk KÖKSAL	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.405	2026-04-24 08:05:01.405	\N
25	Yavuz DEMİRHAN	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.405	2026-04-24 08:05:01.405	\N
26	Tuğba KAHYA	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.406	2026-04-24 08:05:01.406	\N
27	Sultan ACAR	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.406	2026-04-24 08:05:01.406	\N
28	Güler KARA	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.406	2026-04-24 08:05:01.406	\N
29	Sinan ÖNCÜL	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.407	2026-04-24 08:05:01.407	\N
30	Özge KARAHAN	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.407	2026-04-24 08:05:01.407	\N
31	Sevgi DEMİRHAN	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.408	2026-04-24 08:05:01.408	\N
32	Sinem GÜLER	Tesis Kadrosu		B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.408	2026-04-24 08:05:01.408	\N
33	Fatih Mehmet ÖZAYDIN	OSGB Kadrosu	Lider OSGB	A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.409	2026-04-24 08:05:01.409	\N
34	Şeyda YILDIZ	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.409	2026-04-24 08:05:01.409	\N
35	Murat UYSAL	OSGB Kadrosu	KASS OSGB	A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.409	2026-04-24 08:05:01.409	\N
36	Elçin Eren MERABA	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.41	2026-04-24 08:05:01.41	\N
37	Fisun MEYDAN ŞAHİN	Tesis Kadrosu		B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.41	2026-04-24 08:05:01.41	\N
38	Çiğdem ÇİMET KESKİN	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.411	2026-04-24 08:05:01.411	\N
39	Sezin ÇAVUŞ	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.411	2026-04-24 08:05:01.411	\N
40	Akif AÇIKEL	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.411	2026-04-24 08:05:01.411	\N
42	Fatma Nur TÜRKSOY	OSGB Kadrosu	Anadolu OSGB	B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.412	2026-04-24 08:05:01.412	\N
43	Osman ALTUN	OSGB Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.412	2026-04-24 08:05:01.412	\N
44	Kubilay ALTINTAŞ	OSGB Kadrosu	Öztürk OSGB	A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.413	2026-04-24 08:05:01.413	\N
45	Gökmen GÜNDOĞDU	OSGB Kadrosu	Öztürk OSGB	C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.413	2026-04-24 08:05:01.413	\N
46	Aytaç DEMİRHAN	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.413	2026-04-24 08:05:01.413	\N
47	Ayşegül AYDIN	Tesis Kadrosu		B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.414	2026-04-24 08:05:01.414	\N
48	Serkan ÇALIŞKAN	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.414	2026-04-24 08:05:01.414	\N
49	Mesut CAVGA	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.415	2026-04-24 08:05:01.415	\N
50	Seda MANKUT	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.415	2026-04-24 08:05:01.415	\N
51	Edanur KELSOY	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.415	2026-04-24 08:05:01.415	\N
52	Hüseyin AKYILDIZ	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.416	2026-04-24 08:05:01.416	\N
53	Şevval GÜREL DOMBAYCI	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.416	2026-04-24 08:05:01.416	\N
54	Tuğçe YÖRDEM	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.417	2026-04-24 08:05:01.417	\N
55	Muharrem ASLANTAŞ	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.417	2026-04-24 08:05:01.417	\N
56	Barış BOZTEPE	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.417	2026-04-24 08:05:01.417	\N
57	Fatma YENİGÜN	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.418	2026-04-24 08:05:01.418	\N
58	Gözde TOKTAŞ	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.418	2026-04-24 08:05:01.418	\N
59	Asiye İlknur TOSUN	OSGB Kadrosu	Modern Teknik Tıp OSGB	B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.418	2026-04-24 08:05:01.418	\N
60	Rabia ALBAYRAK	OSGB Kadrosu	Modern Teknik Tıp OSGB	B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.419	2026-04-24 08:05:01.419	\N
61	Fatma Çağla NERGİS	OSGB Kadrosu	Modern Teknik Tıp OSGB	C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.419	2026-04-24 08:05:01.419	\N
62	Sinem ŞİMŞEKALP	Tesis Kadrosu		A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.419	2026-04-24 08:05:01.419	\N
16	Melike Genç CİNGÖZ	Tesis Kadrosu		A Sınıfı IGU		\N			\N	t	2026-04-24 08:05:01.402	2026-05-19 19:44:00.187	melike.genc
63	Tuğçe ŞEN	Tesis Kadrosu		B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.42	2026-04-24 08:05:01.42	\N
64	Esra KÖKSAL	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.42	2026-04-24 08:05:01.42	\N
65	Ömer Faruk AYDIN	OSGB Kadrosu	Modern Teknik Tıp OSGB	A Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.421	2026-04-24 08:05:01.421	\N
66	Ramazan CAN	OSGB Kadrosu	Modern Teknik Tıp OSGB	B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.422	2026-04-24 08:05:01.422	\N
67	Ümmühan Nur YILMAZ	OSGB Kadrosu	Modern Teknik Tıp OSGB	İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.422	2026-04-24 08:05:01.422	\N
68	Şerif KÖKSAL	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.423	2026-04-24 08:05:01.423	\N
69	Murad DİREN	OSGB Kadrosu	Lider OSGB	İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.423	2026-04-24 08:05:01.423	\N
70	Gafur DOĞDU	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.424	2026-04-24 08:05:01.424	\N
71	Fatma ZENGİN	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.424	2026-04-24 08:05:01.424	\N
72	Engin IŞIK	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.425	2026-04-24 08:05:01.425	\N
73	Şeref Kamil BASMACIOĞLU	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.425	2026-04-24 08:05:01.425	\N
74	Ertan AYDIN	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.426	2026-04-24 08:05:01.426	\N
75	Yunus SÜNDÜK	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.426	2026-04-24 08:05:01.426	\N
76	Metehan SARAÇOĞLU	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.426	2026-04-24 08:05:01.426	\N
77	Orçun ORHUN	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.427	2026-04-24 08:05:01.427	\N
78	Muhammed Faruk COŞAR	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.427	2026-04-24 08:05:01.427	\N
79	Ahmet Sedat KURTAR	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.428	2026-04-24 08:05:01.428	\N
80	Hakan HASMAN	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.428	2026-04-24 08:05:01.428	\N
81	Gülten ÖZKAN	OSGB Kadrosu	Öztürk OSGB	İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.428	2026-04-24 08:05:01.428	\N
82	Atilla ÇİFCİ	OSGB Kadrosu	Öztürk OSGB	İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.429	2026-04-24 08:05:01.429	\N
83	Meltem DEMİR	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.429	2026-04-24 08:05:01.429	\N
84	Cemil BALCI	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.429	2026-04-24 08:05:01.429	\N
85	Şeref ÖNCÜ	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.429	2026-04-24 08:05:01.429	\N
86	Erol TURAN	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.43	2026-04-24 08:05:01.43	\N
87	Zülfü ÖZKILIÇ	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.43	2026-04-24 08:05:01.43	\N
88	Adnan ALACA	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.431	2026-04-24 08:05:01.431	\N
89	Göksal ŞAHİN	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.431	2026-04-24 08:05:01.431	\N
90	İshak Murat AKBAŞ	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.431	2026-04-24 08:05:01.431	\N
91	Murad DİREN	OSGB Kadrosu	Lider OSGB	İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.432	2026-04-24 08:05:01.432	\N
92	Dursun BULUT	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.432	2026-04-24 08:05:01.432	\N
93	Şule Esen TÜRKYILMAZ	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.432	2026-04-24 08:05:01.432	\N
94	Abdullah CANTÜRK	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.433	2026-04-24 08:05:01.433	\N
95	Ferda ÖZTÜRK	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.433	2026-04-24 08:05:01.433	\N
96	Kemal EKİCİ	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.434	2026-04-24 08:05:01.434	\N
97	Gülhan ÇAKIR	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.434	2026-04-24 08:05:01.434	\N
98	Pervin ERYILMAZ	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.434	2026-04-24 08:05:01.434	\N
99	Cem ALAN	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.435	2026-04-24 08:05:01.435	\N
100	Evren YÜVRÜK	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.435	2026-04-24 08:05:01.435	\N
101	Fulya GÜLERGÜN	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.435	2026-04-24 08:05:01.435	\N
102	Ömer ATALAY	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.436	2026-04-24 08:05:01.436	\N
103	Fevzi AKDEMİR	OSGB Kadrosu	Modern Teknik Tıp OSGB	İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.436	2026-04-24 08:05:01.436	\N
104	Adem DİRİCAN	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.436	2026-04-24 08:05:01.436	\N
105	Roza AYDOĞDU	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.437	2026-04-24 08:05:01.437	\N
106	Yücel KOÇYİĞİT	OSGB Kadrosu	Modern Teknik Tıp OSGB	İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.437	2026-04-24 08:05:01.437	\N
107	Furkan KARABACAK	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.437	2026-04-24 08:05:01.437	\N
108	Esra GÖKSUN PİŞKİN	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.438	2026-04-24 08:05:01.438	\N
109	Sibel SEZER	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.438	2026-04-24 08:05:01.438	\N
110	Neslihan Okumuş GÖKÇE	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.439	2026-04-24 08:05:01.439	\N
111	Şeyda AKSOY	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.439	2026-04-24 08:05:01.439	\N
112	Emel NAMOĞLU	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.439	2026-04-24 08:05:01.439	\N
113	Özgür ŞENOL	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.44	2026-04-24 08:05:01.44	\N
114	Atamer KARACA	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.44	2026-04-24 08:05:01.44	\N
115	Semra KILIÇ	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.44	2026-04-24 08:05:01.44	\N
116	Hatice EYCE	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.441	2026-04-24 08:05:01.441	\N
117	Emine Ünzile ÖZTÜRK	OSGB Kadrosu	Modern Teknik Tıp OSGB	DSP		\N			0	t	2026-04-24 08:05:01.441	2026-04-24 08:05:01.441	\N
118	Hayriye ÇELİK	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.442	2026-04-24 08:05:01.442	\N
119	Esra KESİCİ	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.442	2026-04-24 08:05:01.442	\N
120	Yasemin OKCU	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.442	2026-04-24 08:05:01.442	\N
121	Leman KORKMAZ GÜNEY	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.443	2026-04-24 08:05:01.443	\N
122	Koray Baki KILIÇ	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.443	2026-04-24 08:05:01.443	\N
123	Nurten Arzu BAĞKURAN	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.443	2026-04-24 08:05:01.443	\N
124	Büşra AYDIN	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.444	2026-04-24 08:05:01.444	\N
125	Öznur KARAASLAN	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.444	2026-04-24 08:05:01.444	\N
126	Selma BİRİNCİ	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.445	2026-04-24 08:05:01.445	\N
127	Nesibe ÖMÜR	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.445	2026-04-24 08:05:01.445	\N
128	Gülçin AKTAŞ	OSGB Kadrosu	Öztürk OSGB	DSP		\N			0	t	2026-04-24 08:05:01.445	2026-04-24 08:05:01.445	\N
129	Zeliha BAŞGÜL	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.446	2026-04-24 08:05:01.446	\N
130	Mehtap YAŞİN AMBAR	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.446	2026-04-24 08:05:01.446	\N
131	Dilek DİLER	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.447	2026-04-24 08:05:01.447	\N
132	İpek Nilay SANCAKTAR	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.447	2026-04-24 08:05:01.447	\N
133	Özlem YANAK	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.447	2026-04-24 08:05:01.447	\N
134	Pınar AK GÜVEN	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.448	2026-04-24 08:05:01.448	\N
135	Şeyma Melek AYDIN	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.448	2026-04-24 08:05:01.448	\N
136	Ayşe Gül TOPAL	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.448	2026-04-24 08:05:01.448	\N
137	Muhammet Hasan UYAR	Tesis Kadrosu		DSP		\N			0	t	2026-04-24 08:05:01.449	2026-04-24 08:05:01.449	\N
138	Olga Nehir ÖZTEL	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.449	2026-04-24 08:05:01.449	\N
139	Ayşe ŞİMŞEK	OSGB Kadrosu	Modern Teknik Tıp OSGB	B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.449	2026-04-24 08:05:01.449	\N
140	Işıl Deniz ALIRAVCI	OSGB Kadrosu	Özhan Erkal OSGB	İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.45	2026-04-24 08:05:01.45	\N
142	Mustafa KARATAŞ	Tesis Kadrosu		İşyeri Hekimi		\N			0	t	2026-04-24 08:05:01.45	2026-04-24 08:05:01.45	\N
143	Fatma Gamze NARGOZ ONDER	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.451	2026-04-24 08:05:01.451	\N
144	Şifa Nur HARMANKÖY	Tesis Kadrosu		B Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.451	2026-04-24 08:05:01.451	\N
145	Nevriye CAN	Tesis Kadrosu		DSP	Diğer Sağlık Personeli-288070	\N			0	t	2026-04-24 08:05:01.451	2026-04-24 08:05:01.451	\N
146	Tarık BÜYÜKORAL	Tesis Kadrosu		B Sınıfı IGU	İGU-315491	\N			0	t	2026-04-24 08:05:01.452	2026-04-24 08:05:01.452	\N
147	Elif BAYHATUN	Tesis Kadrosu		A Sınıfı IGU	İGU-58245	\N			0	t	2026-04-24 08:05:01.452	2026-04-24 08:05:01.452	\N
148	Sabri KOÇ	Tesis Kadrosu		C Sınıfı IGU		\N			0	t	2026-04-24 08:05:01.452	2026-04-24 08:05:01.452	\N
149	Murat KURTOĞLU	Tesis Kadrosu		C Sınıfı IGU	İGU-235611	\N			0	t	2026-04-24 08:05:01.453	2026-04-24 08:05:01.453	\N
41	Ali Haydar USTA	OSGB Kadrosu	Anadolu OSGB	A Sınıfı IGU		\N			10000	t	2026-04-24 08:05:01.412	2026-04-24 08:40:26.069	\N
141	Murat BAKAL	Tesis Kadrosu		A Sınıfı IGU		\N			\N	t	2026-04-24 08:05:01.45	2026-04-24 20:16:57.322	murat.bakal
150	Mehmet İlker Çitil	Tesis Kadrosu		İşyeri Hekimi	İH-416334	\N			\N	t	2026-04-27 06:37:03.885	2026-04-27 06:37:03.885	\N
151	Şahide Merve Kırdal	OSGB Kadrosu	Öztürk OSGB	C Sınıfı IGU	İGU-306544	\N			\N	t	2026-04-27 06:58:26.009	2026-04-27 06:58:26.009	\N
152	Emre Poyraz	Tesis Kadrosu		C Sınıfı IGU	İGU-296353	\N			\N	t	2026-04-27 07:15:09.95	2026-04-27 07:15:09.95	\N
153	Emrah Direk	OSGB Kadrosu	Özhan Erkal OSGB	İşyeri Hekimi	İH-191270	\N			\N	t	2026-04-27 07:36:58.025	2026-04-27 07:36:58.025	\N
154	Emin Berat Uzuner	OSGB Kadrosu	Derece OSGB	C Sınıfı IGU	İGU-274996	\N			\N	t	2026-04-27 07:48:09.14	2026-04-27 07:48:52.326	\N
156	Tuğba Kızıltaş	Tesis Kadrosu		DSP	DSP-112124	\N			\N	t	2026-04-27 08:01:15.932	2026-04-27 08:01:15.932	\N
157	Resul Güler	OSGB Kadrosu	Sare OSGB	A Sınıfı IGU	İGU-404617	\N			\N	t	2026-04-27 08:20:40.913	2026-04-27 08:20:40.913	\N
158	Akın Şahin	Tesis Kadrosu		C Sınıfı IGU	İGU-408705	\N			\N	t	2026-04-27 08:30:22.354	2026-04-27 08:30:39.392	\N
159	Hakan Yılmaz	OSGB Kadrosu	Modern Teknik Tıp OSGB	C Sınıfı IGU	İGU-296191	\N			\N	t	2026-04-27 08:34:51.191	2026-04-27 08:34:51.191	\N
160	Kamuran Doğan	OSGB Kadrosu	Modern Teknik Tıp OSGB	İşyeri Hekimi	İH-296957	\N			\N	t	2026-04-27 08:35:16.568	2026-04-27 08:36:34.325	\N
161	Mehmet Dursun	Tesis Kadrosu		DSP	DSP-188356	\N			\N	t	2026-04-27 09:29:28.178	2026-04-27 09:29:28.178	\N
162	Şenol Eren	Tesis Kadrosu		A Sınıfı IGU	İGU-302991	\N			\N	t	2026-04-27 10:29:00.441	2026-04-27 10:29:00.441	\N
163	Kasım Yiğit	OSGB Kadrosu	İhtisas OSGB	B Sınıfı IGU	İGU-297506	\N			\N	t	2026-04-27 10:32:06.909	2026-04-27 10:32:06.909	\N
164	Tülay Demirci	OSGB Kadrosu	Lider OSGB	C Sınıfı IGU	İGU-406631	\N			\N	t	2026-04-27 10:36:59.887	2026-04-27 10:37:21.274	\N
165	Derya Maşalı	Tesis Kadrosu		A Sınıfı IGU	İGU-72046	\N			\N	t	2026-04-27 10:45:28.763	2026-04-27 10:45:28.763	\N
166	Halime Şayak	OSGB Kadrosu	Modern Teknik Tıp OSGB	DSP	DSP-420430	\N			\N	t	2026-04-27 10:46:56.996	2026-04-27 10:47:22.311	\N
167	Hasan Murat Şahin	OSGB Kadrosu	Anadolu OSGB	A Sınıfı IGU	İGU-256188	\N			\N	t	2026-04-27 10:50:14.162	2026-04-27 10:50:14.162	\N
168	Alptekin Akyazı	Tesis Kadrosu		B Sınıfı IGU	İGU-27131	\N			\N	t	2026-04-27 10:56:20.729	2026-04-27 10:56:20.729	\N
155	Burak Kurt	OSGB Kadrosu	Modern Teknik Tıp OSGB	B Sınıfı IGU	İGU-254540	\N			\N	t	2026-04-27 07:58:10.798	2026-05-22 06:48:52.566	burak.kurt
169	Seher Bayraktar Kesin	Tesis Kadrosu		C Sınıfı IGU		\N			\N	t	2026-06-01 06:13:24.668	2026-06-01 06:13:24.668	\N
170	Gülsün SEVEN	OSGB Kadrosu	Modern Teknik Tıp OSGB	A Sınıfı IGU		\N			\N	t	2026-06-01 07:21:07.955	2026-06-01 07:21:07.955	\N
171	Elif Sevinç	OSGB Kadrosu	Modern Teknik Tıp OSGB	A Sınıfı IGU		\N			\N	t	2026-06-01 08:01:41.809	2026-06-01 08:01:41.809	\N
172	Derya Baral	OSGB Kadrosu	Modern Teknik Tıp OSGB	C Sınıfı IGU		\N			\N	t	2026-06-01 08:21:12.785	2026-06-01 08:21:12.785	\N
173	Emine Dırmıkçı	Tesis Kadrosu		DSP		\N			\N	t	2026-06-01 10:20:55.463	2026-06-01 10:20:55.463	\N
\.


--
-- Data for Name: Reconciliation; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."Reconciliation" (id, "facilityId", "osgbCompanyId", month, amount, note, status, "createdAt", "updatedAt", "calculatedAmount", "calculationDetails", difference, "invoiceAmount") FROM stdin;
10	İSU-LIV-TOPKAP	3	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.035	2026-04-27 11:24:57.594	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4170 dk -> 70 saat * ₺0 (Murad DİREN)", "assignmentId": 94, "professionalId": 69, "durationMinutes": 4170, "professionalName": "Murad DİREN"}]	0	\N
9	İSTINYE-DENT	4	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.034	2026-04-27 11:24:57.597	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 800 dk -> 14 saat * ₺0 (Burak Kurt)", "assignmentId": 161, "professionalId": 155, "durationMinutes": 800, "professionalName": "Burak Kurt"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 162, "professionalId": 103, "durationMinutes": 400, "professionalName": "Fevzi AKDEMİR"}]	0	\N
2	MP-GOZTEPE	3	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.028	2026-04-27 11:24:57.585	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatih Mehmet ÖZAYDIN)", "assignmentId": 29, "professionalId": 33, "durationMinutes": 11700, "professionalName": "Fatih Mehmet ÖZAYDIN"}]	0	\N
4	MP-CANAKKALE	5	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.029	2026-04-27 11:24:57.587	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 75 dk -> 2 saat * ₺0 (Emrah Direk)", "assignmentId": 151, "professionalId": 153, "durationMinutes": 75, "professionalName": "Emrah Direk"}]	0	\N
6	MP-İNCEK	4	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.031	2026-04-27 11:24:57.589	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 220 dk -> 4 saat * ₺0 (Emine Ünzile ÖZTÜRK)", "assignmentId": 48, "professionalId": 117, "durationMinutes": 220, "professionalName": "Emine Ünzile ÖZTÜRK"}]	0	\N
8	İSU-LIV-BAHCES	4	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.033	2026-04-27 11:24:57.59	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Doğan Can GÜNEŞ)", "assignmentId": 71, "professionalId": 3, "durationMinutes": 11700, "professionalName": "Doğan Can GÜNEŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
12	MP-İZMIR	2	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.036	2026-04-27 11:24:57.59	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
13	MP-TEM	3	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.036	2026-04-27 11:24:57.593	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4215 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4215, "professionalName": "Murad DİREN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1240 dk -> 21 saat * ₺0 (Tülay Demirci)", "assignmentId": 171, "professionalId": 164, "durationMinutes": 1240, "professionalName": "Tülay Demirci"}]	0	\N
1	LIV-GAZIANTEP	7	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.024	2026-04-27 11:24:57.588	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4520 dk -> 76 saat * ₺0 (Yaşar POLAT)", "assignmentId": 2, "professionalId": 11, "durationMinutes": 4520, "professionalName": "Yaşar POLAT"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Resul Güler)", "assignmentId": 157, "professionalId": 157, "durationMinutes": 11700, "professionalName": "Resul Güler"}]	0	\N
11	MP-İSTANBUL-ON	4	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.035	2026-04-27 11:24:57.593	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 9520 dk -> 159 saat * ₺0 (Ömer Faruk AYDIN)", "assignmentId": 110, "professionalId": 65, "durationMinutes": 9520, "professionalName": "Ömer Faruk AYDIN"}]	0	\N
34	MP-GOZTEPE	3	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.123	2026-04-27 11:24:57.562	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatih Mehmet ÖZAYDIN)", "assignmentId": 29, "professionalId": 33, "durationMinutes": 11700, "professionalName": "Fatih Mehmet ÖZAYDIN"}]	0	\N
37	MP-İNCEK	6	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.127	2026-04-27 11:24:57.565	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 330 dk -> 6 saat * ₺0 (Gülten ÖZKAN)", "assignmentId": 46, "professionalId": 81, "durationMinutes": 330, "professionalName": "Gülten ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 880 dk -> 15 saat * ₺0 (Sema Çiğdem KARAKUŞ)", "assignmentId": 45, "professionalId": 22, "durationMinutes": 880, "professionalName": "Sema Çiğdem KARAKUŞ"}]	0	\N
15	VM-MP-FATIH	4	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.038	2026-04-27 11:24:57.592	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Ayşe ŞİMŞEK)", "assignmentId": 131, "professionalId": 139, "durationMinutes": 400, "professionalName": "Ayşe ŞİMŞEK"}]	0	\N
3	MP-KARADENIZ	1	2026-04	\N		Uyuşmazlık	2026-04-24 08:40:00.028	2026-04-27 11:24:57.586	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 2440 dk -> 41 saat * ₺0 (Fatma Nur TÜRKSOY)", "assignmentId": 35, "professionalId": 42, "durationMinutes": 2440, "professionalName": "Fatma Nur TÜRKSOY"}]	10000	0
36	MP-CANAKKALE	5	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.126	2026-04-27 11:24:57.563	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 75 dk -> 2 saat * ₺0 (Emrah Direk)", "assignmentId": 151, "professionalId": 153, "durationMinutes": 75, "professionalName": "Emrah Direk"}]	0	\N
95	MP-KARADENIZ	1	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.023	2026-06-01 11:51:55.136	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 2480 dk -> 42 saat * ₺0 (Fatma Nur TÜRKSOY)", "assignmentId": 35, "professionalId": 42, "durationMinutes": 2480, "professionalName": "Fatma Nur TÜRKSOY"}]	10000	\N
38	MP-İNCEK	4	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.128	2026-04-27 11:24:57.565	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 220 dk -> 4 saat * ₺0 (Emine Ünzile ÖZTÜRK)", "assignmentId": 48, "professionalId": 117, "durationMinutes": 220, "professionalName": "Emine Ünzile ÖZTÜRK"}]	0	\N
96	MP-CANAKKALE	5	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.025	2026-06-01 11:51:55.138	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 75 dk -> 2 saat * ₺0 (Emrah Direk)", "assignmentId": 151, "professionalId": 153, "durationMinutes": 75, "professionalName": "Emrah Direk"}]	0	\N
43	MP-İSTANBUL-ON	4	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.132	2026-04-27 11:24:57.569	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 9520 dk -> 159 saat * ₺0 (Ömer Faruk AYDIN)", "assignmentId": 110, "professionalId": 65, "durationMinutes": 9520, "professionalName": "Ömer Faruk AYDIN"}]	0	\N
42	İSU-LIV-TOPKAP	3	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.132	2026-04-27 11:24:57.57	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4170 dk -> 70 saat * ₺0 (Murad DİREN)", "assignmentId": 94, "professionalId": 69, "durationMinutes": 4170, "professionalName": "Murad DİREN"}]	0	\N
78	LIV-GAZIANTEP	7	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.378	2026-04-27 11:24:57.523	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4520 dk -> 76 saat * ₺0 (Yaşar POLAT)", "assignmentId": 2, "professionalId": 11, "durationMinutes": 4520, "professionalName": "Yaşar POLAT"}]	0	\N
41	İSTINYE-DENT	4	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.131	2026-04-27 11:24:57.571	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 162, "professionalId": 103, "durationMinutes": 400, "professionalName": "Fevzi AKDEMİR"}]	0	\N
40	İSU-LIV-BAHCES	4	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.13	2026-04-27 11:24:57.566	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Doğan Can GÜNEŞ)", "assignmentId": 71, "professionalId": 3, "durationMinutes": 11700, "professionalName": "Doğan Can GÜNEŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
79	MP-GOZTEPE	3	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.382	2026-04-27 11:24:57.517	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatih Mehmet ÖZAYDIN)", "assignmentId": 29, "professionalId": 33, "durationMinutes": 11700, "professionalName": "Fatih Mehmet ÖZAYDIN"}]	0	\N
44	MP-İZMIR	2	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.133	2026-04-27 11:24:57.567	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
80	MP-KARADENIZ	1	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.383	2026-04-27 11:24:57.52	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 2440 dk -> 41 saat * ₺0 (Fatma Nur TÜRKSOY)", "assignmentId": 35, "professionalId": 42, "durationMinutes": 2440, "professionalName": "Fatma Nur TÜRKSOY"}]	10000	\N
81	MP-CANAKKALE	5	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.384	2026-04-27 11:24:57.521	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 75 dk -> 2 saat * ₺0 (Emrah Direk)", "assignmentId": 151, "professionalId": 153, "durationMinutes": 75, "professionalName": "Emrah Direk"}]	0	\N
47	VM-MP-FATIH	4	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.136	2026-04-27 11:24:57.568	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Ayşe ŞİMŞEK)", "assignmentId": 131, "professionalId": 139, "durationMinutes": 400, "professionalName": "Ayşe ŞİMŞEK"}]	0	\N
45	MP-TEM	3	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.134	2026-04-27 11:24:57.568	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4215 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4215, "professionalName": "Murad DİREN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1240 dk -> 21 saat * ₺0 (Tülay Demirci)", "assignmentId": 171, "professionalId": 164, "durationMinutes": 1240, "professionalName": "Tülay Demirci"}]	0	\N
89	MP-İZMIR	2	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.39	2026-04-27 11:24:57.526	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
91	VM-MP-ANKARA	6	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.392	2026-04-27 11:24:57.526	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4640 dk -> 78 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 4640, "professionalName": "Gökmen GÜNDOĞDU"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7320 dk -> 122 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7320, "professionalName": "Gülçin AKTAŞ"}]	0	\N
86	İSTINYE-DENT	4	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.388	2026-04-27 05:29:05.302	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 840 dk -> 14 saat * ₺0 (Ramazan CAN)", "assignmentId": 92, "professionalId": 66, "durationMinutes": 840, "professionalName": "Ramazan CAN"}]	0	\N
94	MP-GOZTEPE	3	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.022	2026-06-01 11:51:55.135	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatih Mehmet ÖZAYDIN)", "assignmentId": 29, "professionalId": 33, "durationMinutes": 11700, "professionalName": "Fatih Mehmet ÖZAYDIN"}]	0	\N
93	LIV-GAZIANTEP	7	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.021	2026-06-01 11:51:55.141	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4240 dk -> 71 saat * ₺0 (Yaşar POLAT)", "assignmentId": 2, "professionalId": 11, "durationMinutes": 4240, "professionalName": "Yaşar POLAT"}]	0	\N
88	MP-İSTANBUL-ON	4	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.39	2026-04-27 11:24:57.528	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 9520 dk -> 159 saat * ₺0 (Ömer Faruk AYDIN)", "assignmentId": 110, "professionalId": 65, "durationMinutes": 9520, "professionalName": "Ömer Faruk AYDIN"}]	0	\N
87	İSU-LIV-TOPKAP	3	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.389	2026-04-27 11:24:57.529	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4170 dk -> 70 saat * ₺0 (Murad DİREN)", "assignmentId": 94, "professionalId": 69, "durationMinutes": 4170, "professionalName": "Murad DİREN"}]	0	\N
83	MP-İNCEK	4	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.386	2026-04-27 11:24:57.523	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 220 dk -> 4 saat * ₺0 (Emine Ünzile ÖZTÜRK)", "assignmentId": 48, "professionalId": 117, "durationMinutes": 220, "professionalName": "Emine Ünzile ÖZTÜRK"}]	0	\N
85	İSU-LIV-BAHCES	4	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.388	2026-04-27 11:24:57.525	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Doğan Can GÜNEŞ)", "assignmentId": 71, "professionalId": 3, "durationMinutes": 11700, "professionalName": "Doğan Can GÜNEŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
92	VM-MP-FATIH	4	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.392	2026-04-27 11:24:57.527	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Ayşe ŞİMŞEK)", "assignmentId": 131, "professionalId": 139, "durationMinutes": 400, "professionalName": "Ayşe ŞİMŞEK"}]	0	\N
90	MP-TEM	3	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.391	2026-04-27 11:24:57.528	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4215 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4215, "professionalName": "Murad DİREN"}]	0	\N
105	MP-TEM	3	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.035	2026-06-01 11:51:55.147	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4245 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4245, "professionalName": "Murad DİREN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1320 dk -> 22 saat * ₺0 (Tülay Demirci)", "assignmentId": 171, "professionalId": 164, "durationMinutes": 1320, "professionalName": "Tülay Demirci"}]	0	\N
107	VM-MP-FATIH	4	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.037	2026-04-27 11:24:57.546	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Ayşe ŞİMŞEK)", "assignmentId": 131, "professionalId": 139, "durationMinutes": 400, "professionalName": "Ayşe ŞİMŞEK"}]	0	\N
101	İSTINYE-DENT	4	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.031	2026-04-27 05:29:05.324	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 840 dk -> 14 saat * ₺0 (Ramazan CAN)", "assignmentId": 92, "professionalId": 66, "durationMinutes": 840, "professionalName": "Ramazan CAN"}]	0	\N
35	MP-KARADENIZ	1	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.124	2026-04-27 11:24:57.562	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 2440 dk -> 41 saat * ₺0 (Fatma Nur TÜRKSOY)", "assignmentId": 35, "professionalId": 42, "durationMinutes": 2440, "professionalName": "Fatma Nur TÜRKSOY"}]	10000	\N
33	LIV-GAZIANTEP	7	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.119	2026-04-27 11:24:57.564	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4520 dk -> 76 saat * ₺0 (Yaşar POLAT)", "assignmentId": 2, "professionalId": 11, "durationMinutes": 4520, "professionalName": "Yaşar POLAT"}]	0	\N
104	MP-İZMIR	2	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.034	2026-06-01 11:51:55.144	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
106	VM-MP-ANKARA	6	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.036	2026-06-01 11:51:55.145	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7320 dk -> 122 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7320, "professionalName": "Gülçin AKTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4360 dk -> 73 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 4360, "professionalName": "Gökmen GÜNDOĞDU"}]	0	\N
102	İSU-LIV-TOPKAP	3	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.032	2026-06-01 11:51:55.146	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4230 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 94, "professionalId": 69, "durationMinutes": 4230, "professionalName": "Murad DİREN"}]	0	\N
103	MP-İSTANBUL-ON	4	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.033	2026-06-01 11:51:55.148	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 9840 dk -> 164 saat * ₺0 (Ömer Faruk AYDIN)", "assignmentId": 110, "professionalId": 65, "durationMinutes": 9840, "professionalName": "Ömer Faruk AYDIN"}]	0	\N
98	MP-İNCEK	4	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.028	2026-04-27 11:24:57.543	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 220 dk -> 4 saat * ₺0 (Emine Ünzile ÖZTÜRK)", "assignmentId": 48, "professionalId": 117, "durationMinutes": 220, "professionalName": "Emine Ünzile ÖZTÜRK"}]	0	\N
100	İSU-LIV-BAHCES	4	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.03	2026-06-01 11:51:55.143	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Doğan Can GÜNEŞ)", "assignmentId": 71, "professionalId": 3, "durationMinutes": 11700, "professionalName": "Doğan Can GÜNEŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
7	VM-MP-PENDIK	4	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.032	2026-04-27 11:24:57.587	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4000 dk -> 67 saat * ₺0 (Asiye İlknur TOSUN)", "assignmentId": 65, "professionalId": 59, "durationMinutes": 4000, "professionalName": "Asiye İlknur TOSUN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1845 dk -> 31 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 1845, "professionalName": "Fevzi AKDEMİR"}]	0	4
84	VM-MP-PENDIK	4	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.387	2026-04-27 11:24:57.522	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4000 dk -> 67 saat * ₺0 (Asiye İlknur TOSUN)", "assignmentId": 65, "professionalId": 59, "durationMinutes": 4000, "professionalName": "Asiye İlknur TOSUN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1845 dk -> 31 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 1845, "professionalName": "Fevzi AKDEMİR"}]	0	\N
82	MP-İNCEK	6	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.385	2026-04-27 11:24:57.524	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 330 dk -> 6 saat * ₺0 (Gülten ÖZKAN)", "assignmentId": 46, "professionalId": 81, "durationMinutes": 330, "professionalName": "Gülten ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 880 dk -> 15 saat * ₺0 (Sema Çiğdem KARAKUŞ)", "assignmentId": 45, "professionalId": 22, "durationMinutes": 880, "professionalName": "Sema Çiğdem KARAKUŞ"}]	0	\N
97	MP-İNCEK	6	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.027	2026-04-27 11:24:57.544	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 330 dk -> 6 saat * ₺0 (Gülten ÖZKAN)", "assignmentId": 46, "professionalId": 81, "durationMinutes": 330, "professionalName": "Gülten ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 880 dk -> 15 saat * ₺0 (Sema Çiğdem KARAKUŞ)", "assignmentId": 45, "professionalId": 22, "durationMinutes": 880, "professionalName": "Sema Çiğdem KARAKUŞ"}]	0	\N
39	VM-MP-PENDIK	4	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.129	2026-04-27 11:24:57.564	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4000 dk -> 67 saat * ₺0 (Asiye İlknur TOSUN)", "assignmentId": 65, "professionalId": 59, "durationMinutes": 4000, "professionalName": "Asiye İlknur TOSUN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1845 dk -> 31 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 1845, "professionalName": "Fevzi AKDEMİR"}]	0	\N
46	VM-MP-ANKARA	6	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.135	2026-04-27 11:24:57.567	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4640 dk -> 78 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 4640, "professionalName": "Gökmen GÜNDOĞDU"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7320 dk -> 122 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7320, "professionalName": "Gülçin AKTAŞ"}]	0	\N
242	MLP-CAGRI-MERKE	8	2026-03	\N	\N	Beklemede	2026-04-27 11:24:57.57	2026-04-27 11:24:57.57	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 500 dk -> 9 saat * ₺0 (Emin Berat Uzuner)", "assignmentId": 152, "professionalId": 154, "durationMinutes": 500, "professionalName": "Emin Berat Uzuner"}]	0	\N
243	MLP-İGA	4	2026-03	\N	\N	Beklemede	2026-04-27 11:24:57.571	2026-04-27 11:24:57.571	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 130 dk -> 3 saat * ₺0 (Hakan Yılmaz)", "assignmentId": 159, "professionalId": 159, "durationMinutes": 130, "professionalName": "Hakan Yılmaz"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 65 dk -> 2 saat * ₺0 (Kamuran Doğan)", "assignmentId": 160, "professionalId": 160, "durationMinutes": 65, "professionalName": "Kamuran Doğan"}]	0	\N
245	MP-SEYHAN	9	2026-03	\N	\N	Beklemede	2026-04-27 11:24:57.572	2026-04-27 11:24:57.572	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 3920 dk -> 66 saat * ₺0 (Kasım Yiğit)", "assignmentId": 170, "professionalId": 163, "durationMinutes": 3920, "professionalName": "Kasım Yiğit"}]	0	\N
246	İSU-LIV-TOPKAP	4	2026-03	\N	\N	Beklemede	2026-04-27 11:24:57.573	2026-04-27 11:24:57.573	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Halime Şayak)", "assignmentId": 173, "professionalId": 166, "durationMinutes": 11700, "professionalName": "Halime Şayak"}]	0	\N
247	MLP-KARADENIZ-I	1	2026-03	\N	\N	Beklemede	2026-04-27 11:24:57.573	2026-04-27 11:24:57.573	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 40 dk -> 1 saat * ₺0 (Hasan Murat Şahin)", "assignmentId": 174, "professionalId": 167, "durationMinutes": 40, "professionalName": "Hasan Murat Şahin"}]	0	\N
5	MP-İNCEK	6	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.03	2026-04-27 11:24:57.589	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 330 dk -> 6 saat * ₺0 (Gülten ÖZKAN)", "assignmentId": 46, "professionalId": 81, "durationMinutes": 330, "professionalName": "Gülten ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 880 dk -> 15 saat * ₺0 (Sema Çiğdem KARAKUŞ)", "assignmentId": 45, "professionalId": 22, "durationMinutes": 880, "professionalName": "Sema Çiğdem KARAKUŞ"}]	0	\N
227	MLP-KARADENIZ-I	1	2026-02	\N	\N	Beklemede	2026-04-27 11:24:57.55	2026-06-01 11:51:55.149	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 40 dk -> 1 saat * ₺0 (Hasan Murat Şahin)", "assignmentId": 174, "professionalId": 167, "durationMinutes": 40, "professionalName": "Hasan Murat Şahin"}]	0	\N
226	İSU-LIV-TOPKAP	4	2026-02	\N	\N	Beklemede	2026-04-27 11:24:57.549	2026-06-01 11:51:55.15	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 5640 dk -> 94 saat * ₺0 (Halime Şayak)", "assignmentId": 173, "professionalId": 166, "durationMinutes": 5640, "professionalName": "Halime Şayak"}]	0	\N
14	VM-MP-ANKARA	6	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.037	2026-04-27 11:24:57.591	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4640 dk -> 78 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 4640, "professionalName": "Gökmen GÜNDOĞDU"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7320 dk -> 122 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7320, "professionalName": "Gülçin AKTAŞ"}]	0	\N
262	MP-ANKARA	6	2026-04	\N	\N	Beklemede	2026-04-27 11:24:57.595	2026-04-27 11:24:57.595	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Şahide Merve Kırdal)", "assignmentId": 149, "professionalId": 151, "durationMinutes": 11700, "professionalName": "Şahide Merve Kırdal"}]	0	\N
263	MLP-CAGRI-MERKE	8	2026-04	\N	\N	Beklemede	2026-04-27 11:24:57.595	2026-04-27 11:24:57.595	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 500 dk -> 9 saat * ₺0 (Emin Berat Uzuner)", "assignmentId": 152, "professionalId": 154, "durationMinutes": 500, "professionalName": "Emin Berat Uzuner"}]	0	\N
264	GOP-DIYALIZ-MER	4	2026-04	\N	\N	Beklemede	2026-04-27 11:24:57.596	2026-04-27 11:24:57.596	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1240 dk -> 21 saat * ₺0 (Burak Kurt)", "assignmentId": 154, "professionalId": 155, "durationMinutes": 1240, "professionalName": "Burak Kurt"}]	0	\N
265	MLP-İGA	4	2026-04	\N	\N	Beklemede	2026-04-27 11:24:57.596	2026-04-27 11:24:57.596	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 130 dk -> 3 saat * ₺0 (Hakan Yılmaz)", "assignmentId": 159, "professionalId": 159, "durationMinutes": 130, "professionalName": "Hakan Yılmaz"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 65 dk -> 2 saat * ₺0 (Kamuran Doğan)", "assignmentId": 160, "professionalId": 160, "durationMinutes": 65, "professionalName": "Kamuran Doğan"}]	0	\N
267	MP-SEYHAN	9	2026-04	\N	\N	Beklemede	2026-04-27 11:24:57.598	2026-04-27 11:24:57.598	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 3920 dk -> 66 saat * ₺0 (Kasım Yiğit)", "assignmentId": 170, "professionalId": 163, "durationMinutes": 3920, "professionalName": "Kasım Yiğit"}]	0	\N
268	İSU-LIV-TOPKAP	4	2026-04	\N	\N	Beklemede	2026-04-27 11:24:57.598	2026-04-27 11:24:57.598	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Halime Şayak)", "assignmentId": 173, "professionalId": 166, "durationMinutes": 11700, "professionalName": "Halime Şayak"}]	0	\N
269	MLP-KARADENIZ-I	1	2026-04	\N	\N	Beklemede	2026-04-27 11:24:57.599	2026-04-27 11:24:57.599	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 40 dk -> 1 saat * ₺0 (Hasan Murat Şahin)", "assignmentId": 174, "professionalId": 167, "durationMinutes": 40, "professionalName": "Hasan Murat Şahin"}]	0	\N
274	LIV-GAZIANTEP	7	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.17	2026-06-01 11:50:57.989	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4240 dk -> 71 saat * ₺0 (Yaşar POLAT)", "assignmentId": 2, "professionalId": 11, "durationMinutes": 4240, "professionalName": "Yaşar POLAT"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Resul Güler)", "assignmentId": 157, "professionalId": 157, "durationMinutes": 11700, "professionalName": "Resul Güler"}]	0	\N
270	MP-GOZTEPE	3	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.162	2026-06-01 11:50:57.984	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatih Mehmet ÖZAYDIN)", "assignmentId": 29, "professionalId": 33, "durationMinutes": 11700, "professionalName": "Fatih Mehmet ÖZAYDIN"}]	0	\N
272	MP-CANAKKALE	5	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.168	2026-06-01 11:50:57.987	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 75 dk -> 2 saat * ₺0 (Emrah Direk)", "assignmentId": 151, "professionalId": 153, "durationMinutes": 75, "professionalName": "Emrah Direk"}]	0	\N
280	MP-İSTANBUL-ON	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.175	2026-06-01 11:50:57.994	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 9840 dk -> 164 saat * ₺0 (Ömer Faruk AYDIN)", "assignmentId": 110, "professionalId": 65, "durationMinutes": 9840, "professionalName": "Ömer Faruk AYDIN"}]	0	\N
282	GOP-DIYALIZ-MER	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.177	2026-06-01 11:50:57.996	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1240 dk -> 21 saat * ₺0 (Burak Kurt)", "assignmentId": 154, "professionalId": 155, "durationMinutes": 1240, "professionalName": "Burak Kurt"}]	0	\N
284	İSTINYE-DENT	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.178	2026-06-01 11:50:57.997	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 800 dk -> 14 saat * ₺0 (Burak Kurt)", "assignmentId": 161, "professionalId": 155, "durationMinutes": 800, "professionalName": "Burak Kurt"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 162, "professionalId": 103, "durationMinutes": 400, "professionalName": "Fevzi AKDEMİR"}]	0	\N
285	MLP-KARADENIZ-I	1	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.179	2026-06-01 11:50:57.999	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 40 dk -> 1 saat * ₺0 (Hasan Murat Şahin)", "assignmentId": 174, "professionalId": 167, "durationMinutes": 40, "professionalName": "Hasan Murat Şahin"}]	0	\N
286	MP-ANKARA	6	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.179	2026-06-01 11:50:58	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 8760 dk -> 146 saat * ₺0 (Şahide Merve Kırdal)", "assignmentId": 149, "professionalId": 151, "durationMinutes": 8760, "professionalName": "Şahide Merve Kırdal"}]	0	\N
287	İSU-LIV-TOPKAP	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.18	2026-06-01 11:50:58.001	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 5640 dk -> 94 saat * ₺0 (Halime Şayak)", "assignmentId": 173, "professionalId": 166, "durationMinutes": 5640, "professionalName": "Halime Şayak"}]	0	\N
288	VM-MP-FATIH	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.18	2026-06-01 11:50:58.001	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 720 dk -> 12 saat * ₺0 (Gülsün SEVEN)", "assignmentId": 178, "professionalId": 170, "durationMinutes": 720, "professionalName": "Gülsün SEVEN"}]	0	\N
289	MP-SEYHAN	9	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.181	2026-06-01 11:50:58.002	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 3800 dk -> 64 saat * ₺0 (Kasım Yiğit)", "assignmentId": 170, "professionalId": 163, "durationMinutes": 3800, "professionalName": "Kasım Yiğit"}]	0	\N
276	MP-İZMIR	2	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.172	2026-06-01 11:50:57.991	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
277	VM-MP-ANKARA	6	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.172	2026-06-01 11:50:57.992	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7320 dk -> 122 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7320, "professionalName": "Gülçin AKTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4360 dk -> 73 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 4360, "professionalName": "Gökmen GÜNDOĞDU"}]	0	\N
278	İSU-LIV-TOPKAP	3	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.173	2026-06-01 11:50:57.993	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4230 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 94, "professionalId": 69, "durationMinutes": 4230, "professionalName": "Murad DİREN"}]	0	\N
279	MP-TEM	3	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.174	2026-06-01 11:50:57.993	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4245 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4245, "professionalName": "Murad DİREN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1320 dk -> 22 saat * ₺0 (Tülay Demirci)", "assignmentId": 171, "professionalId": 164, "durationMinutes": 1320, "professionalName": "Tülay Demirci"}]	0	\N
281	MLP-CAGRI-MERKE	8	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.176	2026-06-01 11:50:57.995	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 500 dk -> 9 saat * ₺0 (Emin Berat Uzuner)", "assignmentId": 152, "professionalId": 154, "durationMinutes": 500, "professionalName": "Emin Berat Uzuner"}]	0	\N
283	MLP-İGA	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.177	2026-06-01 11:50:57.996	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 130 dk -> 3 saat * ₺0 (Hakan Yılmaz)", "assignmentId": 159, "professionalId": 159, "durationMinutes": 130, "professionalName": "Hakan Yılmaz"}]	0	\N
314	LIV-GAZIANTEP	7	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.447	2026-06-01 11:52:52.718	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4240 dk -> 71 saat * ₺0 (Yaşar POLAT)", "assignmentId": 2, "professionalId": 11, "durationMinutes": 4240, "professionalName": "Yaşar POLAT"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Resul Güler)", "assignmentId": 157, "professionalId": 157, "durationMinutes": 11700, "professionalName": "Resul Güler"}]	0	\N
311	MP-KARADENIZ	1	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.441	2026-06-01 11:52:52.714	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 2480 dk -> 42 saat * ₺0 (Fatma Nur TÜRKSOY)", "assignmentId": 35, "professionalId": 42, "durationMinutes": 2480, "professionalName": "Fatma Nur TÜRKSOY"}]	10000	\N
310	MP-GOZTEPE	3	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.44	2026-06-01 11:52:52.713	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatih Mehmet ÖZAYDIN)", "assignmentId": 29, "professionalId": 33, "durationMinutes": 11700, "professionalName": "Fatih Mehmet ÖZAYDIN"}]	0	\N
312	MP-CANAKKALE	5	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.444	2026-06-01 11:52:52.716	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 75 dk -> 2 saat * ₺0 (Emrah Direk)", "assignmentId": 151, "professionalId": 153, "durationMinutes": 75, "professionalName": "Emrah Direk"}]	0	\N
315	İSU-LIV-BAHCES	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.448	2026-06-01 11:52:52.719	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Doğan Can GÜNEŞ)", "assignmentId": 71, "professionalId": 3, "durationMinutes": 11700, "professionalName": "Doğan Can GÜNEŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Elif Sevinç)", "assignmentId": 180, "professionalId": 171, "durationMinutes": 11700, "professionalName": "Elif Sevinç"}]	0	\N
275	İSU-LIV-BAHCES	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.171	2026-06-01 11:50:57.99	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Doğan Can GÜNEŞ)", "assignmentId": 71, "professionalId": 3, "durationMinutes": 11700, "professionalName": "Doğan Can GÜNEŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Elif Sevinç)", "assignmentId": 180, "professionalId": 171, "durationMinutes": 11700, "professionalName": "Elif Sevinç"}]	0	\N
316	MP-İZMIR	2	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.45	2026-06-01 11:52:52.719	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
318	İSU-LIV-TOPKAP	3	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.451	2026-06-01 11:52:52.722	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4230 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 94, "professionalId": 69, "durationMinutes": 4230, "professionalName": "Murad DİREN"}]	0	\N
319	MP-TEM	3	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.453	2026-06-01 11:52:52.723	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4245 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4245, "professionalName": "Murad DİREN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1320 dk -> 22 saat * ₺0 (Tülay Demirci)", "assignmentId": 171, "professionalId": 164, "durationMinutes": 1320, "professionalName": "Tülay Demirci"}]	0	\N
320	MP-İSTANBUL-ON	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.454	2026-06-01 11:52:52.724	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 9840 dk -> 164 saat * ₺0 (Ömer Faruk AYDIN)", "assignmentId": 110, "professionalId": 65, "durationMinutes": 9840, "professionalName": "Ömer Faruk AYDIN"}]	0	\N
321	MLP-CAGRI-MERKE	8	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.455	2026-06-01 11:52:52.725	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 500 dk -> 9 saat * ₺0 (Emin Berat Uzuner)", "assignmentId": 152, "professionalId": 154, "durationMinutes": 500, "professionalName": "Emin Berat Uzuner"}]	0	\N
322	GOP-DIYALIZ-MER	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.455	2026-06-01 11:52:52.725	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1240 dk -> 21 saat * ₺0 (Burak Kurt)", "assignmentId": 154, "professionalId": 155, "durationMinutes": 1240, "professionalName": "Burak Kurt"}]	0	\N
323	MLP-İGA	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.456	2026-06-01 11:52:52.726	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 130 dk -> 3 saat * ₺0 (Hakan Yılmaz)", "assignmentId": 159, "professionalId": 159, "durationMinutes": 130, "professionalName": "Hakan Yılmaz"}]	0	\N
324	İSTINYE-DENT	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.457	2026-06-01 11:52:52.727	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 800 dk -> 14 saat * ₺0 (Burak Kurt)", "assignmentId": 161, "professionalId": 155, "durationMinutes": 800, "professionalName": "Burak Kurt"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 162, "professionalId": 103, "durationMinutes": 400, "professionalName": "Fevzi AKDEMİR"}]	0	\N
325	MLP-KARADENIZ-I	1	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.458	2026-06-01 11:52:52.728	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 40 dk -> 1 saat * ₺0 (Hasan Murat Şahin)", "assignmentId": 174, "professionalId": 167, "durationMinutes": 40, "professionalName": "Hasan Murat Şahin"}]	0	\N
326	MP-ANKARA	6	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.458	2026-06-01 11:52:52.728	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 8760 dk -> 146 saat * ₺0 (Şahide Merve Kırdal)", "assignmentId": 149, "professionalId": 151, "durationMinutes": 8760, "professionalName": "Şahide Merve Kırdal"}]	0	\N
327	İSU-LIV-TOPKAP	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.459	2026-06-01 11:52:52.729	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 5640 dk -> 94 saat * ₺0 (Halime Şayak)", "assignmentId": 173, "professionalId": 166, "durationMinutes": 5640, "professionalName": "Halime Şayak"}]	0	\N
328	VM-MP-FATIH	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.46	2026-06-01 11:52:52.731	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 720 dk -> 12 saat * ₺0 (Gülsün SEVEN)", "assignmentId": 178, "professionalId": 170, "durationMinutes": 720, "professionalName": "Gülsün SEVEN"}]	0	\N
329	MP-SEYHAN	9	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.461	2026-06-01 11:52:52.732	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 3800 dk -> 64 saat * ₺0 (Kasım Yiğit)", "assignmentId": 170, "professionalId": 163, "durationMinutes": 3800, "professionalName": "Kasım Yiğit"}]	0	\N
317	VM-MP-ANKARA	6	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.45	2026-06-01 11:52:52.72	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7320 dk -> 122 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7320, "professionalName": "Gülçin AKTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4360 dk -> 73 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 4360, "professionalName": "Gökmen GÜNDOĞDU"}]	0	\N
271	MP-KARADENIZ	1	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.167	2026-06-01 11:50:57.985	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 2480 dk -> 42 saat * ₺0 (Fatma Nur TÜRKSOY)", "assignmentId": 35, "professionalId": 42, "durationMinutes": 2480, "professionalName": "Fatma Nur TÜRKSOY"}]	10000	\N
273	VM-MP-PENDIK	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.169	2026-06-01 11:50:57.988	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1845 dk -> 31 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 1845, "professionalName": "Fevzi AKDEMİR"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 440 dk -> 8 saat * ₺0 (Derya Baral)", "assignmentId": 181, "professionalId": 172, "durationMinutes": 440, "professionalName": "Derya Baral"}]	0	\N
99	VM-MP-PENDIK	4	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.029	2026-06-01 11:51:55.139	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1845 dk -> 31 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 1845, "professionalName": "Fevzi AKDEMİR"}]	0	\N
313	VM-MP-PENDIK	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.445	2026-06-01 11:52:52.717	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1845 dk -> 31 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 1845, "professionalName": "Fevzi AKDEMİR"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 440 dk -> 8 saat * ₺0 (Derya Baral)", "assignmentId": 181, "professionalId": 172, "durationMinutes": 440, "professionalName": "Derya Baral"}]	0	\N
\.


--
-- Data for Name: ReportTemplate; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."ReportTemplate" (id, code, name, version, "isActive", "isArchived", module, "documentNo", "revisionNo", "releaseDate", content, orientation, "logoUrl", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RiskAuditLog; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."RiskAuditLog" (id, "riskId", action, details, "changedFields", username, "createdAt") FROM stdin;
5a35d8db-df2a-4da9-b77f-6e03cca91dd3	6fe81944-1d43-4b5e-a645-264b28232f82	Güncellendi	Risk detayları güncellendi.	{"dueDate": {"new": "2026-12-31T00:00:00.000Z", "old": null}, "actionsTaken": {"new": "", "old": null}, "detectionDate": {"new": "2026-04-14T00:00:00.000Z", "old": "1970-01-01T00:00:46.125Z"}, "improvementResponsible": {"new": "Başhekimlik", "old": null}}	metin.salik	2026-05-22 07:26:24.197
\.


--
-- Data for Name: RiskCategorySetting; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."RiskCategorySetting" (id, "facilityId", name, "createdAt", "updatedAt") FROM stdin;
1	LIV-ANKARA	Tıbbi Hizmetler	2026-05-19 18:01:30.397	2026-05-19 18:01:30.397
2	LIV-ANKARA	Yönetsel Hizmetler	2026-05-19 18:01:30.406	2026-05-19 18:01:30.406
3	LIV-ANKARA	Tesis Güvenliği	2026-05-19 18:01:30.41	2026-05-19 18:01:30.41
4	LIV-ANKARA	Çevre Güvenliği	2026-05-19 18:01:30.417	2026-05-19 18:01:30.417
5	LIV-ANKARA	İş Sağlığı ve Güvenliği	2026-05-19 18:01:30.422	2026-05-19 18:01:30.422
6	GOP-DIYALIZ-MER	Tıbbi Hizmetler	2026-05-19 19:40:20.371	2026-05-19 19:40:20.371
\.


--
-- Data for Name: RiskDepartment; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."RiskDepartment" (id, "facilityId", name, "createdAt", "updatedAt", code) FROM stdin;
1	GOP-DIYALIZ-MER	Acil Servis	2026-05-18 14:06:59.221	2026-05-18 14:06:59.221	\N
2	LIV-ANKARA	Acil Servis	2026-05-19 18:01:30.378	2026-05-19 18:01:30.378	\N
3	LIV-ANKARA	Yatan Hasta Servisi	2026-05-19 18:01:30.382	2026-05-19 18:01:30.382	\N
4	LIV-ANKARA	Yetişkin Yoğun Bakım	2026-05-19 18:01:30.385	2026-05-19 18:01:30.385	\N
5	GOP-DIYALIZ-MER	Yetişkin Yoğun Bakım	2026-05-19 19:04:17.068	2026-05-19 19:04:17.068	\N
6	MLP-ANTALYA-KON	FAZ-1 Klinik Araştırmalar Merkezi	2026-05-22 06:36:28.388	2026-05-22 06:36:28.388	\N
7	GOP-DIYALIZ-MER	FAZ-1 Klinik Araştırmalar Merkezi	2026-05-22 06:38:33.067	2026-05-22 06:38:33.067	\N
\.


--
-- Data for Name: RiskDepartmentSetting; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."RiskDepartmentSetting" (id, "facilityId", name, "createdAt", "updatedAt") FROM stdin;
1	LIV-ANKARA	Başhekimlik	2026-05-19 18:01:30.386	2026-05-19 18:01:30.386
2	LIV-ANKARA	Bilgi Sistemleri Müdürlüğü	2026-05-19 18:01:30.388	2026-05-19 18:01:30.388
3	LIV-ANKARA	Biyomedikal Müdürlüğü	2026-05-19 18:01:30.389	2026-05-19 18:01:30.389
4	LIV-ANKARA	Hasta Bakım Hizmetleri Müdürlüğü	2026-05-19 18:01:30.39	2026-05-19 18:01:30.39
5	LIV-ANKARA	İnsan Kaynakları Müdürlüğü	2026-05-19 18:01:30.391	2026-05-19 18:01:30.391
6	LIV-ANKARA	İş Sağlığı ve Güvenliği	2026-05-19 18:01:30.391	2026-05-19 18:01:30.391
7	LIV-ANKARA	Kalite Müdürlüğü	2026-05-19 18:01:30.392	2026-05-19 18:01:30.392
8	LIV-ANKARA	Misafir Hizmetleri Müdürlüğü	2026-05-19 18:01:30.393	2026-05-19 18:01:30.393
9	LIV-ANKARA	Otelcilik ve Destek Hizmetleri Müdürlüğü	2026-05-19 18:01:30.393	2026-05-19 18:01:30.393
10	LIV-ANKARA	Teknik Hizmetler Müdürlüğü	2026-05-19 18:01:30.394	2026-05-19 18:01:30.394
11	LIV-ANKARA	Satınalma Müdürlüğü	2026-05-19 18:01:30.395	2026-05-19 18:01:30.395
12	LIV-ANKARA	Üst Yönetim	2026-05-19 18:01:30.395	2026-05-19 18:01:30.395
13	LIV-ANKARA	Diğer	2026-05-19 18:01:30.396	2026-05-19 18:01:30.396
14	LIV-ANKARA	Ar-Ge Mudurlugu	2026-05-19 18:03:31.821	2026-05-19 18:03:31.821
15	GOP-DIYALIZ-MER	Başhekimlik	2026-05-19 19:40:06.307	2026-05-19 19:40:06.307
\.


--
-- Data for Name: RiskExpertFacility; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."RiskExpertFacility" ("expertUsername", "facilityId") FROM stdin;
\.


--
-- Data for Name: RiskLifecycle; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."RiskLifecycle" (id, "departmentId", "riskNo", "riskCategory", "subCategory", area, method, activity, hazard, "riskDescription", "initialCondition", "initialImage", "initialProb", "initialFreq", "initialSev", "initialScore", "initialLevel", "firstActionPlan", "actionsTaken", "actionDate", "actionBy", "actionImage", "followUpMeasure", "extraImprovement", "finalProb", "finalFreq", "finalSev", "finalScore", "finalLevel", status, "createdBy", "createdAt", "updatedAt", "affectedPeople", "controlResponsible", "controlResult", "detectionDate", "dueDate", "effectivenessMethod", "impactDamage", "improvementResponsible", legislation, "postImprovementDueDate", "postImprovementResponsible") FROM stdin;
ba7a11d0-53ed-4a25-acc6-c1b568c40c0e	1	1	Tıbbi Hizmetler	Hizmete erişim ile ilgili riskler	Acil Servis	Fine Kinney	Deneme	Deneme	Deneme	deneme	\N	6	6	15	540	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-05-22 06:27:00.777	2026-05-22 06:27:00.777	Çalışanlar	\N	\N	2026-05-22 00:00:00	2026-12-31 00:00:00	\N	Deneme	Başhekimlik	isg kanunu	\N	\N
9d03f8f2-5c9f-48e2-acfd-b1ae06d7d510	6	1	Tıbbi Hizmetler	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Gönüllü tedavi ve klinik araştırma sırasında kesici delici alet kullanımı	Kesici Delici Alet Yaralanması	Enfeksiyon, Bulaşıcı Hastalık	HEM-T06 İlaçların Hazırlanması ve Uygulanması Talimatı	\N	10	6	15	900	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:28.392	2026-05-22 06:36:28.392	Hemşire, Doktor	\N	\N	2026-04-13 00:00:00	\N	\N	Bulaşıcı Hastalık	\N	\N	\N	\N
7f9adda2-ecf8-42ab-a0e3-5278f716a7d3	6	2	Tıbbi Hizmetler	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Gönüllü kabul sürecinin planlanması	Klinik Araştırma olası tehlike ve risklerinin detaylı şekilde belirtilmemiş olması	Riskleri Bilmeme	Kalite prosedür ve talimatlarında ilgili süreçler kalite sistemi içine eklenmemiştir.	\N	10	1	7	70	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:28.395	2026-05-22 06:36:28.395	Gönüllü	\N	\N	2026-04-13 00:00:00	\N	\N	Ölüm	\N	\N	\N	\N
cb8ff94b-d175-4662-9647-dccf762200ee	6	3	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Klinik Merkezi Giriş Kapısı	Kapı geçişinde sedye ve yatak geçişine uygun değildir.	Gönüllü Transferinde kapı geçişinde kapının kırılması ve kapı camın dağılması	Otomatik ve kilitli konumda kayar kapı yerleştirilken yata ve sedye geçişi için 120 cm olup olmadığı kontrol edilmemiştir.	\N	3	3	7	63	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:28.397	2026-05-22 06:36:28.397	Gönüllü, Hemşire, Doktor	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma	\N	\N	\N	\N
2ea19522-96ee-4a03-bf67-b659f9b51048	6	4	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Tali Elektrik Panolarının kilitli olmaması	Elektrik altyapısına müdahale edilmesi, Sabotaj	Elektrik Çarpması, Kritik sistemlerin kapalı olması	Tali Pano odası ortamdaki tüm herkes için ulaşılabilir ve açık konumdadır. 	\N	6	6	15	540	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:28.399	2026-05-22 06:36:28.399	Gönüllü, Hemşire, Doktor	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma, Ölüm	\N	\N	\N	\N
2850eae6-0aab-4b5f-b5a7-e39572d7fb38	6	5	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Tahliye Planları bulunmuyor	Acil durum anında alanın tahliye edilememesi	Alan Boşaltılmaması	Mevcut durumda İtfaiye Raporu için hazırlanmış mimari planlar alana asılmıştır.	\N	6	2	40	480	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:28.402	2026-05-22 06:36:28.402	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma, Ölüm	\N	\N	\N	\N
565ee497-fba1-4f07-a4a5-5728e81e342f	6	1	Tıbbi Hizmetler	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Gönüllü tedavi ve klinik araştırma sırasında kesici delici alet kullanımı	Kesici Delici Alet Yaralanması	Enfeksiyon, Bulaşıcı Hastalık	HEM-T06 İlaçların Hazırlanması ve Uygulanması Talimatı	\N	10	6	15	900	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.775	2026-05-22 06:36:48.775	Hemşire, Doktor	\N	\N	2026-04-13 00:00:00	\N	\N	Bulaşıcı Hastalık	\N	\N	\N	\N
5a325eac-a091-4beb-88c2-9ec2bc41657a	6	2	Tıbbi Hizmetler	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Gönüllü kabul sürecinin planlanması	Klinik Araştırma olası tehlike ve risklerinin detaylı şekilde belirtilmemiş olması	Riskleri Bilmeme	Kalite prosedür ve talimatlarında ilgili süreçler kalite sistemi içine eklenmemiştir.	\N	10	1	7	70	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.779	2026-05-22 06:36:48.779	Gönüllü	\N	\N	2026-04-13 00:00:00	\N	\N	Ölüm	\N	\N	\N	\N
24b092d0-7b70-4115-8512-2ba1d81b1959	6	3	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Klinik Merkezi Giriş Kapısı	Kapı geçişinde sedye ve yatak geçişine uygun değildir.	Gönüllü Transferinde kapı geçişinde kapının kırılması ve kapı camın dağılması	Otomatik ve kilitli konumda kayar kapı yerleştirilken yata ve sedye geçişi için 120 cm olup olmadığı kontrol edilmemiştir.	\N	3	3	7	63	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.781	2026-05-22 06:36:48.781	Gönüllü, Hemşire, Doktor	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma	\N	\N	\N	\N
d9a94237-942c-4aea-8357-fbb34fec2988	6	4	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Tali Elektrik Panolarının kilitli olmaması	Elektrik altyapısına müdahale edilmesi, Sabotaj	Elektrik Çarpması, Kritik sistemlerin kapalı olması	Tali Pano odası ortamdaki tüm herkes için ulaşılabilir ve açık konumdadır. 	\N	6	6	15	540	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.783	2026-05-22 06:36:48.783	Gönüllü, Hemşire, Doktor	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma, Ölüm	\N	\N	\N	\N
a45d6295-3943-45e2-a603-278ae59449a7	6	5	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Tahliye Planları bulunmuyor	Acil durum anında alanın tahliye edilememesi	Alan Boşaltılmaması	Mevcut durumda İtfaiye Raporu için hazırlanmış mimari planlar alana asılmıştır.	\N	6	2	40	480	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.785	2026-05-22 06:36:48.785	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma, Ölüm	\N	\N	\N	\N
0792be54-222c-4605-a220-9ebca45208c6	6	6	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Yangın söndürme ekipmanı	Yangına müdahale eksikliği	Yangın	Yaklaşık 200 m2 alan içerisinde bir adet 6kg ABC tipi yangın söndürme cihazı bulunmaktadır.	\N	1	1	40	40	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.787	2026-05-22 06:36:48.787	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma, Ölüm	\N	\N	\N	\N
2b68644e-829e-44d6-9943-44bd9d295ef6	6	7	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Yangın söndürme ekipmanlarının aylık bakımları	Yangına müdahale eksikliği	Yangın	Aylık bakım kartları tespit edilmemiştir.	\N	3	2	15	90	Önemli Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.789	2026-05-22 06:36:48.789	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma	\N	\N	\N	\N
c31842a6-d120-43bb-9059-65b705d79147	6	8	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Yangın söndürme ekipmanlarının periyodik bakımları	Yangına müdahale eksikliği	Yangın	Yıllık periyodik bakım ve kontrolleri süresi henüz gelmemiştır. Fakat bir Periyodik kontrol planı tespit edilememiştir.	\N	3	2	15	90	Önemli Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.791	2026-05-22 06:36:48.791	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma	\N	\N	\N	\N
b487f9d9-deee-4569-9537-82a3cd818df0	6	9	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.792	2026-05-22 06:36:48.792	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2c9c9c0c-a465-4cb1-a21a-05a1ba8c5539	6	10	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.794	2026-05-22 06:36:48.794	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
19315d19-67b5-4215-bc54-7bf96c8937c8	6	11	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.795	2026-05-22 06:36:48.795	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
169a67f9-728d-41e6-ac28-d7ef239dcac3	6	12	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.797	2026-05-22 06:36:48.797	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6267bb2b-38c9-442c-9ff3-7eaefc72e768	6	13	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.799	2026-05-22 06:36:48.799	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
07f4fa1a-ea97-4ce7-923d-7aec79153d1a	6	14	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.8	2026-05-22 06:36:48.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
aca87a25-d663-4896-8f5d-9cbe5f95de83	6	15	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.801	2026-05-22 06:36:48.801	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
eaff08dd-881d-4fcf-bb2c-19201978d33f	6	16	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.803	2026-05-22 06:36:48.803	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
57250dbf-515e-4d92-ace4-203234c3d816	6	17	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.804	2026-05-22 06:36:48.804	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b69bfa57-a269-4750-94d4-43aabeaf9a60	6	18	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.805	2026-05-22 06:36:48.805	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b6784ca5-f84d-4848-8cf8-a207b3c21127	6	19	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.807	2026-05-22 06:36:48.807	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d94c6fa1-e653-4c11-8449-e775b91cbd5b	6	20	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.808	2026-05-22 06:36:48.808	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
aba0b926-fdc6-48f3-9a3d-b4a8c33ba734	6	21	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.809	2026-05-22 06:36:48.809	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
375bf7c8-b54a-416f-9e39-d71a41205d49	6	22	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.81	2026-05-22 06:36:48.81	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3cf3bdd0-a02c-4ecd-bc77-06c950ed69c8	6	23	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.812	2026-05-22 06:36:48.812	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0e96ac4a-aa06-4dec-8670-c97a35789af0	6	24	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.813	2026-05-22 06:36:48.813	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
175395dc-04d9-4488-b13b-c192489b513a	6	25	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.815	2026-05-22 06:36:48.815	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0f707c15-61c6-4e76-bad3-8cdb35c30b86	6	26	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.816	2026-05-22 06:36:48.816	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7a9def47-b87e-490a-9174-f2d726cfd2a3	6	27	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.817	2026-05-22 06:36:48.817	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1c676854-69ce-4708-978a-8f7ba5969d4d	6	28	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.819	2026-05-22 06:36:48.819	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8a7a2ed9-6baa-4d20-932b-040bd4f8ae37	6	29	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.82	2026-05-22 06:36:48.82	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e3bb6262-ee03-4dda-921d-a7ad69b06997	6	30	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.821	2026-05-22 06:36:48.821	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b9a9fdba-5645-42b0-b8dc-e21b9e926dbc	6	31	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.823	2026-05-22 06:36:48.823	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1f1af2b4-9651-4487-8492-0963fb0b100d	6	32	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.824	2026-05-22 06:36:48.824	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
40c6eb12-8503-4252-aeff-960090b1ba65	6	33	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.825	2026-05-22 06:36:48.825	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
30b6bd00-ba3a-4769-ad61-1c7eab416077	6	34	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.827	2026-05-22 06:36:48.827	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e5fb3c49-2e58-48d7-950b-701b7b354900	6	35	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.828	2026-05-22 06:36:48.828	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ffe1a0ee-0c16-44a8-b236-87c42b096f4d	6	36	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.829	2026-05-22 06:36:48.829	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
06eaeb19-af48-44d3-a224-2ae72ee47012	6	37	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.83	2026-05-22 06:36:48.83	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
443382ef-6356-48e4-a175-ed31bc81e1bc	6	38	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.832	2026-05-22 06:36:48.832	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e724d6fd-b04b-4c26-9607-03746d3787d8	6	39	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.833	2026-05-22 06:36:48.833	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bb8be763-76db-40a1-977e-37ecd312448b	6	40	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.834	2026-05-22 06:36:48.834	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
77f133ae-3c55-40c2-8225-40fa7c54e27e	6	41	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.835	2026-05-22 06:36:48.835	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
529d2b74-a358-4fcf-9c78-1f0cc83fd4c1	6	42	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.837	2026-05-22 06:36:48.837	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
64b5cc7b-ed0c-4870-9d17-50b2df7de8a0	6	43	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.838	2026-05-22 06:36:48.838	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7f817a69-f9d0-4529-98da-eab5e35f7dcc	6	44	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.839	2026-05-22 06:36:48.839	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
89e18c1e-d99a-4e38-811e-09731956271e	6	45	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.84	2026-05-22 06:36:48.84	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a2e0d9bf-5855-406b-83d2-124413b84e39	6	46	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.842	2026-05-22 06:36:48.842	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0c6975c7-96e2-4819-9d7a-c42aac0d6e55	6	47	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.843	2026-05-22 06:36:48.843	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
89dbb3f2-1d1b-4cd0-a13e-505223fd7105	6	48	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.844	2026-05-22 06:36:48.844	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f84535ed-49d2-4f12-9c52-5c90a48064a8	6	49	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.845	2026-05-22 06:36:48.845	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7ba1898e-cd94-4131-8c10-bdf9b71b7b52	6	50	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.846	2026-05-22 06:36:48.846	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9924f27f-4ede-469c-bccb-4ffcb5953d73	6	51	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.848	2026-05-22 06:36:48.848	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cc06ad06-e635-4eaa-8552-10f6330cb375	6	52	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.849	2026-05-22 06:36:48.849	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
48617ad8-64aa-428e-a3ad-c86fb86d3d3b	6	53	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.85	2026-05-22 06:36:48.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b2b94f8f-bc08-4590-a14b-2b33a3725021	6	54	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.851	2026-05-22 06:36:48.851	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1baad3fc-a167-42ee-9af1-4d20ff6a8693	6	55	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.852	2026-05-22 06:36:48.852	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7fa1ad3e-f89a-4223-a7fe-7d48d33863e7	6	56	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.854	2026-05-22 06:36:48.854	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
54c5fb34-8d2d-45f7-837e-c9ae7bd63ffd	6	57	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.855	2026-05-22 06:36:48.855	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b0c93e2c-0126-4d88-993f-d950d14d85f6	6	58	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.856	2026-05-22 06:36:48.856	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bf5ea7fb-6791-416f-84fa-f2e6f6ba106f	6	59	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.857	2026-05-22 06:36:48.857	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bbb8bade-259e-4d9c-9b06-90e1d2e6750b	6	60	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.858	2026-05-22 06:36:48.858	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0bcde6ee-bbf3-4440-80b1-7a0216896d03	6	61	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.86	2026-05-22 06:36:48.86	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
34ec36a6-7207-4d85-a58f-81020ae2ac2d	6	62	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.861	2026-05-22 06:36:48.861	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d30c23db-35a7-410d-9009-35626921c31b	6	63	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.862	2026-05-22 06:36:48.862	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a4329522-ab02-47c0-ad19-ed0ffdf931e6	6	64	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.863	2026-05-22 06:36:48.863	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
94b30973-01a3-4a16-8f55-1409e3413aa9	6	65	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.865	2026-05-22 06:36:48.865	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2ee8ed9f-1ba5-420c-9601-9640507344de	6	66	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.866	2026-05-22 06:36:48.866	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
09c70baf-7d52-40af-b80d-74ec382f6968	6	67	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.867	2026-05-22 06:36:48.867	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e1774b28-723f-4a48-8785-70dd18ed5a94	6	68	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.869	2026-05-22 06:36:48.869	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d7145520-83fd-4fc8-aaed-2cd5642ee931	6	69	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.87	2026-05-22 06:36:48.87	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
526e006c-48f4-44ec-bd96-5ae3f32639dd	6	70	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.871	2026-05-22 06:36:48.871	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
749b817a-a311-42f7-bfc6-7237cf46199c	6	71	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.872	2026-05-22 06:36:48.872	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
57b31e04-6d05-4852-a7eb-0055401e7db4	6	72	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.874	2026-05-22 06:36:48.874	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a72f1f38-82bf-4fa4-bda2-02d122ca9766	6	73	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.875	2026-05-22 06:36:48.875	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e7622ae2-460a-42c0-8558-ad84263b789d	6	74	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.876	2026-05-22 06:36:48.876	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
da1f75ce-29de-490f-9a91-1e5ce8cc330a	6	75	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.877	2026-05-22 06:36:48.877	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c010d676-460c-4e17-aa61-8503c1e521b2	6	76	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.879	2026-05-22 06:36:48.879	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
514a3bc2-fca0-45d5-80a5-d850789887cb	6	77	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.88	2026-05-22 06:36:48.88	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d9dddbb2-a40d-45f5-ac3c-58efd657d3e1	6	78	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.881	2026-05-22 06:36:48.881	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8c4b4e6c-c04f-4f5c-9026-7c0c3cbaefa7	6	79	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.882	2026-05-22 06:36:48.882	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2c998dde-d3e1-461e-a1f8-a0b93bf2d8ba	6	80	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.883	2026-05-22 06:36:48.883	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3354d2bf-f3fd-4a3c-9f26-ec3862f423d0	6	81	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.885	2026-05-22 06:36:48.885	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e782559e-d6d2-478d-a4d2-11c6fadaa5c0	6	82	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.886	2026-05-22 06:36:48.886	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c3d59556-44b9-4ccc-b0bb-5658386379f9	6	83	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.887	2026-05-22 06:36:48.887	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
81fb944b-29c5-478a-9014-009f13467868	6	84	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.888	2026-05-22 06:36:48.888	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6f959355-af82-4564-864d-77647de5c266	6	85	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.89	2026-05-22 06:36:48.89	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0a2bbf26-89b7-4065-b234-847aa983172a	6	86	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.891	2026-05-22 06:36:48.891	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
effe433c-c410-441e-a527-65dbb5fe09c9	6	87	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.893	2026-05-22 06:36:48.893	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
83175095-e5d3-429e-a0ea-bf7a8b7ce3d9	6	88	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.894	2026-05-22 06:36:48.894	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8cab8d58-7ee7-44ca-8817-9bba5f05ed74	6	89	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.895	2026-05-22 06:36:48.895	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
34d2a4eb-1493-43e3-b723-0786ad915302	6	90	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.897	2026-05-22 06:36:48.897	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3f8fde68-e1a3-4da4-b195-2bfbff8efdf6	6	91	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.898	2026-05-22 06:36:48.898	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
da025a83-6fc1-466c-b649-87d422b5b558	6	92	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.899	2026-05-22 06:36:48.899	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
daf90704-4bbd-4b03-8138-2b25d209c95c	6	93	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.9	2026-05-22 06:36:48.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
28ee27f4-f745-4dff-b12e-c073dfe9c4b6	6	1	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.902	2026-05-22 06:36:48.902	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f3945b33-09bd-423c-9f1b-0384deb1cb6c	6	1	Genel	\N	İş Güvenliği Uzmanları	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.903	2026-05-22 06:36:48.903	\N	\N	\N	\N	\N	\N	İşyeri Hekimi	\N	\N	\N	\N
292e40ff-2a0c-4bfa-be50-984bd9598844	6	1	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.904	2026-05-22 06:36:48.904	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b510958c-9bf9-463a-9484-20f22a308202	7	2	Tıbbi Hizmetler	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Gönüllü kabul sürecinin planlanması	Klinik Araştırma olası tehlike ve risklerinin detaylı şekilde belirtilmemiş olması	Riskleri Bilmeme	Kalite prosedür ve talimatlarında ilgili süreçler kalite sistemi içine eklenmemiştir.	\N	10	1	7	70	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.072	2026-05-22 06:38:33.072	Gönüllü	\N	\N	1970-01-01 00:00:46.125	\N	\N	Ölüm	\N	\N	\N	\N
a86bb4cd-ce91-46b5-a6a9-2d601bf8b18e	7	3	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Klinik Merkezi Giriş Kapısı	Kapı geçişinde sedye ve yatak geçişine uygun değildir.	Gönüllü Transferinde kapı geçişinde kapının kırılması ve kapı camın dağılması	Otomatik ve kilitli konumda kayar kapı yerleştirilken yata ve sedye geçişi için 120 cm olup olmadığı kontrol edilmemiştir.	\N	3	3	7	63	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.073	2026-05-22 06:38:33.073	Gönüllü, Hemşire, Doktor	\N	\N	1970-01-01 00:00:46.125	\N	\N	Yaralanma	\N	\N	\N	\N
75c358ed-0790-42f4-a22e-2e375f29f09f	7	4	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Tali Elektrik Panolarının kilitli olmaması	Elektrik altyapısına müdahale edilmesi, Sabotaj	Elektrik Çarpması, Kritik sistemlerin kapalı olması	Tali Pano odası ortamdaki tüm herkes için ulaşılabilir ve açık konumdadır. 	\N	6	6	15	540	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.075	2026-05-22 06:38:33.075	Gönüllü, Hemşire, Doktor	\N	\N	1970-01-01 00:00:46.125	\N	\N	Yaralanma, Ölüm	\N	\N	\N	\N
54d4f3b8-b2f2-4244-8a99-4ffd14a86137	7	6	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Yangın söndürme ekipmanı	Yangına müdahale eksikliği	Yangın	Yaklaşık 200 m2 alan içerisinde bir adet 6kg ABC tipi yangın söndürme cihazı bulunmaktadır.	\N	1	1	40	40	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.078	2026-05-22 06:38:33.078	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	1970-01-01 00:00:46.125	\N	\N	Yaralanma, Ölüm	\N	\N	\N	\N
08ba098c-9bfb-4f01-a7c2-b01284bf2b48	7	7	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Yangın söndürme ekipmanlarının aylık bakımları	Yangına müdahale eksikliği	Yangın	Aylık bakım kartları tespit edilmemiştir.	\N	3	2	15	90	Önemli Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.08	2026-05-22 06:38:33.08	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	1970-01-01 00:00:46.125	\N	\N	Yaralanma	\N	\N	\N	\N
aa61434e-a4ee-423d-96ed-3e3328388f22	7	8	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Yangın söndürme ekipmanlarının periyodik bakımları	Yangına müdahale eksikliği	Yangın	Yıllık periyodik bakım ve kontrolleri süresi henüz gelmemiştır. Fakat bir Periyodik kontrol planı tespit edilememiştir.	\N	3	2	15	90	Önemli Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.081	2026-05-22 06:38:33.081	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	1970-01-01 00:00:46.125	\N	\N	Yaralanma	\N	\N	\N	\N
6fe81944-1d43-4b5e-a645-264b28232f82	7	5	Tesis Güvenliği		FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Tahliye Planları bulunmuyor	Acil durum anında alanın tahliye edilememesi	Alan Boşaltılmaması	Mevcut durumda İtfaiye Raporu için hazırlanmış mimari planlar alana asılmıştır.		6	2	40	480	Tolere Gösterilmez Risk	\N		\N	\N		\N	\N	\N	\N	\N	\N		ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.077	2026-05-22 07:26:24.193	Gönüllü, Hemşire, Doktor, Çalışanlar			2026-04-14 00:00:00	2026-12-31 00:00:00		Yaralanma, Ölüm	Başhekimlik		\N	
1e2b1784-e35f-48a9-96d1-fed5b585ea9f	7	1	Tıbbi Hizmetler	Hizmete erişim ile ilgili riskler	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney	Gönüllü tedavi ve klinik araştırma sırasında kesici delici alet kullanımı	Kesici Delici Alet Yaralanması	Enfeksiyon, Bulaşıcı Hastalık	HEM-T06 İlaçların Hazırlanması ve Uygulanması Talimatı		10	6	15	900	Tolere Gösterilmez Risk	\N		\N	\N		\N	\N	\N	\N	\N	\N		ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.07	2026-05-22 06:50:12.464	Hemşire, Doktor			2026-04-14 00:00:00	2026-12-31 00:00:00		Bulaşıcı Hastalık	Başhekimlik		\N	
\.


--
-- Data for Name: RiskSubCategorySetting; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."RiskSubCategorySetting" (id, name, "categoryId", "createdAt", "updatedAt") FROM stdin;
1	Hizmete erişim ile ilgili riskler	1	2026-05-19 18:01:30.399	2026-05-19 18:01:30.399
2	Hasta kabul süreci ile ilgili riskler	1	2026-05-19 18:01:30.401	2026-05-19 18:01:30.401
3	Tanı süreci ile ilgili riskler	1	2026-05-19 18:01:30.402	2026-05-19 18:01:30.402
4	Tedavi ve rehabilitasyon süreci ile ilgili riskler	1	2026-05-19 18:01:30.403	2026-05-19 18:01:30.403
5	Takip ve taburculuk süreci ile ilgili riskler	1	2026-05-19 18:01:30.404	2026-05-19 18:01:30.404
6	Tıbbi kayıt ve arşiv süreci ile ilgili riskler	1	2026-05-19 18:01:30.405	2026-05-19 18:01:30.405
7	İdari süreçler ile ilgili riskler	2	2026-05-19 18:01:30.407	2026-05-19 18:01:30.407
8	Finansal süreçler ile ilgili riskler	2	2026-05-19 18:01:30.407	2026-05-19 18:01:30.407
9	İtibar yönetimi	2	2026-05-19 18:01:30.408	2026-05-19 18:01:30.408
10	Paydaşlarla iletişim süreçlerine yönelik riskler	2	2026-05-19 18:01:30.409	2026-05-19 18:01:30.409
11	Bilgi yönetimi süreçleri ile ilgili riskler	2	2026-05-19 18:01:30.409	2026-05-19 18:01:30.409
12	Atık yönetimi sürecindeki riskler	3	2026-05-19 18:01:30.411	2026-05-19 18:01:30.411
13	Tıbbi cihaz ve malzeme yönetimi süreci riskleri	3	2026-05-19 18:01:30.412	2026-05-19 18:01:30.412
14	Diğer cihaz ve malzemelerin yönetim süreci riskleri	3	2026-05-19 18:01:30.412	2026-05-19 18:01:30.412
15	Yangın Güvenliği ile ilgili riskler	3	2026-05-19 18:01:30.413	2026-05-19 18:01:30.413
16	Altyapı Sistemleri ile ilgili riskler	3	2026-05-19 18:01:30.414	2026-05-19 18:01:30.414
17	İnşaat ve Renovasyon ile ilgili riskler	3	2026-05-19 18:01:30.414	2026-05-19 18:01:30.414
18	Acil Durum ve Afet Yönetimi ile ilgili riskler	3	2026-05-19 18:01:30.415	2026-05-19 18:01:30.415
19	Emniyet ile ilgili riskler	3	2026-05-19 18:01:30.416	2026-05-19 18:01:30.416
20	Hava kirliliği oluşturabilecek unsurlar	4	2026-05-19 18:01:30.418	2026-05-19 18:01:30.418
21	Atıkların çevreye zarar vermesi	4	2026-05-19 18:01:30.419	2026-05-19 18:01:30.419
22	Çevreden hastaneye gelecek zararlar	4	2026-05-19 18:01:30.42	2026-05-19 18:01:30.42
23	Tehlikeli atıklardan oluşabilecek zararlar	4	2026-05-19 18:01:30.421	2026-05-19 18:01:30.421
24	Güvenlik - Fiziksel Risk Etmenleri	5	2026-05-19 18:01:30.423	2026-05-19 18:01:30.423
25	Güvenlik - Biyolojik Risk Etmenleri	5	2026-05-19 18:01:30.424	2026-05-19 18:01:30.424
26	Güvenlik - Psikososyal Risk Etmenleri	5	2026-05-19 18:01:30.425	2026-05-19 18:01:30.425
27	Güvenlik- Ergonomik Risk Etmenleri	5	2026-05-19 18:01:30.426	2026-05-19 18:01:30.426
28	Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri	5	2026-05-19 18:01:30.427	2026-05-19 18:01:30.427
29	Kimyasal Maruziyet Riskleri	5	2026-05-19 18:04:39.897	2026-05-19 18:04:39.897
30	Hizmete erişim ile ilgili riskler	6	2026-05-19 19:40:37.79	2026-05-19 19:40:37.79
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."Role" (id, name, "createdAt") FROM stdin;
1	admin	2026-04-16 21:31:31.535
2	user	2026-04-16 21:31:31.538
3	safety	2026-04-24 20:16:57.328
4	management	2026-04-24 20:18:11.383
5	doctor	2026-04-24 20:18:11.389
6	dsp	2026-04-24 20:18:11.39
\.


--
-- Data for Name: SmtpSettings; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."SmtpSettings" (id, host, port, "user", pass, secure, "fromEmail", "fromName", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SubCategory; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."SubCategory" (id, name, "categoryId", "createdAt", "updatedAt") FROM stdin;
1	Yangın Güvenliği	1	2026-04-24 21:01:33.358	2026-04-24 21:01:33.358
2	HAP Planı	1	2026-04-24 21:01:40.151	2026-04-24 21:01:40.151
3	Elektrik Sistemleri	2	2026-04-24 21:02:10.509	2026-04-24 21:02:10.509
4	Mekanik Sistemler	2	2026-04-24 21:02:22.092	2026-04-24 21:02:22.092
\.


--
-- Data for Name: SystemSettings; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."SystemSettings" (id, year, "seriousAccidentDays", "includeSaturday", "dailyWorkHours", "monthlyWorkDays", "createdAt", "updatedAt") FROM stdin;
1	2026	4	t	7.5	{"1": 26, "2": 24, "3": 26, "4": 26, "5": 26, "6": 26, "7": 27, "8": 26, "9": 26, "10": 27, "11": 25, "12": 27}	2026-04-17 05:49:16.379	2026-04-24 20:36:43.37
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."User" (username, "fullName", "isActive", "employmentType", "osgbName", "createdAt", "updatedAt", department, email, phone, title) FROM stdin;
murat.bakal	Murat BAKAL	t	Tesis Kadrosu		2026-04-24 20:16:57.335	2026-04-24 20:18:11.393	Üst Yönetim	murat.bakal@mlpcare.com	05417262919	A Sınıfı IGU
admin	Admin	t	\N	\N	2026-04-24 20:33:47.811	2026-04-24 20:33:47.811	\N	\N	\N	\N
metin.salik	Metin Salık	t	\N	\N	2026-04-16 21:31:31.54	2026-04-27 11:37:24.034	Üst Yönetim	metin.salik@mlpcare.com	05417262919	İş Güvenliği Uzmanı
murat.bakaş	Murat Bakaş	f	\N	\N	2026-05-19 17:54:40.603	2026-05-19 19:04:50.367	\N	\N	\N	\N
deneme23	Deneme23	f	\N	\N	2026-05-19 17:55:01.79	2026-05-19 19:04:52.332	\N	\N	\N	\N
melike.genc	Melike Genç CİNGÖZ	t	Tesis Kadrosu		2026-05-19 19:44:00.196	2026-05-19 19:45:21.01	Üst Yönetim	melike.genc@mlpcare.com	0541726292919	A Sınıfı IGU
burak.kurt	Burak Kurt	t	OSGB Kadrosu	Modern Teknik Tıp OSGB	2026-05-22 06:48:52.574	2026-05-22 06:49:17.145	Üst Yönetim	metins.salik@gmail.com	05417262919	B Sınıfı IGU
\.


--
-- Data for Name: UserFacility; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."UserFacility" (username, "facilityId") FROM stdin;
murat.bakal	MLP-MERKEZ
murat.bakal	MLP-AR-GE
melike.genc	LIV-VADI
burak.kurt	GOP-DIYALIZ-MER
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."UserRole" (username, "roleId") FROM stdin;
murat.bakal	3
admin	1
metin.salik	1
murat.bakaş	1
deneme23	1
melike.genc	3
burak.kurt	3
\.


--
-- Data for Name: WorkflowAlarm; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."WorkflowAlarm" (id, "taskId", "alarmDate", "alarmType", "isSent", "sentAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: WorkflowCategory; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."WorkflowCategory" (id, name, color, icon, "createdAt") FROM stdin;
\.


--
-- Data for Name: WorkflowDepartment; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."WorkflowDepartment" (id, name, description, "managerId", "createdAt") FROM stdin;
\.


--
-- Data for Name: WorkflowNotificationSettings; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."WorkflowNotificationSettings" (id, "userId", "telegramChatId", "whatsappNumber", "notifyOnAssign", "notifyOnStatusChange", "notifyOnAlarm", "notifyOnComment", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WorkflowTag; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."WorkflowTag" (id, name, color) FROM stdin;
\.


--
-- Data for Name: WorkflowTask; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."WorkflowTask" (id, title, description, priority, status, "categoryId", "departmentId", "createdBy", "dueDate", "alarmDate", "isPool", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WorkflowTaskAssignment; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."WorkflowTaskAssignment" (id, "taskId", "userId", role, "assignedBy", "assignedAt", "completedAt") FROM stdin;
\.


--
-- Data for Name: WorkflowTaskComment; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."WorkflowTaskComment" (id, "taskId", "userId", content, "createdAt") FROM stdin;
\.


--
-- Data for Name: WorkflowTaskHistory; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."WorkflowTaskHistory" (id, "taskId", "changedBy", "oldStatus", "newStatus", note, "changedAt") FROM stdin;
\.


--
-- Data for Name: WorkflowTaskTag; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."WorkflowTaskTag" ("taskId", "tagId") FROM stdin;
\.


--
-- Data for Name: WorkflowUserRole; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."WorkflowUserRole" (id, "userId", "moduleRole", "departmentId", "reportsTo", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: ActivityLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."ActivityLog_id_seq"', 182, true);


--
-- Name: AdministrativeFine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."AdministrativeFine_id_seq"', 1, true);


--
-- Name: Assignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."Assignment_id_seq"', 187, true);


--
-- Name: Category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."Category_id_seq"', 2, true);


--
-- Name: Department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."Department_id_seq"', 3, true);


--
-- Name: EmergencyCode_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."EmergencyCode_id_seq"', 16, true);


--
-- Name: EmployeeCountHistory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."EmployeeCountHistory_id_seq"', 90, true);


--
-- Name: EmployerRepresentative_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."EmployerRepresentative_id_seq"', 1, false);


--
-- Name: ExtraordinaryIncident_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."ExtraordinaryIncident_id_seq"', 1, true);


--
-- Name: FacilityBuilding_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."FacilityBuilding_id_seq"', 1, false);


--
-- Name: IncidentCategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."IncidentCategory_id_seq"', 19, true);


--
-- Name: IncidentRootCause_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."IncidentRootCause_id_seq"', 11, true);


--
-- Name: IncidentSupportUnit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."IncidentSupportUnit_id_seq"', 7, true);


--
-- Name: MonthlyAccidentData_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."MonthlyAccidentData_id_seq"', 1, false);


--
-- Name: MonthlyHRData_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."MonthlyHRData_id_seq"', 5, true);


--
-- Name: NotebookItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."NotebookItem_id_seq"', 13, true);


--
-- Name: NotebookPage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."NotebookPage_id_seq"', 4, true);


--
-- Name: NotificationConfig_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."NotificationConfig_id_seq"', 1, false);


--
-- Name: NotificationTemplate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."NotificationTemplate_id_seq"', 1, false);


--
-- Name: Notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."Notification_id_seq"', 1, false);


--
-- Name: OSGBCompany_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."OSGBCompany_id_seq"', 9, true);


--
-- Name: Professional_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."Professional_id_seq"', 173, true);


--
-- Name: Reconciliation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."Reconciliation_id_seq"', 475, true);


--
-- Name: ReportTemplate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."ReportTemplate_id_seq"', 1, false);


--
-- Name: RiskCategorySetting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."RiskCategorySetting_id_seq"', 6, true);


--
-- Name: RiskDepartmentSetting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."RiskDepartmentSetting_id_seq"', 15, true);


--
-- Name: RiskDepartment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."RiskDepartment_id_seq"', 7, true);


--
-- Name: RiskSubCategorySetting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."RiskSubCategorySetting_id_seq"', 30, true);


--
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."Role_id_seq"', 6, true);


--
-- Name: SubCategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."SubCategory_id_seq"', 4, true);


--
-- Name: SystemSettings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."SystemSettings_id_seq"', 4, true);


--
-- Name: WorkflowAlarm_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."WorkflowAlarm_id_seq"', 1, false);


--
-- Name: WorkflowCategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."WorkflowCategory_id_seq"', 1, false);


--
-- Name: WorkflowDepartment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."WorkflowDepartment_id_seq"', 1, false);


--
-- Name: WorkflowNotificationSettings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."WorkflowNotificationSettings_id_seq"', 1, false);


--
-- Name: WorkflowTag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."WorkflowTag_id_seq"', 1, false);


--
-- Name: WorkflowTaskAssignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."WorkflowTaskAssignment_id_seq"', 1, false);


--
-- Name: WorkflowTaskComment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."WorkflowTaskComment_id_seq"', 1, false);


--
-- Name: WorkflowTaskHistory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."WorkflowTaskHistory_id_seq"', 1, false);


--
-- Name: WorkflowTask_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."WorkflowTask_id_seq"', 1, false);


--
-- Name: WorkflowUserRole_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."WorkflowUserRole_id_seq"', 1, false);


--
-- Name: ActivityLog ActivityLog_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."ActivityLog"
    ADD CONSTRAINT "ActivityLog_pkey" PRIMARY KEY (id);


--
-- Name: AdministrativeFine AdministrativeFine_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."AdministrativeFine"
    ADD CONSTRAINT "AdministrativeFine_pkey" PRIMARY KEY (id);


--
-- Name: Assignment Assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Assignment"
    ADD CONSTRAINT "Assignment_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: EmergencyCode EmergencyCode_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."EmergencyCode"
    ADD CONSTRAINT "EmergencyCode_pkey" PRIMARY KEY (id);


--
-- Name: EmployeeCountHistory EmployeeCountHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."EmployeeCountHistory"
    ADD CONSTRAINT "EmployeeCountHistory_pkey" PRIMARY KEY (id);


--
-- Name: EmployerRepresentative EmployerRepresentative_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."EmployerRepresentative"
    ADD CONSTRAINT "EmployerRepresentative_pkey" PRIMARY KEY (id);


--
-- Name: ExtraordinaryIncident ExtraordinaryIncident_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."ExtraordinaryIncident"
    ADD CONSTRAINT "ExtraordinaryIncident_pkey" PRIMARY KEY (id);


--
-- Name: FacilityBuilding FacilityBuilding_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."FacilityBuilding"
    ADD CONSTRAINT "FacilityBuilding_pkey" PRIMARY KEY (id);


--
-- Name: Facility Facility_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Facility"
    ADD CONSTRAINT "Facility_pkey" PRIMARY KEY (id);


--
-- Name: IncidentCategory IncidentCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."IncidentCategory"
    ADD CONSTRAINT "IncidentCategory_pkey" PRIMARY KEY (id);


--
-- Name: IncidentRootCause IncidentRootCause_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."IncidentRootCause"
    ADD CONSTRAINT "IncidentRootCause_pkey" PRIMARY KEY (id);


--
-- Name: IncidentSupportUnit IncidentSupportUnit_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."IncidentSupportUnit"
    ADD CONSTRAINT "IncidentSupportUnit_pkey" PRIMARY KEY (id);


--
-- Name: MonthlyAccidentData MonthlyAccidentData_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."MonthlyAccidentData"
    ADD CONSTRAINT "MonthlyAccidentData_pkey" PRIMARY KEY (id);


--
-- Name: MonthlyHRData MonthlyHRData_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."MonthlyHRData"
    ADD CONSTRAINT "MonthlyHRData_pkey" PRIMARY KEY (id);


--
-- Name: NotebookItem NotebookItem_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."NotebookItem"
    ADD CONSTRAINT "NotebookItem_pkey" PRIMARY KEY (id);


--
-- Name: NotebookPage NotebookPage_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."NotebookPage"
    ADD CONSTRAINT "NotebookPage_pkey" PRIMARY KEY (id);


--
-- Name: NotificationConfig NotificationConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."NotificationConfig"
    ADD CONSTRAINT "NotificationConfig_pkey" PRIMARY KEY (id);


--
-- Name: NotificationTemplate NotificationTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."NotificationTemplate"
    ADD CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OSGBCompany OSGBCompany_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."OSGBCompany"
    ADD CONSTRAINT "OSGBCompany_pkey" PRIMARY KEY (id);


--
-- Name: Professional Professional_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Professional"
    ADD CONSTRAINT "Professional_pkey" PRIMARY KEY (id);


--
-- Name: Reconciliation Reconciliation_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Reconciliation"
    ADD CONSTRAINT "Reconciliation_pkey" PRIMARY KEY (id);


--
-- Name: ReportTemplate ReportTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."ReportTemplate"
    ADD CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY (id);


--
-- Name: RiskAuditLog RiskAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskAuditLog"
    ADD CONSTRAINT "RiskAuditLog_pkey" PRIMARY KEY (id);


--
-- Name: RiskCategorySetting RiskCategorySetting_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskCategorySetting"
    ADD CONSTRAINT "RiskCategorySetting_pkey" PRIMARY KEY (id);


--
-- Name: RiskDepartmentSetting RiskDepartmentSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskDepartmentSetting"
    ADD CONSTRAINT "RiskDepartmentSetting_pkey" PRIMARY KEY (id);


--
-- Name: RiskDepartment RiskDepartment_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskDepartment"
    ADD CONSTRAINT "RiskDepartment_pkey" PRIMARY KEY (id);


--
-- Name: RiskExpertFacility RiskExpertFacility_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskExpertFacility"
    ADD CONSTRAINT "RiskExpertFacility_pkey" PRIMARY KEY ("expertUsername", "facilityId");


--
-- Name: RiskLifecycle RiskLifecycle_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskLifecycle"
    ADD CONSTRAINT "RiskLifecycle_pkey" PRIMARY KEY (id);


--
-- Name: RiskSubCategorySetting RiskSubCategorySetting_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskSubCategorySetting"
    ADD CONSTRAINT "RiskSubCategorySetting_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: SmtpSettings SmtpSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."SmtpSettings"
    ADD CONSTRAINT "SmtpSettings_pkey" PRIMARY KEY (id);


--
-- Name: SubCategory SubCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."SubCategory"
    ADD CONSTRAINT "SubCategory_pkey" PRIMARY KEY (id);


--
-- Name: SystemSettings SystemSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."SystemSettings"
    ADD CONSTRAINT "SystemSettings_pkey" PRIMARY KEY (id);


--
-- Name: UserFacility UserFacility_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."UserFacility"
    ADD CONSTRAINT "UserFacility_pkey" PRIMARY KEY (username, "facilityId");


--
-- Name: UserRole UserRole_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY (username, "roleId");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (username);


--
-- Name: WorkflowAlarm WorkflowAlarm_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowAlarm"
    ADD CONSTRAINT "WorkflowAlarm_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowCategory WorkflowCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowCategory"
    ADD CONSTRAINT "WorkflowCategory_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowDepartment WorkflowDepartment_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowDepartment"
    ADD CONSTRAINT "WorkflowDepartment_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowNotificationSettings WorkflowNotificationSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowNotificationSettings"
    ADD CONSTRAINT "WorkflowNotificationSettings_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowTag WorkflowTag_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTag"
    ADD CONSTRAINT "WorkflowTag_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowTaskAssignment WorkflowTaskAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTaskAssignment"
    ADD CONSTRAINT "WorkflowTaskAssignment_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowTaskComment WorkflowTaskComment_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTaskComment"
    ADD CONSTRAINT "WorkflowTaskComment_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowTaskHistory WorkflowTaskHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTaskHistory"
    ADD CONSTRAINT "WorkflowTaskHistory_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowTaskTag WorkflowTaskTag_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTaskTag"
    ADD CONSTRAINT "WorkflowTaskTag_pkey" PRIMARY KEY ("taskId", "tagId");


--
-- Name: WorkflowTask WorkflowTask_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTask"
    ADD CONSTRAINT "WorkflowTask_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowUserRole WorkflowUserRole_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowUserRole"
    ADD CONSTRAINT "WorkflowUserRole_pkey" PRIMARY KEY (id);


--
-- Name: AdministrativeFine_year_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "AdministrativeFine_year_key" ON public."AdministrativeFine" USING btree (year);


--
-- Name: EmergencyCode_name_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "EmergencyCode_name_key" ON public."EmergencyCode" USING btree (name);


--
-- Name: ExtraordinaryIncident_facilityId_idx; Type: INDEX; Schema: public; Owner: isguser
--

CREATE INDEX "ExtraordinaryIncident_facilityId_idx" ON public."ExtraordinaryIncident" USING btree ("facilityId");


--
-- Name: IncidentCategory_name_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "IncidentCategory_name_key" ON public."IncidentCategory" USING btree (name);


--
-- Name: IncidentRootCause_name_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "IncidentRootCause_name_key" ON public."IncidentRootCause" USING btree (name);


--
-- Name: IncidentSupportUnit_name_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "IncidentSupportUnit_name_key" ON public."IncidentSupportUnit" USING btree (name);


--
-- Name: MonthlyAccidentData_facilityId_month_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "MonthlyAccidentData_facilityId_month_key" ON public."MonthlyAccidentData" USING btree ("facilityId", month);


--
-- Name: MonthlyHRData_facilityId_month_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "MonthlyHRData_facilityId_month_key" ON public."MonthlyHRData" USING btree ("facilityId", month);


--
-- Name: NotebookPage_facilityId_year_idx; Type: INDEX; Schema: public; Owner: isguser
--

CREATE INDEX "NotebookPage_facilityId_year_idx" ON public."NotebookPage" USING btree ("facilityId", year);


--
-- Name: NotificationConfig_code_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "NotificationConfig_code_key" ON public."NotificationConfig" USING btree (code);


--
-- Name: NotificationTemplate_code_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "NotificationTemplate_code_key" ON public."NotificationTemplate" USING btree (code);


--
-- Name: Reconciliation_facilityId_osgbCompanyId_month_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "Reconciliation_facilityId_osgbCompanyId_month_key" ON public."Reconciliation" USING btree ("facilityId", "osgbCompanyId", month);


--
-- Name: ReportTemplate_code_version_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "ReportTemplate_code_version_key" ON public."ReportTemplate" USING btree (code, version);


--
-- Name: RiskAuditLog_riskId_idx; Type: INDEX; Schema: public; Owner: isguser
--

CREATE INDEX "RiskAuditLog_riskId_idx" ON public."RiskAuditLog" USING btree ("riskId");


--
-- Name: RiskCategorySetting_facilityId_name_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "RiskCategorySetting_facilityId_name_key" ON public."RiskCategorySetting" USING btree ("facilityId", name);


--
-- Name: RiskDepartmentSetting_facilityId_name_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "RiskDepartmentSetting_facilityId_name_key" ON public."RiskDepartmentSetting" USING btree ("facilityId", name);


--
-- Name: RiskDepartment_facilityId_name_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "RiskDepartment_facilityId_name_key" ON public."RiskDepartment" USING btree ("facilityId", name);


--
-- Name: RiskLifecycle_departmentId_idx; Type: INDEX; Schema: public; Owner: isguser
--

CREATE INDEX "RiskLifecycle_departmentId_idx" ON public."RiskLifecycle" USING btree ("departmentId");


--
-- Name: RiskSubCategorySetting_categoryId_name_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "RiskSubCategorySetting_categoryId_name_key" ON public."RiskSubCategorySetting" USING btree ("categoryId", name);


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: SystemSettings_year_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "SystemSettings_year_key" ON public."SystemSettings" USING btree (year);


--
-- Name: WorkflowNotificationSettings_userId_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "WorkflowNotificationSettings_userId_key" ON public."WorkflowNotificationSettings" USING btree ("userId");


--
-- Name: WorkflowUserRole_userId_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "WorkflowUserRole_userId_key" ON public."WorkflowUserRole" USING btree ("userId");


--
-- Name: ActivityLog ActivityLog_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."ActivityLog"
    ADD CONSTRAINT "ActivityLog_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Assignment Assignment_employerRepId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Assignment"
    ADD CONSTRAINT "Assignment_employerRepId_fkey" FOREIGN KEY ("employerRepId") REFERENCES public."EmployerRepresentative"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Assignment Assignment_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Assignment"
    ADD CONSTRAINT "Assignment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Assignment Assignment_professionalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Assignment"
    ADD CONSTRAINT "Assignment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES public."Professional"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EmployeeCountHistory EmployeeCountHistory_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."EmployeeCountHistory"
    ADD CONSTRAINT "EmployeeCountHistory_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExtraordinaryIncident ExtraordinaryIncident_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."ExtraordinaryIncident"
    ADD CONSTRAINT "ExtraordinaryIncident_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."IncidentCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExtraordinaryIncident ExtraordinaryIncident_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."ExtraordinaryIncident"
    ADD CONSTRAINT "ExtraordinaryIncident_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExtraordinaryIncident ExtraordinaryIncident_emergencyCodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."ExtraordinaryIncident"
    ADD CONSTRAINT "ExtraordinaryIncident_emergencyCodeId_fkey" FOREIGN KEY ("emergencyCodeId") REFERENCES public."EmergencyCode"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ExtraordinaryIncident ExtraordinaryIncident_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."ExtraordinaryIncident"
    ADD CONSTRAINT "ExtraordinaryIncident_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExtraordinaryIncident ExtraordinaryIncident_rootCauseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."ExtraordinaryIncident"
    ADD CONSTRAINT "ExtraordinaryIncident_rootCauseId_fkey" FOREIGN KEY ("rootCauseId") REFERENCES public."IncidentRootCause"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExtraordinaryIncident ExtraordinaryIncident_supportUnitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."ExtraordinaryIncident"
    ADD CONSTRAINT "ExtraordinaryIncident_supportUnitId_fkey" FOREIGN KEY ("supportUnitId") REFERENCES public."IncidentSupportUnit"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FacilityBuilding FacilityBuilding_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."FacilityBuilding"
    ADD CONSTRAINT "FacilityBuilding_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MonthlyAccidentData MonthlyAccidentData_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."MonthlyAccidentData"
    ADD CONSTRAINT "MonthlyAccidentData_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MonthlyHRData MonthlyHRData_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."MonthlyHRData"
    ADD CONSTRAINT "MonthlyHRData_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: NotebookItem NotebookItem_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."NotebookItem"
    ADD CONSTRAINT "NotebookItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: NotebookItem NotebookItem_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."NotebookItem"
    ADD CONSTRAINT "NotebookItem_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: NotebookItem NotebookItem_pageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."NotebookItem"
    ADD CONSTRAINT "NotebookItem_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES public."NotebookPage"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotebookItem NotebookItem_subCategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."NotebookItem"
    ADD CONSTRAINT "NotebookItem_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES public."SubCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: NotebookPage NotebookPage_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."NotebookPage"
    ADD CONSTRAINT "NotebookPage_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Reconciliation Reconciliation_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Reconciliation"
    ADD CONSTRAINT "Reconciliation_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Reconciliation Reconciliation_osgbCompanyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Reconciliation"
    ADD CONSTRAINT "Reconciliation_osgbCompanyId_fkey" FOREIGN KEY ("osgbCompanyId") REFERENCES public."OSGBCompany"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RiskAuditLog RiskAuditLog_riskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskAuditLog"
    ADD CONSTRAINT "RiskAuditLog_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES public."RiskLifecycle"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RiskCategorySetting RiskCategorySetting_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskCategorySetting"
    ADD CONSTRAINT "RiskCategorySetting_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RiskDepartmentSetting RiskDepartmentSetting_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskDepartmentSetting"
    ADD CONSTRAINT "RiskDepartmentSetting_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RiskDepartment RiskDepartment_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskDepartment"
    ADD CONSTRAINT "RiskDepartment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RiskExpertFacility RiskExpertFacility_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskExpertFacility"
    ADD CONSTRAINT "RiskExpertFacility_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RiskLifecycle RiskLifecycle_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskLifecycle"
    ADD CONSTRAINT "RiskLifecycle_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."RiskDepartment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RiskSubCategorySetting RiskSubCategorySetting_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."RiskSubCategorySetting"
    ADD CONSTRAINT "RiskSubCategorySetting_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."RiskCategorySetting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SubCategory SubCategory_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."SubCategory"
    ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserFacility UserFacility_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."UserFacility"
    ADD CONSTRAINT "UserFacility_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserFacility UserFacility_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."UserFacility"
    ADD CONSTRAINT "UserFacility_username_fkey" FOREIGN KEY (username) REFERENCES public."User"(username) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserRole UserRole_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserRole UserRole_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_username_fkey" FOREIGN KEY (username) REFERENCES public."User"(username) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkflowAlarm WorkflowAlarm_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowAlarm"
    ADD CONSTRAINT "WorkflowAlarm_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."WorkflowTask"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkflowNotificationSettings WorkflowNotificationSettings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowNotificationSettings"
    ADD CONSTRAINT "WorkflowNotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(username) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkflowTaskAssignment WorkflowTaskAssignment_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTaskAssignment"
    ADD CONSTRAINT "WorkflowTaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."WorkflowTask"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkflowTaskComment WorkflowTaskComment_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTaskComment"
    ADD CONSTRAINT "WorkflowTaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."WorkflowTask"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkflowTaskHistory WorkflowTaskHistory_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTaskHistory"
    ADD CONSTRAINT "WorkflowTaskHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."WorkflowTask"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkflowTaskTag WorkflowTaskTag_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTaskTag"
    ADD CONSTRAINT "WorkflowTaskTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public."WorkflowTag"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkflowTaskTag WorkflowTaskTag_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTaskTag"
    ADD CONSTRAINT "WorkflowTaskTag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."WorkflowTask"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkflowTask WorkflowTask_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTask"
    ADD CONSTRAINT "WorkflowTask_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."WorkflowCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WorkflowTask WorkflowTask_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowTask"
    ADD CONSTRAINT "WorkflowTask_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."WorkflowDepartment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WorkflowUserRole WorkflowUserRole_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowUserRole"
    ADD CONSTRAINT "WorkflowUserRole_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."WorkflowDepartment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WorkflowUserRole WorkflowUserRole_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."WorkflowUserRole"
    ADD CONSTRAINT "WorkflowUserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(username) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict WT4HGh54hvukvlh2dhBQkF4flLm7q4hxb1eEC404oVY26JPAhCAxTZmrnt8e6tZ

