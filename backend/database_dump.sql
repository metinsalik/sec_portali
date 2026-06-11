--
-- PostgreSQL database dump
--

\restrict 36dgtpk15gFULghXKe1bNIydmbnAeXeRKXZ4ZUkKD856Z1rzgzEwTw3UEIlLbIv

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: isguser
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO isguser;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: isguser
--

COMMENT ON SCHEMA public IS '';


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
    username text NOT NULL,
    "professionalId" integer
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
-- Name: FacilityHazmatItem; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."FacilityHazmatItem" (
    id text NOT NULL,
    "facilityId" text NOT NULL,
    "materialId" text NOT NULL,
    "amountValue" double precision,
    "unitId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FacilityHazmatItem" OWNER TO isguser;

--
-- Name: HazmatAdrLabel; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatAdrLabel" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "imageUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HazmatAdrLabel" OWNER TO isguser;

--
-- Name: HazmatAuditLog; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatAuditLog" (
    id text NOT NULL,
    "materialId" text NOT NULL,
    action text NOT NULL,
    details text,
    "changedFields" jsonb,
    username text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."HazmatAuditLog" OWNER TO isguser;

--
-- Name: HazmatCategory; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatCategory" (
    id text NOT NULL,
    name text NOT NULL,
    scope text,
    examples text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HazmatCategory" OWNER TO isguser;

--
-- Name: HazmatDepartment; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatDepartment" (
    id text NOT NULL,
    "facilityId" text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HazmatDepartment" OWNER TO isguser;

--
-- Name: HazmatHazardLabel; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatHazardLabel" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    description text,
    "imageUrl" text
);


ALTER TABLE public."HazmatHazardLabel" OWNER TO isguser;

--
-- Name: HazmatInventoryItem; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatInventoryItem" (
    id text NOT NULL,
    "facilityId" text NOT NULL,
    "departmentId" text NOT NULL,
    "materialId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "maxQuantity" double precision,
    "minQuantity" double precision
);


ALTER TABLE public."HazmatInventoryItem" OWNER TO isguser;

--
-- Name: HazmatMaterial; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatMaterial" (
    id text NOT NULL,
    "productName" text NOT NULL,
    "brandName" text,
    "usageMethod" text,
    composition text,
    "hazardDescription" text,
    "firstAid" text,
    "fireFightingMeasures" text,
    "accidentalReleaseMeasures" text,
    "handlingAndStorage" text,
    "exposureControlsPpe" text,
    "physicalAndChemicalProperties" text,
    "stabilityAndReactivity" text,
    "toxicologicalInformation" text,
    "ecologicalInformation" text,
    "disposalConsiderations" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "regulatoryInfo" text,
    "transportInfo" text,
    "categoryId" text,
    "imageUrl" text,
    "sdsExpiryDate" timestamp(3) without time zone,
    "sdsUrl" text
);


ALTER TABLE public."HazmatMaterial" OWNER TO isguser;

--
-- Name: HazmatMaterialAdrLabel; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatMaterialAdrLabel" (
    id text NOT NULL,
    "materialId" text NOT NULL,
    "labelId" text NOT NULL
);


ALTER TABLE public."HazmatMaterialAdrLabel" OWNER TO isguser;

--
-- Name: HazmatMaterialHazardLabel; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatMaterialHazardLabel" (
    "materialId" text NOT NULL,
    "labelId" text NOT NULL,
    id text NOT NULL
);


ALTER TABLE public."HazmatMaterialHazardLabel" OWNER TO isguser;

--
-- Name: HazmatMaterialPpe; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatMaterialPpe" (
    "materialId" text NOT NULL,
    "ppeId" text NOT NULL,
    id text NOT NULL
);


ALTER TABLE public."HazmatMaterialPpe" OWNER TO isguser;

--
-- Name: HazmatPpe; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatPpe" (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    description text,
    "imageUrl" text
);


ALTER TABLE public."HazmatPpe" OWNER TO isguser;

--
-- Name: HazmatSpillKit; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatSpillKit" (
    id text NOT NULL,
    "facilityId" text NOT NULL,
    purpose text NOT NULL,
    risk text DEFAULT 'Orta'::text NOT NULL,
    "kitName" text NOT NULL,
    "needReason" text,
    "worstCase" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HazmatSpillKit" OWNER TO isguser;

--
-- Name: HazmatSpillKitAction; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatSpillKitAction" (
    id text NOT NULL,
    "actionType" text,
    owner text,
    "dueDate" timestamp(3) without time zone,
    description text,
    status text DEFAULT 'Açık'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "placementId" text NOT NULL
);


ALTER TABLE public."HazmatSpillKitAction" OWNER TO isguser;

--
-- Name: HazmatSpillKitCheck; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatSpillKitCheck" (
    id text NOT NULL,
    "lastCheck" timestamp(3) without time zone,
    period integer DEFAULT 30 NOT NULL,
    result text DEFAULT 'Kontrol Edilmedi'::text NOT NULL,
    "checkedBy" text,
    "contentOk" boolean DEFAULT false NOT NULL,
    "expiryOk" boolean DEFAULT false NOT NULL,
    "qtyOk" boolean DEFAULT false NOT NULL,
    "packageOk" boolean DEFAULT false NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "placementId" text NOT NULL
);


ALTER TABLE public."HazmatSpillKitCheck" OWNER TO isguser;

--
-- Name: HazmatSpillKitDepartment; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatSpillKitDepartment" (
    id text NOT NULL,
    "kitId" text NOT NULL,
    unit text NOT NULL,
    area text,
    location text,
    owner text,
    "backupOwner" text,
    visible boolean DEFAULT false NOT NULL,
    sign boolean DEFAULT false NOT NULL,
    instruction boolean DEFAULT false NOT NULL,
    training boolean DEFAULT false NOT NULL,
    note text,
    status text DEFAULT 'Kurulumda'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HazmatSpillKitDepartment" OWNER TO isguser;

--
-- Name: HazmatSpillKitIncident; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatSpillKitIncident" (
    id text NOT NULL,
    "incidentDate" timestamp(3) without time zone,
    "incidentType" text,
    "kitUsed" text,
    "incidentDesc" text,
    "usedItems" text,
    "incidentOutcome" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "placementId" text NOT NULL
);


ALTER TABLE public."HazmatSpillKitIncident" OWNER TO isguser;

--
-- Name: HazmatSpillKitItem; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatSpillKitItem" (
    id text NOT NULL,
    "kitId" text NOT NULL,
    name text NOT NULL,
    type text,
    qty integer DEFAULT 0 NOT NULL,
    min integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    exp text
);


ALTER TABLE public."HazmatSpillKitItem" OWNER TO isguser;

--
-- Name: HazmatSpillKitMasterItem; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatSpillKitMasterItem" (
    id text NOT NULL,
    "facilityId" text NOT NULL,
    name text NOT NULL,
    type text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HazmatSpillKitMasterItem" OWNER TO isguser;

--
-- Name: HazmatUnit; Type: TABLE; Schema: public; Owner: isguser
--

CREATE TABLE public."HazmatUnit" (
    id text NOT NULL,
    name text NOT NULL,
    symbol text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HazmatUnit" OWNER TO isguser;

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
    "postImprovementResponsible" text,
    "dueDatePeriod" text
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

COPY public."ActivityLog" (id, action, "createdAt", details, "facilityId", username, "professionalId") FROM stdin;
1	Aylık Personel Verisi Güncellendi	2026-04-24 20:44:31.852	2026-04 dönemi için personel verileri girildi/güncellendi.	GOP-DIYALIZ-MER	admin	\N
2	Aylık Personel Verisi Güncellendi	2026-04-24 20:49:34.549	2026-01 dönemi için personel verileri girildi/güncellendi.	GOP-DIYALIZ-MER	metin.salik	\N
3	Aylık Personel Verisi Güncellendi	2026-04-24 20:50:55.334	2026-01 dönemi için personel verileri girildi/güncellendi.	İSU-LIV-TOPKAP	metin.salik	\N
4	Aylık Personel Verisi Güncellendi	2026-04-24 20:51:00.235	2026-04 dönemi için personel verileri girildi/güncellendi.	GOP-DIYALIZ-MER	admin	\N
5	Aylık Personel Verisi Güncellendi	2026-04-24 20:53:17.546	2026-04 dönemi için personel verileri girildi/güncellendi.	MLP-MERKEZ	murat.bakal	\N
6	Aylık Personel Verisi Güncellendi	2026-04-24 20:59:11.721	2026-01 dönemi için personel verileri girildi/güncellendi.	MLP-MERKEZ	murat.bakal	\N
7	Aylık Personel Verisi Güncellendi	2026-04-24 20:59:41.245	2026-04 dönemi için personel verileri girildi/güncellendi.	GOP-DIYALIZ-MER	admin	\N
8	Yeni Defter Kaydı Eklendi	2026-04-24 21:38:06.294	Acil Durum Yönetimi kategorisinde yeni bir tespit/öneri eklendi.	MLP-MERKEZ	admin	\N
9	Yeni Defter Sayfası Eklendi	2026-04-25 19:40:02.693	25.04.2026 tarihli sayfaya 2 madde eklendi.	GOP-DIYALIZ-MER	metin.salik	\N
10	Yeni Defter Sayfası Eklendi	2026-04-25 19:54:58.35	01.04.2026 tarihli sayfaya 1 madde eklendi.	LIV-VADI	metin.salik	\N
11	Defter Sayfası Silindi	2026-04-25 20:10:42.026	25.04.2026 tarihli kayıt arşive taşındı.	GOP-DIYALIZ-MER	metin.salik	\N
12	Yeni Defter Sayfası Eklendi	2026-04-25 20:13:02.184	25.04.2026 tarihli sayfaya 2 madde eklendi.	LIV-GAZIANTEP	metin.salik	\N
13	Defter Sayfası Güncellendi	2026-04-25 20:13:34.04	25.04.2026 tarihli sayfa güncellendi.	LIV-GAZIANTEP	metin.salik	\N
14	Yeni Defter Sayfası Eklendi	2026-04-25 20:15:40.144	01.04.2026 tarihli sayfaya 2 madde eklendi.	MLP-AR-GE	murat.bakal	\N
15	Defter Sayfası Güncellendi	2026-04-25 20:21:27.209	01.04.2026 tarihli sayfa güncellendi.	MLP-AR-GE	murat.bakal	\N
16	Atama Sonlandırıldı	2026-04-27 06:31:50.383	DSP tipi atama sonlandırıldı.	MP-ADANA	metin.salik	\N
17	Atama Sonlandırıldı	2026-04-27 06:31:53.267	DSP tipi atama sonlandırıldı.	MP-ADANA	metin.salik	\N
18	Atama Sonlandırıldı	2026-04-27 06:31:53.704	DSP tipi atama sonlandırıldı.	MP-ADANA	metin.salik	\N
19	Çalışan Sayısı Güncellendi	2026-04-27 06:32:38.296	Çalışan sayısı 347 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-ADANA	metin.salik	\N
20	Yeni Atama Yapıldı	2026-04-27 06:47:59.453	Hekim tipi atama yapıldı. (11700 dk)	LIV-ANKARA	metin.salik	\N
21	Atama Sonlandırıldı	2026-04-27 06:50:52.618	Hekim tipi atama sonlandırıldı.	LIV-ANKARA	metin.salik	\N
22	Çalışan Sayısı Güncellendi	2026-04-27 06:51:41.197	Çalışan sayısı 472 olarak güncellendi. (Yürürlük: 24.04.2026)	LIV-ANKARA	metin.salik	\N
23	Yeni Atama Yapıldı	2026-04-27 06:59:24.585	IGU tipi atama yapıldı. (8240 dk)	MP-ANKARA	metin.salik	\N
24	Atama Sonlandırıldı	2026-04-27 07:00:47.813	IGU tipi atama sonlandırıldı.	MP-ANKARA	metin.salik	\N
25	Çalışan Sayısı Güncellendi	2026-04-27 07:04:10.352	Çalışan sayısı 366 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-ANKARA	metin.salik	\N
26	Yeni Atama Yapıldı	2026-04-27 07:15:42.273	IGU tipi atama yapıldı. (11700 dk)	MP-ANTALYA	metin.salik	\N
27	Atama Sonlandırıldı	2026-04-27 07:17:42.876	IGU tipi atama sonlandırıldı.	MP-ANTALYA	metin.salik	\N
28	Çalışan Sayısı Güncellendi	2026-04-27 07:18:18.005	Çalışan sayısı 707 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-ANTALYA	metin.salik	\N
29	Çalışan Sayısı Güncellendi	2026-04-27 07:27:22.013	Çalışan sayısı 93 olarak güncellendi. (Yürürlük: 24.04.2026)	MLP-AR-GE	metin.salik	\N
30	Çalışan Sayısı Güncellendi	2026-04-27 07:28:53.552	Çalışan sayısı 197 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-ATASEHIR	metin.salik	\N
31	Çalışan Sayısı Güncellendi	2026-04-27 07:30:03.63	Çalışan sayısı 750 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-BAHCELIEVLER	metin.salik	\N
32	Çalışan Sayısı Güncellendi	2026-04-27 07:33:03.986	Çalışan sayısı 515 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-BURSA	metin.salik	\N
33	Yeni Atama Yapıldı	2026-04-27 07:40:10.773	Hekim tipi atama yapıldı. (75 dk)	MP-CANAKKALE	metin.salik	\N
34	Atama Sonlandırıldı	2026-04-27 07:40:45.929	Hekim tipi atama sonlandırıldı.	MP-CANAKKALE	metin.salik	\N
35	Çalışan Sayısı Güncellendi	2026-04-27 07:46:02.424	Çalışan sayısı 52 olarak güncellendi. (Yürürlük: 24.04.2026)	MLP-CAGRI-MERKE	metin.salik	\N
36	Yeni Atama Yapıldı	2026-04-27 07:49:24.552	IGU tipi atama yapıldı. (500 dk)	MLP-CAGRI-MERKE	metin.salik	\N
37	Yeni Atama Yapıldı	2026-04-27 07:50:23.697	Hekim tipi atama yapıldı. (385 dk)	MLP-CAGRI-MERKE	metin.salik	\N
38	Çalışan Sayısı Güncellendi	2026-04-27 07:57:07.597	Çalışan sayısı 62 olarak güncellendi. (Yürürlük: 24.04.2026)	GOP-DIYALIZ-MER	metin.salik	\N
39	Yeni Atama Yapıldı	2026-04-27 07:58:30.574	IGU tipi atama yapıldı. (1240 dk)	GOP-DIYALIZ-MER	metin.salik	\N
40	Yeni Atama Yapıldı	2026-04-27 07:59:20.116	Hekim tipi atama yapıldı. (660 dk)	GOP-DIYALIZ-MER	metin.salik	\N
41	Yeni Atama Yapıldı	2026-04-27 08:01:32.095	DSP tipi atama yapıldı. (11700 dk)	GOP-DIYALIZ-MER	metin.salik	\N
42	Çalışan Sayısı Güncellendi	2026-04-27 08:04:24.805	Çalışan sayısı 265 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-FATIH	metin.salik	\N
43	Çalışan Sayısı Güncellendi	2026-04-27 08:15:53.118	Çalışan sayısı 573 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-FLORYA	metin.salik	\N
44	Yeni Atama Yapıldı	2026-04-27 08:21:06.137	IGU tipi atama yapıldı. (11700 dk)	LIV-GAZIANTEP	metin.salik	\N
45	Çalışan Sayısı Güncellendi	2026-04-27 08:22:29.438	Çalışan sayısı 363 olarak güncellendi. (Yürürlük: 24.04.2026)	LIV-GAZIANTEP	metin.salik	\N
46	Çalışan Sayısı Güncellendi	2026-04-27 08:23:47.277	Çalışan sayısı 363 olarak güncellendi. (Yürürlük: 24.04.2026)	LIV-GAZIANTEP	metin.salik	\N
47	Atama Sonlandırıldı	2026-04-27 08:24:24.486	IGU tipi atama sonlandırıldı.	LIV-GAZIANTEP	metin.salik	\N
48	Çalışan Sayısı Güncellendi	2026-04-27 08:25:34.932	Çalışan sayısı 433 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-GEBZE	metin.salik	\N
49	Çalışan Sayısı Güncellendi	2026-04-27 08:29:02.489	Çalışan sayısı 573 olarak güncellendi. (Yürürlük: 24.04.2026)	İSU-MP-GAZIOSM	metin.salik	\N
50	Yeni Atama Yapıldı	2026-04-27 08:30:54.082	IGU tipi atama yapıldı. (6000 dk)	İSU-MP-GAZIOSM	metin.salik	\N
51	Çalışan Sayısı Güncellendi	2026-04-27 08:33:04.379	Çalışan sayısı 704 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-GOZTEPE	metin.salik	\N
52	Yeni Atama Yapıldı	2026-04-27 08:36:04.477	IGU tipi atama yapıldı. (130 dk)	MLP-İGA	metin.salik	\N
53	Yeni Atama Yapıldı	2026-04-27 08:36:57.858	Hekim tipi atama yapıldı. (65 dk)	MLP-İGA	metin.salik	\N
54	Atama Sonlandırıldı	2026-04-27 08:37:11.127	IGU tipi atama sonlandırıldı.	MLP-İGA	metin.salik	\N
55	Çalışan Sayısı Güncellendi	2026-04-27 08:38:21.196	Çalışan sayısı 35 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-İNCEK	metin.salik	\N
56	Atama Sonlandırıldı	2026-04-27 08:40:39.434	Hekim tipi atama sonlandırıldı.	MP-İNCEK	metin.salik	\N
57	Çalışan Sayısı Güncellendi	2026-04-27 08:45:24.975	Çalışan sayısı 40 olarak güncellendi. (Yürürlük: 24.04.2026)	İSTINYE-DENT	metin.salik	\N
58	Yeni Atama Yapıldı	2026-04-27 08:46:11.207	IGU tipi atama yapıldı. (800 dk)	İSTINYE-DENT	metin.salik	\N
59	Atama Sonlandırıldı	2026-04-27 08:46:50.699	IGU tipi atama sonlandırıldı.	İSTINYE-DENT	metin.salik	\N
60	Yeni Atama Yapıldı	2026-04-27 08:47:44.931	Hekim tipi atama yapıldı. (400 dk)	İSTINYE-DENT	metin.salik	\N
61	Çalışan Sayısı Güncellendi	2026-04-27 08:58:50.703	Çalışan sayısı 738 olarak güncellendi. (Yürürlük: 24.04.2026)	İSU-LIV-BAHCES	metin.salik	\N
62	Atama Sonlandırıldı	2026-04-27 09:00:07.767	Hekim tipi atama sonlandırıldı.	İSU-LIV-BAHCES	metin.salik	\N
63	Atama Sonlandırıldı	2026-04-27 09:01:40.688	IGU tipi atama sonlandırıldı.	İSU-LIV-BAHCES	metin.salik	\N
64	Çalışan Sayısı Güncellendi	2026-04-27 09:03:33.831	Çalışan sayısı 679 olarak güncellendi. (Yürürlük: 24.04.2026)	İSU-TIP-FAKULT	metin.salik	\N
65	Yeni Atama Yapıldı	2026-04-27 09:05:02.457	Hekim tipi atama yapıldı. (10000 dk)	İSU-TIP-FAKULT	metin.salik	\N
66	Yeni Atama Yapıldı	2026-04-27 09:05:54.115	DSP tipi atama yapıldı. (11700 dk)	İSU-TIP-FAKULT	metin.salik	\N
67	Çalışan Sayısı Güncellendi	2026-04-27 09:11:03.967	Çalışan sayısı 205 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-İZMIR	metin.salik	\N
68	Çalışan Sayısı Güncellendi	2026-04-27 09:14:48.895	Çalışan sayısı 594 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-KOCAELI	metin.salik	\N
69	Yeni Atama Yapıldı	2026-04-27 09:15:57.73	IGU tipi atama yapıldı. (3960 dk)	VM-MP-KOCAELI	metin.salik	\N
70	Çalışan Sayısı Güncellendi	2026-04-27 09:17:21.055	Çalışan sayısı 448 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-MALTEPE	metin.salik	\N
71	Çalışan Sayısı Güncellendi	2026-04-27 09:19:45.757	Çalışan sayısı 415 olarak güncellendi. (Yürürlük: 24.04.2026)	MLP-MERKEZ	metin.salik	\N
72	Yeni Atama Yapıldı	2026-04-27 09:20:41.742	IGU tipi atama yapıldı. (11700 dk)	MLP-MERKEZ	metin.salik	\N
73	Yeni Atama Yapıldı	2026-04-27 09:21:32.129	Hekim tipi atama yapıldı. (2350 dk)	MLP-MERKEZ	metin.salik	\N
74	Çalışan Sayısı Güncellendi	2026-04-27 09:24:55.423	Çalışan sayısı 477 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-MERSIN	metin.salik	\N
75	Çalışan Sayısı Güncellendi	2026-04-27 09:28:06.838	Çalışan sayısı 238 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-İSTANBUL-ON	metin.salik	\N
76	Yeni Atama Yapıldı	2026-04-27 09:29:54.9	DSP tipi atama yapıldı. (11700 dk)	MP-İSTANBUL-ON	metin.salik	\N
77	Çalışan Sayısı Güncellendi	2026-04-27 09:30:35.514	Çalışan sayısı 353 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-ORDU	metin.salik	\N
78	Çalışan Sayısı Güncellendi	2026-04-27 09:32:09.836	Çalışan sayısı 775 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-PENDIK	metin.salik	\N
79	Çalışan Sayısı Güncellendi	2026-04-27 09:35:18.325	Çalışan sayısı 222 olarak güncellendi. (Yürürlük: 24.04.2026)	LIV-SAMSUN	metin.salik	\N
80	Çalışan Sayısı Güncellendi	2026-04-27 10:27:43.29	Çalışan sayısı 726 olarak güncellendi. (Yürürlük: 24.04.2026)	VM-MP-SAMSUN	metin.salik	\N
81	Yeni Atama Yapıldı	2026-04-27 10:29:34.51	IGU tipi atama yapıldı. (11700 dk)	VM-MP-SAMSUN	metin.salik	\N
82	Çalışan Sayısı Güncellendi	2026-04-27 10:30:48.849	Çalışan sayısı 349 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-SEYHAN	metin.salik	\N
83	Yeni Atama Yapıldı	2026-04-27 10:32:51.807	IGU tipi atama yapıldı. (3920 dk)	MP-SEYHAN	metin.salik	\N
84	Çalışan Sayısı Güncellendi	2026-04-27 10:36:09.274	Çalışan sayısı 280 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-TEM	metin.salik	\N
85	Yeni Atama Yapıldı	2026-04-27 10:37:55.847	IGU tipi atama yapıldı. (1240 dk)	MP-TEM	metin.salik	\N
86	Çalışan Sayısı Güncellendi	2026-04-27 10:44:31.866	Çalışan sayısı 278 olarak güncellendi. (Yürürlük: 24.04.2026)	İSU-LIV-TOPKAP	metin.salik	\N
87	Yeni Atama Yapıldı	2026-04-27 10:45:52.459	IGU tipi atama yapıldı. (11700 dk)	İSU-LIV-TOPKAP	metin.salik	\N
88	Yeni Atama Yapıldı	2026-04-27 10:47:44.882	DSP tipi atama yapıldı. (11700 dk)	İSU-LIV-TOPKAP	metin.salik	\N
89	Yeni Atama Yapıldı	2026-04-27 10:50:40.856	IGU tipi atama yapıldı. (10 dk)	MLP-KARADENIZ-I	metin.salik	\N
90	Çalışan Sayısı Güncellendi	2026-04-27 10:53:24.114	Çalışan sayısı 311 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-KARADENIZ	metin.salik	\N
91	Çalışan Sayısı Güncellendi	2026-04-27 10:55:41.297	Çalışan sayısı 264 olarak güncellendi. (Yürürlük: 24.04.2026)	MP-YILDIZLI	metin.salik	\N
92	Yeni Atama Yapıldı	2026-04-27 10:56:48.624	IGU tipi atama yapıldı. (3000 dk)	MP-YILDIZLI	metin.salik	\N
93	Çalışan Sayısı Güncellendi	2026-04-27 10:58:21.03	Çalışan sayısı 652 olarak güncellendi. (Yürürlük: 24.04.2026)	LIV-ULUS	metin.salik	\N
94	Çalışan Sayısı Güncellendi	2026-04-27 11:01:17.969	Çalışan sayısı 572 olarak güncellendi. (Yürürlük: 24.04.2026)	LIV-VADI	metin.salik	\N
95	Yeni Atama Yapıldı	2026-04-27 11:04:21.026	IGU tipi atama yapıldı. (260 dk)	MLP-VADI-İDARI	metin.salik	\N
96	Atama Sonlandırıldı	2026-04-27 11:04:33.007	IGU tipi atama sonlandırıldı.	MLP-VADI-İDARI	metin.salik	\N
97	Çalışan Sayısı Güncellendi	2026-06-01 05:54:04.678	Çalışan sayısı 469 olarak güncellendi. (Yürürlük: 23.05.2026)	MP-ANKARA	metin.salik	\N
98	Çalışan Sayısı Güncellendi	2026-06-01 06:11:33.302	Çalışan sayısı 553 olarak güncellendi. (Yürürlük: 23.05.2026)	VM-MP-FLORYA	metin.salik	\N
99	Atama Sonlandırıldı	2026-06-01 06:14:31.978	IGU tipi atama sonlandırıldı.	VM-MP-FLORYA	metin.salik	\N
100	Yeni Atama Yapıldı	2026-06-01 06:15:57.461	IGU tipi atama yapıldı. (11700 dk)	VM-MP-FLORYA	metin.salik	\N
101	Çalışan Sayısı Güncellendi	2026-06-01 06:25:42.034	Çalışan sayısı 343 olarak güncellendi. (Yürürlük: 23.05.2026)	MP-ADANA	metin.salik	\N
102	Çalışan Sayısı Güncellendi	2026-06-01 06:27:37.049	Çalışan sayısı 474 olarak güncellendi. (Yürürlük: 23.05.2026)	LIV-ANKARA	metin.salik	\N
103	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 62 yapıldı.	GOP-DIYALIZ-MER	metin.salik	\N
104	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 44 yapıldı.	İSTINYE-DENT	metin.salik	\N
105	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 731 yapıldı.	İSU-LIV-BAHCES	metin.salik	\N
106	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 282 yapıldı.	İSU-LIV-TOPKAP	metin.salik	\N
107	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 559 yapıldı.	İSU-MP-GAZIOSM	metin.salik	\N
108	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 697 yapıldı.	İSU-TIP-FAKULT	metin.salik	\N
109	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 474 yapıldı.	LIV-ANKARA	metin.salik	\N
110	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 356 yapıldı.	LIV-GAZIANTEP	metin.salik	\N
111	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 224 yapıldı.	LIV-SAMSUN	metin.salik	\N
112	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 655 yapıldı.	LIV-ULUS	metin.salik	\N
113	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 577 yapıldı.	LIV-VADI	metin.salik	\N
114	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 1 yapıldı.	MLP-ANKARA-DEPO	metin.salik	\N
115	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 1 yapıldı.	MLP-ANTALYA-KON	metin.salik	\N
116	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 95 yapıldı.	MLP-AR-GE	metin.salik	\N
117	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 50 yapıldı.	MLP-CAGRI-MERKE	metin.salik	\N
118	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 13 yapıldı.	MLP-İGA	metin.salik	\N
119	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 2 yapıldı.	MLP-KARADENIZ-I	metin.salik	\N
120	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 420 yapıldı.	MLP-MERKEZ	metin.salik	\N
121	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 4 yapıldı.	MLP-MERKEZ-DEPO	metin.salik	\N
122	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 4 yapıldı.	MLP-SAMSUN-LIV-	metin.salik	\N
123	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 0 yapıldı.	MLP-VADI-İDARI	metin.salik	\N
124	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 26 yapıldı.	MLP-VADI-OFIS	metin.salik	\N
125	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 343 yapıldı.	MP-ADANA	metin.salik	\N
126	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 469 yapıldı.	MP-ANKARA	metin.salik	\N
127	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 707 yapıldı.	MP-ANTALYA	metin.salik	\N
128	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 200 yapıldı.	MP-ATASEHIR	metin.salik	\N
129	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 741 yapıldı.	MP-BAHCELIEVLER	metin.salik	\N
130	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 5 yapıldı.	MP-CANAKKALE	metin.salik	\N
131	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 441 yapıldı.	MP-GEBZE	metin.salik	\N
132	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 706 yapıldı.	MP-GOZTEPE	metin.salik	\N
133	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 16 yapıldı.	MP-İNCEK	metin.salik	\N
134	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 246 yapıldı.	MP-İSTANBUL-ON	metin.salik	\N
135	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 208 yapıldı.	MP-İZMIR	metin.salik	\N
136	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 307 yapıldı.	MP-KARADENIZ	metin.salik	\N
137	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 346 yapıldı.	MP-ORDU	metin.salik	\N
138	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 345 yapıldı.	MP-SEYHAN	metin.salik	\N
139	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 283 yapıldı.	MP-TEM	metin.salik	\N
140	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 248 yapıldı.	MP-TOKAT	metin.salik	\N
141	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 261 yapıldı.	MP-YILDIZLI	metin.salik	\N
142	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 359 yapıldı.	VM-MP-ANKARA	metin.salik	\N
143	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 506 yapıldı.	VM-MP-BURSA	metin.salik	\N
144	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 266 yapıldı.	VM-MP-FATIH	metin.salik	\N
145	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 553 yapıldı.	VM-MP-FLORYA	metin.salik	\N
146	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 591 yapıldı.	VM-MP-KOCAELI	metin.salik	\N
147	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 459 yapıldı.	VM-MP-MALTEPE	metin.salik	\N
148	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 469 yapıldı.	VM-MP-MERSIN	metin.salik	\N
149	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 759 yapıldı.	VM-MP-PENDIK	metin.salik	\N
150	Toplu Çalışan Sayısı Güncelleme	2026-06-01 06:59:09.595	Toplu güncelleme ile çalışan sayısı 726 yapıldı.	VM-MP-SAMSUN	metin.salik	\N
151	Atama Sonlandırıldı	2026-06-01 07:04:27.284	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik	\N
152	Atama Sonlandırıldı	2026-06-01 07:04:28.726	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik	\N
153	Atama Sonlandırıldı	2026-06-01 07:04:29.647	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik	\N
154	Atama Sonlandırıldı	2026-06-01 07:04:30.077	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik	\N
155	Atama Sonlandırıldı	2026-06-01 07:04:30.241	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik	\N
156	Atama Sonlandırıldı	2026-06-01 07:04:30.442	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik	\N
157	Atama Sonlandırıldı	2026-06-01 07:04:30.819	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik	\N
158	Atama Sonlandırıldı	2026-06-01 07:04:30.991	DSP tipi atama sonlandırıldı.	VM-MP-BURSA	metin.salik	\N
159	Atama Sonlandırıldı	2026-06-01 07:08:10.743	DSP tipi atama sonlandırıldı.	GOP-DIYALIZ-MER	metin.salik	\N
160	Atama Sonlandırıldı	2026-06-01 07:19:51.931	IGU tipi atama sonlandırıldı.	VM-MP-FATIH	metin.salik	\N
161	Yeni Atama Yapıldı	2026-06-01 07:22:02.426	IGU tipi atama yapıldı. (720 dk)	VM-MP-FATIH	metin.salik	\N
162	Yeni Atama Yapıldı	2026-06-01 07:22:07.076	IGU tipi atama yapıldı. (720 dk)	VM-MP-FATIH	metin.salik	\N
163	Atama Sonlandırıldı	2026-06-01 07:22:26.649	IGU tipi atama sonlandırıldı.	VM-MP-FATIH	metin.salik	\N
164	Atama Sonlandırıldı	2026-06-01 07:51:30.638	Hekim tipi atama sonlandırıldı.	MLP-İGA	metin.salik	\N
165	Atama Sonlandırıldı	2026-06-01 07:56:25.588	DSP tipi atama sonlandırıldı.	İSU-TIP-FAKULT	metin.salik	\N
166	Yeni Atama Yapıldı	2026-06-01 08:02:24.013	IGU tipi atama yapıldı. (11700 dk)	İSU-LIV-BAHCES	metin.salik	\N
167	Atama Sonlandırıldı	2026-06-01 08:11:16.276	DSP tipi atama sonlandırıldı.	VM-MP-MALTEPE	metin.salik	\N
168	Yeni Atama Yapıldı	2026-06-01 08:21:50.476	IGU tipi atama yapıldı. (440 dk)	VM-MP-PENDIK	metin.salik	\N
169	Atama Sonlandırıldı	2026-06-01 08:23:12.286	IGU tipi atama sonlandırıldı.	VM-MP-PENDIK	metin.salik	\N
170	Yeni Atama Yapıldı	2026-06-01 10:21:16.352	DSP tipi atama yapıldı. (11700 dk)	MP-TOKAT	metin.salik	\N
171	Yeni Atama Yapıldı	2026-06-01 10:26:47.234	Hekim tipi atama yapıldı. (100 dk)	MLP-KARADENIZ-I	metin.salik	\N
172	Atama Sonlandırıldı	2026-06-01 10:30:26.809	DSP tipi atama sonlandırıldı.	MP-YILDIZLI	metin.salik	\N
173	Atama Sonlandırıldı	2026-06-01 10:46:18.576	IGU tipi atama sonlandırıldı.	MP-İNCEK	metin.salik	\N
174	Atama Sonlandırıldı	2026-06-01 10:46:24.691	Hekim tipi atama sonlandırıldı.	MP-İNCEK	metin.salik	\N
175	Atama Sonlandırıldı	2026-06-01 10:46:31.261	DSP tipi atama sonlandırıldı.	MP-İNCEK	metin.salik	\N
176	Yeni Atama Yapıldı	2026-06-01 11:24:51.108	DSP tipi atama yapıldı. (5920 dk)	MP-YILDIZLI	metin.salik	\N
177	Atama Sonlandırıldı	2026-06-01 11:29:24.346	Nesibe ÖMÜR'in MP Yıldızlı tesisindeki DSP ataması 01.06.2026 tarihinde Metin Salık tarafından sonlandırıldı.	MP-YILDIZLI	metin.salik	\N
178	Yeni Atama Yapıldı	2026-06-01 11:29:44.588	19.05.2026 tarihinde Nesibe ÖMÜR - DSP tipi atama yapıldı. (5290 dk.) işlemi yapan Metin Salık	MP-YILDIZLI	metin.salik	\N
179	Atama Sonlandırıldı	2026-06-01 11:50:35.732	Nesibe ÖMÜR'in MP Yıldızlı tesisindeki DSP ataması 01.06.2026 tarihinde Metin Salık tarafından sonlandırıldı.	MP-YILDIZLI	metin.salik	\N
180	Yeni Atama Yapıldı	2026-06-01 11:50:57.957	19.05.2026 tarihinde Nesibe ÖMÜR - DSP tipi atama yapıldı. (5290 dk.)	MP-YILDIZLI	metin.salik	\N
181	Yeni Atama Yapıldı	2026-06-01 11:52:33.811	01.06.2026 tarihinde Alptekin Akyazı - IGU tipi atama yapıldı. (3000 dk.)	MP-YILDIZLI	metin.salik	\N
182	Atama Sonlandırıldı	2026-06-01 11:52:52.685	Alptekin Akyazı'in MP Yıldızlı tesisindeki IGU ataması 01.06.2026 tarihinde Metin Salık tarafından sonlandırıldı.	MP-YILDIZLI	metin.salik	\N
183	Atama Güncellendi	2026-06-01 12:55:55.089	Atama detayları güncellendi. Süre: 3000 dk -> 3500 dk. 	MP-YILDIZLI	metin.salik	168
184	Atama Güncellendi	2026-06-01 12:56:49.785	Atama detayları güncellendi. Süre: 3500 dk -> 3000 dk. 	MP-YILDIZLI	metin.salik	168
185	Atama Güncellendi	2026-06-01 13:46:12.911	Alptekin Akyazı'in MP Yıldızlı tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 3000 dk -> 3300 dk. Başlangıç tarihi: 20.02.2026 -> 19.05.2026.	MP-YILDIZLI	metin.salik	168
186	Atama Güncellendi	2026-06-01 13:50:11.926	Alptekin Akyazı'in MP Yıldızlı tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 3300 dk -> 3000 dk. Başlangıç tarihi: 19.05.2026 -> 20.02.2026.	MP-YILDIZLI	metin.salik	168
187	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 65 yapıldı.	GOP-DIYALIZ-MER	metin.salik	\N
188	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 46 yapıldı.	İSTINYE-DENT	metin.salik	\N
189	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 879 yapıldı.	İSU-LIV-BAHCES	metin.salik	\N
190	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 420 yapıldı.	İSU-LIV-TOPKAP	metin.salik	\N
191	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 686 yapıldı.	İSU-MP-GAZIOSM	metin.salik	\N
192	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 787 yapıldı.	İSU-TIP-FAKULT	metin.salik	\N
193	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 558 yapıldı.	LIV-ANKARA	metin.salik	\N
194	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 396 yapıldı.	LIV-GAZIANTEP	metin.salik	\N
195	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 260 yapıldı.	LIV-SAMSUN	metin.salik	\N
196	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 738 yapıldı.	LIV-ULUS	metin.salik	\N
197	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 647 yapıldı.	LIV-VADI	metin.salik	\N
198	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 1 yapıldı.	MLP-ANKARA-DEPO	metin.salik	\N
199	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 1 yapıldı.	MLP-ANTALYA-KON	metin.salik	\N
200	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 96 yapıldı.	MLP-AR-GE	metin.salik	\N
201	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 51 yapıldı.	MLP-CAGRI-MERKE	metin.salik	\N
202	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 13 yapıldı.	MLP-İGA	metin.salik	\N
203	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 2 yapıldı.	MLP-KARADENIZ-I	metin.salik	\N
204	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 419 yapıldı.	MLP-MERKEZ	metin.salik	\N
205	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 4 yapıldı.	MLP-MERKEZ-DEPO	metin.salik	\N
206	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 4 yapıldı.	MLP-SAMSUN-LIV-	metin.salik	\N
207	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 0 yapıldı.	MLP-VADI-İDARI	metin.salik	\N
208	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 26 yapıldı.	MLP-VADI-OFIS	metin.salik	\N
209	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 371 yapıldı.	MP-ADANA	metin.salik	\N
210	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 560 yapıldı.	MP-ANKARA	metin.salik	\N
211	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 805 yapıldı.	MP-ANTALYA	metin.salik	\N
212	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 232 yapıldı.	MP-ATASEHIR	metin.salik	\N
213	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 848 yapıldı.	MP-BAHCELIEVLER	metin.salik	\N
214	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 5 yapıldı.	MP-CANAKKALE	metin.salik	\N
215	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 527 yapıldı.	MP-GEBZE	metin.salik	\N
216	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 813 yapıldı.	MP-GOZTEPE	metin.salik	\N
217	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 0 yapıldı.	MP-İNCEK	metin.salik	\N
218	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 266 yapıldı.	MP-İSTANBUL-ON	metin.salik	\N
219	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 237 yapıldı.	MP-İZMIR	metin.salik	\N
220	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 334 yapıldı.	MP-KARADENIZ	metin.salik	\N
221	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 375 yapıldı.	MP-ORDU	metin.salik	\N
222	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 376 yapıldı.	MP-SEYHAN	metin.salik	\N
223	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 295 yapıldı.	MP-TEM	metin.salik	\N
224	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 267 yapıldı.	MP-TOKAT	metin.salik	\N
225	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 275 yapıldı.	MP-YILDIZLI	metin.salik	\N
226	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 436 yapıldı.	VM-MP-ANKARA	metin.salik	\N
227	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 538 yapıldı.	VM-MP-BURSA	metin.salik	\N
228	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 308 yapıldı.	VM-MP-FATIH	metin.salik	\N
229	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 636 yapıldı.	VM-MP-FLORYA	metin.salik	\N
230	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 683 yapıldı.	VM-MP-KOCAELI	metin.salik	\N
231	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 512 yapıldı.	VM-MP-MALTEPE	metin.salik	\N
232	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 561 yapıldı.	VM-MP-MERSIN	metin.salik	\N
233	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 967 yapıldı.	VM-MP-PENDIK	metin.salik	\N
234	Toplu Çalışan Sayısı Güncelleme	2026-06-05 11:28:29.785	Toplu güncelleme ile çalışan sayısı 842 yapıldı.	VM-MP-SAMSUN	metin.salik	\N
235	Atama Güncellendi	2026-06-05 11:41:10.216	Şahide Merve Kırdal'in MP Ankara tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 8760 dk -> 11700 dk. Tam zamanlı durumu: false -> true.	MP-ANKARA	metin.salik	151
236	Atama Güncellendi	2026-06-05 11:43:32.31	Gökmen GÜNDOĞDU'in VM MP Ankara tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 4360 dk -> 7440 dk. Başlangıç tarihi: 22.04.2025 -> 05.06.2025.	VM-MP-ANKARA	metin.salik	45
237	Atama Güncellendi	2026-06-05 11:44:02.81	Gülçin AKTAŞ'in VM MP Ankara tesisindeki DSP ataması Metin Salık tarafından güncellendi. Süre: 7320 dk -> 7180 dk.	VM-MP-ANKARA	metin.salik	128
238	Atama Güncellendi	2026-06-05 11:44:25.997	Ferda ÖZTÜRK'in VM MP Ankara tesisindeki Hekim ataması Metin Salık tarafından güncellendi. Süre: 5490 dk -> 6540 dk.	VM-MP-ANKARA	metin.salik	95
239	Yeni Atama Yapıldı	2026-06-05 11:50:41.383	04.05.2026 tarihinde Tekinay Tan - IGU tipi atama yapıldı. (8680 dk.)	MP-ANTALYA	metin.salik	\N
240	Atama Güncellendi	2026-06-05 12:10:07.518	Yaşar POLAT'in Liv Gaziantep tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 4240 dk -> 5840 dk. Başlangıç tarihi: 10.02.2025 -> 05.06.2026.	LIV-GAZIANTEP	metin.salik	11
241	Atama Sonlandırıldı	2026-06-05 12:11:29.759	Yunus SÜNDÜK'in Liv Gaziantep tesisindeki Hekim ataması 31.05.2026 tarihinde Metin Salık tarafından sonlandırıldı.	LIV-GAZIANTEP	metin.salik	\N
242	Yeni Atama Yapıldı	2026-06-05 12:12:38.04	01.06.2026 tarihinde İbrahim Can Kürkçüoğlu - Hekim tipi atama yapıldı. (11700 dk.)	LIV-GAZIANTEP	metin.salik	\N
243	Atama Sonlandırıldı	2026-06-05 12:17:48.485	Fatih Mehmet ÖZAYDIN'in MP Göztepe tesisindeki IGU ataması 24.04.2026 tarihinde Metin Salık tarafından sonlandırıldı.	MP-GOZTEPE	metin.salik	\N
244	Yeni Atama Yapıldı	2026-06-05 12:19:16.934	06.05.2026 tarihinde Ozan Özçelik - IGU tipi atama yapıldı. (11700 dk.)	MP-GOZTEPE	metin.salik	\N
245	Atama Güncellendi	2026-06-05 12:31:31.651	Ömer Faruk AYDIN'in MP İstanbul Onkoloji tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 9840 dk -> 11700 dk. Tam zamanlı durumu: false -> true. Başlangıç tarihi: 05.01.2026 -> 04.06.2026.	MP-İSTANBUL-ON	metin.salik	65
246	Atama Sonlandırıldı	2026-06-05 12:34:26.646	Derya Baral'in VM MP Pendik tesisindeki IGU ataması 01.06.2026 tarihinde Metin Salık tarafından sonlandırıldı.	VM-MP-PENDIK	metin.salik	\N
247	Atama Sonlandırıldı	2026-06-05 12:38:14.809	Tuğçe ŞEN'in VM MP Samsun tesisindeki IGU ataması 04.06.2026 tarihinde Metin Salık tarafından sonlandırıldı.	VM-MP-SAMSUN	metin.salik	\N
248	Atama Güncellendi	2026-06-05 12:39:34.756	Kasım Yiğit'in MP Seyhan tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 3800 dk -> 5080 dk. Başlangıç tarihi: 05.03.2026 -> 05.06.2026.	MP-SEYHAN	metin.salik	163
249	Atama Güncellendi	2026-06-05 12:41:04.164	Murad DİREN'in MP Tem tesisindeki Hekim ataması Metin Salık tarafından güncellendi. Süre: 4245 dk -> 4440 dk.	MP-TEM	metin.salik	69
250	Atama Güncellendi	2026-06-05 12:41:18.96	Tülay Demirci'in MP Tem tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 1320 dk -> 1840 dk.	MP-TEM	metin.salik	164
251	Atama Güncellendi	2026-06-05 12:43:43.381	Fatma Nur TÜRKSOY'in MP Karadeniz tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 2480 dk -> 3520 dk.	MP-KARADENIZ	metin.salik	42
252	Atama Sonlandırıldı	2026-06-05 12:45:14.653	Nesibe ÖMÜR'in MP Yıldızlı tesisindeki DSP ataması 19.05.2026 tarihinde Metin Salık tarafından sonlandırıldı.	MP-YILDIZLI	metin.salik	\N
253	Atama Güncellendi	2026-06-08 12:59:54.678	Gülhan ÇAKIR'in VM MP Fatih tesisindeki Hekim ataması Metin Salık tarafından güncellendi. Süre: 4500 dk -> 5000 dk. Başlangıç tarihi: 07.10.2025 -> 08.06.2026.	VM-MP-FATIH	metin.salik	97
254	Atama Güncellendi	2026-06-09 07:05:19.506	Olga Nehir ÖZTEL'in Liv Vadi tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 2880 dk -> 6000 dk. Başlangıç tarihi: 05.02.2025 -> 09.06.2026.	LIV-VADI	metin.salik	138
255	Atama Güncellendi	2026-06-09 07:05:43.881	Hakan HASMAN'in MP Ankara tesisindeki Hekim ataması Metin Salık tarafından güncellendi. Süre: 8100 dk -> 9000 dk. Başlangıç tarihi: 18.09.2023 -> 09.06.2026.	MP-ANKARA	metin.salik	80
256	Atama Güncellendi	2026-06-09 07:06:06.522	Adnan ALACA'in MP İzmir tesisindeki Hekim ataması Metin Salık tarafından güncellendi. Süre: 3150 dk -> 4000 dk. Başlangıç tarihi: 18.07.2024 -> 09.06.2026.	MP-İZMIR	metin.salik	88
257	Atama Güncellendi	2026-06-09 07:06:18.674	Nurten Arzu BAĞKURAN'in MP İzmir tesisindeki DSP ataması Metin Salık tarafından güncellendi. Süre: 3150 dk -> 4000 dk. Başlangıç tarihi: 05.11.2025 -> 09.06.2026.	MP-İZMIR	metin.salik	123
258	Atama Güncellendi	2026-06-09 07:06:38.952	Göksal ŞAHİN'in MP Ordu tesisindeki Hekim ataması Metin Salık tarafından güncellendi. Süre: 5580 dk -> 6500 dk. Başlangıç tarihi: 02.08.2024 -> 09.06.2026.	MP-ORDU	metin.salik	89
259	Atama Güncellendi	2026-06-09 07:06:56.725	Fisun MEYDAN ŞAHİN'in MP Ordu tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 4600 dk -> 5500 dk. Başlangıç tarihi: 30.09.2025 -> 09.06.2026.	MP-ORDU	metin.salik	37
260	Atama Güncellendi	2026-06-09 07:07:24.07	Abdullah CANTÜRK'in MP Yıldızlı tesisindeki Hekim ataması Metin Salık tarafından güncellendi. Süre: 4110 dk -> 4500 dk. Başlangıç tarihi: 09.05.2025 -> 09.06.2026.	MP-YILDIZLI	metin.salik	94
261	Atama Güncellendi	2026-06-09 07:08:02.932	Muharrem ASLANTAŞ'in VM MP Maltepe tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 8080 dk -> 11700 dk. Tam zamanlı durumu: false -> true. Başlangıç tarihi: 22.07.2025 -> 09.06.2026.	VM-MP-MALTEPE	metin.salik	55
262	Yeni Atama Yapıldı	2026-06-09 07:10:26.569	09.06.2026 tarihinde İrem Bal - IGU tipi atama yapıldı. (11700 dk.)	VM-MP-PENDIK	metin.salik	\N
263	Atama Güncellendi	2026-06-09 07:10:43.901	İrem Bal'in VM MP Pendik tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 11700 dk -> 8640 dk. Tam zamanlı durumu: true -> false.	VM-MP-PENDIK	metin.salik	177
264	Atama Güncellendi	2026-06-09 07:11:07.72	İrem Bal'in VM MP Pendik tesisindeki IGU ataması Metin Salık tarafından güncellendi. Başlangıç tarihi: 09.06.2026 -> 08.06.2026.	VM-MP-PENDIK	metin.salik	177
265	Çalışan Sayısı Güncellendi	2026-06-09 07:11:48.476	Çalışan sayısı 966 olarak güncellendi. (Yürürlük: 09.06.2026)	VM-MP-PENDIK	metin.salik	\N
266	Atama Güncellendi	2026-06-09 07:24:31.017	Fevzi AKDEMİR'in VM MP Pendik tesisindeki Hekim ataması Metin Salık tarafından güncellendi. Süre: 1845 dk -> 3240 dk. Başlangıç tarihi: 25.03.2025 -> 09.06.2026.	VM-MP-PENDIK	metin.salik	103
267	Atama Güncellendi	2026-06-09 07:30:13.027	Halime Şayak'in İSÜ Liv Topkapı tesisindeki DSP ataması Metin Salık tarafından güncellendi. Süre: 5640 dk -> 8340 dk. Başlangıç tarihi: 10.02.2026 -> 09.06.2026.	İSU-LIV-TOPKAP	metin.salik	166
268	Atama Güncellendi	2026-06-09 10:56:53.402	Gülsün SEVEN'in VM MP Fatih tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 720 dk -> 2280 dk. Başlangıç tarihi: 08.05.2026 -> 09.06.2026.	VM-MP-FATIH	metin.salik	170
269	Çalışan Sayısı Güncellendi	2026-06-09 10:57:07.654	Çalışan sayısı 307 olarak güncellendi. (Yürürlük: 09.06.2026)	VM-MP-FATIH	metin.salik	\N
270	Çalışan Sayısı Güncellendi	2026-06-09 10:59:05.029	Çalışan sayısı 261 olarak güncellendi. (Yürürlük: 09.06.2026)	MP-İSTANBUL-ON	metin.salik	\N
271	Yeni Atama Yapıldı	2026-06-09 11:00:17.966	09.06.2026 tarihinde Hakan Yılmaz - IGU tipi atama yapıldı. (440 dk.)	MP-İSTANBUL-ON	metin.salik	\N
272	Yeni Atama Yapıldı	2026-06-09 11:01:35.447	09.06.2026 tarihinde Hakan Yılmaz - IGU tipi atama yapıldı. (5200 dk.)	İSU-LIV-BAHCES	metin.salik	\N
273	Atama Güncellendi	2026-06-09 11:29:27.03	Kemal EKİCİ'in VM MP Bursa tesisindeki Hekim ataması Metin Salık tarafından güncellendi. Süre: 7875 dk -> 8200 dk. Başlangıç tarihi: 23.11.2022 -> 09.06.2026.	VM-MP-BURSA	metin.salik	96
274	Çalışan Sayısı Güncellendi	2026-06-09 11:29:39.232	Çalışan sayısı 535 olarak güncellendi. (Yürürlük: 09.06.2026)	VM-MP-BURSA	metin.salik	\N
275	Yeni Atama Yapıldı	2026-06-09 11:53:37.064	09.06.2026 tarihinde Melike Uslu - IGU tipi atama yapıldı. (1400 dk.)	VM-MP-BURSA	metin.salik	\N
276	Atama Güncellendi	2026-06-11 06:34:13.503	Murad DİREN'in İSÜ Liv Topkapı tesisindeki Hekim ataması Metin Salık tarafından güncellendi. Süre: 4230 dk -> 6000 dk.	İSU-LIV-TOPKAP	metin.salik	69
277	Atama Güncellendi	2026-06-11 06:34:57.947	Murad DİREN'in İSÜ Liv Topkapı tesisindeki Hekim ataması Metin Salık tarafından güncellendi. Süre: 6000 dk -> 6300 dk.	İSU-LIV-TOPKAP	metin.salik	69
278	Atama Güncellendi	2026-06-11 06:49:54.424	Metin SALIK'in İSÜ Liv Topkapı tesisindeki IGU ataması Metin Salık tarafından güncellendi. Süre: 11700 dk -> 9200 dk. Tam zamanlı durumu: true -> false. Başlangıç tarihi: 11.09.2025 -> 10.06.2026.	İSU-LIV-TOPKAP	metin.salik	4
279	Atama Güncellendi	2026-06-11 06:54:39.227	İshak Murat AKBAŞ'in MP Seyhan tesisindeki Hekim ataması Metin Salık tarafından güncellendi. Süre: 5250 dk -> 6000 dk. Başlangıç tarihi: 07.04.2023 -> 10.06.2026.	MP-SEYHAN	metin.salik	90
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
30	MP-GOZTEPE	32	\N	IGU	11700	t	2025-03-07 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.51	2026-04-24 08:05:01.51
31	MP-GOZTEPE	34	\N	IGU	11700	t	2025-01-15 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.511	2026-04-24 08:05:01.511
32	MP-GOZTEPE	87	\N	Hekim	11700	t	2025-01-21 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.512	2026-04-24 08:05:01.512
33	MP-GOZTEPE	122	\N	DSP	11700	t	2024-08-21 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.513	2026-04-24 08:05:01.513
34	MP-KARADENIZ	41	\N	IGU	11700	t	2024-08-23 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.514	2026-04-24 08:05:01.514
37	MP-KARADENIZ	126	\N	DSP	11700	t	2022-12-01 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.518	2026-04-24 08:05:01.518
38	MP-ORDU	36	\N	IGU	11700	t	2025-09-30 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.518	2026-04-24 08:05:01.518
41	MP-ORDU	124	\N	DSP	11700	t	2026-01-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.521	2026-04-24 08:05:01.521
42	MP-CANAKKALE	21	\N	IGU	200	f	2025-09-05 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.521	2026-04-24 08:05:01.521
44	MP-CANAKKALE	116	\N	DSP	2850	f	2022-12-21 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.523	2026-04-24 08:05:01.523
49	VM-MP-BURSA	46	\N	IGU	11700	t	2025-05-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.529	2026-04-24 08:05:01.529
50	VM-MP-BURSA	47	\N	IGU	11700	t	2025-05-13 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.53	2026-04-24 08:05:01.53
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
19	MP-ADANA	114	\N	DSP	11700	t	2026-01-05 00:00:00	2026-03-16 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.501	2026-04-27 06:31:53.704
7	LIV-ANKARA	74	\N	Hekim	7290	f	2025-02-03 00:00:00	2026-02-23 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.49	2026-04-27 06:50:52.618
43	MP-CANAKKALE	140	\N	Hekim	75	f	2026-01-16 00:00:00	2026-01-05 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.522	2026-04-27 07:40:45.929
65	VM-MP-PENDIK	59	\N	IGU	4000	f	2025-07-17 00:00:00	2026-04-27 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.542	2026-06-01 08:23:12.286
1	LIV-GAZIANTEP	10	\N	IGU	11700	t	2025-01-06 00:00:00	2026-02-02 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.484	2026-04-27 08:24:24.486
48	MP-İNCEK	117	\N	DSP	220	f	2024-04-03 00:00:00	2026-06-01 00:00:00	Sona Erdi	Saatlik	\N	2026-04-24 08:05:01.528	2026-06-01 10:46:31.261
47	MP-İNCEK	82	\N	Hekim	1605	f	2025-10-16 00:00:00	2026-01-28 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.525	2026-04-27 08:40:39.434
46	MP-İNCEK	81	\N	Hekim	330	f	2025-11-07 00:00:00	2026-06-01 00:00:00	Sona Erdi	Saatlik	\N	2026-04-24 08:05:01.524	2026-06-01 10:46:24.691
55	VM-MP-FLORYA	51	\N	IGU	11700	t	2025-10-06 00:00:00	2026-04-01 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.533	2026-06-01 06:14:31.978
36	MP-KARADENIZ	93	\N	Hekim	10500	f	2024-06-04 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.516	2026-06-01 10:25:48.284
45	MP-İNCEK	22	\N	IGU	640	f	2025-11-07 00:00:00	2026-06-01 00:00:00	Sona Erdi	Saatlik	\N	2026-04-24 08:05:01.523	2026-06-01 10:46:18.576
68	VM-MP-PENDIK	137	\N	DSP	11700	t	2022-12-01 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.544	2026-04-24 08:05:01.544
3	LIV-GAZIANTEP	75	\N	Hekim	7400	f	2024-09-27 00:00:00	2026-05-31 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.487	2026-06-05 12:11:29.759
29	MP-GOZTEPE	33	\N	IGU	11700	t	2025-02-25 00:00:00	2026-04-24 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.509	2026-06-05 12:17:48.485
35	MP-KARADENIZ	42	\N	IGU	3520	f	2026-01-06 00:00:00	\N	Aktif	Saatlik	\N	2026-04-24 08:05:01.515	2026-06-05 12:43:43.377
40	MP-ORDU	89	\N	Hekim	6500	f	2026-06-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.52	2026-06-09 07:06:38.946
39	MP-ORDU	37	\N	IGU	5500	f	2026-06-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.519	2026-06-09 07:06:56.719
67	VM-MP-PENDIK	103	\N	Hekim	3240	f	2026-06-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.543	2026-06-09 07:24:31.008
51	VM-MP-BURSA	96	\N	Hekim	8200	f	2026-06-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.53	2026-06-09 11:29:27.019
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
95	İSU-TIP-FAKULT	147	\N	IGU	11700	t	2026-02-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.565	2026-04-24 08:05:01.565
96	İSU-TIP-FAKULT	149	\N	IGU	11700	t	2026-02-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.566	2026-04-24 08:05:01.566
97	İSU-TIP-FAKULT	148	\N	IGU	11700	t	2026-02-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.567	2026-04-24 08:05:01.567
98	MP-ANKARA	19	\N	IGU	11700	t	2025-11-18 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.567	2026-04-24 08:05:01.567
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
117	MP-SEYHAN	125	\N	DSP	11700	t	2024-07-19 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.583	2026-04-24 08:05:01.583
118	MP-TEM	39	\N	IGU	11700	t	2025-09-08 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.583	2026-04-24 08:05:01.583
120	MP-TEM	145	\N	DSP	11700	t	2026-01-28 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.585	2026-04-24 08:05:01.585
121	MP-TOKAT	40	\N	IGU	11700	t	2023-06-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.585	2026-04-24 08:05:01.585
122	MP-TOKAT	92	\N	Hekim	4260	f	2024-04-23 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.586	2026-04-24 08:05:01.586
123	MP-YILDIZLI	43	\N	IGU	11700	t	2022-12-01 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.587	2026-04-24 08:05:01.587
126	VM-MP-ANKARA	44	\N	IGU	11700	t	2025-04-22 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.589	2026-04-24 08:05:01.589
130	VM-MP-FATIH	48	\N	IGU	11700	t	2024-01-11 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.591	2026-04-24 08:05:01.591
133	VM-MP-FATIH	130	\N	DSP	11700	t	2024-09-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.593	2026-04-24 08:05:01.593
134	VM-MP-FATIH	131	\N	DSP	11700	t	2025-06-27 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.594	2026-04-24 08:05:01.594
103	MP-ANTALYA	24	\N	IGU	11700	t	2026-01-06 00:00:00	2026-03-13 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.571	2026-04-27 07:17:42.876
108	MP-GEBZE	86	\N	Hekim	6600	f	2025-12-23 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.575	2026-06-01 07:46:47.277
91	MLP-İGA	144	\N	IGU	140	f	2024-03-26 00:00:00	2026-03-06 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.563	2026-04-27 08:37:11.127
92	İSTINYE-DENT	66	\N	IGU	840	f	2025-04-16 00:00:00	2026-03-12 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.563	2026-04-27 08:46:50.699
69	İSU-LIV-BAHCES	1	\N	IGU	11700	t	2026-01-15 00:00:00	2026-04-21 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.545	2026-04-27 09:01:40.688
125	MP-YILDIZLI	127	\N	DSP	5920	f	2023-01-11 00:00:00	2026-05-19 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.588	2026-06-01 10:30:26.809
89	MLP-VADI-OFIS	144	\N	IGU	260	f	2025-02-04 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.561	2026-04-27 11:04:58.97
131	VM-MP-FATIH	139	\N	IGU	400	f	2026-01-29 00:00:00	2026-04-27 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.592	2026-06-01 07:19:51.931
135	VM-MP-KOCAELI	52	\N	IGU	11700	t	2026-01-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.595	2026-04-24 08:05:01.595
136	VM-MP-KOCAELI	53	\N	IGU	11700	t	2026-01-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.595	2026-04-24 08:05:01.595
137	VM-MP-KOCAELI	99	\N	Hekim	11700	t	2025-02-07 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.596	2026-04-24 08:05:01.596
129	VM-MP-ANKARA	128	\N	DSP	7180	f	2025-07-18 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.591	2026-06-05 11:44:02.804
128	VM-MP-ANKARA	95	\N	Hekim	6540	f	2025-04-03 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.59	2026-06-05 11:44:25.99
110	MP-İSTANBUL-ON	65	\N	IGU	11700	t	2026-06-04 00:00:00	\N	Aktif	Saatlik	\N	2026-04-24 08:05:01.578	2026-06-05 12:31:31.642
119	MP-TEM	69	\N	Hekim	4440	f	2025-09-08 00:00:00	\N	Aktif	Saatlik	\N	2026-04-24 08:05:01.584	2026-06-05 12:41:04.159
132	VM-MP-FATIH	97	\N	Hekim	5000	f	2026-06-08 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.593	2026-06-08 12:59:54.669
85	LIV-VADI	138	\N	IGU	6000	f	2026-06-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.558	2026-06-09 07:05:19.497
100	MP-ANKARA	80	\N	Hekim	9000	f	2026-06-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.569	2026-06-09 07:05:43.874
113	MP-İZMIR	88	\N	Hekim	4000	f	2026-06-09 00:00:00	\N	Aktif	Saatlik	\N	2026-04-24 08:05:01.58	2026-06-09 07:06:06.513
114	MP-İZMIR	123	\N	DSP	4000	f	2026-06-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.581	2026-06-09 07:06:18.669
93	İSU-LIV-TOPKAP	4	\N	IGU	9200	f	2026-06-10 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.564	2026-06-11 06:49:54.414
94	İSU-LIV-TOPKAP	69	\N	Hekim	6300	f	2025-10-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.564	2026-06-11 06:34:57.941
116	MP-SEYHAN	90	\N	Hekim	6000	f	2026-06-10 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.582	2026-06-11 06:54:39.219
138	VM-MP-KOCAELI	133	\N	DSP	11700	t	2022-12-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.597	2026-04-24 08:05:01.597
139	VM-MP-MALTEPE	54	\N	IGU	11700	t	2025-07-04 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.597	2026-04-24 08:05:01.597
141	VM-MP-MALTEPE	100	\N	Hekim	11700	t	2025-09-25 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.599	2026-04-24 08:05:01.599
143	VM-MP-MALTEPE	135	\N	DSP	11700	t	2025-07-12 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.6	2026-04-24 08:05:01.6
144	VM-MP-SAMSUN	62	\N	IGU	11700	t	2025-10-23 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.601	2026-04-24 08:05:01.601
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
166	MLP-MERKEZ	143	\N	IGU	11700	t	2024-09-17 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 09:20:41.742	2026-04-27 09:20:41.742
167	MLP-MERKEZ	142	\N	Hekim	2350	f	2022-11-30 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 09:21:32.129	2026-04-27 09:21:32.129
168	MP-İSTANBUL-ON	161	\N	DSP	11700	t	2026-04-03 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 09:29:54.9	2026-04-27 09:29:54.9
169	VM-MP-SAMSUN	162	\N	IGU	11700	t	2026-04-11 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 10:29:34.51	2026-04-27 10:29:34.51
172	İSU-LIV-TOPKAP	165	\N	IGU	11700	t	2026-04-24 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 10:45:52.459	2026-04-27 10:45:52.459
174	MLP-KARADENIZ-I	167	\N	IGU	40	f	2026-02-02 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 10:50:40.856	2026-04-27 10:51:00.508
176	MLP-VADI-İDARI	144	\N	IGU	260	f	2026-04-27 00:00:00	2026-04-27 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-27 11:04:21.026	2026-04-27 11:04:33.007
177	VM-MP-FLORYA	169	\N	IGU	11700	t	2026-04-08 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-01 06:15:57.461	2026-06-01 06:15:57.461
179	VM-MP-FATIH	170	\N	IGU	720	f	2026-05-08 00:00:00	2026-06-01 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-06-01 07:22:07.076	2026-06-01 07:22:26.649
160	MLP-İGA	160	\N	Hekim	65	f	2026-03-06 00:00:00	2026-05-08 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-27 08:36:57.858	2026-06-01 07:51:30.638
164	İSU-TIP-FAKULT	109	\N	DSP	11700	t	2023-02-06 00:00:00	2026-05-19 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-27 09:05:54.115	2026-06-01 07:56:25.588
180	İSU-LIV-BAHCES	171	\N	IGU	11700	t	2026-05-13 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-01 08:02:24.013	2026-06-01 08:02:24.013
52	VM-MP-BURSA	129	\N	DSP	11700	t	2022-11-23 00:00:00	2026-05-19 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.531	2026-06-01 07:04:30.991
156	GOP-DIYALIZ-MER	156	\N	DSP	11700	t	2026-04-27 00:00:00	2026-05-19 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-27 08:01:32.095	2026-06-01 07:08:10.743
142	VM-MP-MALTEPE	134	\N	DSP	11700	t	2023-08-23 00:00:00	2026-05-19 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.599	2026-06-01 08:11:16.276
182	MP-TOKAT	173	\N	DSP	11700	t	2026-05-22 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-01 10:21:16.352	2026-06-01 10:21:16.352
183	MLP-KARADENIZ-I	93	\N	Hekim	100	f	2026-05-14 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-01 10:26:47.234	2026-06-01 10:26:47.234
184	MP-YILDIZLI	127	\N	DSP	5920	f	2026-05-10 00:00:00	2026-06-01 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-06-01 11:24:51.108	2026-06-01 11:29:24.346
185	MP-YILDIZLI	127	\N	DSP	5290	f	2026-05-19 00:00:00	2026-06-01 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-06-01 11:29:44.585	2026-06-01 11:50:35.732
187	MP-YILDIZLI	168	\N	IGU	3000	f	2026-06-01 00:00:00	2026-06-01 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-06-01 11:52:33.805	2026-06-01 11:52:52.685
2	LIV-GAZIANTEP	11	\N	IGU	5840	f	2026-06-05 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.486	2026-06-05 12:10:07.51
189	LIV-GAZIANTEP	175	\N	Hekim	11700	t	2026-06-01 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-05 12:12:38.037	2026-06-05 12:12:38.037
190	MP-GOZTEPE	176	\N	IGU	11700	t	2026-05-06 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-05 12:19:16.928	2026-06-05 12:19:16.928
175	MP-YILDIZLI	168	\N	IGU	3000	f	2026-02-20 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 10:56:48.624	2026-06-01 13:50:11.92
149	MP-ANKARA	151	\N	IGU	11700	t	2026-04-27 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 06:59:24.585	2026-06-05 11:41:10.208
127	VM-MP-ANKARA	45	\N	IGU	7440	f	2025-06-05 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.589	2026-06-05 11:43:32.301
188	MP-ANTALYA	174	\N	IGU	8680	f	2026-05-04 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-05 11:50:41.375	2026-06-05 11:50:41.375
181	VM-MP-PENDIK	172	\N	IGU	440	f	2026-05-15 00:00:00	2026-06-01 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-06-01 08:21:50.476	2026-06-05 12:34:26.646
145	VM-MP-SAMSUN	63	\N	IGU	11700	t	2022-11-29 00:00:00	2026-06-04 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-04-24 08:05:01.602	2026-06-05 12:38:14.809
170	MP-SEYHAN	163	\N	IGU	5080	f	2026-06-05 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 10:32:51.807	2026-06-05 12:39:34.749
171	MP-TEM	164	\N	IGU	1840	f	2026-02-13 00:00:00	\N	Aktif	Saatlik	\N	2026-04-27 10:37:55.847	2026-06-05 12:41:18.956
186	MP-YILDIZLI	127	\N	DSP	5290	f	2026-05-19 00:00:00	2026-05-19 00:00:00	Sona Erdi	Aylık Sabit	\N	2026-06-01 11:50:57.949	2026-06-05 12:45:14.653
124	MP-YILDIZLI	94	\N	Hekim	4500	f	2026-06-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-24 08:05:01.587	2026-06-09 07:07:24.063
140	VM-MP-MALTEPE	55	\N	IGU	11700	t	2026-06-09 00:00:00	\N	Aktif	Saatlik	\N	2026-04-24 08:05:01.598	2026-06-09 07:08:02.926
173	İSU-LIV-TOPKAP	166	\N	DSP	8340	f	2026-06-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-04-27 10:47:44.882	2026-06-09 07:30:13.016
191	VM-MP-PENDIK	177	\N	IGU	8640	f	2026-06-08 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-09 07:10:26.56	2026-06-09 07:11:07.711
178	VM-MP-FATIH	170	\N	IGU	2280	f	2026-06-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-01 07:22:02.426	2026-06-09 10:56:53.395
192	MP-İSTANBUL-ON	159	\N	IGU	440	f	2026-06-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-09 11:00:17.959	2026-06-09 11:00:17.959
193	İSU-LIV-BAHCES	159	\N	IGU	5200	f	2026-06-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-09 11:01:35.439	2026-06-09 11:01:35.439
194	VM-MP-BURSA	179	\N	IGU	1400	f	2026-06-09 00:00:00	\N	Aktif	Aylık Sabit	\N	2026-06-09 11:53:37.056	2026-06-09 11:53:37.056
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
91	GOP-DIYALIZ-MER	65	2026-06-05 00:00:00	2026-06-05 11:28:29.785
92	İSTINYE-DENT	46	2026-06-05 00:00:00	2026-06-05 11:28:29.785
93	İSU-LIV-BAHCES	879	2026-06-05 00:00:00	2026-06-05 11:28:29.785
94	İSU-LIV-TOPKAP	420	2026-06-05 00:00:00	2026-06-05 11:28:29.785
95	İSU-MP-GAZIOSM	686	2026-06-05 00:00:00	2026-06-05 11:28:29.785
96	İSU-TIP-FAKULT	787	2026-06-05 00:00:00	2026-06-05 11:28:29.785
97	LIV-ANKARA	558	2026-06-05 00:00:00	2026-06-05 11:28:29.785
98	LIV-GAZIANTEP	396	2026-06-05 00:00:00	2026-06-05 11:28:29.785
99	LIV-SAMSUN	260	2026-06-05 00:00:00	2026-06-05 11:28:29.785
100	LIV-ULUS	738	2026-06-05 00:00:00	2026-06-05 11:28:29.785
101	LIV-VADI	647	2026-06-05 00:00:00	2026-06-05 11:28:29.785
102	MLP-ANKARA-DEPO	1	2026-06-05 00:00:00	2026-06-05 11:28:29.785
103	MLP-ANTALYA-KON	1	2026-06-05 00:00:00	2026-06-05 11:28:29.785
104	MLP-AR-GE	96	2026-06-05 00:00:00	2026-06-05 11:28:29.785
105	MLP-CAGRI-MERKE	51	2026-06-05 00:00:00	2026-06-05 11:28:29.785
106	MLP-İGA	13	2026-06-05 00:00:00	2026-06-05 11:28:29.785
107	MLP-KARADENIZ-I	2	2026-06-05 00:00:00	2026-06-05 11:28:29.785
108	MLP-MERKEZ	419	2026-06-05 00:00:00	2026-06-05 11:28:29.785
109	MLP-MERKEZ-DEPO	4	2026-06-05 00:00:00	2026-06-05 11:28:29.785
110	MLP-SAMSUN-LIV-	4	2026-06-05 00:00:00	2026-06-05 11:28:29.785
111	MLP-VADI-İDARI	0	2026-06-05 00:00:00	2026-06-05 11:28:29.785
112	MLP-VADI-OFIS	26	2026-06-05 00:00:00	2026-06-05 11:28:29.785
113	MP-ADANA	371	2026-06-05 00:00:00	2026-06-05 11:28:29.785
114	MP-ANKARA	560	2026-06-05 00:00:00	2026-06-05 11:28:29.785
115	MP-ANTALYA	805	2026-06-05 00:00:00	2026-06-05 11:28:29.785
116	MP-ATASEHIR	232	2026-06-05 00:00:00	2026-06-05 11:28:29.785
117	MP-BAHCELIEVLER	848	2026-06-05 00:00:00	2026-06-05 11:28:29.785
118	MP-CANAKKALE	5	2026-06-05 00:00:00	2026-06-05 11:28:29.785
119	MP-GEBZE	527	2026-06-05 00:00:00	2026-06-05 11:28:29.785
120	MP-GOZTEPE	813	2026-06-05 00:00:00	2026-06-05 11:28:29.785
121	MP-İNCEK	0	2026-06-05 00:00:00	2026-06-05 11:28:29.785
122	MP-İSTANBUL-ON	266	2026-06-05 00:00:00	2026-06-05 11:28:29.785
123	MP-İZMIR	237	2026-06-05 00:00:00	2026-06-05 11:28:29.785
124	MP-KARADENIZ	334	2026-06-05 00:00:00	2026-06-05 11:28:29.785
125	MP-ORDU	375	2026-06-05 00:00:00	2026-06-05 11:28:29.785
126	MP-SEYHAN	376	2026-06-05 00:00:00	2026-06-05 11:28:29.785
127	MP-TEM	295	2026-06-05 00:00:00	2026-06-05 11:28:29.785
128	MP-TOKAT	267	2026-06-05 00:00:00	2026-06-05 11:28:29.785
129	MP-YILDIZLI	275	2026-06-05 00:00:00	2026-06-05 11:28:29.785
130	VM-MP-ANKARA	436	2026-06-05 00:00:00	2026-06-05 11:28:29.785
131	VM-MP-BURSA	538	2026-06-05 00:00:00	2026-06-05 11:28:29.785
132	VM-MP-FATIH	308	2026-06-05 00:00:00	2026-06-05 11:28:29.785
133	VM-MP-FLORYA	636	2026-06-05 00:00:00	2026-06-05 11:28:29.785
134	VM-MP-KOCAELI	683	2026-06-05 00:00:00	2026-06-05 11:28:29.785
135	VM-MP-MALTEPE	512	2026-06-05 00:00:00	2026-06-05 11:28:29.785
136	VM-MP-MERSIN	561	2026-06-05 00:00:00	2026-06-05 11:28:29.785
137	VM-MP-PENDIK	967	2026-06-05 00:00:00	2026-06-05 11:28:29.785
138	VM-MP-SAMSUN	842	2026-06-05 00:00:00	2026-06-05 11:28:29.785
139	VM-MP-PENDIK	966	2026-06-09 00:00:00	2026-06-09 07:11:48.476
140	VM-MP-FATIH	307	2026-06-09 00:00:00	2026-06-09 10:57:07.654
141	MP-İSTANBUL-ON	261	2026-06-09 00:00:00	2026-06-09 10:59:05.029
142	VM-MP-BURSA	535	2026-06-09 00:00:00	2026-06-09 11:29:39.232
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
GOP-DIYALIZ-MER	GOP Diyaliz Merkezi	t	2026-04-24 08:05:01.46	2026-06-05 11:28:29.785	İstanbul	Bileşim Turizm İnşaat San. ve Tic. A.S Özel Gaziosmanpaşa Diyaliz Merkezi Şubesi	Tehlikeli	İstanbul	\N	65	Yenidoğan Mah.Erka Balata Sk. No:6C	\N	\N	286220606108001203425-76/000	\N	\N	\N	Tıp Merkezi	\N
İSTINYE-DENT	İstinye Dent	t	2026-04-24 08:05:01.465	2026-06-05 11:28:29.785	İstanbul		Tehlikeli	İstanbul	\N	46	Ayazağa, Defne Sk. No:1 D:34408,	\N	\N	\N	\N	\N	\N	Hastane	\N
İSU-LIV-BAHCES	İSÜ Liv Bahçeşehir	t	2026-04-24 08:05:01.479	2026-06-05 11:28:29.785	İstanbul	İstinye Üniversitesi	Çok Tehlikeli	İstanbul	\N	879	Aşık Veysel, Süleyman Demirel Cd. No:1, 34517	\N	\N	\N	\N	\N	\N	Hastane	\N
MLP-AR-GE	MLP AR-GE	t	2026-04-24 08:05:01.464	2026-06-05 11:28:29.785			Az Tehlikeli		\N	96		\N	\N	\N	\N	\N	\N	Ofis	\N
İSU-LIV-TOPKAP	İSÜ Liv Topkapı	t	2026-04-24 08:05:01.479	2026-06-05 11:28:29.785	İstanbul	İstinye Üniversitesi	Çok Tehlikeli	İstanbul	\N	420	Maltepe Mah Edirne Çırpıcı Yolu Sk. No:9, 34010	\N	\N	\N	\N	\N	\N	Hastane	\N
İSU-MP-GAZIOSM	İSÜ MP Gaziosmanpaşa	t	2026-04-24 08:05:01.478	2026-06-05 11:28:29.785	İstanbul	İstinye Üniversitesi	Çok Tehlikeli	İstanbul	\N	686	Merkez, Çukurçeşme Cd. No:57 D:59, 34250	\N	\N	\N	\N	\N	\N	Hastane	\N
İSU-TIP-FAKULT	İSÜ Tıp Fakültesi	t	2026-04-24 08:05:01.478	2026-06-05 11:28:29.785	İstanbul	İstinye Üniversitesi	Çok Tehlikeli	İstanbul	\N	787	Merkez, Çukurçeşme Cd. No:51, 34245	\N	\N	\N	\N	\N	\N	Hastane	\N
LIV-ANKARA	Liv Ankara	t	2026-04-24 08:05:01.478	2026-06-05 11:28:29.785	Ankara	MS Sağlık Hizmetleri Ticaret Anonim Şirketi	Çok Tehlikeli	Ankara	\N	558	Kavaklıdere, Bestekar Sok. No:8 06680	\N	\N	\N	\N	\N	\N	Hastane	\N
LIV-GAZIANTEP	Liv Gaziantep	t	2026-04-24 08:05:01.477	2026-06-05 11:28:29.785	Gaziantep	MLP Gaziantep Sağlık Hizmetleri Anonim Şirketi	Çok Tehlikeli	Gaziantep	\N	396	Seyrantepe, Abdulkadir Konukoğlu Cd No:1 27080	\N	\N	\N	\N	\N	\N	Hastane	\N
LIV-SAMSUN	Liv Samsun	t	2026-04-24 08:05:01.477	2026-06-05 11:28:29.785	Samsun	Samsun Medikal Grup Özel Sağlık Hizm. A.Ş.	Çok Tehlikeli	Samsun	\N	260	Hançerli, Fatih Sultan Mehmet Cd No:155 55020	\N	\N	\N	\N	\N	\N	Hastane	\N
LIV-ULUS	Liv Ulus	t	2026-04-24 08:05:01.476	2026-06-05 11:28:29.785	İstanbul	MLP Sağlık Hizmetleri Anonim Şirketi	Çok Tehlikeli	İstanbul	\N	738	Ahmet Adnan Saygun Cad. Canan Sok. No:5 34340	\N	\N	\N	\N	\N	\N	Hastane	\N
LIV-VADI	Liv Vadi	t	2026-04-24 08:05:01.476	2026-06-05 11:28:29.785	İstanbul	Samsun Medikal Grup Özel Sağlık Hizm. A.Ş.	Çok Tehlikeli	İstanbul	\N	647	Ayazağa Mahallesi, Kemerburgaz Caddesi, Vadistanbul Park Etabı, 7F Blok 34396	\N	\N	\N	\N	\N	\N	Hastane	\N
MLP-ANKARA-DEPO	MLP Ankara Depo	t	2026-04-24 08:05:01.461	2026-06-05 11:28:29.785	Ankara		Tehlikeli	Ankara	\N	1	Çamlıca Mh.Bağdat Cad. Dış Kapı No:83 İç Kapı No:17	\N	\N	\N	\N	\N	\N	Depo	\N
MLP-ANTALYA-KON	MLP Antalya Konuk Evi	t	2026-04-24 08:05:01.458	2026-06-05 11:28:29.785	Antalya	28610010115235780072046-152	Az Tehlikeli	Antalya	\N	1	Güzeloba Mah. 2157 Sk. Dış Kapı No:11	\N	\N	\N	\N	\N	\N	Ofis	\N
MLP-CAGRI-MERKE	MLP Çağrı Merkezi	t	2026-04-24 08:05:01.463	2026-06-05 11:28:29.785			Az Tehlikeli		\N	51		\N	\N	\N	\N	\N	\N	Çağrı Merkezi	\N
MLP-İGA	MLP İGA	t	2026-04-24 08:05:01.461	2026-06-05 11:28:29.785			Az Tehlikeli		\N	13		\N	\N	\N	\N	\N	\N	Ofis	\N
MLP-KARADENIZ-I	MLP Karadeniz İdari	t	2026-04-24 08:05:01.459	2026-06-05 11:28:29.785			Az Tehlikeli		\N	2		\N	\N	\N	\N	\N	\N	Ofis	\N
MLP-MERKEZ	MLP Merkez	t	2026-04-24 08:05:01.464	2026-06-05 11:28:29.785			Az Tehlikeli		\N	419		\N	\N	\N	\N	\N	\N	Ofis	\N
MLP-MERKEZ-DEPO	MLP Merkez Depo	t	2026-04-24 08:05:01.462	2026-06-05 11:28:29.785			Tehlikeli		\N	4		\N	\N	\N	\N	\N	\N	Depo	\N
MLP-SAMSUN-LIV-	MLP Samsun Liv İdari	t	2026-04-24 08:05:01.46	2026-06-05 11:28:29.785	Samsun	Hançerli Mah. Dervişzade Sk. Dış Kapı No:6 İç Kapı No:13	Çok Tehlikeli	Samsun	\N	4	Hançerli Mah. Dervişzade Sk. Dış Kapı No:6 İç Kapı No:13	\N	\N	28610010111679150551844-000	\N	\N	\N	Ofis	\N
MLP-VADI-İDARI	MLP Vadi İdari	f	2026-04-24 08:05:01.463	2026-06-05 11:28:29.785			Az Tehlikeli		\N	0		\N	\N	\N	\N	\N	\N	Ofis	\N
MLP-VADI-OFIS	MLP Vadi Ofis	t	2026-04-24 08:05:01.463	2026-06-05 11:28:29.785			Az Tehlikeli		\N	26		\N	\N	\N	\N	\N	\N	Ofis	\N
MP-ADANA	MP Adana	t	2026-04-24 08:05:01.476	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	371		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-ANKARA	MP Ankara	t	2026-04-24 08:05:01.475	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	560		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-ANTALYA	MP Antalya	t	2026-04-24 08:05:01.474	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	805		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-ATASEHIR	MP Ataşehir	t	2026-04-24 08:05:01.474	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	232		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-BAHCELIEVLER	MP Bahçelievler	t	2026-04-24 08:05:01.474	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	848		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-CANAKKALE	MP Çanakkale	t	2026-04-24 08:05:01.473	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	5		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-GEBZE	MP Gebze	t	2026-04-24 08:05:01.473	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	527		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-GOZTEPE	MP Göztepe	t	2026-04-24 08:05:01.472	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	813		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-İNCEK	MP İncek	f	2026-04-24 08:05:01.475	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	0		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-İZMIR	MP İzmir	t	2026-04-24 08:05:01.472	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	237		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-KARADENIZ	MP Karadeniz	t	2026-04-24 08:05:01.47	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	334		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-ORDU	MP Ordu	t	2026-04-24 08:05:01.472	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	375		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-SEYHAN	MP Seyhan	t	2026-04-24 08:05:01.471	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	376		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-TEM	MP Tem	t	2026-04-24 08:05:01.471	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	295		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-TOKAT	MP Tokat	t	2026-04-24 08:05:01.47	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	267		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-YILDIZLI	MP Yıldızlı	t	2026-04-24 08:05:01.47	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	275		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-ANKARA	VM MP Ankara	t	2026-04-24 08:05:01.469	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	436		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-FLORYA	VM MP Florya	t	2026-04-24 08:05:01.468	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	636		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-KOCAELI	VM MP Kocaeli	t	2026-04-24 08:05:01.467	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	683		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-MALTEPE	VM MP Maltepe	t	2026-04-24 08:05:01.467	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	512		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-MERSIN	VM MP Mersin	t	2026-04-24 08:05:01.466	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	561		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-SAMSUN	VM MP Samsun	t	2026-04-24 08:05:01.465	2026-06-05 11:28:29.785			Çok Tehlikeli		\N	842		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-PENDIK	VM MP Pendik	t	2026-04-24 08:05:01.466	2026-06-09 07:11:48.476			Çok Tehlikeli		\N	966		\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-FATIH	VM MP Fatih	t	2026-04-24 08:05:01.468	2026-06-09 10:57:07.654			Çok Tehlikeli		\N	307		\N	\N	\N	\N	\N	\N	Hastane	\N
MP-İSTANBUL-ON	MP İstanbul Onkoloji	t	2026-04-24 08:05:01.465	2026-06-09 10:59:05.029	İstanbul	MLP Sağlık Hizmetleri Anonim Şirketi	Çok Tehlikeli	İstanbul	\N	261	Cevizli, Talatpaşa Cd. B Blok No:75/0	\N	\N	\N	\N	\N	\N	Hastane	\N
VM-MP-BURSA	VM MP Bursa	t	2026-04-24 08:05:01.469	2026-06-09 11:29:39.232			Çok Tehlikeli		\N	535		\N	\N	\N	\N	\N	\N	Hastane	\N
\.


--
-- Data for Name: FacilityBuilding; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."FacilityBuilding" (id, "facilityId", name, "createdAt", "updatedAt", "bedCapacity", "buildingFloors", "buildingHeight", "closedArea", "constructionYear", "gardenArea", "parkingArea", "structureFloors", "structureHeight") FROM stdin;
\.


--
-- Data for Name: FacilityHazmatItem; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."FacilityHazmatItem" (id, "facilityId", "materialId", "amountValue", "unitId", "createdAt", "updatedAt") FROM stdin;
8ed6dcd9-14d5-482f-8c39-5bca51233751	GOP-DIYALIZ-MER	60b4a2e1-5eff-422c-be2a-5fc6708d19aa	1	cmq5msml5000412i0saj0xvrh	2026-06-08 20:41:15.701	2026-06-08 21:16:55.143
ca3be0ff-e2f4-4755-b78b-3991a7ca2cf2	İSTINYE-DENT	60b4a2e1-5eff-422c-be2a-5fc6708d19aa	1	cmq5msml4000312i0lbz840bt	2026-06-08 21:38:49.615	2026-06-08 21:46:59.304
29d6865e-4812-4a03-9f3f-412d470937bc	İSTINYE-DENT	3092459b-527c-4e65-bd6e-d350750f0f6f	1	cmq5msml4000312i0lbz840bt	2026-06-09 06:18:53.374	2026-06-09 06:59:32.714
fa7ab4db-5915-4a45-8774-a63766c4c207	İSTINYE-DENT	31166065-c385-423c-b072-0ab95cd891ad	750	cmq5msml5000412i0saj0xvrh	2026-06-09 07:02:38.01	2026-06-09 07:02:38.01
1a904207-91cc-4d68-a7bc-cc096880631a	İSTINYE-DENT	41cb9587-27df-463a-b3e0-d380a44c460f	400	cmq5msml5000412i0saj0xvrh	2026-06-09 09:00:54.693	2026-06-09 09:05:06.075
\.


--
-- Data for Name: HazmatAdrLabel; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatAdrLabel" (id, code, name, description, "imageUrl", "isActive", "createdAt", "updatedAt") FROM stdin;
a43dfe65-4a02-4975-8c52-3e90f85de1f0	ADR01	Patylayıcı Maddeler	\N	/uploads/hazmat/1780949191545-148279442.jpg	t	2026-06-08 20:06:32.288	2026-06-08 20:06:32.288
4d70fc6d-c72a-4ce7-8e5b-ebc5573839d6	ADR02	Yanıcı Gaz	\N	/uploads/hazmat/1780950026540-599076867.jpg	t	2026-06-08 20:20:27.17	2026-06-08 20:20:27.17
babbc7ad-31e4-4bdc-9c09-cf5936608eed	ADR03	Boğucu Gaz	\N	/uploads/hazmat/1780950048360-95028385.jpg	t	2026-06-08 20:20:49.422	2026-06-08 20:20:49.422
66f1acde-467a-444c-bfe5-2d89211c8c8b	ADR04	Zehirli Gaz	\N	/uploads/hazmat/1780950066113-443136923.jpg	t	2026-06-08 20:21:06.718	2026-06-08 20:21:06.718
7290ebed-ee4b-4b50-a776-417cfd7ea456	ADR05	Alevlenir Sıvılar	\N	/uploads/hazmat/1780950089395-475422986.jpg	t	2026-06-08 20:21:30.087	2026-06-08 20:21:30.087
e7223f22-6ed2-49b9-a9a9-3ab3cb574ab9	ADR06	Alevlenir Katılar	\N	/uploads/hazmat/1780950113213-337383553.jpg	t	2026-06-08 20:21:54.053	2026-06-08 20:21:54.053
3bdfba8d-0d43-44f1-a13c-a2947350ae35	ADR07	Kendiliğinden Yanmaya Yatkın Maddeler	\N	/uploads/hazmat/1780950131603-667193713.jpg	t	2026-06-08 20:22:14.314	2026-06-08 20:22:14.314
67fea72a-37f2-48d1-bcff-6e77864e6af5	ADR08	Su İle Temas Ettiğinde Alevlenir Gazlar Açığa Çıkaran Maddeler	\N	/uploads/hazmat/1780950158272-488247931.jpg	t	2026-06-08 20:22:39	2026-06-08 20:22:39
d8482e4d-11df-4733-90de-b138a9628364	ADR09	Oksitleyici Maddeler	\N	/uploads/hazmat/1780950175360-673909960.jpg	t	2026-06-08 20:22:55.971	2026-06-08 20:22:55.971
a3896052-3085-4697-a1e2-8d588b7d86b8	ADR10	Organik Peroksitler	\N	/uploads/hazmat/1780950195286-144084687.jpg	t	2026-06-08 20:23:15.947	2026-06-08 20:23:15.947
20c9c29e-54ce-4b2a-8783-706627296bfa	ADR11	Zehirli Maddeler	\N	/uploads/hazmat/1780950209047-542029382.jpg	t	2026-06-08 20:23:29.827	2026-06-08 20:23:29.827
1ce0435b-e9eb-4db6-997a-f734c6d9747a	ADR12	Bulaşıcı Maddeler	\N	/uploads/hazmat/1780950227544-520006677.png	t	2026-06-08 20:23:49.292	2026-06-08 20:23:49.292
4a7a9113-ba5e-4e2b-a932-79e9b541c3c3	ADR13	Radyoaktif Malzemeler	\N	/uploads/hazmat/1780950244402-42178752.png	t	2026-06-08 20:24:05.01	2026-06-08 20:24:05.01
85b603f9-2a33-4400-978b-b57e62380be4	ADR14	Aşındırıcı Maddeler	\N	/uploads/hazmat/1780950263220-575652017.jpg	t	2026-06-08 20:24:24.054	2026-06-08 20:24:24.054
b3ad1e65-5398-4799-acf9-b38b9ff9f4f0	ADR15	Muhtelif Tehlikeli Maddeler	\N	/uploads/hazmat/1780950308902-899617735.jpg	t	2026-06-08 20:25:10.136	2026-06-08 20:25:10.136
4a16cada-eef5-466a-9cf3-123d7b3fe8f5	ADR16	Çevre İçin Tehlikeli Maddeler	\N	/uploads/hazmat/1780950325432-332564390.jpg	t	2026-06-08 20:25:26.211	2026-06-08 20:25:26.211
\.


--
-- Data for Name: HazmatAuditLog; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatAuditLog" (id, "materialId", action, details, "changedFields", username, "createdAt") FROM stdin;
f7f5f23c-a5a0-49ae-804b-ed15b06ab08c	60b4a2e1-5eff-422c-be2a-5fc6708d19aa	UPDATE	Kullanıcı ürün içeriğini veya miktarını güncelledi.	\N	metin.salik	2026-06-08 21:16:55.145
50c4dc65-98e0-4458-9483-4e0c89a7ecf4	60b4a2e1-5eff-422c-be2a-5fc6708d19aa	UPDATE	Kullanıcı ürün içeriğini veya miktarını güncelledi.	\N	metin.salik	2026-06-08 21:38:49.616
d4f299ac-a52b-45e6-baca-3924fde286f2	60b4a2e1-5eff-422c-be2a-5fc6708d19aa	UPDATE	Kullanıcı ürün içeriğini veya miktarını güncelledi.	\N	metin.salik	2026-06-08 21:46:59.305
184754b2-8ae0-4296-943b-e1f2b32bfef1	3092459b-527c-4e65-bd6e-d350750f0f6f	CREATE	Kullanıcı yeni bir tehlikeli madde oluşturdu.	\N	metin.salik	2026-06-09 06:18:53.371
4093eac4-8f88-43e5-bb97-54efff2e6589	3092459b-527c-4e65-bd6e-d350750f0f6f	UPDATE	Kullanıcı ürün içeriğini veya miktarını güncelledi.	\N	metin.salik	2026-06-09 06:55:50.678
d75bc93b-6aad-4b79-a1a9-9398718e6c3a	3092459b-527c-4e65-bd6e-d350750f0f6f	UPDATE	Kullanıcı ürün içeriğini veya miktarını güncelledi.	\N	metin.salik	2026-06-09 06:56:30.398
cc0ced6d-6130-4b51-b116-f3c55b6adf7a	3092459b-527c-4e65-bd6e-d350750f0f6f	UPDATE	Kullanıcı ürün içeriğini veya miktarını güncelledi.	\N	metin.salik	2026-06-09 06:56:53.866
de87a6f8-bada-47bf-8993-250f934a5b25	3092459b-527c-4e65-bd6e-d350750f0f6f	UPDATE	Kullanıcı ürün içeriğini veya miktarını güncelledi.	\N	metin.salik	2026-06-09 06:59:32.715
3950ac8b-f8cf-47cb-8d9a-16aed76d19a4	31166065-c385-423c-b072-0ab95cd891ad	CREATE	Kullanıcı yeni bir tehlikeli madde oluşturdu.	\N	metin.salik	2026-06-09 07:02:38.009
04dd79cc-2adc-454e-9114-a0cf4095e059	41cb9587-27df-463a-b3e0-d380a44c460f	CREATE	Kullanıcı yeni bir tehlikeli madde oluşturdu.	\N	metin.salik	2026-06-09 09:00:54.691
de57263f-822d-43b1-8627-b0af4cc7e257	41cb9587-27df-463a-b3e0-d380a44c460f	UPDATE	Kullanıcı ürün içeriğini veya miktarını güncelledi.	\N	metin.salik	2026-06-09 09:03:16.914
701e479b-7ffe-4480-ac2b-79be08c7961f	41cb9587-27df-463a-b3e0-d380a44c460f	UPDATE	Kullanıcı ürün içeriğini veya miktarını güncelledi.	\N	metin.salik	2026-06-09 09:05:06.076
\.


--
-- Data for Name: HazmatCategory; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatCategory" (id, name, scope, examples, "isActive", "createdAt", "updatedAt") FROM stdin;
675d8fff-03a0-430d-9814-18b12d851cf6	Temizlik, Hijyen ve Dezenfeksiyon Kimyasalları	Temizlik, yüzey dezenfeksiyonu, el/cilt antisepsisi, çamaşırhane ve mutfak kimyasalları	Deterjan, çamaşır suyu, yüzey dezenfektanı, el antiseptiği, alkol bazlı ürünler	t	2026-06-09 06:43:20.598	2026-06-09 06:43:20.598
34ed1a70-393a-4055-939c-fbbd67b744fa	Laboratuvar ve Tanı Kimyasalları	Laboratuvar testlerinde, cihaz kitlerinde, kalibrasyon ve kontrol işlemlerinde kullanılan kimyasallar	Biyokimya kitleri, hematoloji solüsyonları, PCR kitleri, boyalar, reaktifler, kalibratörler	t	2026-06-09 06:43:20.601	2026-06-09 06:43:20.601
c7c9988c-2da6-440f-9f50-ed10193143bc	Patoloji, Histoloji ve Morg Kimyasalları	Doku tespiti, boyama, takip, saklama ve morg işlemlerinde kullanılan yüksek riskli kimyasallar	Formaldehit, formalin, ksilen, etanol, metanol, hematoksilen, eozin	t	2026-06-09 06:43:20.602	2026-06-09 06:43:20.602
db333a57-cc32-447a-9c58-883d0c38f3a8	Sterilizasyon ve Tıbbi Cihaz Dezenfeksiyon Kimyasalları	Sterilizasyon, yüksek düzey dezenfeksiyon ve tıbbi cihaz işleme süreçlerinde kullanılan kimyasallar	Etilen oksit, glutaraldehit, OPA, perasetik asit, hidrojen peroksit kartuşları	t	2026-06-09 06:43:20.603	2026-06-09 06:43:20.603
3721d713-64e0-4af9-aaac-05da03aeba97	Teknik Hizmetler, Bakım ve Altyapı Kimyasalları	Teknik bakım, su şartlandırma, kazan, HVAC, boya, solvent, akü, jeneratör ve altyapı kimyasalları	Biyosit, korozyon inhibitörü, pH düzenleyici, tiner, boya, silikon, akü asidi	t	2026-06-09 06:43:20.604	2026-06-09 06:43:20.604
b174d534-6cb3-493f-bbd5-7823eb1b174a	Farmasötik, Klinik ve Özel Amaçlı Kimyasallar	Eczane, klinik uygulama, radyoloji/nükleer tıp, araştırma, eğitim ve özel riskli ürünler	Sitotoksik ilaçlar, kontrast maddeler, radyofarmasötikler, araştırma kimyasalları	t	2026-06-09 06:43:20.605	2026-06-09 06:43:20.605
\.


--
-- Data for Name: HazmatDepartment; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatDepartment" (id, "facilityId", name, "isActive", "createdAt", "updatedAt") FROM stdin;
fea1087a-c93c-487c-b23c-f9f8053d1749	GOP-DIYALIZ-MER	Ameliyathane	t	2026-06-08 19:56:08.927	2026-06-08 19:56:08.927
45314f20-53a7-4d75-b855-94d6fe6a3464	GOP-DIYALIZ-MER	Acil Servis	t	2026-06-08 19:56:08.929	2026-06-08 19:56:08.929
01657f7d-616c-485e-abe5-12a7b2466c53	GOP-DIYALIZ-MER	Radyoloji	t	2026-06-08 19:56:08.93	2026-06-08 19:56:08.93
235ecfa7-071a-4d9f-b010-aef599c90d15	GOP-DIYALIZ-MER	Laboratuvar	t	2026-06-08 19:56:08.931	2026-06-08 19:56:08.931
3e38d7a5-92f4-46e6-92b5-8a00b20b0c31	GOP-DIYALIZ-MER	Yoğun Bakım	t	2026-06-08 19:56:08.931	2026-06-08 19:56:08.931
f021e659-162f-45d7-9ecf-87557c211906	GOP-DIYALIZ-MER	Sterilizasyon	t	2026-06-08 19:56:08.932	2026-06-08 19:56:08.932
1ae7e750-d935-4cf3-b15b-d124bec4ac04	İSTINYE-DENT	Ameliyathane	t	2026-06-08 19:56:08.933	2026-06-08 19:56:08.933
aeb05b5b-d2a2-413f-98c4-df004885a11e	İSTINYE-DENT	Acil Servis	t	2026-06-08 19:56:08.933	2026-06-08 19:56:08.933
5daa8f13-05be-4070-8c4a-e6356fbb7cc1	İSTINYE-DENT	Radyoloji	t	2026-06-08 19:56:08.934	2026-06-08 19:56:08.934
e7ec06df-7b15-4936-a539-8719a09e57e0	İSTINYE-DENT	Laboratuvar	t	2026-06-08 19:56:08.935	2026-06-08 19:56:08.935
b2de2c69-6d52-4572-98be-06f97fb28274	İSTINYE-DENT	Yoğun Bakım	t	2026-06-08 19:56:08.935	2026-06-08 19:56:08.935
5acebe15-8b7c-4b89-8240-71994254dce8	İSTINYE-DENT	Sterilizasyon	t	2026-06-08 19:56:08.936	2026-06-08 19:56:08.936
1d7ce2ce-c67c-4e74-9d63-8864daa51bda	İSU-LIV-BAHCES	Ameliyathane	t	2026-06-08 19:56:08.936	2026-06-08 19:56:08.936
79d3a823-385b-48d9-b040-eec5062f8799	İSU-LIV-BAHCES	Acil Servis	t	2026-06-08 19:56:08.937	2026-06-08 19:56:08.937
870d7147-616d-4abf-a058-ece4bb1928c1	İSU-LIV-BAHCES	Radyoloji	t	2026-06-08 19:56:08.938	2026-06-08 19:56:08.938
f2c0c2c6-ec71-4c80-b4e1-cafa039043a4	İSU-LIV-BAHCES	Laboratuvar	t	2026-06-08 19:56:08.938	2026-06-08 19:56:08.938
8c0dc1b4-6289-46e2-96ff-5ef8fa40f8f4	İSU-LIV-BAHCES	Yoğun Bakım	t	2026-06-08 19:56:08.939	2026-06-08 19:56:08.939
e14ee5d4-72e1-40fa-a58b-64452df2c11c	İSU-LIV-BAHCES	Sterilizasyon	t	2026-06-08 19:56:08.94	2026-06-08 19:56:08.94
1f56fc0d-5cd4-459e-a854-1391bdaf59d3	MLP-AR-GE	Ameliyathane	t	2026-06-08 19:56:08.94	2026-06-08 19:56:08.94
d6f9e17a-a115-4267-8c73-6ac99b4906b6	MLP-AR-GE	Acil Servis	t	2026-06-08 19:56:08.941	2026-06-08 19:56:08.941
a540d108-ee45-42bf-aa17-798dbb4953b4	MLP-AR-GE	Radyoloji	t	2026-06-08 19:56:08.942	2026-06-08 19:56:08.942
18205071-459e-40ac-9a81-5b3250ebe0f4	MLP-AR-GE	Laboratuvar	t	2026-06-08 19:56:08.942	2026-06-08 19:56:08.942
c7448f40-dc4e-4f5d-b3e2-8b78a9e0cd9d	MLP-AR-GE	Yoğun Bakım	t	2026-06-08 19:56:08.943	2026-06-08 19:56:08.943
36a14cfb-e56c-4164-bc05-8b74fe825daf	MLP-AR-GE	Sterilizasyon	t	2026-06-08 19:56:08.944	2026-06-08 19:56:08.944
93a4af53-96a1-4dc3-9724-b61c6beaf8a6	İSU-LIV-TOPKAP	Ameliyathane	t	2026-06-08 19:56:08.944	2026-06-08 19:56:08.944
c40dceb0-1164-4168-b5c3-b9173b81059f	İSU-LIV-TOPKAP	Acil Servis	t	2026-06-08 19:56:08.945	2026-06-08 19:56:08.945
ffb354ea-1247-4bb4-bbfc-bde4f5fcffa5	İSU-LIV-TOPKAP	Radyoloji	t	2026-06-08 19:56:08.946	2026-06-08 19:56:08.946
194a26d9-735a-4af6-8356-d3d7a8facf1e	İSU-LIV-TOPKAP	Laboratuvar	t	2026-06-08 19:56:08.947	2026-06-08 19:56:08.947
1072200c-02ff-4948-9764-f7fada0f1e95	İSU-LIV-TOPKAP	Yoğun Bakım	t	2026-06-08 19:56:08.947	2026-06-08 19:56:08.947
895568b8-2ce9-442b-b7b9-834ea637275c	İSU-LIV-TOPKAP	Sterilizasyon	t	2026-06-08 19:56:08.948	2026-06-08 19:56:08.948
a36aebf8-5283-48c0-a4e5-134eacda3e1a	İSU-MP-GAZIOSM	Ameliyathane	t	2026-06-08 19:56:08.949	2026-06-08 19:56:08.949
0c29b96f-c964-4700-8e61-cc60cb304021	İSU-MP-GAZIOSM	Acil Servis	t	2026-06-08 19:56:08.949	2026-06-08 19:56:08.949
1001536b-75a0-4af4-9441-36bd54dbf2e7	İSU-MP-GAZIOSM	Radyoloji	t	2026-06-08 19:56:08.95	2026-06-08 19:56:08.95
31c55417-f675-4030-8b46-71dbb4ad4d98	İSU-MP-GAZIOSM	Laboratuvar	t	2026-06-08 19:56:08.951	2026-06-08 19:56:08.951
c04d7729-1aa7-4ab2-8b2e-1533f76278fe	İSU-MP-GAZIOSM	Yoğun Bakım	t	2026-06-08 19:56:08.951	2026-06-08 19:56:08.951
30e46d78-1434-41a2-a094-a3a57f1c1c21	İSU-MP-GAZIOSM	Sterilizasyon	t	2026-06-08 19:56:08.952	2026-06-08 19:56:08.952
9bb26207-ae09-45cb-89b7-e79437f9c711	İSU-TIP-FAKULT	Ameliyathane	t	2026-06-08 19:56:08.953	2026-06-08 19:56:08.953
c0185bd8-ef6a-4d1d-b110-782d86742d43	İSU-TIP-FAKULT	Acil Servis	t	2026-06-08 19:56:08.953	2026-06-08 19:56:08.953
4f3e08af-1772-4fea-bb23-5c3d088759e9	İSU-TIP-FAKULT	Radyoloji	t	2026-06-08 19:56:08.954	2026-06-08 19:56:08.954
ee556d5c-eaa0-4339-9b99-7acae34dc7f0	İSU-TIP-FAKULT	Laboratuvar	t	2026-06-08 19:56:08.955	2026-06-08 19:56:08.955
ed1395dd-4408-4d97-bebc-6958bbccc73d	İSU-TIP-FAKULT	Yoğun Bakım	t	2026-06-08 19:56:08.955	2026-06-08 19:56:08.955
5c39839d-ee7d-43ea-af50-6ebdea929dcd	İSU-TIP-FAKULT	Sterilizasyon	t	2026-06-08 19:56:08.956	2026-06-08 19:56:08.956
9a550069-e31d-494a-8e3c-de97c87f5771	LIV-ANKARA	Ameliyathane	t	2026-06-08 19:56:08.957	2026-06-08 19:56:08.957
db887d57-5d89-4657-8908-260981f575fb	LIV-ANKARA	Acil Servis	t	2026-06-08 19:56:08.957	2026-06-08 19:56:08.957
7c0bee80-060a-4955-bbc0-572ac932be54	LIV-ANKARA	Radyoloji	t	2026-06-08 19:56:08.958	2026-06-08 19:56:08.958
28d683aa-646b-403b-a8ad-9e6f77954abd	LIV-ANKARA	Laboratuvar	t	2026-06-08 19:56:08.958	2026-06-08 19:56:08.958
56ffa392-fcb4-4ed1-a8cc-4d856cbfb06a	LIV-ANKARA	Yoğun Bakım	t	2026-06-08 19:56:08.959	2026-06-08 19:56:08.959
19cc0c65-041e-4afb-b641-88a769bd4b4b	LIV-ANKARA	Sterilizasyon	t	2026-06-08 19:56:08.959	2026-06-08 19:56:08.959
99bf33ef-9f9c-47c9-8841-e24ddb5d16de	LIV-GAZIANTEP	Ameliyathane	t	2026-06-08 19:56:08.96	2026-06-08 19:56:08.96
97782b7f-f236-4f24-9850-de1b5f445d86	LIV-GAZIANTEP	Acil Servis	t	2026-06-08 19:56:08.96	2026-06-08 19:56:08.96
bf842093-6ef4-49ba-9a44-69eb761b3024	LIV-GAZIANTEP	Radyoloji	t	2026-06-08 19:56:08.961	2026-06-08 19:56:08.961
a887badf-6670-4be8-91ff-1b7eb2cde303	LIV-GAZIANTEP	Laboratuvar	t	2026-06-08 19:56:08.962	2026-06-08 19:56:08.962
c9a1a02e-d617-480f-9437-c842d4b84fb3	LIV-GAZIANTEP	Yoğun Bakım	t	2026-06-08 19:56:08.962	2026-06-08 19:56:08.962
1f0e494a-d189-4247-a69d-6cb296617c91	LIV-GAZIANTEP	Sterilizasyon	t	2026-06-08 19:56:08.963	2026-06-08 19:56:08.963
4a9a4394-a660-4f92-8b30-123dd44e244f	LIV-SAMSUN	Ameliyathane	t	2026-06-08 19:56:08.963	2026-06-08 19:56:08.963
d921718e-39c3-487e-a151-bbbcece1df6c	LIV-SAMSUN	Acil Servis	t	2026-06-08 19:56:08.964	2026-06-08 19:56:08.964
c107264f-0c00-424b-81b1-f42b845469ab	LIV-SAMSUN	Radyoloji	t	2026-06-08 19:56:08.964	2026-06-08 19:56:08.964
2dae0dd0-c944-4bcc-898a-c9fbea04a1e8	LIV-SAMSUN	Laboratuvar	t	2026-06-08 19:56:08.965	2026-06-08 19:56:08.965
9b4b279f-b58a-41c4-a345-f61b72e30f90	LIV-SAMSUN	Yoğun Bakım	t	2026-06-08 19:56:08.965	2026-06-08 19:56:08.965
577213e1-937d-4028-9ed4-b0286865cec7	LIV-SAMSUN	Sterilizasyon	t	2026-06-08 19:56:08.965	2026-06-08 19:56:08.965
d4ad5ec9-a1be-44fb-832b-b644ff00cdce	LIV-ULUS	Ameliyathane	t	2026-06-08 19:56:08.966	2026-06-08 19:56:08.966
4f7a29e1-466c-4489-984a-6c4661330c42	LIV-ULUS	Acil Servis	t	2026-06-08 19:56:08.967	2026-06-08 19:56:08.967
20132ab3-42c7-4654-98d3-3929312e9df1	LIV-ULUS	Radyoloji	t	2026-06-08 19:56:08.967	2026-06-08 19:56:08.967
852af7ee-2a85-483e-9940-cc7763886df5	LIV-ULUS	Laboratuvar	t	2026-06-08 19:56:08.968	2026-06-08 19:56:08.968
fb9c6a3d-31f0-4bb3-b23b-eafef2861073	LIV-ULUS	Yoğun Bakım	t	2026-06-08 19:56:08.968	2026-06-08 19:56:08.968
67a0000c-63c8-4d84-924b-4ee91d179c5f	LIV-ULUS	Sterilizasyon	t	2026-06-08 19:56:08.969	2026-06-08 19:56:08.969
77b2b4ec-371e-48ba-902a-298563c313fe	LIV-VADI	Ameliyathane	t	2026-06-08 19:56:08.969	2026-06-08 19:56:08.969
a2876e1f-5925-4583-99d2-9e30fd417548	LIV-VADI	Acil Servis	t	2026-06-08 19:56:08.97	2026-06-08 19:56:08.97
8ccd4820-1e4a-4c5a-b202-8b78b82ab784	LIV-VADI	Radyoloji	t	2026-06-08 19:56:08.97	2026-06-08 19:56:08.97
8721c0e8-7433-4e89-9b4c-8f7b34423b87	LIV-VADI	Laboratuvar	t	2026-06-08 19:56:08.971	2026-06-08 19:56:08.971
a20976c4-ca1c-4115-9ee5-9fcb34f7a4d6	LIV-VADI	Yoğun Bakım	t	2026-06-08 19:56:08.971	2026-06-08 19:56:08.971
08714eb9-9a38-4b86-a271-8995a58a65f7	LIV-VADI	Sterilizasyon	t	2026-06-08 19:56:08.972	2026-06-08 19:56:08.972
e1b3a763-f8dd-4ed5-aa19-a8b760d94991	MLP-ANKARA-DEPO	Ameliyathane	t	2026-06-08 19:56:08.973	2026-06-08 19:56:08.973
14754892-f4f4-4303-98b5-105bef270a0a	MLP-ANKARA-DEPO	Acil Servis	t	2026-06-08 19:56:08.973	2026-06-08 19:56:08.973
3194ec6b-39fb-40df-9e9c-309fe25e0d5d	MLP-ANKARA-DEPO	Radyoloji	t	2026-06-08 19:56:08.974	2026-06-08 19:56:08.974
1d3cbb61-85e4-481b-8714-f89f81f3bf81	MLP-ANKARA-DEPO	Laboratuvar	t	2026-06-08 19:56:08.974	2026-06-08 19:56:08.974
bf118a42-57e3-4d1c-8d6c-603fd48722c6	MLP-ANKARA-DEPO	Yoğun Bakım	t	2026-06-08 19:56:08.975	2026-06-08 19:56:08.975
445f7d61-c6a1-4312-85fe-99783485a8e2	MLP-ANKARA-DEPO	Sterilizasyon	t	2026-06-08 19:56:08.975	2026-06-08 19:56:08.975
99f9e860-ed2d-4956-b6d1-c868585fc46f	MLP-ANTALYA-KON	Ameliyathane	t	2026-06-08 19:56:08.976	2026-06-08 19:56:08.976
3096fe0e-5e3d-44d5-9eed-0e140736e254	MLP-ANTALYA-KON	Acil Servis	t	2026-06-08 19:56:08.976	2026-06-08 19:56:08.976
a560cdec-a513-47b5-97f4-74d992d4abbe	MLP-ANTALYA-KON	Radyoloji	t	2026-06-08 19:56:08.977	2026-06-08 19:56:08.977
985119dc-437b-425f-bfb9-71439f05a387	MLP-ANTALYA-KON	Laboratuvar	t	2026-06-08 19:56:08.978	2026-06-08 19:56:08.978
145b5704-6ee9-4dc4-a136-fe1d016cece7	MLP-ANTALYA-KON	Yoğun Bakım	t	2026-06-08 19:56:08.978	2026-06-08 19:56:08.978
3922791d-a3e2-43c0-8c8e-aa697189fe24	MLP-ANTALYA-KON	Sterilizasyon	t	2026-06-08 19:56:08.979	2026-06-08 19:56:08.979
da4b37b0-530c-4118-b037-88dc8559de70	MLP-CAGRI-MERKE	Ameliyathane	t	2026-06-08 19:56:08.979	2026-06-08 19:56:08.979
c4f586f9-4535-468e-b468-6f477fc8d134	MLP-CAGRI-MERKE	Acil Servis	t	2026-06-08 19:56:08.98	2026-06-08 19:56:08.98
2c6c8130-6910-4c23-a637-e156321a546d	MLP-CAGRI-MERKE	Radyoloji	t	2026-06-08 19:56:08.98	2026-06-08 19:56:08.98
8d4573d7-7a14-4aa8-a20a-b2e1704848d7	MLP-CAGRI-MERKE	Laboratuvar	t	2026-06-08 19:56:08.981	2026-06-08 19:56:08.981
1da74abf-8583-457a-800e-57609143ccf9	MLP-CAGRI-MERKE	Yoğun Bakım	t	2026-06-08 19:56:08.981	2026-06-08 19:56:08.981
fe84372a-b0b3-463b-825c-a76a5cc13ef3	MLP-CAGRI-MERKE	Sterilizasyon	t	2026-06-08 19:56:08.982	2026-06-08 19:56:08.982
946f10dc-dec4-441a-aefc-158e8ca2e0f5	MLP-İGA	Ameliyathane	t	2026-06-08 19:56:08.982	2026-06-08 19:56:08.982
97c1fc4f-f306-46e9-8633-3ef4245d0d80	MLP-İGA	Acil Servis	t	2026-06-08 19:56:08.983	2026-06-08 19:56:08.983
a7b4f3bb-4476-4236-9562-86079965fafc	MLP-İGA	Radyoloji	t	2026-06-08 19:56:08.984	2026-06-08 19:56:08.984
fd430a8f-a757-4fa0-b134-c8f8a83a2ad0	MLP-İGA	Laboratuvar	t	2026-06-08 19:56:08.984	2026-06-08 19:56:08.984
595cd478-5659-4c92-9408-1978517ee50a	MLP-İGA	Yoğun Bakım	t	2026-06-08 19:56:08.985	2026-06-08 19:56:08.985
95b533eb-e66e-49f3-845a-a421dad73c43	MLP-İGA	Sterilizasyon	t	2026-06-08 19:56:08.986	2026-06-08 19:56:08.986
df8ad6ed-01f0-438a-87da-16c76ddd8c96	MLP-KARADENIZ-I	Ameliyathane	t	2026-06-08 19:56:08.986	2026-06-08 19:56:08.986
99abd8fb-948a-4964-8443-2fb1cddf3609	MLP-KARADENIZ-I	Acil Servis	t	2026-06-08 19:56:08.987	2026-06-08 19:56:08.987
1296e70c-3d8a-48f3-aa40-c33d82a7d306	MLP-KARADENIZ-I	Radyoloji	t	2026-06-08 19:56:08.987	2026-06-08 19:56:08.987
4de19129-8943-492c-8a79-d13d3fc3751c	MLP-KARADENIZ-I	Laboratuvar	t	2026-06-08 19:56:08.988	2026-06-08 19:56:08.988
6b800492-2ebd-43b1-b728-7d1e77a01eb7	MLP-KARADENIZ-I	Yoğun Bakım	t	2026-06-08 19:56:08.988	2026-06-08 19:56:08.988
219402a2-cd58-4701-ab9f-3d353aa9206d	MLP-KARADENIZ-I	Sterilizasyon	t	2026-06-08 19:56:08.989	2026-06-08 19:56:08.989
68f47fc1-b00d-4a05-8487-67bd23ff8eb3	MLP-MERKEZ	Ameliyathane	t	2026-06-08 19:56:08.989	2026-06-08 19:56:08.989
d6f76aa5-6828-4bee-b7fc-3568499bb2d9	MLP-MERKEZ	Acil Servis	t	2026-06-08 19:56:08.99	2026-06-08 19:56:08.99
c13af2e7-4ad7-463d-9556-73b10bddd221	MLP-MERKEZ	Radyoloji	t	2026-06-08 19:56:08.991	2026-06-08 19:56:08.991
7023ae0e-2a5c-4c2a-b216-1167110122b2	MLP-MERKEZ	Laboratuvar	t	2026-06-08 19:56:08.991	2026-06-08 19:56:08.991
78f90390-e845-40bb-9041-b154629b4824	MLP-MERKEZ	Yoğun Bakım	t	2026-06-08 19:56:08.992	2026-06-08 19:56:08.992
1fba60ac-7599-4ca0-9427-0c38fbf8c28e	MLP-MERKEZ	Sterilizasyon	t	2026-06-08 19:56:08.992	2026-06-08 19:56:08.992
2150fa9c-5bd7-4081-9b97-e8a6c3b85d8a	MLP-MERKEZ-DEPO	Ameliyathane	t	2026-06-08 19:56:08.993	2026-06-08 19:56:08.993
0cb8630f-1de8-487d-bc8e-2937756c4d6d	MLP-MERKEZ-DEPO	Acil Servis	t	2026-06-08 19:56:08.993	2026-06-08 19:56:08.993
4acd0b69-92d6-4dae-a474-fc97dc530a67	MLP-MERKEZ-DEPO	Radyoloji	t	2026-06-08 19:56:08.994	2026-06-08 19:56:08.994
af435d0e-7640-451b-a7ec-b0d003e20e3c	MLP-MERKEZ-DEPO	Laboratuvar	t	2026-06-08 19:56:08.995	2026-06-08 19:56:08.995
ac98ebc5-c5df-4bba-8865-1300e34a0e74	MLP-MERKEZ-DEPO	Yoğun Bakım	t	2026-06-08 19:56:08.995	2026-06-08 19:56:08.995
b02d4b1a-e9df-44fa-b1ad-32e9dea0c509	MLP-MERKEZ-DEPO	Sterilizasyon	t	2026-06-08 19:56:08.996	2026-06-08 19:56:08.996
cc037496-66da-4846-832a-f3b3501a75e7	MLP-SAMSUN-LIV-	Ameliyathane	t	2026-06-08 19:56:08.996	2026-06-08 19:56:08.996
0fea5ded-abcf-44c8-a27a-347660b638f6	MLP-SAMSUN-LIV-	Acil Servis	t	2026-06-08 19:56:08.997	2026-06-08 19:56:08.997
933a3922-4626-4b83-89d6-befcbe9ff9e3	MLP-SAMSUN-LIV-	Radyoloji	t	2026-06-08 19:56:08.997	2026-06-08 19:56:08.997
8e5a46af-fede-4313-9d52-eadeb69e3402	MLP-SAMSUN-LIV-	Laboratuvar	t	2026-06-08 19:56:08.998	2026-06-08 19:56:08.998
519c509a-7c80-443a-a907-35fcd1a17b2f	MLP-SAMSUN-LIV-	Yoğun Bakım	t	2026-06-08 19:56:08.999	2026-06-08 19:56:08.999
a75e411e-251b-499c-8aab-7889fbe29034	MLP-SAMSUN-LIV-	Sterilizasyon	t	2026-06-08 19:56:08.999	2026-06-08 19:56:08.999
8a36053e-9067-4225-b715-5ad798d2924a	MLP-VADI-İDARI	Ameliyathane	t	2026-06-08 19:56:09	2026-06-08 19:56:09
a1d778a3-a024-4fc5-aba4-990769a6ca0a	MLP-VADI-İDARI	Acil Servis	t	2026-06-08 19:56:09	2026-06-08 19:56:09
bf98b3d0-5f8d-4625-9f9b-5e7fa9a67112	MLP-VADI-İDARI	Radyoloji	t	2026-06-08 19:56:09.001	2026-06-08 19:56:09.001
1290999c-5127-4739-a2e4-ef8169f44d47	MLP-VADI-İDARI	Laboratuvar	t	2026-06-08 19:56:09.001	2026-06-08 19:56:09.001
4a92f903-c567-44d2-a9de-500125e9ac06	MLP-VADI-İDARI	Yoğun Bakım	t	2026-06-08 19:56:09.002	2026-06-08 19:56:09.002
e0516667-0faa-4b54-8bc5-1328c03cde0f	MLP-VADI-İDARI	Sterilizasyon	t	2026-06-08 19:56:09.002	2026-06-08 19:56:09.002
f13f7d6b-bb48-4d34-86bc-387415831e17	MLP-VADI-OFIS	Ameliyathane	t	2026-06-08 19:56:09.003	2026-06-08 19:56:09.003
7c289165-c526-4221-b077-9e995cd090f2	MLP-VADI-OFIS	Acil Servis	t	2026-06-08 19:56:09.004	2026-06-08 19:56:09.004
e668733a-c3dd-448a-921e-8d044a59c5e9	MLP-VADI-OFIS	Radyoloji	t	2026-06-08 19:56:09.004	2026-06-08 19:56:09.004
bb2145a9-a2e2-48cb-894d-8e08808be43e	MLP-VADI-OFIS	Laboratuvar	t	2026-06-08 19:56:09.005	2026-06-08 19:56:09.005
11761d07-ee2d-4c8a-9db4-ac418db5b7f7	MLP-VADI-OFIS	Yoğun Bakım	t	2026-06-08 19:56:09.005	2026-06-08 19:56:09.005
df271926-12c7-4dc1-9080-a8410cd7f0f0	MLP-VADI-OFIS	Sterilizasyon	t	2026-06-08 19:56:09.006	2026-06-08 19:56:09.006
f717a303-6b5b-4db8-8ad0-86550cf299f2	MP-ADANA	Ameliyathane	t	2026-06-08 19:56:09.006	2026-06-08 19:56:09.006
2ab4b946-fc20-4296-b822-4b5e505e8a65	MP-ADANA	Acil Servis	t	2026-06-08 19:56:09.007	2026-06-08 19:56:09.007
310983ac-345a-4f0b-bd1d-73ea10c1aac2	MP-ADANA	Radyoloji	t	2026-06-08 19:56:09.007	2026-06-08 19:56:09.007
e353226a-bb47-4127-b088-67a907f27fb7	MP-ADANA	Laboratuvar	t	2026-06-08 19:56:09.008	2026-06-08 19:56:09.008
08831f3a-8947-482d-8cdb-9b2992d7ba12	MP-ADANA	Yoğun Bakım	t	2026-06-08 19:56:09.008	2026-06-08 19:56:09.008
c6c09b31-0f1b-4b8d-8368-19db8283c49b	MP-ADANA	Sterilizasyon	t	2026-06-08 19:56:09.009	2026-06-08 19:56:09.009
45767f8e-315a-497a-b1d1-2a35d477728f	MP-ANKARA	Ameliyathane	t	2026-06-08 19:56:09.009	2026-06-08 19:56:09.009
0dcdb056-3b5d-4c6a-891f-6708641f39e8	MP-ANKARA	Acil Servis	t	2026-06-08 19:56:09.01	2026-06-08 19:56:09.01
c6955108-9f5e-4c60-965d-24536ff67171	MP-ANKARA	Radyoloji	t	2026-06-08 19:56:09.01	2026-06-08 19:56:09.01
b478a65f-014b-4f5b-8fed-1f197d5af88c	MP-ANKARA	Laboratuvar	t	2026-06-08 19:56:09.011	2026-06-08 19:56:09.011
8ff86280-d1ef-41cd-a0b3-e4e1a22eca15	MP-ANKARA	Yoğun Bakım	t	2026-06-08 19:56:09.011	2026-06-08 19:56:09.011
4dd955e0-e8f9-4055-bbdc-c69d18242639	MP-ANKARA	Sterilizasyon	t	2026-06-08 19:56:09.012	2026-06-08 19:56:09.012
d8d2cfdb-80d1-4e09-bc15-c06fa9b59781	MP-ANTALYA	Ameliyathane	t	2026-06-08 19:56:09.012	2026-06-08 19:56:09.012
90c28259-792b-4521-ac65-a28743d3798f	MP-ANTALYA	Acil Servis	t	2026-06-08 19:56:09.013	2026-06-08 19:56:09.013
d0efbbc8-8b0d-4b3e-af10-56e89ed96b7c	MP-ANTALYA	Radyoloji	t	2026-06-08 19:56:09.013	2026-06-08 19:56:09.013
3bca8772-dc41-4634-b888-f3fced6f1f8b	MP-ANTALYA	Laboratuvar	t	2026-06-08 19:56:09.014	2026-06-08 19:56:09.014
469d8bb1-eefa-4c56-a13a-5ba4d63d3c3b	MP-ANTALYA	Yoğun Bakım	t	2026-06-08 19:56:09.014	2026-06-08 19:56:09.014
ae5719ed-58ca-431c-8b81-bc50f789fb68	MP-ANTALYA	Sterilizasyon	t	2026-06-08 19:56:09.014	2026-06-08 19:56:09.014
3c7ee255-03fb-48ee-89a4-ffa281647c0f	MP-ATASEHIR	Ameliyathane	t	2026-06-08 19:56:09.015	2026-06-08 19:56:09.015
54a68274-7712-490d-84ba-337fd04bac33	MP-ATASEHIR	Acil Servis	t	2026-06-08 19:56:09.016	2026-06-08 19:56:09.016
161a449b-3e65-4a8d-8701-69f94f4e010c	MP-ATASEHIR	Radyoloji	t	2026-06-08 19:56:09.016	2026-06-08 19:56:09.016
5279381d-f677-4bc2-bf81-ef8a1fb735ba	MP-ATASEHIR	Laboratuvar	t	2026-06-08 19:56:09.017	2026-06-08 19:56:09.017
a9683395-87ac-4ab6-9ddf-c082a109d462	MP-ATASEHIR	Yoğun Bakım	t	2026-06-08 19:56:09.017	2026-06-08 19:56:09.017
4ea5f19c-76f2-47c0-a49f-5aab58b0efa9	MP-ATASEHIR	Sterilizasyon	t	2026-06-08 19:56:09.018	2026-06-08 19:56:09.018
f7483082-40de-4fec-a4c1-4030469c4097	MP-BAHCELIEVLER	Ameliyathane	t	2026-06-08 19:56:09.018	2026-06-08 19:56:09.018
826eb40e-4672-43ab-adf3-e157b3e6b72c	MP-BAHCELIEVLER	Acil Servis	t	2026-06-08 19:56:09.019	2026-06-08 19:56:09.019
83d61506-3f1a-428d-82d4-569aaf3ff45d	MP-BAHCELIEVLER	Radyoloji	t	2026-06-08 19:56:09.019	2026-06-08 19:56:09.019
4c75d20f-993e-45ff-b41f-c83ce8198df6	MP-BAHCELIEVLER	Laboratuvar	t	2026-06-08 19:56:09.02	2026-06-08 19:56:09.02
1048db27-9442-4480-a4f4-d69b71480a46	MP-BAHCELIEVLER	Yoğun Bakım	t	2026-06-08 19:56:09.021	2026-06-08 19:56:09.021
cf58ded4-784d-4ccf-b7a3-c2f1aa8d2ed8	MP-BAHCELIEVLER	Sterilizasyon	t	2026-06-08 19:56:09.021	2026-06-08 19:56:09.021
f9704631-4f9e-46e0-91ed-18d9c3bc02ff	MP-CANAKKALE	Ameliyathane	t	2026-06-08 19:56:09.022	2026-06-08 19:56:09.022
92bf4a57-b3a3-4400-9786-d696252799a6	MP-CANAKKALE	Acil Servis	t	2026-06-08 19:56:09.022	2026-06-08 19:56:09.022
d8c3973b-5c54-440a-8cca-eeac24a5d0b1	MP-CANAKKALE	Radyoloji	t	2026-06-08 19:56:09.023	2026-06-08 19:56:09.023
3387d16d-2e9a-4a16-adcd-293e93774f35	MP-CANAKKALE	Laboratuvar	t	2026-06-08 19:56:09.023	2026-06-08 19:56:09.023
0cbb6015-e132-4148-a5d1-71a4f9c59e91	MP-CANAKKALE	Yoğun Bakım	t	2026-06-08 19:56:09.024	2026-06-08 19:56:09.024
73392c68-3816-43d7-bd72-6ccc4090a89f	MP-CANAKKALE	Sterilizasyon	t	2026-06-08 19:56:09.024	2026-06-08 19:56:09.024
1f88cda5-22a8-4347-bee0-ba12229795ac	MP-GEBZE	Ameliyathane	t	2026-06-08 19:56:09.025	2026-06-08 19:56:09.025
4344c3f4-5f8a-4e3f-9b34-27231534b7f4	MP-GEBZE	Acil Servis	t	2026-06-08 19:56:09.025	2026-06-08 19:56:09.025
ea8c698f-5744-4d9b-aa8f-ad6c066fc331	MP-GEBZE	Radyoloji	t	2026-06-08 19:56:09.026	2026-06-08 19:56:09.026
1fde99cd-da0f-4cd9-b847-4c3c1ff8124c	MP-GEBZE	Laboratuvar	t	2026-06-08 19:56:09.026	2026-06-08 19:56:09.026
a2daae96-2e85-4d39-aeca-d2ce44f4fa0a	MP-GEBZE	Yoğun Bakım	t	2026-06-08 19:56:09.027	2026-06-08 19:56:09.027
8b8d67c9-77b1-4763-b2cd-f5924da88744	MP-GEBZE	Sterilizasyon	t	2026-06-08 19:56:09.027	2026-06-08 19:56:09.027
3187df9b-2ba5-4871-8935-463715d89d3e	MP-GOZTEPE	Ameliyathane	t	2026-06-08 19:56:09.028	2026-06-08 19:56:09.028
abbff7f7-64f0-4024-8e7a-4fa02bf23dd5	MP-GOZTEPE	Acil Servis	t	2026-06-08 19:56:09.028	2026-06-08 19:56:09.028
9e1bb260-e11d-4aac-8fee-2b199572c1ae	MP-GOZTEPE	Radyoloji	t	2026-06-08 19:56:09.028	2026-06-08 19:56:09.028
831c847f-c516-48b4-b69f-fcf44f8629e9	MP-GOZTEPE	Laboratuvar	t	2026-06-08 19:56:09.029	2026-06-08 19:56:09.029
11c9cf66-f471-4ee4-934a-62e61f6ecd2b	MP-GOZTEPE	Yoğun Bakım	t	2026-06-08 19:56:09.029	2026-06-08 19:56:09.029
b693466e-6d00-4a25-9014-29968551da85	MP-GOZTEPE	Sterilizasyon	t	2026-06-08 19:56:09.03	2026-06-08 19:56:09.03
af069e99-43be-415f-aee3-a705dd7c745b	MP-İNCEK	Ameliyathane	t	2026-06-08 19:56:09.031	2026-06-08 19:56:09.031
457fa186-3a11-4db7-8bc8-c4747d6c77a8	MP-İNCEK	Acil Servis	t	2026-06-08 19:56:09.031	2026-06-08 19:56:09.031
5eeb46e4-74ed-4401-86e1-a62a33f78d02	MP-İNCEK	Radyoloji	t	2026-06-08 19:56:09.032	2026-06-08 19:56:09.032
c06aaa41-6480-4649-b49a-741d51ef355c	MP-İNCEK	Laboratuvar	t	2026-06-08 19:56:09.032	2026-06-08 19:56:09.032
9ef6ba51-fe55-4e02-89fc-394fae15f799	MP-İNCEK	Yoğun Bakım	t	2026-06-08 19:56:09.033	2026-06-08 19:56:09.033
a4c76ce3-c89b-462c-9f15-a7da354d6178	MP-İNCEK	Sterilizasyon	t	2026-06-08 19:56:09.033	2026-06-08 19:56:09.033
b89d342c-9a5e-45c4-ac2e-bf68cbd6070a	MP-İSTANBUL-ON	Ameliyathane	t	2026-06-08 19:56:09.034	2026-06-08 19:56:09.034
a569ca0b-58e1-4c4b-ae30-1a4cb8e7fa29	MP-İSTANBUL-ON	Acil Servis	t	2026-06-08 19:56:09.034	2026-06-08 19:56:09.034
4d7a851f-edd9-4b53-8e89-bf7aa0e6755d	MP-İSTANBUL-ON	Radyoloji	t	2026-06-08 19:56:09.035	2026-06-08 19:56:09.035
5b40040c-605f-4d38-9090-e6b3954b31f9	MP-İSTANBUL-ON	Laboratuvar	t	2026-06-08 19:56:09.035	2026-06-08 19:56:09.035
5eca10a8-14b5-40d1-83d5-9a411d85f2d6	MP-İSTANBUL-ON	Yoğun Bakım	t	2026-06-08 19:56:09.036	2026-06-08 19:56:09.036
3d28a905-9fff-445e-a1bc-d4663b084e2c	MP-İSTANBUL-ON	Sterilizasyon	t	2026-06-08 19:56:09.036	2026-06-08 19:56:09.036
754b2df5-5b3a-4920-a080-6b988f92a00f	MP-İZMIR	Ameliyathane	t	2026-06-08 19:56:09.037	2026-06-08 19:56:09.037
ed8517fa-6136-43a6-b138-9a32e458cd6b	MP-İZMIR	Acil Servis	t	2026-06-08 19:56:09.037	2026-06-08 19:56:09.037
2d044614-6186-4912-854b-138f3bde3aa2	MP-İZMIR	Radyoloji	t	2026-06-08 19:56:09.038	2026-06-08 19:56:09.038
1123a0b6-97c3-49b4-8285-a3f70ef802bd	MP-İZMIR	Laboratuvar	t	2026-06-08 19:56:09.039	2026-06-08 19:56:09.039
3e5a8fda-01db-4f83-96ee-173297b76749	MP-İZMIR	Yoğun Bakım	t	2026-06-08 19:56:09.039	2026-06-08 19:56:09.039
2716583b-f66e-4866-bd05-2827d5edec6a	MP-İZMIR	Sterilizasyon	t	2026-06-08 19:56:09.04	2026-06-08 19:56:09.04
39af4071-a7ab-4fca-9f52-2740bc0fdfcb	MP-KARADENIZ	Ameliyathane	t	2026-06-08 19:56:09.04	2026-06-08 19:56:09.04
d2d67108-12e3-43e8-87bc-45281bda6b47	MP-KARADENIZ	Acil Servis	t	2026-06-08 19:56:09.041	2026-06-08 19:56:09.041
fd8df963-7da5-46eb-ae5d-e312ca1ddd6c	MP-KARADENIZ	Radyoloji	t	2026-06-08 19:56:09.041	2026-06-08 19:56:09.041
c2c22c16-5e99-4310-b82b-5ea782b06d50	MP-KARADENIZ	Laboratuvar	t	2026-06-08 19:56:09.042	2026-06-08 19:56:09.042
9a20b064-4a38-4dd7-84c4-05c370c1d4bc	MP-KARADENIZ	Yoğun Bakım	t	2026-06-08 19:56:09.042	2026-06-08 19:56:09.042
9df8a521-3401-4697-ac7b-c6bcfd4be6f0	MP-KARADENIZ	Sterilizasyon	t	2026-06-08 19:56:09.043	2026-06-08 19:56:09.043
183b2416-764e-4871-9cbb-3b1a2b96b556	MP-ORDU	Ameliyathane	t	2026-06-08 19:56:09.043	2026-06-08 19:56:09.043
079c9728-918f-42f8-a86c-289ad6a11625	MP-ORDU	Acil Servis	t	2026-06-08 19:56:09.044	2026-06-08 19:56:09.044
dc23f590-dddc-48d2-80f8-bb90ec083ea8	MP-ORDU	Radyoloji	t	2026-06-08 19:56:09.044	2026-06-08 19:56:09.044
af66c9ca-0db5-4df6-ab4e-d963cb263ef1	MP-ORDU	Laboratuvar	t	2026-06-08 19:56:09.045	2026-06-08 19:56:09.045
d885aee5-c2c3-46ac-a819-469afd63ab86	MP-ORDU	Yoğun Bakım	t	2026-06-08 19:56:09.045	2026-06-08 19:56:09.045
5935a37a-d9ce-430e-a493-2edd2e71026e	MP-ORDU	Sterilizasyon	t	2026-06-08 19:56:09.046	2026-06-08 19:56:09.046
d149109a-ae15-40e1-8a81-1532033aa0d5	MP-SEYHAN	Ameliyathane	t	2026-06-08 19:56:09.046	2026-06-08 19:56:09.046
947e15a9-5623-4549-a211-66ebaa92cef2	MP-SEYHAN	Acil Servis	t	2026-06-08 19:56:09.047	2026-06-08 19:56:09.047
dcc97cd1-f655-4162-aad2-b54aa536271b	MP-SEYHAN	Radyoloji	t	2026-06-08 19:56:09.047	2026-06-08 19:56:09.047
b2d46f5a-0257-4c2c-ab04-1f3fdd969aa6	MP-SEYHAN	Laboratuvar	t	2026-06-08 19:56:09.048	2026-06-08 19:56:09.048
5cb75bd0-d275-42b4-8db8-da65f3bd2bba	MP-SEYHAN	Yoğun Bakım	t	2026-06-08 19:56:09.049	2026-06-08 19:56:09.049
43c4260b-b4e7-4f8a-b4b1-4f1dd5138bee	MP-SEYHAN	Sterilizasyon	t	2026-06-08 19:56:09.049	2026-06-08 19:56:09.049
a6e40a79-e285-443f-bb24-01391b6dcf16	MP-TEM	Ameliyathane	t	2026-06-08 19:56:09.05	2026-06-08 19:56:09.05
6ab305ef-d011-4328-9120-b986f9a531a3	MP-TEM	Acil Servis	t	2026-06-08 19:56:09.05	2026-06-08 19:56:09.05
ab357839-4620-402b-a6a7-7e7541870609	MP-TEM	Radyoloji	t	2026-06-08 19:56:09.051	2026-06-08 19:56:09.051
f87a35c8-3627-44bf-b3c1-74fc42d777cd	MP-TEM	Laboratuvar	t	2026-06-08 19:56:09.051	2026-06-08 19:56:09.051
936d8524-9756-4057-9acd-aa2987ba9bed	MP-TEM	Yoğun Bakım	t	2026-06-08 19:56:09.052	2026-06-08 19:56:09.052
4e14aa60-7e02-49f3-b9d0-b84b3b129074	MP-TEM	Sterilizasyon	t	2026-06-08 19:56:09.052	2026-06-08 19:56:09.052
98e7b842-d3e3-4e3e-b296-205cbb0843e9	MP-TOKAT	Ameliyathane	t	2026-06-08 19:56:09.053	2026-06-08 19:56:09.053
3bbe9c9e-6a29-4926-9419-a021501c6c18	MP-TOKAT	Acil Servis	t	2026-06-08 19:56:09.053	2026-06-08 19:56:09.053
249cd4e0-d559-46f9-bad0-b051bf2aa83d	MP-TOKAT	Radyoloji	t	2026-06-08 19:56:09.054	2026-06-08 19:56:09.054
7008b973-932a-4dcf-b31e-ad577456b8c9	MP-TOKAT	Laboratuvar	t	2026-06-08 19:56:09.054	2026-06-08 19:56:09.054
3668e315-258f-4040-a715-44cffebd28f9	MP-TOKAT	Yoğun Bakım	t	2026-06-08 19:56:09.054	2026-06-08 19:56:09.054
7877aedf-d2bb-4d86-8614-bd77cd47360e	MP-TOKAT	Sterilizasyon	t	2026-06-08 19:56:09.055	2026-06-08 19:56:09.055
7c0df4e9-109f-467d-a983-67fcd2016bba	MP-YILDIZLI	Ameliyathane	t	2026-06-08 19:56:09.055	2026-06-08 19:56:09.055
d15a1a0a-2a5f-43c4-b086-c403d3770bea	MP-YILDIZLI	Acil Servis	t	2026-06-08 19:56:09.056	2026-06-08 19:56:09.056
3da2e866-27d6-4e1b-aa8a-ceebb251c6b9	MP-YILDIZLI	Radyoloji	t	2026-06-08 19:56:09.057	2026-06-08 19:56:09.057
57af7a18-e80c-481b-9427-87653f58f1c2	MP-YILDIZLI	Laboratuvar	t	2026-06-08 19:56:09.057	2026-06-08 19:56:09.057
a4bf6420-7b6f-45a5-8728-7278ac67a809	MP-YILDIZLI	Yoğun Bakım	t	2026-06-08 19:56:09.058	2026-06-08 19:56:09.058
7a9f8403-faf5-46cd-9744-c8e01504fb58	MP-YILDIZLI	Sterilizasyon	t	2026-06-08 19:56:09.058	2026-06-08 19:56:09.058
2907f9e2-4bd0-4e58-9b45-ebbc2b879836	VM-MP-ANKARA	Ameliyathane	t	2026-06-08 19:56:09.059	2026-06-08 19:56:09.059
f04d5a6c-de4e-46fc-b050-5bf38463e93f	VM-MP-ANKARA	Acil Servis	t	2026-06-08 19:56:09.059	2026-06-08 19:56:09.059
8b9113c6-7e28-4cc4-a8ae-7cc1cd2051d9	VM-MP-ANKARA	Radyoloji	t	2026-06-08 19:56:09.06	2026-06-08 19:56:09.06
d0f29381-51c5-4c05-8482-28c1b7bd8a4e	VM-MP-ANKARA	Laboratuvar	t	2026-06-08 19:56:09.06	2026-06-08 19:56:09.06
2494c61d-68d3-44e8-99a0-45054b742458	VM-MP-ANKARA	Yoğun Bakım	t	2026-06-08 19:56:09.061	2026-06-08 19:56:09.061
30309c82-8fca-43a4-8cd6-307bb2731757	VM-MP-ANKARA	Sterilizasyon	t	2026-06-08 19:56:09.061	2026-06-08 19:56:09.061
1989049d-d2d0-416b-bbbe-64711ce9baeb	VM-MP-BURSA	Ameliyathane	t	2026-06-08 19:56:09.062	2026-06-08 19:56:09.062
3c1558e6-ca51-47ce-987e-f2843e41d6ba	VM-MP-BURSA	Acil Servis	t	2026-06-08 19:56:09.062	2026-06-08 19:56:09.062
4dcd4ab1-f70f-41c2-8b3b-76e6bea0361f	VM-MP-BURSA	Radyoloji	t	2026-06-08 19:56:09.063	2026-06-08 19:56:09.063
885b4476-188c-4655-8a36-9832dcbd4ec7	VM-MP-BURSA	Laboratuvar	t	2026-06-08 19:56:09.064	2026-06-08 19:56:09.064
cb7935b7-0f52-4fc7-ad4f-ad217556e0a1	VM-MP-BURSA	Yoğun Bakım	t	2026-06-08 19:56:09.064	2026-06-08 19:56:09.064
afaf1bf2-41c8-4731-8b07-e055b669f2f6	VM-MP-BURSA	Sterilizasyon	t	2026-06-08 19:56:09.065	2026-06-08 19:56:09.065
e252172b-4a3a-46aa-b364-4a9b0a430fdc	VM-MP-FATIH	Ameliyathane	t	2026-06-08 19:56:09.065	2026-06-08 19:56:09.065
a5be47df-3769-487d-9771-75a5e0deba99	VM-MP-FATIH	Acil Servis	t	2026-06-08 19:56:09.066	2026-06-08 19:56:09.066
991a9d56-9f92-4fd4-88fd-a3c6fb22bc1f	VM-MP-FATIH	Radyoloji	t	2026-06-08 19:56:09.066	2026-06-08 19:56:09.066
f0e878ee-afa8-40eb-ab3c-82408bc00de8	VM-MP-FATIH	Laboratuvar	t	2026-06-08 19:56:09.067	2026-06-08 19:56:09.067
246d9240-7dc8-4626-adf3-d7e357fc33e5	VM-MP-FATIH	Yoğun Bakım	t	2026-06-08 19:56:09.067	2026-06-08 19:56:09.067
a5805a66-30d0-497f-951d-6494fb060c35	VM-MP-FATIH	Sterilizasyon	t	2026-06-08 19:56:09.068	2026-06-08 19:56:09.068
8ce10d06-1b63-4f7c-9d51-505fbfa791ba	VM-MP-FLORYA	Ameliyathane	t	2026-06-08 19:56:09.068	2026-06-08 19:56:09.068
5b75b30a-843e-4d23-a700-5cd2267f6058	VM-MP-FLORYA	Acil Servis	t	2026-06-08 19:56:09.069	2026-06-08 19:56:09.069
952d3f3e-13bf-46cb-880e-642b376c8c61	VM-MP-FLORYA	Radyoloji	t	2026-06-08 19:56:09.069	2026-06-08 19:56:09.069
0dc7cf7c-4b71-4db5-9245-565d03375ba6	VM-MP-FLORYA	Laboratuvar	t	2026-06-08 19:56:09.07	2026-06-08 19:56:09.07
a46ef530-dc65-4031-a570-b2a5ce3a2679	VM-MP-FLORYA	Yoğun Bakım	t	2026-06-08 19:56:09.07	2026-06-08 19:56:09.07
f51ce28c-4118-4eb5-b91f-88dcecfa346e	VM-MP-FLORYA	Sterilizasyon	t	2026-06-08 19:56:09.071	2026-06-08 19:56:09.071
c0c1506e-b8a4-4e21-95b0-a3db557ad382	VM-MP-KOCAELI	Ameliyathane	t	2026-06-08 19:56:09.072	2026-06-08 19:56:09.072
c5243105-4d71-4fc2-9e09-aa2334483d6f	VM-MP-KOCAELI	Acil Servis	t	2026-06-08 19:56:09.072	2026-06-08 19:56:09.072
86187961-dd54-4027-84b0-319892a769a8	VM-MP-KOCAELI	Radyoloji	t	2026-06-08 19:56:09.073	2026-06-08 19:56:09.073
8e738604-47e3-4935-a0e8-381e1ce2e6b6	VM-MP-KOCAELI	Laboratuvar	t	2026-06-08 19:56:09.073	2026-06-08 19:56:09.073
e4e1b5ea-a34b-488f-abd4-a141ebd8fd9f	VM-MP-KOCAELI	Yoğun Bakım	t	2026-06-08 19:56:09.073	2026-06-08 19:56:09.073
51921e09-a140-4ef8-bc8a-ba8c5b3b55e8	VM-MP-KOCAELI	Sterilizasyon	t	2026-06-08 19:56:09.074	2026-06-08 19:56:09.074
d680c7c3-4daf-4d8d-b92b-c91bdf53b201	VM-MP-MALTEPE	Ameliyathane	t	2026-06-08 19:56:09.074	2026-06-08 19:56:09.074
cb77b521-6a85-4309-bb8e-a4b57790ab51	VM-MP-MALTEPE	Acil Servis	t	2026-06-08 19:56:09.075	2026-06-08 19:56:09.075
9c86eb1a-b351-4c3b-9c57-a4c6f94f2745	VM-MP-MALTEPE	Radyoloji	t	2026-06-08 19:56:09.075	2026-06-08 19:56:09.075
d843ac5b-70f3-41b6-80c1-c7774d4bf39d	VM-MP-MALTEPE	Laboratuvar	t	2026-06-08 19:56:09.076	2026-06-08 19:56:09.076
398d8866-8549-4b02-a549-fcfcdf97de10	VM-MP-MALTEPE	Yoğun Bakım	t	2026-06-08 19:56:09.076	2026-06-08 19:56:09.076
678f3d57-6c92-47a6-8c16-be9f9f52a7ec	VM-MP-MALTEPE	Sterilizasyon	t	2026-06-08 19:56:09.077	2026-06-08 19:56:09.077
f47623f4-c140-4b67-85aa-c5b969b798f4	VM-MP-MERSIN	Ameliyathane	t	2026-06-08 19:56:09.077	2026-06-08 19:56:09.077
eeef6056-ac97-4045-82fa-6a67b8cc3082	VM-MP-MERSIN	Acil Servis	t	2026-06-08 19:56:09.078	2026-06-08 19:56:09.078
c4a14b52-347e-4d9d-a090-862d97add63f	VM-MP-MERSIN	Radyoloji	t	2026-06-08 19:56:09.078	2026-06-08 19:56:09.078
124a482f-1ae1-4dca-bbad-5a820f7244f6	VM-MP-MERSIN	Laboratuvar	t	2026-06-08 19:56:09.078	2026-06-08 19:56:09.078
43f5c3dd-f8be-4140-aee8-95e3c62b9744	VM-MP-MERSIN	Yoğun Bakım	t	2026-06-08 19:56:09.079	2026-06-08 19:56:09.079
fc58dec5-4cfa-4bc2-802b-ac6757ad2948	VM-MP-MERSIN	Sterilizasyon	t	2026-06-08 19:56:09.079	2026-06-08 19:56:09.079
4ad3027b-1188-42e5-9e09-a5b91d870abd	VM-MP-PENDIK	Ameliyathane	t	2026-06-08 19:56:09.08	2026-06-08 19:56:09.08
51fd11b8-a4bc-4fdc-9bf7-a97e98bb509c	VM-MP-PENDIK	Acil Servis	t	2026-06-08 19:56:09.08	2026-06-08 19:56:09.08
51ecb4cf-0f0a-4ccd-9364-dd10820013b7	VM-MP-PENDIK	Radyoloji	t	2026-06-08 19:56:09.081	2026-06-08 19:56:09.081
8042d643-bd0d-47cf-992f-60dd1de1acf6	VM-MP-PENDIK	Laboratuvar	t	2026-06-08 19:56:09.081	2026-06-08 19:56:09.081
2b6ea2d7-9425-475e-a169-3debc28fa55c	VM-MP-PENDIK	Yoğun Bakım	t	2026-06-08 19:56:09.082	2026-06-08 19:56:09.082
ca04c400-4e95-4bf1-91ac-7021e7197bc1	VM-MP-PENDIK	Sterilizasyon	t	2026-06-08 19:56:09.082	2026-06-08 19:56:09.082
f003d4c4-043d-4c04-b3ea-79ea622e2c48	VM-MP-SAMSUN	Ameliyathane	t	2026-06-08 19:56:09.083	2026-06-08 19:56:09.083
196db1f2-7b93-4c80-83f5-93559d5883e4	VM-MP-SAMSUN	Acil Servis	t	2026-06-08 19:56:09.083	2026-06-08 19:56:09.083
bc7bbe4d-0a41-4e55-9014-d482a4541221	VM-MP-SAMSUN	Radyoloji	t	2026-06-08 19:56:09.084	2026-06-08 19:56:09.084
61f3de7a-fee9-4e28-88b2-78c21cc869c0	VM-MP-SAMSUN	Laboratuvar	t	2026-06-08 19:56:09.084	2026-06-08 19:56:09.084
b69787a4-e043-4a44-b5a4-5f6a66e57d56	VM-MP-SAMSUN	Yoğun Bakım	t	2026-06-08 19:56:09.085	2026-06-08 19:56:09.085
5ee8b8c6-2b31-4559-8988-84396b238f83	VM-MP-SAMSUN	Sterilizasyon	t	2026-06-08 19:56:09.085	2026-06-08 19:56:09.085
\.


--
-- Data for Name: HazmatHazardLabel; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatHazardLabel" (id, name, code, "isActive", "createdAt", "updatedAt", description, "imageUrl") FROM stdin;
c3514baf-ba04-4f17-bfcc-1449889b26d5	Patlayıcı Madde	GHS01	t	2026-06-08 20:01:49.754	2026-06-08 20:01:49.754	\N	/uploads/hazmat/1780948908998-20330135.png
19710a21-997c-49b5-bd2c-d0798403f5df	Yanıcı Madde	GHS02	t	2026-06-08 20:12:02.05	2026-06-08 20:12:02.05	\N	/uploads/hazmat/1780949521191-237619162.png
04cfa884-37ab-4c1a-9166-aa1dde4fac01	Oksitleyici Madde	GHS03	t	2026-06-08 20:12:24.224	2026-06-08 20:12:24.224	\N	/uploads/hazmat/1780949543006-325606046.png
d877f390-6bca-4cf1-80c3-2d88f8b1ee74	Basınç Altında Gaz	GHS04	t	2026-06-08 20:12:55.959	2026-06-08 20:12:55.959	\N	/uploads/hazmat/1780949575174-575533031.png
553f76fa-edce-40fd-9fa1-e56a55572686	Aşındırıcı Madde	GHS05	t	2026-06-08 20:13:18.841	2026-06-08 20:13:18.841	\N	/uploads/hazmat/1780949598266-663269927.png
f63efbd2-890c-46b4-94ce-685d7036baf4	Toksik Madde	GHS06	t	2026-06-08 20:13:38.519	2026-06-08 20:13:38.519	\N	/uploads/hazmat/1780949617765-791704528.png
4eafac30-14aa-4e56-9aca-b2bd1c458696	Zararlı / Tahriş Edici Madde	GHS07	t	2026-06-08 20:14:12.887	2026-06-08 20:14:12.887	\N	/uploads/hazmat/1780949652232-447256096.png
1da8c34a-3861-49a2-a780-64b3b1072ac5	Kansorjen Madde	GHS08	t	2026-06-08 20:14:36.628	2026-06-08 20:14:36.628	\N	/uploads/hazmat/1780949675302-24569839.png
b4bf6971-90d7-43bb-8e4d-2788013025c8	Çevre İçin Tehlikeli Madde	GHS09	t	2026-06-08 20:15:03.203	2026-06-08 20:15:03.203	\N	/uploads/hazmat/1780949702169-157240791.png
\.


--
-- Data for Name: HazmatInventoryItem; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatInventoryItem" (id, "facilityId", "departmentId", "materialId", "createdAt", "updatedAt", "maxQuantity", "minQuantity") FROM stdin;
be5bb14f-2855-4e42-9c57-4e5c3105a016	İSTINYE-DENT	aeb05b5b-d2a2-413f-98c4-df004885a11e	60b4a2e1-5eff-422c-be2a-5fc6708d19aa	2026-06-09 05:27:18.017	2026-06-09 05:39:06.618	5	3
39b04860-3d4e-49cb-90a6-fbadc4eb327a	İSTINYE-DENT	5daa8f13-05be-4070-8c4a-e6356fbb7cc1	60b4a2e1-5eff-422c-be2a-5fc6708d19aa	2026-06-09 05:39:06.62	2026-06-09 05:39:06.62	3	1
\.


--
-- Data for Name: HazmatMaterial; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatMaterial" (id, "productName", "brandName", "usageMethod", composition, "hazardDescription", "firstAid", "fireFightingMeasures", "accidentalReleaseMeasures", "handlingAndStorage", "exposureControlsPpe", "physicalAndChemicalProperties", "stabilityAndReactivity", "toxicologicalInformation", "ecologicalInformation", "disposalConsiderations", "createdAt", "updatedAt", "isActive", "regulatoryInfo", "transportInfo", "categoryId", "imageUrl", "sdsExpiryDate", "sdsUrl") FROM stdin;
60b4a2e1-5eff-422c-be2a-5fc6708d19aa	DERHAND PLUS	ECOLAB	El dezenfektanı	Etanol,İzopropil alkol,Alkil Dimetilbenzil,Amonyum Klorür	Yanıcı, tahriş edici	Kullanıcı kendini koruyucu tedbirler alarak ürünü kullanmalıdır. Acil bir durum, şüpheye \nkapılmanız veya semptomların devam etmesi halinde daima bir doktora başvurun.Solunum: Maruz kaldığı yerden kişiyi uzaklaştırın ve temiz hava aldırın. Rahatsızlık halinde doktora \nbaşvurunuz.\n3 Cilt ile Temas: Önlem gerektirmez Göz ile Temas: Gözle temasından kaçınınız. Gözle temas durumunda hemen bol su ile yıkayınız. Gerektiği \ndurumda, kontak lensleri çıkarın. Etiketi ile birlikte hemen doktora başvurunuz.Yutma: Yutulması halinde kişi kusturmayınız, etiketi ile birlikte hemen doktora başvurunuz	Ürün kendinden alevlenebilir üründür. Bütün acil olmayan personeli yangın alanından çıkartınız.\nPatlama ve yanma sonucu oluşabilecek gazları solumayınız. Yanma sonucu zararlı gazlar oluşabilir	Tutuşmaya neden olabilecek tüm kaynakları uzaklaştırınız. \nTemizliğin yalnızca eğitimli personel tarafından yapıldığından emin olun.	Asitlerle beraber saklamayınız. Asetik anhidrit, kuvvetli oksitleyiciler, perklorik asit, perkloratlar, sülfürik asit,  permanganatlar, asetaldehit, hidroklorik asit ile reaksiyona girebileceğinden bu maddeler ile birlikte  bulundurmayınız. Depolama sırasında su ile temas etmemelidir. Maddeyi orijinal ambalajında depolayınız. 	Göz için zararlıdır	Görünüm (Atmosfer Sıcaklığı) Berrak Reksiz Sıvı Koku Karakteristik	Saklama ve kullanımla ilgili önerilere/talimatlara uyulursa tehlikeli reaksiyon olmaz.	Toksisite bilgisi bulunmamakta olup, çevresel olarak tehlikeli sınıflandırılmamıştır	Bu ürünün bilinen ekolojiktoksik etkileri yoktur.	Temizlik işlemi tamamlana kadar alana girişe engel olunuz. Tekrar bir kullanımı maksadıyla ürünü tekrar geri \nalmayın.\nSıvı bağlayıcı malzemeyle ( kum, asit bağlayıcı, un halinde talaş) emilmesini sağlayınız. Kimyasallar \nuzaklaştırıldıktan sonra etkilenmiş bölgeyi temizleyiniz.\nYerel yönetmeliklere uygun hareket ediniz. Zararlı madde karışmış malzemeyi uygun bir konteynere yerleştiriniz \nve madde 13'e göre tasfiye ediniz.	2026-06-08 20:41:15.691	2026-06-08 21:46:59.297	t		Ürünün taşındığı yada uygulandığı alanda yenilmemeli, içilmemelidir. Sigara kullanılmamalıdır. \nGıda maddelerinden, içeceklerden ve yemlerden uzak tutulmalıdır.	\N	\N	\N	\N
3092459b-527c-4e65-bd6e-d350750f0f6f	HİDROJEN PEROKSİT (OKSİJENLİ SU) (1 L)	AQUA	haricen	hidrojen peroksit H202	korozif, oksitleyici, ağartıcıdır	 yutulursa kusturulmamalıdır bol su içirilmelidir.deri ve gözle temas halinde bol su ile durulanmalıdır.	Uygun madde söndürme maddesi:Tercihen su veya su sisi kaullanılmalıdır.Kimyasal içerikli yangın söndürücüler kullanılmamalıdır.                                      Özel tehlikeler:ürün temel olarak yanıcı değildir.ancak dekompozisyonu sonucu açığa çıkan oksijen yanmayı şiddetlendirebilir.Özellikle ısıtıldığında organik sıvı veya buharlarla teması sonucu ani yanmaya ya da patlamaya neden olabilir.Hiderojen peroksitten oksijen açığa çıkışı organik buharları veya hidrojen buharlarını patlama aralığına doğru çekebilir.	Kapalı kaplarda taşıma ve muhafazası yapılır,Tam yüz ve koruyucu giysi kullanın Cilt ile teması sözkonusu ise eldiven ve  koruyucu önlük giyilmelidir.	depolama ekipmanları malzemesi olarak alüminyum -magnezyum paslanmaz çelik,serin bir alanda direkt güneş ışığından uzakta depolayın	 göz,deri  ve yutma ,Göz, deri ve gastrik mukozada tahriş	Renk : Renksiz ve berrak çözelti\nKoku : Kokusuz\npH : 3.0-3.5\nMiktar tayini : %3 - 3.5\nYoğunluk : 1.00-1.02 g/ml\nAsitlik : 0.1 N NaOH sarfiyatı (0.2 – 1.0) ml	organik malzemelerle temasından kaçınılması yün odun tahıllar kağıt kömür	Akut Oral Toksisite (LD 50): > 5000 mg/kg (fare) \nAkut Dermal Toksisite (LD 50): > 5000 mg/kg (domuz)	sınıflandırmaya tabi değil	uygun emici maddeyle yüzey temizlenir.kimyasal atık kovasına atılır.etkilenmiş bölge su ile temizlenir.	2026-06-09 06:18:53.359	2026-06-09 06:59:32.708	t	Tehlikeli maddeler ve Müstahzarlara İlişkin Güvenlik Bilgi Formlarının Hazırlanması ve Dağıtılması \nHakkında Yönetmelik (26 Aralık 2008 Tarih ve 27092) ‘e uygun olarak hazırlanmıştır	Kapalı kaplarda taşıma ve muhafazası yapılır,Tam yüz ve koruyucu giysi kullanın Cilt ile teması sözkonusu ise eldiven ve  koruyucu önlük giyilmelidir.	b174d534-6cb3-493f-bbd5-7823eb1b174a	\N	2026-12-31 00:00:00	\N
31166065-c385-423c-b072-0ab95cd891ad	INCIDIN FOAM (750 mL)	ECOLAB	 hızlı  yüzey dezenfektanı	2-propanol, etil alkol, kuaterner amonyum bileşikleri,benzil c-12-16-alkildimetil,klorürler	yanıcıdır, tahriş edicidir	Soluma:Solunması durunuda açıkhavaya çıkarınız.                                                          Yutma:medikal görevli tarafından talimat verilmediyse kusamaya yönlendirmeyiniz.Yutuldu ise ağzı su ile çalkalayınız.                                                       Ciltle temas: Bol miktarda akan su ile gözleri hemen bolsuyla yıkayınız,tahriş oluştu ise medikal yardım alınız.	Uygun madde söndürme maddesi:Tercihen su veya su sisi kaullanılmalıdır.Kimyasal içerikli yangın söndürücüler kullanılmamalıdır.                                      Özel tehlikeler:ürün temel olarak yanıcı değildir.ancak dekompozisyonu sonucu açığa çıkan oksijen yanmayı şiddetlendirebilir.Özellikle ısıtıldığında organik sıvı veya buharlarla teması sonucu ani yanmaya ya da patlamaya neden olabilir.Hiderojen peroksitten oksijen açığa çıkışı organik buharları veya hidrojen buharlarını patlama aralığına doğru çekebilir.	Geniş olarak yayılır ve sızar.Acilen güvenlik sorumlularıyla temasa geçin.Tüm tutuşma kaynaklarını eleyiniz.Görevli olmyan kişileri uzak tutun.Dökülmüş maddeye dokunmayın,uzerinde yürümeyin.Toprağa ve su yollarına ve gidere yönlendirmeyiniz..Küçük miktarları  suyla seyreltin veyıkayın.Büüyk miktarlar dökülmüş maddenin etrafınıçeviriniz. yada kanalizasyona dökülmesine izin vermeyiniz.Dökülmüş maddeyi uygun bir kaba koyup atınız.	Gözle temasından kaçınınız.Isı,kıvılcım ve ateşten uzak tutunuz.25 C üzerinde saklamayınız.Kabı sıkı ve kapalı tutunuz.Tüm tutuşma kaynaklarından uzakta ve 25 C nin altında saklayınız.. Orijinal kabında saklayınız.	Soluma maskesi normal kullanımda gerekli değil.Ellerin korunması normal kullanımda gerekli değil..Sıçrama riski:güvenlik gözlükleri	Sıvı,renksizden açık sarıya ,limon kokulu ,parlama nok. 24 C	Normal koşullar altında stabil.\norganik materyaller, metaller, asitler, alkaliler ile reaksiyon vermez. \nDiğer ürünlerle karıştırmayınız. 	soluma,yutma ,ciltle temasta belirgin bir zararı ok,gözü tahriş eder.	sınıflandırmaya tabi değil	küçük miktarları bol su ile yıkanır,büyük miktarlarıuygun emici madde ile (kumvs) toplanarak etkisizleştirili tıbbi atığa atılır atılır.	2026-06-09 07:02:37.999	2026-06-09 07:02:37.999	t	             R10:Alevlenebilir.                    R36:Gözleri tahriş eder.                 R67:  Buharı baş dönmesi ve uyuşukluk yapar.                               S2:Çocuklarda uzak tutunuz.S26:gözle temasında bol suyla yıkayınız.	Kapalı kaplarda taşıma ve muhafazası yapılır.normal çalışma koşullarında maskeye ihtiyaç yoktur.eldiven kullanılmalıdır.sıçrama sözkonusuysa gözlük kullanılmalıdır	675d8fff-03a0-430d-9814-18b12d851cf6	\N	2026-12-31 00:00:00	\N
41cb9587-27df-463a-b3e0-d380a44c460f	CRYOS SOĞUTUCU SPREY (400 mL)	PHYTO	hafif lokal aneztezik	sodyum hidroksit, kalsiyum hidroksit	Yanıcı, tahriş edici	SOLUNUM: Açık havayı çıkarın. Nesnenin solunması durursa, yapay solunum uygulayın. Tıbbi tavsiye / ilgi alın. YUTMA: Tıbbi tavsiye / ilgi alın. Kusmaya yalnızca doktor tarafından bildirilirse verin. Ağız yoluyla bir şey vermeyin bilinçsiz kişi. GÖZLER VE CİLT: Bol su ile yıkayın. Sürekli tahriş olması durumunda, tıbbi tavsiye / dikkat edin	UYGUN SÖNDÜRME EKİPMANLARI Söndürücü maddeler: karbon dioksit, köpük, kimyasal toz. Ürünün kaybedilmesi veya sızıntı yapması halinde yangın geçirmez, su püskürterek yanıcı buharları dağıtmak ve sızıntıyı gidermek için çalışanlara karşı koruma sağlamak için kullanılabilir. KESİNTİSİZ SÖNDÜRME EKİPMANLARI Jetli su kullanmayın. Su, yangın söndürme için etkili değildir, ancak alevlere maruz kalan kapları soğutmak için kullanılabilir; patlamalar	Herhangi bir tehlike yoksa sızıntıyı engelleyin. Uygun koruyucu ekipman giyin  cilt, göz ve kişisel giysilerin kontamine olmasını önleyin. 	temiz ve kuru ortamda depolanmalıdır..depolama derecesi 0-35c olmalıdır.direkt güneş ışığı ve dondurucu soğuktan korunmalıdır. Depolama konteynırlarının kapakları kapalı olmalıdır.	Kimyasal maddelerle uğraşırken genellikle uygulanan güvenlik önlemlerine uyun. EL KORUMA Gerekli değil. CİLT KORUNMA Gerekli değil. GÖZ KORUMASI Gerekli değil. SOLUNUM KORUMA Kimyasal risk değerlendirmesinde aksi belirtilmedikçe hiçbiri gerekmez.	Görünüm: Sıvı\nRenk: Renksiz\nKoku: Karakteristik\n\nSprey	Normal kullanım koşullarında diğer maddelerle reaksiyona girme konusunda herhangi bir risk oluşturmaz.\nTehlikeli reaksiyon olasılığı. Buharlar havayla patlayıcı karışımlar da oluşturabilir.Kaçınılması gereken durumlar. Aşırı ısınmayı önleyin. Elektrostatik yüklerin bir araya gelmesinden kaçının. Tüm ateşleme kaynaklarından uzak durun.	LC50 (Soluma - buharlar): Sınıflandırılmadı (önemli bir bileşen yok). LC50 (Soluma - sis / toz) karışımı: Sınıflandırılmadı (önemli bir bileşen yok). Karışımın LD50 (Oral): Sınıflandırılmadı (önemli bir bileşen yok). Karışımın LD50 (Dermal): Sınıflandırılmadı (önemli bir bileşen yok).	Ekotoksik Bilgiler:	Sızdırılmış ürünü uygun bir kaba koyun. Ürün yanıcıysa patlamaya dayanıklı ekipman kullanın. Kalanı atıl emici malzeme ile emdirin.\nKaçak alanının iyi havalandırıldığından emin olun. Kirlenmiş materyal, yukarıda belirtilen hükümlere uygun olarak atılmalıdır	2026-06-09 09:00:54.678	2026-06-09 09:05:06.068	t		ADR, RID, IMDG'ye göre\nUN Numarası : 1950\nAERESOLLER.\nS n2.2	34ed1a70-393a-4055-939c-fbbd67b744fa	/uploads/hazmat/1780995795805-344484871.jpeg	2025-12-31 00:00:00	/uploads/hazmat/1780995905181-636258661.pdf
\.


--
-- Data for Name: HazmatMaterialAdrLabel; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatMaterialAdrLabel" (id, "materialId", "labelId") FROM stdin;
89ae731f-8f63-40ad-a714-956cb92e30cc	60b4a2e1-5eff-422c-be2a-5fc6708d19aa	babbc7ad-31e4-4bdc-9c09-cf5936608eed
8b0841cd-fa23-4a8e-bdf4-e2c0eb5807ac	60b4a2e1-5eff-422c-be2a-5fc6708d19aa	7290ebed-ee4b-4b50-a776-417cfd7ea456
b2fbad45-f8b1-4d49-8081-c003222584d3	3092459b-527c-4e65-bd6e-d350750f0f6f	d8482e4d-11df-4733-90de-b138a9628364
a91cf4a2-5941-44ad-a210-daaa9df6c595	31166065-c385-423c-b072-0ab95cd891ad	4d70fc6d-c72a-4ce7-8e5b-ebc5573839d6
f29ed281-d059-42a0-866e-7a9d12305423	31166065-c385-423c-b072-0ab95cd891ad	a43dfe65-4a02-4975-8c52-3e90f85de1f0
01aceb35-e680-475e-882e-103f5347ce1c	41cb9587-27df-463a-b3e0-d380a44c460f	4d70fc6d-c72a-4ce7-8e5b-ebc5573839d6
\.


--
-- Data for Name: HazmatMaterialHazardLabel; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatMaterialHazardLabel" ("materialId", "labelId", id) FROM stdin;
60b4a2e1-5eff-422c-be2a-5fc6708d19aa	04cfa884-37ab-4c1a-9166-aa1dde4fac01	5380a290-3a78-4620-be76-c998b6f660cd
60b4a2e1-5eff-422c-be2a-5fc6708d19aa	19710a21-997c-49b5-bd2c-d0798403f5df	d2e5fc49-edbe-4a37-80db-7f0913e644e2
60b4a2e1-5eff-422c-be2a-5fc6708d19aa	4eafac30-14aa-4e56-9aca-b2bd1c458696	bb977eeb-2cec-4260-bde2-405039e4610c
3092459b-527c-4e65-bd6e-d350750f0f6f	b4bf6971-90d7-43bb-8e4d-2788013025c8	154819b4-2b5c-46f7-a1d5-b89ea6ec0287
3092459b-527c-4e65-bd6e-d350750f0f6f	04cfa884-37ab-4c1a-9166-aa1dde4fac01	4728f437-6d62-4ffe-9a83-ab379b8eab15
31166065-c385-423c-b072-0ab95cd891ad	4eafac30-14aa-4e56-9aca-b2bd1c458696	069d08d7-6ffc-4cbe-b67d-21f2b7614787
31166065-c385-423c-b072-0ab95cd891ad	19710a21-997c-49b5-bd2c-d0798403f5df	d28e75f1-34e7-4c79-ada4-d0e5c4668366
41cb9587-27df-463a-b3e0-d380a44c460f	19710a21-997c-49b5-bd2c-d0798403f5df	bc6e3e5b-866a-4a47-99e0-71404a567e8f
\.


--
-- Data for Name: HazmatMaterialPpe; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatMaterialPpe" ("materialId", "ppeId", id) FROM stdin;
60b4a2e1-5eff-422c-be2a-5fc6708d19aa	ffc1e574-1f35-4de2-a2f7-b13a27d36bf9	c20c00ef-362d-41d6-8ca4-71c837e18508
60b4a2e1-5eff-422c-be2a-5fc6708d19aa	c0dbe498-0f45-4ee6-9e4b-07e85e9528d1	0c39b077-7816-40a9-8267-a923a57d5a47
60b4a2e1-5eff-422c-be2a-5fc6708d19aa	3ee38c43-0be3-4a7b-84e7-bd89ad15b21a	26123392-faef-4302-99a7-21807e3e05a2
3092459b-527c-4e65-bd6e-d350750f0f6f	c0dbe498-0f45-4ee6-9e4b-07e85e9528d1	0353e4ed-dee7-4770-b719-cf388e8f3844
3092459b-527c-4e65-bd6e-d350750f0f6f	3ee38c43-0be3-4a7b-84e7-bd89ad15b21a	f263b893-9b44-4aa8-a27e-dea25d163e13
31166065-c385-423c-b072-0ab95cd891ad	ffc1e574-1f35-4de2-a2f7-b13a27d36bf9	6110a652-de70-4b3b-9482-bef2fb3d74ce
31166065-c385-423c-b072-0ab95cd891ad	3ee38c43-0be3-4a7b-84e7-bd89ad15b21a	cef62e43-edea-43b4-acde-a39df31f7179
41cb9587-27df-463a-b3e0-d380a44c460f	ffc1e574-1f35-4de2-a2f7-b13a27d36bf9	76b1678d-4338-4194-8b02-c3ea6a066512
41cb9587-27df-463a-b3e0-d380a44c460f	3ee38c43-0be3-4a7b-84e7-bd89ad15b21a	079fd69a-c96c-4536-8d9e-b345c94a5bf5
\.


--
-- Data for Name: HazmatPpe; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatPpe" (id, name, "isActive", "createdAt", "updatedAt", description, "imageUrl") FROM stdin;
ffc1e574-1f35-4de2-a2f7-b13a27d36bf9	Gözlük Kullan	t	2026-06-08 20:00:06.026	2026-06-08 20:00:06.026	\N	/uploads/hazmat/1780948805158-961755020.png
2d2d4421-28d4-423d-bdc8-a7067aa785ca	İş Ayakkabısı Giy	t	2026-06-08 20:16:02.159	2026-06-08 20:16:02.159	\N	/uploads/hazmat/1780949761463-431332499.png
3ee38c43-0be3-4a7b-84e7-bd89ad15b21a	Eldiven Giy	t	2026-06-08 20:16:14.678	2026-06-08 20:16:14.678	\N	/uploads/hazmat/1780949774087-156817726.png
75054831-4f9d-4a58-a04b-3b7babf7000f	Maske Kullan	t	2026-06-08 20:16:27.855	2026-06-08 20:16:27.855	\N	/uploads/hazmat/1780949787333-328149208.png
c0dbe498-0f45-4ee6-9e4b-07e85e9528d1	Koruyucu Elbise Giy	t	2026-06-08 20:16:45.017	2026-06-08 20:16:45.017	\N	/uploads/hazmat/1780949804392-779600708.png
2a72cc07-41ac-4b84-8418-bb4a5ca9986b	Yüz Siperi Kullan	t	2026-06-08 20:17:03.051	2026-06-08 20:17:03.051	\N	/uploads/hazmat/1780949822509-368589139.png
\.


--
-- Data for Name: HazmatSpillKit; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatSpillKit" (id, "facilityId", purpose, risk, "kitName", "needReason", "worstCase", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: HazmatSpillKitAction; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatSpillKitAction" (id, "actionType", owner, "dueDate", description, status, "createdAt", "updatedAt", "placementId") FROM stdin;
\.


--
-- Data for Name: HazmatSpillKitCheck; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatSpillKitCheck" (id, "lastCheck", period, result, "checkedBy", "contentOk", "expiryOk", "qtyOk", "packageOk", note, "createdAt", "updatedAt", "placementId") FROM stdin;
\.


--
-- Data for Name: HazmatSpillKitDepartment; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatSpillKitDepartment" (id, "kitId", unit, area, location, owner, "backupOwner", visible, sign, instruction, training, note, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: HazmatSpillKitIncident; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatSpillKitIncident" (id, "incidentDate", "incidentType", "kitUsed", "incidentDesc", "usedItems", "incidentOutcome", "createdAt", "updatedAt", "placementId") FROM stdin;
\.


--
-- Data for Name: HazmatSpillKitItem; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatSpillKitItem" (id, "kitId", name, type, qty, min, "createdAt", "updatedAt", exp) FROM stdin;
\.


--
-- Data for Name: HazmatSpillKitMasterItem; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatSpillKitMasterItem" (id, "facilityId", name, type, "createdAt", "updatedAt") FROM stdin;
85c11f50-586c-41f0-8b27-13f449d6e925	İSTINYE-DENT	Biyolojik absorban	Absorban	2026-06-09 13:39:32.21	2026-06-09 13:39:32.21
\.


--
-- Data for Name: HazmatUnit; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."HazmatUnit" (id, name, symbol, "isActive", "createdAt", "updatedAt") FROM stdin;
cmq5msmky000012i0ier7gl17	Miligram	mg	t	2026-06-08 19:56:08.914	2026-06-08 19:56:08.914
cmq5msml2000112i0su49mabu	Gram	g	t	2026-06-08 19:56:08.918	2026-06-08 19:56:08.918
cmq5msml3000212i0ux0rhk8a	Kilogram	kg	t	2026-06-08 19:56:08.919	2026-06-08 19:56:08.919
cmq5msml4000312i0lbz840bt	Litre	L	t	2026-06-08 19:56:08.92	2026-06-08 19:56:08.92
cmq5msml5000412i0saj0xvrh	Mililitre	mL	t	2026-06-08 19:56:08.921	2026-06-08 19:56:08.921
cmq5msml6000512i0mjosf8sd	Metreküp	m³	t	2026-06-08 19:56:08.922	2026-06-08 19:56:08.922
cmq5msml6000612i0r9zgpvbe	Adet	adet	t	2026-06-08 19:56:08.923	2026-06-08 19:56:08.923
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
1	NEW_ACCIDENT	OPERATIONS	Yeni bir iş kazası kaydedildiğinde bildirim gider.	t	t	normal	2026-06-08 20:08:16.479
2	ASSIGNMENT_REMINDER	OPERATIONS	Süresi dolmak üzere olan atamalar için bildirim gider.	t	t	normal	2026-06-08 20:08:16.492
3	RECONCILIATION_APPROVED	PANEL	Bir mutabakat onaylandığında bildirim gider.	t	t	normal	2026-06-08 20:08:16.496
4	SYSTEM_ALERT	SYSTEM	Kritik sistem olaylarında bildirim gider.	t	t	normal	2026-06-08 20:08:16.498
\.


--
-- Data for Name: NotificationTemplate; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."NotificationTemplate" (id, code, name, module, subject, body, "createdAt", "updatedAt") FROM stdin;
1	NEW_ACCIDENT	Yeni Kaza Bildirimi	OPERATIONS	Yeni Kaza Bildirimi - SEC Portalı	Sayın Yetkili,\n\nYeni bir iş kazası kaydedildiğinde bildirim gider.\n\nDetaylar için lütfen sisteme giriş yapınız.\n\nİyi çalışmalar.	2026-06-08 20:08:16.488	2026-06-08 20:08:16.488
2	ASSIGNMENT_REMINDER	Atama Hatırlatıcı	OPERATIONS	Atama Hatırlatıcı - SEC Portalı	Sayın Yetkili,\n\nSüresi dolmak üzere olan atamalar için bildirim gider.\n\nDetaylar için lütfen sisteme giriş yapınız.\n\nİyi çalışmalar.	2026-06-08 20:08:16.494	2026-06-08 20:08:16.494
3	RECONCILIATION_APPROVED	Mutabakat Onayı	PANEL	Mutabakat Onayı - SEC Portalı	Sayın Yetkili,\n\nBir mutabakat onaylandığında bildirim gider.\n\nDetaylar için lütfen sisteme giriş yapınız.\n\nİyi çalışmalar.	2026-06-08 20:08:16.497	2026-06-08 20:08:16.497
4	SYSTEM_ALERT	Sistem Uyarısı	SYSTEM	Sistem Uyarısı - SEC Portalı	Sayın Yetkili,\n\nKritik sistem olaylarında bildirim gider.\n\nDetaylar için lütfen sisteme giriş yapınız.\n\nİyi çalışmalar.	2026-06-08 20:08:16.499	2026-06-08 20:08:16.499
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
10	Otonom OSGB				t	2026-06-05 11:49:34.41	2026-06-05 11:49:34.41	Antalya	
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
174	Tekinay Tan	OSGB Kadrosu	Otonom OSGB	C Sınıfı IGU		\N			\N	t	2026-06-05 11:49:57.995	2026-06-05 11:49:57.995	\N
175	İbrahim Can Kürkçüoğlu	Tesis Kadrosu		İşyeri Hekimi		\N			\N	t	2026-06-05 12:12:10.807	2026-06-05 12:12:10.807	\N
176	Ozan Özçelik	OSGB Kadrosu	Lider OSGB	A Sınıfı IGU		\N			\N	t	2026-06-05 12:18:23.69	2026-06-05 12:18:23.69	\N
177	İrem Bal	OSGB Kadrosu	Modern Teknik Tıp OSGB	C Sınıfı IGU		\N			\N	t	2026-06-09 07:10:06.326	2026-06-09 07:10:06.326	\N
178	Hakan Yılmaz	OSGB Kadrosu	Modern Teknik Tıp OSGB	C Sınıfı IGU		\N			\N	f	2026-06-09 10:58:44.016	2026-06-09 10:59:55.106	\N
179	Melike Uslu	Tesis Kadrosu		C Sınıfı IGU		\N			\N	t	2026-06-09 11:53:18.88	2026-06-09 11:53:18.88	\N
\.


--
-- Data for Name: Reconciliation; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."Reconciliation" (id, "facilityId", "osgbCompanyId", month, amount, note, status, "createdAt", "updatedAt", "calculatedAmount", "calculationDetails", difference, "invoiceAmount") FROM stdin;
6	MP-İNCEK	4	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.031	2026-04-27 11:24:57.589	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 220 dk -> 4 saat * ₺0 (Emine Ünzile ÖZTÜRK)", "assignmentId": 48, "professionalId": 117, "durationMinutes": 220, "professionalName": "Emine Ünzile ÖZTÜRK"}]	0	\N
34	MP-GOZTEPE	3	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.123	2026-04-27 11:24:57.562	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatih Mehmet ÖZAYDIN)", "assignmentId": 29, "professionalId": 33, "durationMinutes": 11700, "professionalName": "Fatih Mehmet ÖZAYDIN"}]	0	\N
37	MP-İNCEK	6	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.127	2026-04-27 11:24:57.565	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 330 dk -> 6 saat * ₺0 (Gülten ÖZKAN)", "assignmentId": 46, "professionalId": 81, "durationMinutes": 330, "professionalName": "Gülten ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 880 dk -> 15 saat * ₺0 (Sema Çiğdem KARAKUŞ)", "assignmentId": 45, "professionalId": 22, "durationMinutes": 880, "professionalName": "Sema Çiğdem KARAKUŞ"}]	0	\N
15	VM-MP-FATIH	4	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.038	2026-04-27 11:24:57.592	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Ayşe ŞİMŞEK)", "assignmentId": 131, "professionalId": 139, "durationMinutes": 400, "professionalName": "Ayşe ŞİMŞEK"}]	0	\N
8	İSU-LIV-BAHCES	4	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.033	2026-06-05 12:17:48.532	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Doğan Can GÜNEŞ)", "assignmentId": 71, "professionalId": 3, "durationMinutes": 11700, "professionalName": "Doğan Can GÜNEŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
9	İSTINYE-DENT	4	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.034	2026-06-05 12:17:48.539	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 800 dk -> 14 saat * ₺0 (Burak Kurt)", "assignmentId": 161, "professionalId": 155, "durationMinutes": 800, "professionalName": "Burak Kurt"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 162, "professionalId": 103, "durationMinutes": 400, "professionalName": "Fevzi AKDEMİR"}]	0	\N
12	MP-İZMIR	2	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.036	2026-06-05 12:17:48.532	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
10	İSU-LIV-TOPKAP	3	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.035	2026-06-05 12:17:48.534	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4230 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 94, "professionalId": 69, "durationMinutes": 4230, "professionalName": "Murad DİREN"}]	0	\N
13	MP-TEM	3	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.036	2026-06-05 12:17:48.535	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4245 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4245, "professionalName": "Murad DİREN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1320 dk -> 22 saat * ₺0 (Tülay Demirci)", "assignmentId": 171, "professionalId": 164, "durationMinutes": 1320, "professionalName": "Tülay Demirci"}]	0	\N
11	MP-İSTANBUL-ON	4	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.035	2026-06-05 12:17:48.535	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 9840 dk -> 164 saat * ₺0 (Ömer Faruk AYDIN)", "assignmentId": 110, "professionalId": 65, "durationMinutes": 9840, "professionalName": "Ömer Faruk AYDIN"}]	0	\N
1	LIV-GAZIANTEP	7	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.024	2026-06-05 12:17:48.538	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Resul Güler)", "assignmentId": 157, "professionalId": 157, "durationMinutes": 11700, "professionalName": "Resul Güler"}]	0	\N
36	MP-CANAKKALE	5	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.126	2026-06-05 12:39:34.781	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 75 dk -> 2 saat * ₺0 (Emrah Direk)", "assignmentId": 151, "professionalId": 153, "durationMinutes": 75, "professionalName": "Emrah Direk"}]	0	\N
4	MP-CANAKKALE	5	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.029	2026-06-05 12:17:48.53	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 75 dk -> 2 saat * ₺0 (Emrah Direk)", "assignmentId": 151, "professionalId": 153, "durationMinutes": 75, "professionalName": "Emrah Direk"}]	0	\N
38	MP-İNCEK	4	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.128	2026-04-27 11:24:57.565	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 220 dk -> 4 saat * ₺0 (Emine Ünzile ÖZTÜRK)", "assignmentId": 48, "professionalId": 117, "durationMinutes": 220, "professionalName": "Emine Ünzile ÖZTÜRK"}]	0	\N
43	MP-İSTANBUL-ON	4	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.132	2026-04-27 11:24:57.569	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 9520 dk -> 159 saat * ₺0 (Ömer Faruk AYDIN)", "assignmentId": 110, "professionalId": 65, "durationMinutes": 9520, "professionalName": "Ömer Faruk AYDIN"}]	0	\N
78	LIV-GAZIANTEP	7	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.378	2026-04-27 11:24:57.523	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4520 dk -> 76 saat * ₺0 (Yaşar POLAT)", "assignmentId": 2, "professionalId": 11, "durationMinutes": 4520, "professionalName": "Yaşar POLAT"}]	0	\N
79	MP-GOZTEPE	3	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.382	2026-04-27 11:24:57.517	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatih Mehmet ÖZAYDIN)", "assignmentId": 29, "professionalId": 33, "durationMinutes": 11700, "professionalName": "Fatih Mehmet ÖZAYDIN"}]	0	\N
47	VM-MP-FATIH	4	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.136	2026-04-27 11:24:57.568	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Ayşe ŞİMŞEK)", "assignmentId": 131, "professionalId": 139, "durationMinutes": 400, "professionalName": "Ayşe ŞİMŞEK"}]	0	\N
597	LIV-GAZIANTEP	7	2025-06	\N	\N	Beklemede	2026-06-05 11:43:32.343	2026-06-05 11:43:32.343	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4240 dk -> 71 saat * ₺0 (Yaşar POLAT)", "assignmentId": 2, "professionalId": 11, "durationMinutes": 4240, "professionalName": "Yaşar POLAT"}]	0	\N
81	MP-CANAKKALE	5	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.384	2026-06-05 12:43:43.409	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 75 dk -> 2 saat * ₺0 (Emrah Direk)", "assignmentId": 151, "professionalId": 153, "durationMinutes": 75, "professionalName": "Emrah Direk"}]	0	\N
598	İSU-LIV-BAHCES	4	2025-06	\N	\N	Beklemede	2026-06-05 11:43:32.344	2026-06-05 11:43:32.344	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
599	MP-İZMIR	2	2025-06	\N	\N	Beklemede	2026-06-05 11:43:32.345	2026-06-05 11:43:32.345	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
89	MP-İZMIR	2	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.39	2026-06-05 12:43:43.412	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
96	MP-CANAKKALE	5	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.025	2026-06-09 07:30:13.07	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 75 dk -> 2 saat * ₺0 (Emrah Direk)", "assignmentId": 151, "professionalId": 153, "durationMinutes": 75, "professionalName": "Emrah Direk"}]	0	\N
40	İSU-LIV-BAHCES	4	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.13	2026-06-05 12:39:34.785	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Doğan Can GÜNEŞ)", "assignmentId": 71, "professionalId": 3, "durationMinutes": 11700, "professionalName": "Doğan Can GÜNEŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
44	MP-İZMIR	2	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.133	2026-06-05 12:39:34.786	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
42	İSU-LIV-TOPKAP	3	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.132	2026-06-05 12:39:34.788	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4230 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 94, "professionalId": 69, "durationMinutes": 4230, "professionalName": "Murad DİREN"}]	0	\N
45	MP-TEM	3	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.134	2026-06-05 12:39:34.789	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4245 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4245, "professionalName": "Murad DİREN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1320 dk -> 22 saat * ₺0 (Tülay Demirci)", "assignmentId": 171, "professionalId": 164, "durationMinutes": 1320, "professionalName": "Tülay Demirci"}]	0	\N
41	İSTINYE-DENT	4	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.131	2026-06-05 12:39:34.793	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 162, "professionalId": 103, "durationMinutes": 400, "professionalName": "Fevzi AKDEMİR"}]	0	\N
86	İSTINYE-DENT	4	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.388	2026-04-27 05:29:05.302	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 840 dk -> 14 saat * ₺0 (Ramazan CAN)", "assignmentId": 92, "professionalId": 66, "durationMinutes": 840, "professionalName": "Ramazan CAN"}]	0	\N
88	MP-İSTANBUL-ON	4	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.39	2026-04-27 11:24:57.528	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 9520 dk -> 159 saat * ₺0 (Ömer Faruk AYDIN)", "assignmentId": 110, "professionalId": 65, "durationMinutes": 9520, "professionalName": "Ömer Faruk AYDIN"}]	0	\N
83	MP-İNCEK	4	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.386	2026-04-27 11:24:57.523	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 220 dk -> 4 saat * ₺0 (Emine Ünzile ÖZTÜRK)", "assignmentId": 48, "professionalId": 117, "durationMinutes": 220, "professionalName": "Emine Ünzile ÖZTÜRK"}]	0	\N
92	VM-MP-FATIH	4	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.392	2026-04-27 11:24:57.527	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Ayşe ŞİMŞEK)", "assignmentId": 131, "professionalId": 139, "durationMinutes": 400, "professionalName": "Ayşe ŞİMŞEK"}]	0	\N
107	VM-MP-FATIH	4	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.037	2026-04-27 11:24:57.546	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Ayşe ŞİMŞEK)", "assignmentId": 131, "professionalId": 139, "durationMinutes": 400, "professionalName": "Ayşe ŞİMŞEK"}]	0	\N
101	İSTINYE-DENT	4	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.031	2026-04-27 05:29:05.324	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 840 dk -> 14 saat * ₺0 (Ramazan CAN)", "assignmentId": 92, "professionalId": 66, "durationMinutes": 840, "professionalName": "Ramazan CAN"}]	0	\N
33	LIV-GAZIANTEP	7	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.119	2026-04-27 11:24:57.564	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4520 dk -> 76 saat * ₺0 (Yaşar POLAT)", "assignmentId": 2, "professionalId": 11, "durationMinutes": 4520, "professionalName": "Yaşar POLAT"}]	0	\N
601	MP-GOZTEPE	3	2025-07	\N	\N	Beklemede	2026-06-05 11:44:02.822	2026-06-05 11:44:02.822	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatih Mehmet ÖZAYDIN)", "assignmentId": 29, "professionalId": 33, "durationMinutes": 11700, "professionalName": "Fatih Mehmet ÖZAYDIN"}]	0	\N
94	MP-GOZTEPE	3	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.022	2026-06-01 13:50:12.027	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatih Mehmet ÖZAYDIN)", "assignmentId": 29, "professionalId": 33, "durationMinutes": 11700, "professionalName": "Fatih Mehmet ÖZAYDIN"}]	0	\N
93	LIV-GAZIANTEP	7	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.021	2026-06-01 13:50:12.031	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4240 dk -> 71 saat * ₺0 (Yaşar POLAT)", "assignmentId": 2, "professionalId": 11, "durationMinutes": 4240, "professionalName": "Yaşar POLAT"}]	0	\N
602	MP-KARADENIZ	1	2025-07	\N	\N	Beklemede	2026-06-05 11:44:02.824	2026-06-09 07:08:02.946	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}]	10000	\N
104	MP-İZMIR	2	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.034	2026-06-09 07:30:13.074	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
35	MP-KARADENIZ	1	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.124	2026-06-05 12:39:34.778	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 2480 dk -> 42 saat * ₺0 (Fatma Nur TÜRKSOY)", "assignmentId": 35, "professionalId": 42, "durationMinutes": 2480, "professionalName": "Fatma Nur TÜRKSOY"}]	10000	\N
87	İSU-LIV-TOPKAP	3	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.389	2026-06-05 12:43:43.414	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4230 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 94, "professionalId": 69, "durationMinutes": 4230, "professionalName": "Murad DİREN"}]	0	\N
90	MP-TEM	3	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.391	2026-06-05 12:43:43.415	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4440 dk -> 74 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4440, "professionalName": "Murad DİREN"}]	0	\N
98	MP-İNCEK	4	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.028	2026-04-27 11:24:57.543	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 220 dk -> 4 saat * ₺0 (Emine Ünzile ÖZTÜRK)", "assignmentId": 48, "professionalId": 117, "durationMinutes": 220, "professionalName": "Emine Ünzile ÖZTÜRK"}]	0	\N
82	MP-İNCEK	6	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.385	2026-04-27 11:24:57.524	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 330 dk -> 6 saat * ₺0 (Gülten ÖZKAN)", "assignmentId": 46, "professionalId": 81, "durationMinutes": 330, "professionalName": "Gülten ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 880 dk -> 15 saat * ₺0 (Sema Çiğdem KARAKUŞ)", "assignmentId": 45, "professionalId": 22, "durationMinutes": 880, "professionalName": "Sema Çiğdem KARAKUŞ"}]	0	\N
97	MP-İNCEK	6	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.027	2026-04-27 11:24:57.544	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 330 dk -> 6 saat * ₺0 (Gülten ÖZKAN)", "assignmentId": 46, "professionalId": 81, "durationMinutes": 330, "professionalName": "Gülten ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 880 dk -> 15 saat * ₺0 (Sema Çiğdem KARAKUŞ)", "assignmentId": 45, "professionalId": 22, "durationMinutes": 880, "professionalName": "Sema Çiğdem KARAKUŞ"}]	0	\N
102	İSU-LIV-TOPKAP	3	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.032	2026-06-09 07:30:13.075	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4230 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 94, "professionalId": 69, "durationMinutes": 4230, "professionalName": "Murad DİREN"}]	0	\N
103	MP-İSTANBUL-ON	4	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.033	2026-06-01 13:50:12.035	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 9840 dk -> 164 saat * ₺0 (Ömer Faruk AYDIN)", "assignmentId": 110, "professionalId": 65, "durationMinutes": 9840, "professionalName": "Ömer Faruk AYDIN"}]	0	\N
39	VM-MP-PENDIK	4	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.129	2026-06-05 12:39:34.783	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1845 dk -> 31 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 1845, "professionalName": "Fevzi AKDEMİR"}]	0	\N
7	VM-MP-PENDIK	4	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.032	2026-06-05 12:17:48.531	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1845 dk -> 31 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 1845, "professionalName": "Fevzi AKDEMİR"}]	0	4
84	VM-MP-PENDIK	4	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.387	2026-06-05 12:43:43.41	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1845 dk -> 31 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 1845, "professionalName": "Fevzi AKDEMİR"}]	0	\N
245	MP-SEYHAN	9	2026-03	\N	\N	Beklemede	2026-04-27 11:24:57.572	2026-04-27 11:24:57.572	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 3920 dk -> 66 saat * ₺0 (Kasım Yiğit)", "assignmentId": 170, "professionalId": 163, "durationMinutes": 3920, "professionalName": "Kasım Yiğit"}]	0	\N
5	MP-İNCEK	6	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.03	2026-04-27 11:24:57.589	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 330 dk -> 6 saat * ₺0 (Gülten ÖZKAN)", "assignmentId": 46, "professionalId": 81, "durationMinutes": 330, "professionalName": "Gülten ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 880 dk -> 15 saat * ₺0 (Sema Çiğdem KARAKUŞ)", "assignmentId": 45, "professionalId": 22, "durationMinutes": 880, "professionalName": "Sema Çiğdem KARAKUŞ"}]	0	\N
265	MLP-İGA	4	2026-04	\N	\N	Beklemede	2026-04-27 11:24:57.596	2026-06-05 12:17:48.538	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 130 dk -> 3 saat * ₺0 (Hakan Yılmaz)", "assignmentId": 159, "professionalId": 159, "durationMinutes": 130, "professionalName": "Hakan Yılmaz"}]	0	\N
267	MP-SEYHAN	9	2026-04	\N	\N	Beklemede	2026-04-27 11:24:57.598	2026-06-05 12:17:48.541	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 3800 dk -> 64 saat * ₺0 (Kasım Yiğit)", "assignmentId": 170, "professionalId": 163, "durationMinutes": 3800, "professionalName": "Kasım Yiğit"}]	0	\N
46	VM-MP-ANKARA	6	2026-03	\N	\N	Beklemede	2026-04-24 08:46:37.135	2026-06-05 12:39:34.787	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7180 dk -> 120 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7180, "professionalName": "Gülçin AKTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7440 dk -> 124 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 7440, "professionalName": "Gökmen GÜNDOĞDU"}]	0	\N
242	MLP-CAGRI-MERKE	8	2026-03	\N	\N	Beklemede	2026-04-27 11:24:57.57	2026-06-05 12:39:34.79	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 500 dk -> 9 saat * ₺0 (Emin Berat Uzuner)", "assignmentId": 152, "professionalId": 154, "durationMinutes": 500, "professionalName": "Emin Berat Uzuner"}]	0	\N
243	MLP-İGA	4	2026-03	\N	\N	Beklemede	2026-04-27 11:24:57.571	2026-06-05 12:39:34.792	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 130 dk -> 3 saat * ₺0 (Hakan Yılmaz)", "assignmentId": 159, "professionalId": 159, "durationMinutes": 130, "professionalName": "Hakan Yılmaz"}]	0	\N
263	MLP-CAGRI-MERKE	8	2026-04	\N	\N	Beklemede	2026-04-27 11:24:57.595	2026-06-05 12:17:48.536	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 500 dk -> 9 saat * ₺0 (Emin Berat Uzuner)", "assignmentId": 152, "professionalId": 154, "durationMinutes": 500, "professionalName": "Emin Berat Uzuner"}]	0	\N
264	GOP-DIYALIZ-MER	4	2026-04	\N	\N	Beklemede	2026-04-27 11:24:57.596	2026-06-05 12:17:48.537	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1240 dk -> 21 saat * ₺0 (Burak Kurt)", "assignmentId": 154, "professionalId": 155, "durationMinutes": 1240, "professionalName": "Burak Kurt"}]	0	\N
262	MP-ANKARA	6	2026-04	\N	\N	Beklemede	2026-04-27 11:24:57.595	2026-06-05 12:17:48.541	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Şahide Merve Kırdal)", "assignmentId": 149, "professionalId": 151, "durationMinutes": 11700, "professionalName": "Şahide Merve Kırdal"}]	0	\N
247	MLP-KARADENIZ-I	1	2026-03	\N	\N	Beklemede	2026-04-27 11:24:57.573	2026-06-05 12:39:34.794	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 40 dk -> 1 saat * ₺0 (Hasan Murat Şahin)", "assignmentId": 174, "professionalId": 167, "durationMinutes": 40, "professionalName": "Hasan Murat Şahin"}]	0	\N
246	İSU-LIV-TOPKAP	4	2026-03	\N	\N	Beklemede	2026-04-27 11:24:57.573	2026-06-05 12:39:34.794	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 5640 dk -> 94 saat * ₺0 (Halime Şayak)", "assignmentId": 173, "professionalId": 166, "durationMinutes": 5640, "professionalName": "Halime Şayak"}]	0	\N
226	İSU-LIV-TOPKAP	4	2026-02	\N	\N	Beklemede	2026-04-27 11:24:57.549	2026-06-05 12:41:18.992	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 5640 dk -> 94 saat * ₺0 (Halime Şayak)", "assignmentId": 173, "professionalId": 166, "durationMinutes": 5640, "professionalName": "Halime Şayak"}]	0	\N
284	İSTINYE-DENT	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.178	2026-06-09 10:56:53.463	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 800 dk -> 14 saat * ₺0 (Burak Kurt)", "assignmentId": 161, "professionalId": 155, "durationMinutes": 800, "professionalName": "Burak Kurt"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 162, "professionalId": 103, "durationMinutes": 400, "professionalName": "Fevzi AKDEMİR"}]	0	\N
287	İSU-LIV-TOPKAP	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.18	2026-06-05 12:45:14.696	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 5640 dk -> 94 saat * ₺0 (Halime Şayak)", "assignmentId": 173, "professionalId": 166, "durationMinutes": 5640, "professionalName": "Halime Şayak"}]	0	\N
288	VM-MP-FATIH	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.18	2026-06-05 12:45:14.696	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 720 dk -> 12 saat * ₺0 (Gülsün SEVEN)", "assignmentId": 178, "professionalId": 170, "durationMinutes": 720, "professionalName": "Gülsün SEVEN"}]	0	\N
289	MP-SEYHAN	9	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.181	2026-06-05 12:34:26.684	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 3800 dk -> 64 saat * ₺0 (Kasım Yiğit)", "assignmentId": 170, "professionalId": 163, "durationMinutes": 3800, "professionalName": "Kasım Yiğit"}]	0	\N
635	MP-ANTALYA	10	2026-05	\N	\N	Beklemede	2026-06-05 11:50:41.441	2026-06-09 10:56:53.466	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 8680 dk -> 145 saat * ₺0 (Tekinay Tan)", "assignmentId": 188, "professionalId": 174, "durationMinutes": 8680, "professionalName": "Tekinay Tan"}]	0	\N
873	MP-CANAKKALE	5	2025-09	\N	\N	Beklemede	2026-06-05 12:41:04.179	2026-06-11 06:49:54.457	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}]	0	\N
278	İSU-LIV-TOPKAP	3	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.173	2026-06-09 10:56:53.457	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4230 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 94, "professionalId": 69, "durationMinutes": 4230, "professionalName": "Murad DİREN"}]	0	\N
282	GOP-DIYALIZ-MER	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.177	2026-06-09 10:56:53.46	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1240 dk -> 21 saat * ₺0 (Burak Kurt)", "assignmentId": 154, "professionalId": 155, "durationMinutes": 1240, "professionalName": "Burak Kurt"}]	0	\N
274	LIV-GAZIANTEP	7	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.17	2026-06-09 10:56:53.462	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Resul Güler)", "assignmentId": 157, "professionalId": 157, "durationMinutes": 11700, "professionalName": "Resul Güler"}]	0	\N
269	MLP-KARADENIZ-I	1	2026-04	\N	\N	Beklemede	2026-04-27 11:24:57.599	2026-06-05 12:17:48.539	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 40 dk -> 1 saat * ₺0 (Hasan Murat Şahin)", "assignmentId": 174, "professionalId": 167, "durationMinutes": 40, "professionalName": "Hasan Murat Şahin"}]	0	\N
268	İSU-LIV-TOPKAP	4	2026-04	\N	\N	Beklemede	2026-04-27 11:24:57.598	2026-06-05 12:17:48.54	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 5640 dk -> 94 saat * ₺0 (Halime Şayak)", "assignmentId": 173, "professionalId": 166, "durationMinutes": 5640, "professionalName": "Halime Şayak"}]	0	\N
872	MP-KARADENIZ	1	2025-09	\N	\N	Beklemede	2026-06-05 12:41:04.177	2026-06-11 06:49:54.454	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}]	10000	\N
285	MLP-KARADENIZ-I	1	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.179	2026-06-09 10:56:53.464	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 40 dk -> 1 saat * ₺0 (Hasan Murat Şahin)", "assignmentId": 174, "professionalId": 167, "durationMinutes": 40, "professionalName": "Hasan Murat Şahin"}]	0	\N
280	MP-İSTANBUL-ON	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.175	2026-06-05 12:19:16.964	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 9840 dk -> 164 saat * ₺0 (Ömer Faruk AYDIN)", "assignmentId": 110, "professionalId": 65, "durationMinutes": 9840, "professionalName": "Ömer Faruk AYDIN"}]	0	\N
286	MP-ANKARA	6	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.179	2026-06-09 10:56:53.466	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Şahide Merve Kırdal)", "assignmentId": 149, "professionalId": 151, "durationMinutes": 11700, "professionalName": "Şahide Merve Kırdal"}]	0	\N
270	MP-GOZTEPE	3	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.162	2026-06-09 10:56:53.465	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ozan Özçelik)", "assignmentId": 190, "professionalId": 176, "durationMinutes": 11700, "professionalName": "Ozan Özçelik"}]	0	\N
1208	MP-İZMIR	2	2025-03	\N	\N	Beklemede	2026-06-09 07:24:31.047	2026-06-09 07:24:31.047	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
276	MP-İZMIR	2	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.172	2026-06-09 10:56:53.454	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
283	MLP-İGA	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.177	2026-06-09 10:56:53.462	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 130 dk -> 3 saat * ₺0 (Hakan Yılmaz)", "assignmentId": 159, "professionalId": 159, "durationMinutes": 130, "professionalName": "Hakan Yılmaz"}]	0	\N
318	İSU-LIV-TOPKAP	3	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.451	2026-06-11 06:54:39.26	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 6300 dk -> 105 saat * ₺0 (Murad DİREN)", "assignmentId": 94, "professionalId": 69, "durationMinutes": 6300, "professionalName": "Murad DİREN"}]	0	\N
320	MP-İSTANBUL-ON	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.454	2026-06-11 06:54:39.259	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ömer Faruk AYDIN)", "assignmentId": 110, "professionalId": 65, "durationMinutes": 11700, "professionalName": "Ömer Faruk AYDIN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 440 dk -> 8 saat * ₺0 (Hakan Yılmaz)", "assignmentId": 192, "professionalId": 159, "durationMinutes": 440, "professionalName": "Hakan Yılmaz"}]	0	\N
310	MP-GOZTEPE	3	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.44	2026-06-11 06:54:39.265	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ozan Özçelik)", "assignmentId": 190, "professionalId": 176, "durationMinutes": 11700, "professionalName": "Ozan Özçelik"}]	0	\N
279	MP-TEM	3	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.174	2026-06-09 10:56:53.458	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4440 dk -> 74 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4440, "professionalName": "Murad DİREN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1840 dk -> 31 saat * ₺0 (Tülay Demirci)", "assignmentId": 171, "professionalId": 164, "durationMinutes": 1840, "professionalName": "Tülay Demirci"}]	0	\N
311	MP-KARADENIZ	1	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.441	2026-06-11 06:54:39.252	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 3520 dk -> 59 saat * ₺0 (Fatma Nur TÜRKSOY)", "assignmentId": 35, "professionalId": 42, "durationMinutes": 3520, "professionalName": "Fatma Nur TÜRKSOY"}]	10000	\N
312	MP-CANAKKALE	5	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.444	2026-06-11 06:54:39.254	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 75 dk -> 2 saat * ₺0 (Emrah Direk)", "assignmentId": 151, "professionalId": 153, "durationMinutes": 75, "professionalName": "Emrah Direk"}]	0	\N
281	MLP-CAGRI-MERKE	8	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.176	2026-06-09 10:56:53.459	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 500 dk -> 9 saat * ₺0 (Emin Berat Uzuner)", "assignmentId": 152, "professionalId": 154, "durationMinutes": 500, "professionalName": "Emin Berat Uzuner"}]	0	\N
319	MP-TEM	3	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.453	2026-06-11 06:54:39.259	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4440 dk -> 74 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4440, "professionalName": "Murad DİREN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1840 dk -> 31 saat * ₺0 (Tülay Demirci)", "assignmentId": 171, "professionalId": 164, "durationMinutes": 1840, "professionalName": "Tülay Demirci"}]	0	\N
321	MLP-CAGRI-MERKE	8	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.455	2026-06-11 06:54:39.261	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 500 dk -> 9 saat * ₺0 (Emin Berat Uzuner)", "assignmentId": 152, "professionalId": 154, "durationMinutes": 500, "professionalName": "Emin Berat Uzuner"}]	0	\N
316	MP-İZMIR	2	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.45	2026-06-11 06:54:39.257	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
314	LIV-GAZIANTEP	7	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.447	2026-06-11 06:54:39.262	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Resul Güler)", "assignmentId": 157, "professionalId": 157, "durationMinutes": 11700, "professionalName": "Resul Güler"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 5840 dk -> 98 saat * ₺0 (Yaşar POLAT)", "assignmentId": 2, "professionalId": 11, "durationMinutes": 5840, "professionalName": "Yaşar POLAT"}]	0	\N
329	MP-SEYHAN	9	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.461	2026-06-11 06:54:39.268	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 5080 dk -> 85 saat * ₺0 (Kasım Yiğit)", "assignmentId": 170, "professionalId": 163, "durationMinutes": 5080, "professionalName": "Kasım Yiğit"}]	0	\N
323	MLP-İGA	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.456	2026-06-11 06:54:39.263	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 130 dk -> 3 saat * ₺0 (Hakan Yılmaz)", "assignmentId": 159, "professionalId": 159, "durationMinutes": 130, "professionalName": "Hakan Yılmaz"}]	0	\N
327	İSU-LIV-TOPKAP	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.459	2026-06-11 06:54:39.269	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 8340 dk -> 139 saat * ₺0 (Halime Şayak)", "assignmentId": 173, "professionalId": 166, "durationMinutes": 8340, "professionalName": "Halime Şayak"}]	0	\N
600	VM-MP-ANKARA	6	2025-06	\N	\N	Beklemede	2026-06-05 11:43:32.346	2026-06-05 11:43:32.346	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7440 dk -> 124 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 7440, "professionalName": "Gökmen GÜNDOĞDU"}]	0	\N
272	MP-CANAKKALE	5	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.168	2026-06-09 10:56:53.451	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 75 dk -> 2 saat * ₺0 (Emrah Direk)", "assignmentId": 151, "professionalId": 153, "durationMinutes": 75, "professionalName": "Emrah Direk"}]	0	\N
328	VM-MP-FATIH	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.46	2026-06-11 06:54:39.27	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 2280 dk -> 38 saat * ₺0 (Gülsün SEVEN)", "assignmentId": 178, "professionalId": 170, "durationMinutes": 2280, "professionalName": "Gülsün SEVEN"}]	0	\N
324	İSTINYE-DENT	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.457	2026-06-11 06:54:39.264	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 800 dk -> 14 saat * ₺0 (Burak Kurt)", "assignmentId": 161, "professionalId": 155, "durationMinutes": 800, "professionalName": "Burak Kurt"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 400 dk -> 7 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 162, "professionalId": 103, "durationMinutes": 400, "professionalName": "Fevzi AKDEMİR"}]	0	\N
325	MLP-KARADENIZ-I	1	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.458	2026-06-11 06:54:39.264	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 40 dk -> 1 saat * ₺0 (Hasan Murat Şahin)", "assignmentId": 174, "professionalId": 167, "durationMinutes": 40, "professionalName": "Hasan Murat Şahin"}]	0	\N
326	MP-ANKARA	6	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.458	2026-06-11 06:54:39.266	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Şahide Merve Kırdal)", "assignmentId": 149, "professionalId": 151, "durationMinutes": 11700, "professionalName": "Şahide Merve Kırdal"}]	0	\N
322	GOP-DIYALIZ-MER	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.455	2026-06-11 06:54:39.261	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1240 dk -> 21 saat * ₺0 (Burak Kurt)", "assignmentId": 154, "professionalId": 155, "durationMinutes": 1240, "professionalName": "Burak Kurt"}]	0	\N
271	MP-KARADENIZ	1	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.167	2026-06-09 10:56:53.448	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 3520 dk -> 59 saat * ₺0 (Fatma Nur TÜRKSOY)", "assignmentId": 35, "professionalId": 42, "durationMinutes": 3520, "professionalName": "Fatma Nur TÜRKSOY"}]	10000	\N
105	MP-TEM	3	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.035	2026-06-09 07:30:13.076	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4440 dk -> 74 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4440, "professionalName": "Murad DİREN"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1840 dk -> 31 saat * ₺0 (Tülay Demirci)", "assignmentId": 171, "professionalId": 164, "durationMinutes": 1840, "professionalName": "Tülay Demirci"}]	0	\N
227	MLP-KARADENIZ-I	1	2026-02	\N	\N	Beklemede	2026-04-27 11:24:57.55	2026-06-09 07:30:13.077	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 40 dk -> 1 saat * ₺0 (Hasan Murat Şahin)", "assignmentId": 174, "professionalId": 167, "durationMinutes": 40, "professionalName": "Hasan Murat Şahin"}]	0	\N
95	MP-KARADENIZ	1	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.023	2026-06-09 07:30:13.068	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 3520 dk -> 59 saat * ₺0 (Fatma Nur TÜRKSOY)", "assignmentId": 35, "professionalId": 42, "durationMinutes": 3520, "professionalName": "Fatma Nur TÜRKSOY"}]	10000	\N
99	VM-MP-PENDIK	4	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.029	2026-06-09 07:30:13.072	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}]	0	\N
594	MP-GOZTEPE	3	2025-06	\N	\N	Beklemede	2026-06-05 11:43:32.34	2026-06-05 11:43:32.34	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatih Mehmet ÖZAYDIN)", "assignmentId": 29, "professionalId": 33, "durationMinutes": 11700, "professionalName": "Fatih Mehmet ÖZAYDIN"}]	0	\N
595	MP-KARADENIZ	1	2025-06	\N	\N	Beklemede	2026-06-05 11:43:32.341	2026-06-05 11:43:32.341	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}]	10000	\N
596	VM-MP-PENDIK	4	2025-06	\N	\N	Beklemede	2026-06-05 11:43:32.342	2026-06-05 11:43:32.342	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1845 dk -> 31 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 1845, "professionalName": "Fevzi AKDEMİR"}]	0	\N
592	MP-İZMIR	2	2025-04	\N	\N	Beklemede	2026-06-05 11:43:32.331	2026-06-05 11:44:26.014	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
593	VM-MP-ANKARA	6	2025-04	\N	\N	Beklemede	2026-06-05 11:43:32.332	2026-06-05 11:44:26.016	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}]	0	\N
100	İSU-LIV-BAHCES	4	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.03	2026-06-09 07:30:13.073	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Doğan Can GÜNEŞ)", "assignmentId": 71, "professionalId": 3, "durationMinutes": 11700, "professionalName": "Doğan Can GÜNEŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
106	VM-MP-ANKARA	6	2026-02	\N	\N	Beklemede	2026-04-24 19:18:18.036	2026-06-09 07:30:13.074	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7180 dk -> 120 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7180, "professionalName": "Gülçin AKTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7440 dk -> 124 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 7440, "professionalName": "Gökmen GÜNDOĞDU"}]	0	\N
273	VM-MP-PENDIK	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.169	2026-06-09 10:56:53.452	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}]	0	\N
275	İSU-LIV-BAHCES	4	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.171	2026-06-09 10:56:53.453	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Doğan Can GÜNEŞ)", "assignmentId": 71, "professionalId": 3, "durationMinutes": 11700, "professionalName": "Doğan Can GÜNEŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Elif Sevinç)", "assignmentId": 180, "professionalId": 171, "durationMinutes": 11700, "professionalName": "Elif Sevinç"}]	0	\N
2	MP-GOZTEPE	3	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.028	2026-06-05 11:41:10.274	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatih Mehmet ÖZAYDIN)", "assignmentId": 29, "professionalId": 33, "durationMinutes": 11700, "professionalName": "Fatih Mehmet ÖZAYDIN"}]	0	\N
587	MP-GOZTEPE	3	2025-04	\N	\N	Beklemede	2026-06-05 11:43:32.322	2026-06-05 11:44:26.008	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatih Mehmet ÖZAYDIN)", "assignmentId": 29, "professionalId": 33, "durationMinutes": 11700, "professionalName": "Fatih Mehmet ÖZAYDIN"}]	0	\N
588	MP-KARADENIZ	1	2025-04	\N	\N	Beklemede	2026-06-05 11:43:32.323	2026-06-05 11:44:26.009	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}]	10000	\N
589	VM-MP-PENDIK	4	2025-04	\N	\N	Beklemede	2026-06-05 11:43:32.325	2026-06-05 11:44:26.01	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1845 dk -> 31 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 1845, "professionalName": "Fevzi AKDEMİR"}]	0	\N
590	LIV-GAZIANTEP	7	2025-04	\N	\N	Beklemede	2026-06-05 11:43:32.327	2026-06-05 11:44:26.012	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4240 dk -> 71 saat * ₺0 (Yaşar POLAT)", "assignmentId": 2, "professionalId": 11, "durationMinutes": 4240, "professionalName": "Yaşar POLAT"}]	0	\N
3	MP-KARADENIZ	1	2026-04	\N		Uyuşmazlık	2026-04-24 08:40:00.028	2026-06-05 12:17:48.528	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 2480 dk -> 42 saat * ₺0 (Fatma Nur TÜRKSOY)", "assignmentId": 35, "professionalId": 42, "durationMinutes": 2480, "professionalName": "Fatma Nur TÜRKSOY"}]	10000	0
14	VM-MP-ANKARA	6	2026-04	\N	\N	Beklemede	2026-04-24 08:40:00.037	2026-06-05 12:17:48.533	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7180 dk -> 120 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7180, "professionalName": "Gülçin AKTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7440 dk -> 124 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 7440, "professionalName": "Gökmen GÜNDOĞDU"}]	0	\N
604	LIV-GAZIANTEP	7	2025-07	\N	\N	Beklemede	2026-06-05 11:44:02.827	2026-06-05 11:44:02.827	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4240 dk -> 71 saat * ₺0 (Yaşar POLAT)", "assignmentId": 2, "professionalId": 11, "durationMinutes": 4240, "professionalName": "Yaşar POLAT"}]	0	\N
591	İSU-LIV-BAHCES	4	2025-04	\N	\N	Beklemede	2026-06-05 11:43:32.329	2026-06-05 11:44:26.013	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
636	MP-GOZTEPE	3	2025-02	\N	\N	Beklemede	2026-06-05 12:10:07.541	2026-06-05 12:10:07.541	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatih Mehmet ÖZAYDIN)", "assignmentId": 29, "professionalId": 33, "durationMinutes": 11700, "professionalName": "Fatih Mehmet ÖZAYDIN"}]	0	\N
661	MP-KARADENIZ	1	2024-09	\N	\N	Beklemede	2026-06-05 12:11:29.767	2026-06-05 12:11:29.767	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}]	10000	\N
662	MP-İZMIR	2	2024-09	\N	\N	Beklemede	2026-06-05 12:11:29.768	2026-06-05 12:11:29.768	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
637	MP-KARADENIZ	1	2025-02	\N	\N	Beklemede	2026-06-05 12:10:07.543	2026-06-09 07:05:19.555	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}]	10000	\N
660	MP-ANTALYA	10	2026-06	\N	\N	Beklemede	2026-06-05 12:10:07.575	2026-06-11 06:54:39.267	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 8680 dk -> 145 saat * ₺0 (Tekinay Tan)", "assignmentId": 188, "professionalId": 174, "durationMinutes": 8680, "professionalName": "Tekinay Tan"}]	0	\N
603	VM-MP-PENDIK	4	2025-07	\N	\N	Beklemede	2026-06-05 11:44:02.826	2026-06-09 07:08:02.948	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1845 dk -> 31 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 1845, "professionalName": "Fevzi AKDEMİR"}]	0	\N
605	İSU-LIV-BAHCES	4	2025-07	\N	\N	Beklemede	2026-06-05 11:44:02.828	2026-06-09 07:08:02.95	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
638	İSU-LIV-BAHCES	4	2025-02	\N	\N	Beklemede	2026-06-05 12:10:07.544	2026-06-09 07:05:19.56	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
639	MP-İZMIR	2	2025-02	\N	\N	Beklemede	2026-06-05 12:10:07.545	2026-06-09 07:05:19.561	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
606	MP-İZMIR	2	2025-07	\N	\N	Beklemede	2026-06-05 11:44:02.829	2026-06-09 07:08:02.952	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
607	VM-MP-ANKARA	6	2025-07	\N	\N	Beklemede	2026-06-05 11:44:02.83	2026-06-09 07:08:02.953	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7180 dk -> 120 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7180, "professionalName": "Gülçin AKTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7440 dk -> 124 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 7440, "professionalName": "Gökmen GÜNDOĞDU"}]	0	\N
80	MP-KARADENIZ	1	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.383	2026-06-05 12:43:43.406	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 3520 dk -> 59 saat * ₺0 (Fatma Nur TÜRKSOY)", "assignmentId": 35, "professionalId": 42, "durationMinutes": 3520, "professionalName": "Fatma Nur TÜRKSOY"}]	10000	\N
313	VM-MP-PENDIK	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.445	2026-06-11 06:54:39.255	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 3240 dk -> 54 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 3240, "professionalName": "Fevzi AKDEMİR"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 8640 dk -> 144 saat * ₺0 (İrem Bal)", "assignmentId": 191, "professionalId": 177, "durationMinutes": 8640, "professionalName": "İrem Bal"}]	0	\N
85	İSU-LIV-BAHCES	4	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.388	2026-06-05 12:43:43.411	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Doğan Can GÜNEŞ)", "assignmentId": 71, "professionalId": 3, "durationMinutes": 11700, "professionalName": "Doğan Can GÜNEŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
277	VM-MP-ANKARA	6	2026-05	\N	\N	Beklemede	2026-06-01 11:24:51.172	2026-06-09 10:56:53.456	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7180 dk -> 120 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7180, "professionalName": "Gülçin AKTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7440 dk -> 124 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 7440, "professionalName": "Gökmen GÜNDOĞDU"}]	0	\N
91	VM-MP-ANKARA	6	2026-01	\N	\N	Beklemede	2026-04-24 19:18:12.392	2026-06-05 12:43:43.413	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7180 dk -> 120 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7180, "professionalName": "Gülçin AKTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7440 dk -> 124 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 7440, "professionalName": "Gökmen GÜNDOĞDU"}]	0	\N
317	VM-MP-ANKARA	6	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.45	2026-06-11 06:54:39.258	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7180 dk -> 120 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7180, "professionalName": "Gülçin AKTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7440 dk -> 124 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 7440, "professionalName": "Gökmen GÜNDOĞDU"}]	0	\N
1011	MP-KARADENIZ	1	2025-11	\N	\N	Beklemede	2026-06-09 07:06:18.688	2026-06-09 07:06:18.688	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}]	10000	\N
1012	MP-CANAKKALE	5	2025-11	\N	\N	Beklemede	2026-06-09 07:06:18.693	2026-06-09 07:06:18.693	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}]	0	\N
877	VM-MP-ANKARA	6	2025-09	\N	\N	Beklemede	2026-06-05 12:41:04.185	2026-06-11 06:49:54.461	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7180 dk -> 120 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7180, "professionalName": "Gülçin AKTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7440 dk -> 124 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 7440, "professionalName": "Gökmen GÜNDOĞDU"}]	0	\N
878	MP-TEM	3	2025-09	\N	\N	Beklemede	2026-06-05 12:41:04.187	2026-06-11 06:49:54.462	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4440 dk -> 74 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4440, "professionalName": "Murad DİREN"}]	0	\N
918	VM-MP-PENDIK	4	2025-10	\N	\N	Beklemede	2026-06-08 12:59:54.712	2026-06-11 06:34:57.964	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}]	0	\N
919	İSU-LIV-BAHCES	4	2025-10	\N	\N	Beklemede	2026-06-08 12:59:54.713	2026-06-11 06:34:57.965	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
923	MP-TEM	3	2025-10	\N	\N	Beklemede	2026-06-08 12:59:54.718	2026-06-11 06:34:57.968	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4440 dk -> 74 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4440, "professionalName": "Murad DİREN"}]	0	\N
922	İSU-LIV-TOPKAP	3	2025-10	\N	\N	Beklemede	2026-06-08 12:59:54.717	2026-06-11 06:34:57.969	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 6300 dk -> 105 saat * ₺0 (Murad DİREN)", "assignmentId": 94, "professionalId": 69, "durationMinutes": 6300, "professionalName": "Murad DİREN"}]	0	\N
875	İSU-LIV-BAHCES	4	2025-09	\N	\N	Beklemede	2026-06-05 12:41:04.183	2026-06-11 06:49:54.459	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
916	MP-KARADENIZ	1	2025-10	\N	\N	Beklemede	2026-06-08 12:59:54.707	2026-06-11 06:34:57.961	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}]	10000	\N
917	MP-CANAKKALE	5	2025-10	\N	\N	Beklemede	2026-06-08 12:59:54.711	2026-06-11 06:34:57.963	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 200 dk -> 4 saat * ₺0 (Seray ÖZKAN)", "assignmentId": 42, "professionalId": 21, "durationMinutes": 200, "professionalName": "Seray ÖZKAN"}]	0	\N
920	MP-İZMIR	2	2025-10	\N	\N	Beklemede	2026-06-08 12:59:54.714	2026-06-11 06:34:57.966	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
876	MP-İZMIR	2	2025-09	\N	\N	Beklemede	2026-06-05 12:41:04.184	2026-06-11 06:49:54.46	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
1013	VM-MP-PENDIK	4	2025-11	\N	\N	Beklemede	2026-06-09 07:06:18.695	2026-06-09 07:06:18.695	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1845 dk -> 31 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 1845, "professionalName": "Fevzi AKDEMİR"}]	0	\N
1014	İSU-LIV-BAHCES	4	2025-11	\N	\N	Beklemede	2026-06-09 07:06:18.697	2026-06-09 07:06:18.697	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
1015	MP-İZMIR	2	2025-11	\N	\N	Beklemede	2026-06-09 07:06:18.698	2026-06-09 07:06:18.698	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
1016	VM-MP-ANKARA	6	2025-11	\N	\N	Beklemede	2026-06-09 07:06:18.699	2026-06-09 07:06:18.699	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7180 dk -> 120 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7180, "professionalName": "Gülçin AKTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7440 dk -> 124 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 7440, "professionalName": "Gökmen GÜNDOĞDU"}]	0	\N
1017	İSU-LIV-TOPKAP	3	2025-11	\N	\N	Beklemede	2026-06-09 07:06:18.701	2026-06-09 07:06:18.701	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4230 dk -> 71 saat * ₺0 (Murad DİREN)", "assignmentId": 94, "professionalId": 69, "durationMinutes": 4230, "professionalName": "Murad DİREN"}]	0	\N
1018	MP-TEM	3	2025-11	\N	\N	Beklemede	2026-06-09 07:06:18.702	2026-06-09 07:06:18.702	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 4440 dk -> 74 saat * ₺0 (Murad DİREN)", "assignmentId": 119, "professionalId": 69, "durationMinutes": 4440, "professionalName": "Murad DİREN"}]	0	\N
1040	MP-KARADENIZ	1	2024-08	\N	\N	Beklemede	2026-06-09 07:06:38.96	2026-06-09 07:06:38.96	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}]	10000	\N
1041	MP-İZMIR	2	2024-08	\N	\N	Beklemede	2026-06-09 07:06:38.963	2026-06-09 07:06:38.963	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
1091	MP-KARADENIZ	1	2025-05	\N	\N	Beklemede	2026-06-09 07:07:24.08	2026-06-09 07:07:24.08	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}]	10000	\N
1092	VM-MP-PENDIK	4	2025-05	\N	\N	Beklemede	2026-06-09 07:07:24.084	2026-06-09 07:07:24.084	0	[{"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 1845 dk -> 31 saat * ₺0 (Fevzi AKDEMİR)", "assignmentId": 67, "professionalId": 103, "durationMinutes": 1845, "professionalName": "Fevzi AKDEMİR"}]	0	\N
1093	İSU-LIV-BAHCES	4	2025-05	\N	\N	Beklemede	2026-06-09 07:07:24.086	2026-06-09 07:07:24.086	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
1094	MP-İZMIR	2	2025-05	\N	\N	Beklemede	2026-06-09 07:07:24.087	2026-06-09 07:07:24.087	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Murat UYSAL)", "assignmentId": 112, "professionalId": 35, "durationMinutes": 11700, "professionalName": "Murat UYSAL"}]	0	\N
1095	VM-MP-ANKARA	6	2025-05	\N	\N	Beklemede	2026-06-09 07:07:24.089	2026-06-09 07:07:24.089	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}]	0	\N
1206	MP-KARADENIZ	1	2025-03	\N	\N	Beklemede	2026-06-09 07:24:31.043	2026-06-09 07:24:31.043	10000	[{"cost": 10000, "unitPrice": 10000, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ali Haydar USTA)", "assignmentId": 34, "professionalId": 41, "durationMinutes": 11700, "professionalName": "Ali Haydar USTA"}]	10000	\N
1207	İSU-LIV-BAHCES	4	2025-03	\N	\N	Beklemede	2026-06-09 07:24:31.045	2026-06-09 07:24:31.045	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}]	0	\N
315	İSU-LIV-BAHCES	4	2026-06	\N	\N	Beklemede	2026-06-01 11:29:24.448	2026-06-11 06:54:39.256	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Doğan Can GÜNEŞ)", "assignmentId": 71, "professionalId": 3, "durationMinutes": 11700, "professionalName": "Doğan Can GÜNEŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Ümmühan Nur YILMAZ)", "assignmentId": 72, "professionalId": 67, "durationMinutes": 11700, "professionalName": "Ümmühan Nur YILMAZ"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Elif Sevinç)", "assignmentId": 180, "professionalId": 171, "durationMinutes": 11700, "professionalName": "Elif Sevinç"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 5200 dk -> 87 saat * ₺0 (Hakan Yılmaz)", "assignmentId": 193, "professionalId": 159, "durationMinutes": 5200, "professionalName": "Hakan Yılmaz"}]	0	\N
921	VM-MP-ANKARA	6	2025-10	\N	\N	Beklemede	2026-06-08 12:59:54.716	2026-06-11 06:34:57.967	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Kubilay ALTINTAŞ)", "assignmentId": 126, "professionalId": 44, "durationMinutes": 11700, "professionalName": "Kubilay ALTINTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7180 dk -> 120 saat * ₺0 (Gülçin AKTAŞ)", "assignmentId": 129, "professionalId": 128, "durationMinutes": 7180, "professionalName": "Gülçin AKTAŞ"}, {"cost": 0, "unitPrice": 0, "isFullTime": false, "description": "Kısmi Zamanlı: 7440 dk -> 124 saat * ₺0 (Gökmen GÜNDOĞDU)", "assignmentId": 127, "professionalId": 45, "durationMinutes": 7440, "professionalName": "Gökmen GÜNDOĞDU"}]	0	\N
874	VM-MP-PENDIK	4	2025-09	\N	\N	Beklemede	2026-06-05 12:41:04.181	2026-06-11 06:49:54.458	0	[{"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Rabia ALBAYRAK)", "assignmentId": 63, "professionalId": 60, "durationMinutes": 11700, "professionalName": "Rabia ALBAYRAK"}, {"cost": 0, "unitPrice": 0, "isFullTime": true, "description": "Tam Zamanlı Sabit Ücret (Fatma Çağla NERGİS)", "assignmentId": 64, "professionalId": 61, "durationMinutes": 11700, "professionalName": "Fatma Çağla NERGİS"}]	0	\N
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
4a35475b-a993-4835-96ce-0c736241f048	1e2b1784-e35f-48a9-96d1-fed5b585ea9f	Güncellendi	Risk detayları güncellendi.	{"finalScore": {"new": 108, "old": null}}	metin.salik	2026-06-05 06:19:28.608
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
7	GOP-DIYALIZ-MER	Yönetsel Hizmetler	2026-06-05 09:44:42.97	2026-06-05 09:44:42.97
8	GOP-DIYALIZ-MER	Tesis Güvenliği	2026-06-05 09:45:46.596	2026-06-05 09:45:46.596
9	GOP-DIYALIZ-MER	Çevre Güvenliği	2026-06-05 09:47:19.307	2026-06-05 09:47:19.307
10	GOP-DIYALIZ-MER	İş Sağlığı ve Güvenliği	2026-06-05 09:48:02.662	2026-06-05 09:48:02.662
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
10	GOP-DIYALIZ-MER	Radyoloji	2026-06-08 13:35:31.595	2026-06-08 13:35:31.595	RAD
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
15	GOP-DIYALIZ-MER	Bilgi Sistemleri Müdürlüğü	2026-05-19 19:40:06.307	2026-06-05 09:49:16.304
16	GOP-DIYALIZ-MER	Başhekimlik	2026-06-05 09:49:23.066	2026-06-05 09:49:23.066
17	GOP-DIYALIZ-MER	Biyomedikal Müdürlüğü	2026-06-05 09:49:33.026	2026-06-05 09:49:33.026
18	GOP-DIYALIZ-MER	Hasta Bakım Hizmetleri Müdürlüğü	2026-06-05 09:49:45.972	2026-06-05 09:49:45.972
19	GOP-DIYALIZ-MER	İnsan Kaynakları Müdürlüğü	2026-06-05 09:49:56.884	2026-06-05 09:49:56.884
20	GOP-DIYALIZ-MER	İş Sağlığı ve Güvenliği	2026-06-05 09:50:07.687	2026-06-05 09:50:07.687
21	GOP-DIYALIZ-MER	Kalite Müdürlüğü	2026-06-05 09:50:17.32	2026-06-05 09:50:17.32
22	GOP-DIYALIZ-MER	Misafir Hizmetleri Müdürlüğü	2026-06-05 09:50:30.183	2026-06-05 09:50:30.183
23	GOP-DIYALIZ-MER	Otelcilik ve Destek Hizmetleri Müdürlüğü	2026-06-05 09:50:45.037	2026-06-05 09:50:45.037
24	GOP-DIYALIZ-MER	Teknik Hizmetler Müdürlüğü	2026-06-05 09:50:58.999	2026-06-05 09:50:58.999
25	GOP-DIYALIZ-MER	Satınalma Müdürlüğü	2026-06-05 09:51:12.177	2026-06-05 09:51:12.177
26	GOP-DIYALIZ-MER	Üst Yönetim	2026-06-05 09:51:21.038	2026-06-05 09:51:21.038
27	GOP-DIYALIZ-MER	Diğer	2026-06-05 09:51:26.069	2026-06-05 09:51:26.069
\.


--
-- Data for Name: RiskExpertFacility; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."RiskExpertFacility" ("expertUsername", "facilityId") FROM stdin;
\.


--
-- Data for Name: RiskLifecycle; Type: TABLE DATA; Schema: public; Owner: isguser
--

COPY public."RiskLifecycle" (id, "departmentId", "riskNo", "riskCategory", "subCategory", area, method, activity, hazard, "riskDescription", "initialCondition", "initialImage", "initialProb", "initialFreq", "initialSev", "initialScore", "initialLevel", "firstActionPlan", "actionsTaken", "actionDate", "actionBy", "actionImage", "followUpMeasure", "extraImprovement", "finalProb", "finalFreq", "finalSev", "finalScore", "finalLevel", status, "createdBy", "createdAt", "updatedAt", "affectedPeople", "controlResponsible", "controlResult", "detectionDate", "dueDate", "effectivenessMethod", "impactDamage", "improvementResponsible", legislation, "postImprovementDueDate", "postImprovementResponsible", "dueDatePeriod") FROM stdin;
ba7a11d0-53ed-4a25-acc6-c1b568c40c0e	1	1	Tıbbi Hizmetler	Hizmete erişim ile ilgili riskler	Acil Servis	Fine Kinney	Deneme	Deneme	Deneme	deneme	\N	6	6	15	540	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-05-22 06:27:00.777	2026-05-22 06:27:00.777	Çalışanlar	\N	\N	2026-05-22 00:00:00	2026-12-31 00:00:00	\N	Deneme	Başhekimlik	isg kanunu	\N	\N	\N
9d03f8f2-5c9f-48e2-acfd-b1ae06d7d510	6	1	Tıbbi Hizmetler	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Gönüllü tedavi ve klinik araştırma sırasında kesici delici alet kullanımı	Kesici Delici Alet Yaralanması	Enfeksiyon, Bulaşıcı Hastalık	HEM-T06 İlaçların Hazırlanması ve Uygulanması Talimatı	\N	10	6	15	900	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:28.392	2026-05-22 06:36:28.392	Hemşire, Doktor	\N	\N	2026-04-13 00:00:00	\N	\N	Bulaşıcı Hastalık	\N	\N	\N	\N	\N
7f9adda2-ecf8-42ab-a0e3-5278f716a7d3	6	2	Tıbbi Hizmetler	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Gönüllü kabul sürecinin planlanması	Klinik Araştırma olası tehlike ve risklerinin detaylı şekilde belirtilmemiş olması	Riskleri Bilmeme	Kalite prosedür ve talimatlarında ilgili süreçler kalite sistemi içine eklenmemiştir.	\N	10	1	7	70	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:28.395	2026-05-22 06:36:28.395	Gönüllü	\N	\N	2026-04-13 00:00:00	\N	\N	Ölüm	\N	\N	\N	\N	\N
cb8ff94b-d175-4662-9647-dccf762200ee	6	3	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Klinik Merkezi Giriş Kapısı	Kapı geçişinde sedye ve yatak geçişine uygun değildir.	Gönüllü Transferinde kapı geçişinde kapının kırılması ve kapı camın dağılması	Otomatik ve kilitli konumda kayar kapı yerleştirilken yata ve sedye geçişi için 120 cm olup olmadığı kontrol edilmemiştir.	\N	3	3	7	63	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:28.397	2026-05-22 06:36:28.397	Gönüllü, Hemşire, Doktor	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma	\N	\N	\N	\N	\N
2ea19522-96ee-4a03-bf67-b659f9b51048	6	4	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Tali Elektrik Panolarının kilitli olmaması	Elektrik altyapısına müdahale edilmesi, Sabotaj	Elektrik Çarpması, Kritik sistemlerin kapalı olması	Tali Pano odası ortamdaki tüm herkes için ulaşılabilir ve açık konumdadır. 	\N	6	6	15	540	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:28.399	2026-05-22 06:36:28.399	Gönüllü, Hemşire, Doktor	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma, Ölüm	\N	\N	\N	\N	\N
2850eae6-0aab-4b5f-b5a7-e39572d7fb38	6	5	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Tahliye Planları bulunmuyor	Acil durum anında alanın tahliye edilememesi	Alan Boşaltılmaması	Mevcut durumda İtfaiye Raporu için hazırlanmış mimari planlar alana asılmıştır.	\N	6	2	40	480	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:28.402	2026-05-22 06:36:28.402	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma, Ölüm	\N	\N	\N	\N	\N
565ee497-fba1-4f07-a4a5-5728e81e342f	6	1	Tıbbi Hizmetler	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Gönüllü tedavi ve klinik araştırma sırasında kesici delici alet kullanımı	Kesici Delici Alet Yaralanması	Enfeksiyon, Bulaşıcı Hastalık	HEM-T06 İlaçların Hazırlanması ve Uygulanması Talimatı	\N	10	6	15	900	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.775	2026-05-22 06:36:48.775	Hemşire, Doktor	\N	\N	2026-04-13 00:00:00	\N	\N	Bulaşıcı Hastalık	\N	\N	\N	\N	\N
5a325eac-a091-4beb-88c2-9ec2bc41657a	6	2	Tıbbi Hizmetler	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Gönüllü kabul sürecinin planlanması	Klinik Araştırma olası tehlike ve risklerinin detaylı şekilde belirtilmemiş olması	Riskleri Bilmeme	Kalite prosedür ve talimatlarında ilgili süreçler kalite sistemi içine eklenmemiştir.	\N	10	1	7	70	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.779	2026-05-22 06:36:48.779	Gönüllü	\N	\N	2026-04-13 00:00:00	\N	\N	Ölüm	\N	\N	\N	\N	\N
24b092d0-7b70-4115-8512-2ba1d81b1959	6	3	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Klinik Merkezi Giriş Kapısı	Kapı geçişinde sedye ve yatak geçişine uygun değildir.	Gönüllü Transferinde kapı geçişinde kapının kırılması ve kapı camın dağılması	Otomatik ve kilitli konumda kayar kapı yerleştirilken yata ve sedye geçişi için 120 cm olup olmadığı kontrol edilmemiştir.	\N	3	3	7	63	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.781	2026-05-22 06:36:48.781	Gönüllü, Hemşire, Doktor	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma	\N	\N	\N	\N	\N
d9a94237-942c-4aea-8357-fbb34fec2988	6	4	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Tali Elektrik Panolarının kilitli olmaması	Elektrik altyapısına müdahale edilmesi, Sabotaj	Elektrik Çarpması, Kritik sistemlerin kapalı olması	Tali Pano odası ortamdaki tüm herkes için ulaşılabilir ve açık konumdadır. 	\N	6	6	15	540	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.783	2026-05-22 06:36:48.783	Gönüllü, Hemşire, Doktor	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma, Ölüm	\N	\N	\N	\N	\N
a45d6295-3943-45e2-a603-278ae59449a7	6	5	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Tahliye Planları bulunmuyor	Acil durum anında alanın tahliye edilememesi	Alan Boşaltılmaması	Mevcut durumda İtfaiye Raporu için hazırlanmış mimari planlar alana asılmıştır.	\N	6	2	40	480	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.785	2026-05-22 06:36:48.785	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma, Ölüm	\N	\N	\N	\N	\N
0792be54-222c-4605-a220-9ebca45208c6	6	6	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Yangın söndürme ekipmanı	Yangına müdahale eksikliği	Yangın	Yaklaşık 200 m2 alan içerisinde bir adet 6kg ABC tipi yangın söndürme cihazı bulunmaktadır.	\N	1	1	40	40	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.787	2026-05-22 06:36:48.787	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma, Ölüm	\N	\N	\N	\N	\N
2b68644e-829e-44d6-9943-44bd9d295ef6	6	7	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Yangın söndürme ekipmanlarının aylık bakımları	Yangına müdahale eksikliği	Yangın	Aylık bakım kartları tespit edilmemiştir.	\N	3	2	15	90	Önemli Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.789	2026-05-22 06:36:48.789	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma	\N	\N	\N	\N	\N
c31842a6-d120-43bb-9059-65b705d79147	6	8	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Yangın söndürme ekipmanlarının periyodik bakımları	Yangına müdahale eksikliği	Yangın	Yıllık periyodik bakım ve kontrolleri süresi henüz gelmemiştır. Fakat bir Periyodik kontrol planı tespit edilememiştir.	\N	3	2	15	90	Önemli Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.791	2026-05-22 06:36:48.791	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	2026-04-13 00:00:00	\N	\N	Yaralanma	\N	\N	\N	\N	\N
b487f9d9-deee-4569-9537-82a3cd818df0	6	9	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.792	2026-05-22 06:36:48.792	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2c9c9c0c-a465-4cb1-a21a-05a1ba8c5539	6	10	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.794	2026-05-22 06:36:48.794	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
19315d19-67b5-4215-bc54-7bf96c8937c8	6	11	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.795	2026-05-22 06:36:48.795	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
169a67f9-728d-41e6-ac28-d7ef239dcac3	6	12	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.797	2026-05-22 06:36:48.797	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6267bb2b-38c9-442c-9ff3-7eaefc72e768	6	13	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.799	2026-05-22 06:36:48.799	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
07f4fa1a-ea97-4ce7-923d-7aec79153d1a	6	14	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.8	2026-05-22 06:36:48.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
aca87a25-d663-4896-8f5d-9cbe5f95de83	6	15	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.801	2026-05-22 06:36:48.801	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
eaff08dd-881d-4fcf-bb2c-19201978d33f	6	16	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.803	2026-05-22 06:36:48.803	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
57250dbf-515e-4d92-ace4-203234c3d816	6	17	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.804	2026-05-22 06:36:48.804	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b69bfa57-a269-4750-94d4-43aabeaf9a60	6	18	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.805	2026-05-22 06:36:48.805	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b6784ca5-f84d-4848-8cf8-a207b3c21127	6	19	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.807	2026-05-22 06:36:48.807	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d94c6fa1-e653-4c11-8449-e775b91cbd5b	6	20	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.808	2026-05-22 06:36:48.808	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
aba0b926-fdc6-48f3-9a3d-b4a8c33ba734	6	21	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.809	2026-05-22 06:36:48.809	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
375bf7c8-b54a-416f-9e39-d71a41205d49	6	22	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.81	2026-05-22 06:36:48.81	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3cf3bdd0-a02c-4ecd-bc77-06c950ed69c8	6	23	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.812	2026-05-22 06:36:48.812	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0e96ac4a-aa06-4dec-8670-c97a35789af0	6	24	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.813	2026-05-22 06:36:48.813	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
175395dc-04d9-4488-b13b-c192489b513a	6	25	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.815	2026-05-22 06:36:48.815	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0f707c15-61c6-4e76-bad3-8cdb35c30b86	6	26	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.816	2026-05-22 06:36:48.816	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7a9def47-b87e-490a-9174-f2d726cfd2a3	6	27	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.817	2026-05-22 06:36:48.817	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1c676854-69ce-4708-978a-8f7ba5969d4d	6	28	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.819	2026-05-22 06:36:48.819	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8a7a2ed9-6baa-4d20-932b-040bd4f8ae37	6	29	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.82	2026-05-22 06:36:48.82	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e3bb6262-ee03-4dda-921d-a7ad69b06997	6	30	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.821	2026-05-22 06:36:48.821	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b9a9fdba-5645-42b0-b8dc-e21b9e926dbc	6	31	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.823	2026-05-22 06:36:48.823	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1f1af2b4-9651-4487-8492-0963fb0b100d	6	32	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.824	2026-05-22 06:36:48.824	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
40c6eb12-8503-4252-aeff-960090b1ba65	6	33	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.825	2026-05-22 06:36:48.825	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
30b6bd00-ba3a-4769-ad61-1c7eab416077	6	34	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.827	2026-05-22 06:36:48.827	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e5fb3c49-2e58-48d7-950b-701b7b354900	6	35	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.828	2026-05-22 06:36:48.828	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ffe1a0ee-0c16-44a8-b236-87c42b096f4d	6	36	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.829	2026-05-22 06:36:48.829	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
06eaeb19-af48-44d3-a224-2ae72ee47012	6	37	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.83	2026-05-22 06:36:48.83	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
443382ef-6356-48e4-a175-ed31bc81e1bc	6	38	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.832	2026-05-22 06:36:48.832	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e724d6fd-b04b-4c26-9607-03746d3787d8	6	39	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.833	2026-05-22 06:36:48.833	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bb8be763-76db-40a1-977e-37ecd312448b	6	40	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.834	2026-05-22 06:36:48.834	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
77f133ae-3c55-40c2-8225-40fa7c54e27e	6	41	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.835	2026-05-22 06:36:48.835	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
529d2b74-a358-4fcf-9c78-1f0cc83fd4c1	6	42	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.837	2026-05-22 06:36:48.837	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
64b5cc7b-ed0c-4870-9d17-50b2df7de8a0	6	43	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.838	2026-05-22 06:36:48.838	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7f817a69-f9d0-4529-98da-eab5e35f7dcc	6	44	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.839	2026-05-22 06:36:48.839	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
89e18c1e-d99a-4e38-811e-09731956271e	6	45	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.84	2026-05-22 06:36:48.84	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a2e0d9bf-5855-406b-83d2-124413b84e39	6	46	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.842	2026-05-22 06:36:48.842	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0c6975c7-96e2-4819-9d7a-c42aac0d6e55	6	47	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.843	2026-05-22 06:36:48.843	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
89dbb3f2-1d1b-4cd0-a13e-505223fd7105	6	48	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.844	2026-05-22 06:36:48.844	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f84535ed-49d2-4f12-9c52-5c90a48064a8	6	49	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.845	2026-05-22 06:36:48.845	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7ba1898e-cd94-4131-8c10-bdf9b71b7b52	6	50	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.846	2026-05-22 06:36:48.846	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9924f27f-4ede-469c-bccb-4ffcb5953d73	6	51	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.848	2026-05-22 06:36:48.848	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cc06ad06-e635-4eaa-8552-10f6330cb375	6	52	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.849	2026-05-22 06:36:48.849	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
48617ad8-64aa-428e-a3ad-c86fb86d3d3b	6	53	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.85	2026-05-22 06:36:48.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b2b94f8f-bc08-4590-a14b-2b33a3725021	6	54	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.851	2026-05-22 06:36:48.851	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1baad3fc-a167-42ee-9af1-4d20ff6a8693	6	55	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.852	2026-05-22 06:36:48.852	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7fa1ad3e-f89a-4223-a7fe-7d48d33863e7	6	56	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.854	2026-05-22 06:36:48.854	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
54c5fb34-8d2d-45f7-837e-c9ae7bd63ffd	6	57	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.855	2026-05-22 06:36:48.855	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b0c93e2c-0126-4d88-993f-d950d14d85f6	6	58	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.856	2026-05-22 06:36:48.856	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bf5ea7fb-6791-416f-84fa-f2e6f6ba106f	6	59	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.857	2026-05-22 06:36:48.857	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bbb8bade-259e-4d9c-9b06-90e1d2e6750b	6	60	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.858	2026-05-22 06:36:48.858	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0bcde6ee-bbf3-4440-80b1-7a0216896d03	6	61	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.86	2026-05-22 06:36:48.86	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
34ec36a6-7207-4d85-a58f-81020ae2ac2d	6	62	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.861	2026-05-22 06:36:48.861	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d30c23db-35a7-410d-9009-35626921c31b	6	63	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.862	2026-05-22 06:36:48.862	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a4329522-ab02-47c0-ad19-ed0ffdf931e6	6	64	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.863	2026-05-22 06:36:48.863	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
94b30973-01a3-4a16-8f55-1409e3413aa9	6	65	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.865	2026-05-22 06:36:48.865	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2ee8ed9f-1ba5-420c-9601-9640507344de	6	66	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.866	2026-05-22 06:36:48.866	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
09c70baf-7d52-40af-b80d-74ec382f6968	6	67	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.867	2026-05-22 06:36:48.867	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e1774b28-723f-4a48-8785-70dd18ed5a94	6	68	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.869	2026-05-22 06:36:48.869	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d7145520-83fd-4fc8-aaed-2cd5642ee931	6	69	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.87	2026-05-22 06:36:48.87	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
526e006c-48f4-44ec-bd96-5ae3f32639dd	6	70	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.871	2026-05-22 06:36:48.871	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
749b817a-a311-42f7-bfc6-7237cf46199c	6	71	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.872	2026-05-22 06:36:48.872	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
57b31e04-6d05-4852-a7eb-0055401e7db4	6	72	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.874	2026-05-22 06:36:48.874	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a72f1f38-82bf-4fa4-bda2-02d122ca9766	6	73	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.875	2026-05-22 06:36:48.875	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e7622ae2-460a-42c0-8558-ad84263b789d	6	74	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.876	2026-05-22 06:36:48.876	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
da1f75ce-29de-490f-9a91-1e5ce8cc330a	6	75	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.877	2026-05-22 06:36:48.877	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c010d676-460c-4e17-aa61-8503c1e521b2	6	76	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.879	2026-05-22 06:36:48.879	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
514a3bc2-fca0-45d5-80a5-d850789887cb	6	77	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.88	2026-05-22 06:36:48.88	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d9dddbb2-a40d-45f5-ac3c-58efd657d3e1	6	78	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.881	2026-05-22 06:36:48.881	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8c4b4e6c-c04f-4f5c-9026-7c0c3cbaefa7	6	79	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.882	2026-05-22 06:36:48.882	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2c998dde-d3e1-461e-a1f8-a0b93bf2d8ba	6	80	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.883	2026-05-22 06:36:48.883	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3354d2bf-f3fd-4a3c-9f26-ec3862f423d0	6	81	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.885	2026-05-22 06:36:48.885	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e782559e-d6d2-478d-a4d2-11c6fadaa5c0	6	82	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.886	2026-05-22 06:36:48.886	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c3d59556-44b9-4ccc-b0bb-5658386379f9	6	83	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.887	2026-05-22 06:36:48.887	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
81fb944b-29c5-478a-9014-009f13467868	6	84	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.888	2026-05-22 06:36:48.888	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6f959355-af82-4564-864d-77647de5c266	6	85	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.89	2026-05-22 06:36:48.89	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0a2bbf26-89b7-4065-b234-847aa983172a	6	86	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.891	2026-05-22 06:36:48.891	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
effe433c-c410-441e-a527-65dbb5fe09c9	6	87	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.893	2026-05-22 06:36:48.893	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
83175095-e5d3-429e-a0ea-bf7a8b7ce3d9	6	88	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.894	2026-05-22 06:36:48.894	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8cab8d58-7ee7-44ca-8817-9bba5f05ed74	6	89	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.895	2026-05-22 06:36:48.895	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
34d2a4eb-1493-43e3-b723-0786ad915302	6	90	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.897	2026-05-22 06:36:48.897	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3f8fde68-e1a3-4da4-b195-2bfbff8efdf6	6	91	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.898	2026-05-22 06:36:48.898	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
da025a83-6fc1-466c-b649-87d422b5b558	6	92	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.899	2026-05-22 06:36:48.899	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
daf90704-4bbd-4b03-8138-2b25d209c95c	6	93	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.9	2026-05-22 06:36:48.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
28ee27f4-f745-4dff-b12e-c073dfe9c4b6	6	1	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.902	2026-05-22 06:36:48.902	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f3945b33-09bd-423c-9f1b-0384deb1cb6c	6	1	Genel	\N	İş Güvenliği Uzmanları	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.903	2026-05-22 06:36:48.903	\N	\N	\N	\N	\N	\N	İşyeri Hekimi	\N	\N	\N	\N	\N
292e40ff-2a0c-4bfa-be50-984bd9598844	6	1	Genel	\N	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney				\N	\N	1	\N	1	0	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	test_runner	2026-05-22 06:36:48.904	2026-05-22 06:36:48.904	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b510958c-9bf9-463a-9484-20f22a308202	7	2	Tıbbi Hizmetler	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Gönüllü kabul sürecinin planlanması	Klinik Araştırma olası tehlike ve risklerinin detaylı şekilde belirtilmemiş olması	Riskleri Bilmeme	Kalite prosedür ve talimatlarında ilgili süreçler kalite sistemi içine eklenmemiştir.	\N	10	1	7	70	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.072	2026-05-22 06:38:33.072	Gönüllü	\N	\N	1970-01-01 00:00:46.125	\N	\N	Ölüm	\N	\N	\N	\N	\N
a86bb4cd-ce91-46b5-a6a9-2d601bf8b18e	7	3	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Klinik Merkezi Giriş Kapısı	Kapı geçişinde sedye ve yatak geçişine uygun değildir.	Gönüllü Transferinde kapı geçişinde kapının kırılması ve kapı camın dağılması	Otomatik ve kilitli konumda kayar kapı yerleştirilken yata ve sedye geçişi için 120 cm olup olmadığı kontrol edilmemiştir.	\N	3	3	7	63	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.073	2026-05-22 06:38:33.073	Gönüllü, Hemşire, Doktor	\N	\N	1970-01-01 00:00:46.125	\N	\N	Yaralanma	\N	\N	\N	\N	\N
75c358ed-0790-42f4-a22e-2e375f29f09f	7	4	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Tali Elektrik Panolarının kilitli olmaması	Elektrik altyapısına müdahale edilmesi, Sabotaj	Elektrik Çarpması, Kritik sistemlerin kapalı olması	Tali Pano odası ortamdaki tüm herkes için ulaşılabilir ve açık konumdadır. 	\N	6	6	15	540	Tolere Gösterilmez Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.075	2026-05-22 06:38:33.075	Gönüllü, Hemşire, Doktor	\N	\N	1970-01-01 00:00:46.125	\N	\N	Yaralanma, Ölüm	\N	\N	\N	\N	\N
54d4f3b8-b2f2-4244-8a99-4ffd14a86137	7	6	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Yangın söndürme ekipmanı	Yangına müdahale eksikliği	Yangın	Yaklaşık 200 m2 alan içerisinde bir adet 6kg ABC tipi yangın söndürme cihazı bulunmaktadır.	\N	1	1	40	40	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.078	2026-05-22 06:38:33.078	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	1970-01-01 00:00:46.125	\N	\N	Yaralanma, Ölüm	\N	\N	\N	\N	\N
08ba098c-9bfb-4f01-a7c2-b01284bf2b48	7	7	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Yangın söndürme ekipmanlarının aylık bakımları	Yangına müdahale eksikliği	Yangın	Aylık bakım kartları tespit edilmemiştir.	\N	3	2	15	90	Önemli Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.08	2026-05-22 06:38:33.08	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	1970-01-01 00:00:46.125	\N	\N	Yaralanma	\N	\N	\N	\N	\N
aa61434e-a4ee-423d-96ed-3e3328388f22	7	8	Tesis Güvenliği	\N	FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Yangın söndürme ekipmanlarının periyodik bakımları	Yangına müdahale eksikliği	Yangın	Yıllık periyodik bakım ve kontrolleri süresi henüz gelmemiştır. Fakat bir Periyodik kontrol planı tespit edilememiştir.	\N	3	2	15	90	Önemli Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.081	2026-05-22 06:38:33.081	Gönüllü, Hemşire, Doktor, Çalışanlar	\N	\N	1970-01-01 00:00:46.125	\N	\N	Yaralanma	\N	\N	\N	\N	\N
6fe81944-1d43-4b5e-a645-264b28232f82	7	5	Tesis Güvenliği		FAZ-1 Klinik Araştırma Merkezi	Fine Kinney	Tahliye Planları bulunmuyor	Acil durum anında alanın tahliye edilememesi	Alan Boşaltılmaması	Mevcut durumda İtfaiye Raporu için hazırlanmış mimari planlar alana asılmıştır.		6	2	40	480	Tolere Gösterilmez Risk	\N		\N	\N		\N	\N	\N	\N	\N	\N		ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.077	2026-05-22 07:26:24.193	Gönüllü, Hemşire, Doktor, Çalışanlar			2026-04-14 00:00:00	2026-12-31 00:00:00		Yaralanma, Ölüm	Başhekimlik		\N		\N
5d7a3221-9fe4-44a2-9190-ea98b5a22f81	10	48	Tesis Güvenliği	Emniyet	Radyoloji	Fine Kinney	Hastaların bekleme süresi, cihaz arızası vb. sorunlar çözümlenerek hasta memnuniyeti sağlanmalıdır.	Ajite hasta		Yıl içerisinde Beyaz kod yaşanmamıştır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.61	2026-06-08 13:35:42.61	Hasta, Hasta Yakını, Çalışanlar, Ziyaretçiler	\N	\N	2025-08-07 20:59:04	\N	\N	Yaralanma, buhran	\N	\N	\N	\N	\N
1e2b1784-e35f-48a9-96d1-fed5b585ea9f	7	1	Tıbbi Hizmetler	Hizmete erişim ile ilgili riskler	FAZ-1 Klinik Araştırmalar Merkezi	Fine Kinney	Gönüllü tedavi ve klinik araştırma sırasında kesici delici alet kullanımı	Kesici Delici Alet Yaralanması	Enfeksiyon, Bulaşıcı Hastalık	HEM-T06 İlaçların Hazırlanması ve Uygulanması Talimatı	/uploads/risks/1780639690247-78384490.png	10	6	15	900	Tolere Gösterilmez Risk	\N		\N	\N		\N	\N	6	6	3	108	Önemli Risk	ACIK_TEHLIKE	metin.salik	2026-05-22 06:38:33.07	2026-06-05 06:19:28.599	Hemşire, Doktor			2026-04-14 00:00:00	2026-12-31 00:00:00		Bulaşıcı Hastalık	Başhekimlik		2026-12-31 00:00:00	Başhekimlik	\N
c9f7d8e2-bc6c-4345-b4d9-c44ef01cbc83	10	129	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	MR	Fine Kinney	Her hasta kontrol sonrası cihaz alanına alınmaya devam edilmelidir.	Manyetik alanlara manyetik malzeme ile giriş	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	MR alanının girişinde kontrollü geçiş sistemi bulunmakta olup yalnızca tanımlı kişilerin girişi sağlanabilmektedir. Cihazın olduğu alana hasta alınmadan önce metal dedektör ile taraması yapılarak manyetik ekipmanlarla giriş engellenmektedir.\r\nAlan girişininde uyarı işaretlemeleri mevcuttur.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.616	2026-06-08 13:35:42.616	Hasta, Hasta Yakını, Çalışanlar, Ziyaretçiler	Tesis Güvenliği Komitesi	Herhangi bir kaza/ramak kala olay, olay bildirim yaşanmamıştır.	2025-08-07 20:59:04	\N	Diğer	Yaralanma	\N	\N	\N	\N	\N
faa3eef8-a47c-483d-a8c5-70c36ccc5101	10	3129	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi	Radyasyon Maruziyeti	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Duvarlar ve kapılar kurşun malzeme ile kaplıdır. Personellere kişisel koruyucu ekipan (kurşun önlük, boyun koruyucu vb.) temin edilmiştir. Personellere dozimetre kullanımı zorunlu hale getirilmiştir. 	\N	1	3	15	45	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.619	2026-06-08 13:35:42.619	Hastalar / Çalışanlar 	Radyasyon Güvenliği Komitesi	Doz ölçümleri kayıt altına alınmaktadır.	2025-08-07 20:59:04	\N	Gösterge Takibi	Kanser / Genetik Bozukluklar / Dokularda Hasar	\N	\N	\N	\N	\N
42cdfd9e-7562-4c44-b15e-152ed162cc49	10	3130	Tesis Güvenliği	Tıbbi Cihaz ve Malzeme Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi	Güçlü Manyetik Alan 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	MR odasına giren kişiselerin metal eşyalarını bırakmaları sağlanmaktadır. Hastalar Mr uyumlu olmayan implantlar hakkında bilgilendirilmektedir. MR Zone alan etiketlemesi yapılmıştır. 	\N	1	3	15	45	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.621	2026-06-08 13:35:42.621	Hastalar / Çalışanlar 	Radyasyon Güvenliği Komitesi	Yapılan alan denetimlerinde herhangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Ciddi yaralanmalar / Cihaz hasarı / Hasta güvenliği ihlali 	\N	\N	\N	\N	\N
f1ef2c8d-8e11-486f-976c-602d8c9d8d5c	10	3131	Tesis Güvenliği	Tıbbi Cihaz ve Malzeme Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi	Akustik Gürültü 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Hastalar için kulak tıkayıcı ve kulaklık gibi kişisel koruyucu ekipmanlar temin edilmiştir.	\N	1	3	15	45	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.623	2026-06-08 13:35:42.623	Çalışanlar	Radyasyon Güvenliği Komitesi	Yapılan alan denetimlerinde herhangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	İşitme kaybı	\N	\N	\N	\N	\N
a0fee9f6-a487-429c-b9b2-4658164d8e7a	10	3132	Tesis Güvenliği	Tıbbi Cihaz ve Malzeme Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi	Radyofrekans ısınması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Hastanın cildi ile mr cihaz bobinleri arasına yalıtkan malzeme yerleştirilmektedir.	\N	1	3	15	45	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.624	2026-06-08 13:35:42.624	Hastalar  	Radyasyon Güvenliği Komitesi	Yapılan alan denetimlerinde herhangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Cilt hasarı ,/ Hasta konforunun azalması 	\N	\N	\N	\N	\N
d14df67a-a7ce-4b8c-939f-7e915d164739	10	3133	İş Sağlığı ve Güvenliği	Güvenlik - Ergonomik Risk Etmenler	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi	Klostrofobi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Mr öncesinde hastaya prosedürün detaylı açıklanmaktadır.	\N	1	3	15	45	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.626	2026-06-08 13:35:42.626	Hastalar  	Radyasyon Güvenliği Komitesi	Yapılan alan denetimlerinde herhangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Görüntüleme başarısızlığı / Hasta stresinde artış	\N	\N	\N	\N	\N
da6650e9-7e1e-4bcf-bbca-a7dd263a6763	10	3134	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi	Duvar,kapı ve pencerelerin radyasyon koruyucu özellikte olmaması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Denetimli alanların duvar,kapı elemanları kurşun kaplama ve radyasyon geçirmez malzemelerden inşa edilmiştir. Alanlarda olası radyasyon kaçağı tespiti için alan doz ölçümleri yapılmaktadır.	\N	0.5	6	7	21	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.628	2026-06-08 13:35:42.628	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Radyasyon Güvenliği Komitesi	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Uzun vadede kanser hastalıkları / Alan güvenliği ihlali 	\N	\N	\N	\N	\N
270d0183-1de8-412c-8483-692aa29890fd	10	3135	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi	Çalışanda bilgi ve eğitim eksikliği 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Çalışanlara radyasyon güvenliği eğitimleri verilmiştir. Eğitimler sonunda çalışanların değerlendirilmesi ve çalışanın başarı oranına göre eğitimler yenilenmektedir. 	\N	0.5	1	7	3.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.629	2026-06-08 13:35:42.629	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Radyasyon Güvenliği Komitesi	Eğitim katılım formları kayıt altına alınmaktadır.	2025-08-07 20:59:04	\N	Sınav / Değerlendirme	Uzun vadede kanser hastalıkları / Alan güvenliği ihlali / Hasta güvenliği ihlali 	\N	\N	\N	\N	\N
efd3df6b-063e-4783-8148-c2d32c3aa5ba	10	3136	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi	Radyasyon maruziyetinin yetersiz izlenmesi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Denetimli alanlarda çalışan personeller için kişisel dozimetre kullanımının zorunlu hale getirilmiştir. Gözetimli alanlardaki radyasyon seviyeleri düzenli ölçülmekted ve kayıt altına alınmaktadır.	\N	1	1	7	7	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.631	2026-06-08 13:35:42.631	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Radyasyon Güvenliği Komitesi	Ölçüm donuçlarında herhangi bir olumsuz durum tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Çalışan sağlığının tehlikeye girmesi 	\N	\N	\N	\N	\N
90b57086-e236-4137-8551-5708f9b96a89	10	3137	Tesis Güvenliği	Tıbbi Cihaz ve Malzeme Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Hatalı kalibrasyon 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Doz kalibratörlerinin uygunluluğunun yapılan planlamalar doğrultusunda (yılda en az bir defa) test ve kontrollerinin yapılmaktadır. Kullanım sırasında çift kontrol prosedürleri uygulanmaktadır. 	\N	1	1	7	7	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.632	2026-06-08 13:35:42.632	Hasta / Hekim /  Tekniker / Temizlik Görevlisi / Tıbbi Atık Personeli	Biyomedikal Müdürlüğü	Kalibrasyonları yapılmıştır.	2025-08-07 20:59:04	\N	Gösterge Takibi	Uzun vadeli sağlık sorunları / Tedavi süreçlerinin başarısız olması 	\N	\N	\N	\N	\N
699c8bd2-6deb-4553-9e84-1a7ea7d32262	10	3138	Tesis Güvenliği	Tıbbi Cihaz ve Malzeme Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Dedektörlerin hatalı ölçüm yapması	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Planlama doğrultusunda üretici firma talimatları doğrultusunda kalibrasyonları yapılmaktadır.	\N	1	1	7	7	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.634	2026-06-08 13:35:42.634	Hasta / Hekim /  Tekniker / Temizlik Görevlisi / Tıbbi Atık Personeli	Biyomedikal Müdürlüğü	Kalibrasyonları yapılmıştır.	2025-08-07 20:59:04	\N	Gösterge Takibi	Çalışanların ve çevrenin gereksiz radyasyona maruz kalması 	\N	\N	\N	\N	\N
a753736d-6e2b-4ca3-803e-faef2958d025	10	3139	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Zemindeki deformasyonlar 	Zemindeki hasarlı pvc malzemeleri kaldırılmış olup yeni kaplama ile değiştirilmiştir. 	Zemindeki deformasyonlar üzerinden tespiti halinde tasviye yapılmaktır.	\N	1	1	3	3	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.635	2026-06-08 13:35:42.635	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar / Enfeksiyon 	\N	\N	\N	\N	\N
15acef27-df45-48fd-b9bc-24174ffb1669	10	3140	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Oda girişlerindeki ve içindeki kot farkları, zemin farklılıkları 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Zemindeki kot farklılıklarını kapatmak için dolgu yapılmaktadır ve/veya farkındalık oluşturması için farklı renklendirme yapılmaktadır.	\N	1	1	3	3	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.636	2026-06-08 13:35:42.636	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar  	\N	\N	\N	\N	\N
e86e8fb7-c46c-4ac9-9d05-6e5602c1d2f0	10	3141	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Zeminde temizlik sonrası kayganlık oluşması 	Personelin konu hakkında eğitiminin tamamlaması ve alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır.	 Çalışma esnasında ön ve arka tarafa iki taraflı alanda farkındalık olacak şekilde uyarı tabelalarının yerleştirilmektedir. 	\N	1	1	3	3	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.637	2026-06-08 13:35:42.637	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Otelcilik ve Destek Hizmetleri Müdürlüğü	 Yüzyüze yapılan soru-cevapla yapılan değerlendirmelerde uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Sınav / Değerlendirme	Yaralanmalar  	\N	\N	\N	\N	\N
73f0e832-85af-4580-8705-ff5d5b733176	10	3142	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Zemine, duvara sabitlenmemiş yüksek eşyalar ve/veya ağır eşyaların olması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Sabitlenmemiş dolap,raf,çerçeve vb. eşyaların tespit edilerek montajları yapılmıştır.	\N	1	3	3	9	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.639	2026-06-08 13:35:42.639	Hastalar /  Çalışanlar 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar	\N	\N	\N	\N	\N
cbc4354f-f818-4020-8151-ac67cdefd8b7	10	3143	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Sharp-box Tepsilerinin kırık olması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Kullanan kişiler tarafından tespit edilmesi halinde kullanımının bırakılmaktadır ve yenisi ile değiştirilmektedir.	\N	1	3	3	9	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.64	2026-06-08 13:35:42.64	 Çalışanlar	Satınalma Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar / Enfeksiyon 	\N	\N	\N	\N	\N
81f8786b-a614-4edb-9515-5da15e82138f	10	3144	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tıbbi cihaz park alanın bulunmaması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Kat içinde geçiş/kaçış yollarına engel olmayacak alanlarda  park alanı oluşturulmuştur.	\N	1	3	1	3	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.641	2026-06-08 13:35:42.641	 Çalışanlar	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar 	\N	\N	\N	\N	\N
1f30ca72-8447-4b32-9e08-14ad1796a648	10	3145	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Malzemelerin ağırlık  sırasına göre yerleştririlmemesi	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Dolap ve raflarda malzeme ve/veya ürünün ağırlıklarına göre istifleme yapılmakta ve kontrolü sağlanmaktadır.  Yanıcı malzeme mevcut ise kullanılan raf veya dolapta en alt kademeye konumlandırılmaktadır. 	\N	0.5	1	3	1.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.643	2026-06-08 13:35:42.643	 Çalışanlar	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar 	\N	\N	\N	\N	\N
cc590297-b655-4058-b4be-c7c204d2a4cd	10	3146	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Kişisek koruyucu ekipmaların hasarlı olması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Personellere Kişisel Koruyucu Donanım kullanımının zorunluluğu hakkında eğitim verilmektedir.  Hasarlı kişisel koruyucu ekipmanların kullanım dışı bırakılmakta olup yenisi ile değiştirmektedir.	\N	0.5	0.5	7	1.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.644	2026-06-08 13:35:42.644	Çalışanlar	İş Sağlığı ve Güvenliği	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Ramak kala olay / İş kazası 	\N	\N	\N	\N	\N
d6229712-794c-47b8-9bb6-35ee5306e142	10	3147	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Personel ve hastaların yeterli istifleme alanı bulunmaması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yeterli sayıda eşya ve ekipman dolabı bulunmaktadır. Dolap ve rafların amacının dışında kullanımı engellenmiştir.	\N	0.5	0.5	3	0.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.645	2026-06-08 13:35:42.645	 Çalışanlar	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar	\N	\N	\N	\N	\N
ed9bbce5-f16d-42cc-bfba-7c82b1bbab5c	10	3148	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi	Duvar,kapı ve pencerelerin radyasyon koruyucu özellikte olmaması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Denetimli alanların duvar,kapı elemanları kurşun kaplama ve radyasyon geçirmez malzemelerden inşa edilmiştir. Alanlarda olası radyasyon kaçağı tespiti için alan doz ölçümleri yapılmaktadır.	\N	0.5	6	7	21	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.646	2026-06-08 13:35:42.646	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Radyasyon Güvenliği Komitesi	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Uzun vadede kanser hastalıkları / Alan güvenliği ihlali 	\N	\N	\N	\N	\N
b5c07584-62c2-4ada-be3c-2d23095a9398	10	3149	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi	Çalışanda bilgi ve eğitim eksikliği 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Çalışanlara radyasyon güvenliği eğitimleri verilmiştir. Eğitimler sonunda çalışanların değerlendirilmesi ve çalışanın başarı oranına göre eğitimler yenilenmektedir. 	\N	0.5	1	7	3.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.647	2026-06-08 13:35:42.647	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Radyasyon Güvenliği Komitesi	Eğitim katılım formları kayıt altına alınmaktadır.	2025-08-07 20:59:04	\N	Sınav / Değerlendirme	Uzun vadede kanser hastalıkları / Alan güvenliği ihlali / Hasta güvenliği ihlali 	\N	\N	\N	\N	\N
d2aaf7a7-9b6c-4f20-90bc-92b7695536b7	10	3150	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi	Radyasyon maruziyetinin yetersiz izlenmesi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Denetimli alanlarda çalışan personeller için kişisel dozimetre kullanımının zorunlu hale getirilmiştir. Gözetimli alanlardaki radyasyon seviyeleri düzenli ölçülmekted ve kayıt altına alınmaktadır.	\N	1	1	7	7	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.649	2026-06-08 13:35:42.649	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Radyasyon Güvenliği Komitesi	Ölçüm donuçlarında herhangi bir olumsuz durum tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Çalışan sağlığının tehlikeye girmesi 	\N	\N	\N	\N	\N
12de1002-43d1-4e75-901b-604bd47b07bc	10	3151	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi 	Yüzeylerin Dezenfekte Edilmemesi 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Temizlik planı doğrultusunda alan temizlik ve dezenfeksiyonu yapılmakatdır.  Çalışanlara el hijyeni eğitimleri verilmekte ve alanlarda el antiseptikleri bulunmaktadır.  Çalışanların hijyenik el yıkama uyumlarının takip edilmekte olup çapraz bulaşmanın önlenmektedir.	\N	1	2	15	30	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.65	2026-06-08 13:35:42.65	Tekniker / Teknisyen / Porter / Temizlik Görevllisi / Tıbbi Atık Personeli 	Enfeksiyon Komitesi	Yapılan alan denetimelerinde herhangi bir uygunsuz durum tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Enfeksiyon  	\N	\N	\N	\N	\N
bc65e2d6-eb41-4230-abe4-9137b0dca8ac	10	3152	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi	El hijyeni talimatlarının alanda bulunmaması 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	El yıkama alanına denk gelecek şekilde el hijyeni talimatı asılmıştır. İşe giriş eğitimlerinde Enfeksiyon Sorumlusu tarafından program kapasamında eğitim verilmektedir.	\N	1	6	1	6	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.651	2026-06-08 13:35:42.651	  Tekniker / Teknisyen / Porter / Temizlik Görevllisi / Tıbbi Atık Personeli 	Enfeksiyon Komitesi	Yapılan alan denetimelerinde herhangi bir uygunsuz durum tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Enfeksiyon 	\N	\N	\N	\N	\N
e752d7b4-5f1a-4cf2-a3ba-655d6fa979a4	10	3153	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi 	Tekerlekli araçlarda durdurucu-fren bulunmaması 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Pansuman arabası, taşıma arabaları, sedye vb. araçların tekerleklerinde durdurucu bulunmakta ve düzenli aralıklarla görsel olarak kontrol edilmektedir.	\N	0.5	1	3	1.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.653	2026-06-08 13:35:42.653	 Hasta / Tekniker / Teknisyen / Porter / Temizlik Görevllisi / Tıbbi Atık Personeli 	Biyomedikal Müdürlüğü	Yapılan alan denetimelerinde herhangi bir uygunsuz durum tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yaralanma / Maddi hasar 	\N	\N	\N	\N	\N
b8fec2b4-f922-45df-917c-0915ac46392a	10	3154	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Lateks/Nitril Eldiven Kullanımı 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Alerji öyküleri olan personellere farklı KKD temin edilmektedir. 	\N	0.5	6	1	3	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.654	2026-06-08 13:35:42.654	Çalışanlar	Hasta Bakım Hizmetleri Müdürlüğü	Yapılan alan denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Cilt tahrişi /Cilt hastalıkları 	\N	\N	\N	\N	\N
5214a39b-6cca-4d96-b74b-4089ad45f3b9	10	3155	İş Sağlığı ve Güvenliği	Güvenlik - Fiziksel Risk Etmenleri	Radyoloji	Fine Kinney	Yeleklerin her taraftan kapalı, yük kapasitesine uygun taşıyıcısı bulunan raf tasarımı yapılmalıdır. 	Kurşun geçirmez yeleklerin askılıklarının dayanımlı olmaması 		Uygun yük kapasitesine sahip ve nemlenmeler için belli bir süre açık rafta bekletilmektedir.  Yeleklerin geçiş yolu üzerinde ve işlem bitimi odalarda bırakılmaması sağlanmaktadır.	\N	0.5	6	1	3	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.655	2026-06-08 13:35:42.655	Tekniker / Teknisyen / Porter / Temizlik Görevllisi / Tıbbi Atık Personeli 	\N	\N	2025-08-07 20:59:04	\N	\N	Yaralanmalar	\N	\N	\N	\N	\N
ed130ecb-4817-4b05-a90e-8037ea4b517e	10	3156	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Hastalarının izolasyonunun sağlanamaması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Enfeksiyon bulaş riski bulunan hastalar için diğer müdahale odalarından ayrı izolasyon odası oluşturulmuş ve işaretlenmiştir.	\N	0.5	0.5	3	0.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.656	2026-06-08 13:35:42.656	Hastalar /  Çalışanlar	Hasta Bakım Hizmetleri Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk veya geri bildirim tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Enfeksiyon / Kritik durumun kötüleşmesi 	\N	\N	\N	\N	\N
d1b87dea-3964-4f1a-b929-8a7e7601e90e	10	3157	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Panelin ve bağlantılı cihazların düzenli temizlenmemesi	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yatak başı panellerinin ve ekipmanlarının yapılan planlamalar doğrultusunda  kontrol, bakım ve dezenfeksiyonları yapılmaktadır. 	\N	1	0.5	7	3.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.657	2026-06-08 13:35:42.657	Hastalar /  Çalışanlar	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk veya geri bildirim tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Enfeksiyon 	\N	\N	\N	\N	\N
e4c27c11-1617-4dec-a827-9c7af97cecc0	10	3158	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tespiti yapılamayan izolasyon gerektiren hastalar 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Personellere sürekli kullanmaları için kişisel koruyucu ekipmanlar temin edilmiştir. Personellere düzenli aralıklarla enfeksiyon kontrol eğitimi verilmektedir. Personellerin bağışıklık durumları işe giriş tetkiklerinde ve yılda en az bir defa olmak üzere izlenmektedir.	\N	0.5	0.5	3	0.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.658	2026-06-08 13:35:42.658	Hastalar /  Çalışanlar	Enfeksiyon Kontrol Komitesi 	Analiz sonuçlarında herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Enfeksiyon 	\N	\N	\N	\N	\N
d705d7bf-c0e6-4c91-adde-1c7df041e134	10	3159	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Kesici-delici aletlerle temas edilmesi	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	İş başlangıç eğitimlerinde ve düzenli aralıklarda personellere bilgilendirme yapılmaktadır. Personellere kişisel koruyucu ekipman temin edilmiştir ve kullanımı zorunlu tutulmuştur. Aylık olarak gerçekleşen ilgili iş kazalarının analizi yapılmakta olup nedenlerine göre anlık aksiyon alınmaktadır.	\N	1	1	7	7	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.659	2026-06-08 13:35:42.659	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Analiz sonuçlarında herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Yaralanmalar / Enfeksiyon / İş kazası 	\N	\N	\N	\N	\N
b1d207f9-8eba-43dd-bbdf-5dc2ca290743	10	3160	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Kesici-delici aletlerle temas edilmesi	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	İş başlangıç eğitimlerinde ve düzenli aralıklarda personellere bilgilendirme yapılmaktadır. Personellere kişisel koruyucu ekipman temin edilmiştir ve kullanımı zorunlu tutulmuştur. Aylık olarak gerçekleşen ilgili iş kazalarının analizi yapılmakta olup nedenlerine göre anlık aksiyon alınmaktadır.	\N	1	1	7	7	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.66	2026-06-08 13:35:42.66	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Analiz sonuçlarında herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Gösterge Takibi	Yaralanmalar / Enfeksiyon / İş kazası 	\N	\N	\N	\N	\N
182a2f46-6dd2-420d-9343-b15bb2db66d5	10	3161	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Sharp-boxların doluluğunun gereğinden fazla olmas/değişiminin yapılmaması	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Sharp-boxların 3/4 doluluk oranına ulaştığında anında değitirilmesi husunda işe giriş eğitimlerinde ve düzenli aralıklarla personellere bilgilendirme yapılmaktadır. 	\N	1	1	7	7	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.662	2026-06-08 13:35:42.662	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Analiz sonuçlarında herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Gösterge Takibi	Yaralanmalar / İğne batması / Enfeksiyon 	\N	\N	\N	\N	\N
77c46f74-413b-4aee-9bad-aa54730013a2	10	3162	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Personellere bilgilendirme eğitimi verilmesi 	Kesici-delici alet yaralanmaları 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Atık kutularının bibirinden ayrıştırılması ve doluluk oranlarının belirlenmesiyle atık toplama süreci oluşturulması 	\N	1	1	7	7	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.663	2026-06-08 13:35:42.663	Hasta / Hekim / Hemşire / Hasta Bakım Personeli / ATT / Paramedik 	Enfeksiyon Kontrol Komitesi 	Analiz sonuçlarında herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Gösterge Takibi	Yaralanma /İğne batması / Enfeksiyon 	\N	\N	\N	\N	\N
019052d6-bc10-486c-aa8d-5aa26c7479d0	10	3163	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tedavi tepsilerinde iğne unutulması 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Tedavi tepsileri için katlara temin edilen sharp-boxların kullanılmaktır.	\N	1	3	7	21	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.664	2026-06-08 13:35:42.664	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Analiz sonuçlarında herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Gösterge Takibi	Yaralanma / İğne batması / Enfeksiyon 	\N	\N	\N	\N	\N
6dffd6e3-3c2d-4b2d-9362-16258852a877	10	3164	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Enfeksiyon etkenleri Grup 3 biyolojik etkenler (tüberküloz vb. )	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Personellere kişisel koruyucu donanım (eldiven,gözlük,maske, koruyucu giysi) temin edilmektedir. Hastanın müracatı halinde izolasyon protokolleri başaltılmaktadır. Koruyucu donanımların kullanım zorunluluğu ve el hijyeni eğitimleri işe giriş oryantasyon katılımlarında verilmektedir.	\N	1	1	15	15	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.665	2026-06-08 13:35:42.665	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Analiz sonuçlarında herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Enfeksiyon	\N	\N	\N	\N	\N
f6c44374-7f5d-47f2-a8f5-dd5c18599c2f	10	3165	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Enfeksiyon etkenleri Grup 3 biyolojik etkenler (hepatit b vb. )	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Personellere kişisel koruyucu donanım (eldiven,gözlük,maske, koruyucu giysi) temin edilmektedir. Hastanın müracatı halinde izolasyon protokolleri başaltılmaktadır. Koruyucu donanımların kullanım zorunluluğu ve el hijyeni eğitimleri işe giriş oryantasyon katılımlarında verilmektedir.	\N	1	1	15	15	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.666	2026-06-08 13:35:42.666	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Analiz sonuçlarında herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Enfeksiyon	\N	\N	\N	\N	\N
92a2bb8f-5dc4-487f-ac26-c1e893f76a90	10	3166	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Enfeksiyon etkenleri Grup 3 biyolojik etkenler        (Hepatit B-Hepatit C vb. )	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Personellere kişisel koruyucu donanım (eldiven,gözlük,maske, koruyucu giysi) temin edilmektedir. Hastanın müracatı halinde izolasyon protokolleri başaltılmaktadır. Koruyucu donanımların kullanım zorunluluğu ve el hijyeni eğitimleri işe giriş oryantasyon katılımlarında verilmektedir.	\N	0.5	1	15	7.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.667	2026-06-08 13:35:42.667	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Analiz sonuçlarında herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Enfeksiyon	\N	\N	\N	\N	\N
5121a977-9618-41c0-b384-42b76cc89041	10	3167	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Enfeksiyon etkenleri Grup 3 biyolojik etkenler               (Hepatit B-Hepatit C vb.)	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Personellere kişisel koruyucu donanım (eldiven,gözlük,maske, koruyucu giysi) temin edilmektedir. Hastanın müracatı halinde izolasyon protokolleri başaltılmaktadır. Koruyucu donanımların kullanım zorunluluğu ve el hijyeni eğitimleri işe giriş oryantasyon katılımlarında verilmektedir.	\N	0.5	1	15	7.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.668	2026-06-08 13:35:42.668	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Analiz sonuçlarında herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Enfeksiyon	\N	\N	\N	\N	\N
81cf158b-1405-4b0d-a356-95a528588b38	10	3168	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Enfeksiyon etkenleri Grup 4 biyolojik etkenler           (Kırım Kongo Kanamalı Ateş, Ebola vb. )	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Personellere kişisel koruyucu donanım (eldiven,gözlük,maske, koruyucu giysi) temin edilmektedir. Hastanın müracatı halinde izolasyon protokolleri başaltılmaktadır. Koruyucu donanımların kullanım zorunluluğu ve el hijyeni eğitimleri işe giriş oryantasyon katılımlarında verilmektedir.	\N	0.5	0.5	15	3.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.669	2026-06-08 13:35:42.669	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Analiz sonuçlarında herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Enfeksiyon	\N	\N	\N	\N	\N
c7e39c31-ef29-4c71-ad5b-38cbf4e8582e	10	3169	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Enfeksiyon etkenleri Grup 4 biyolojik etkenler           (Kırım Kongo Kanamalı Ateş, Ebola vb. )	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Personellere kişisel koruyucu donanım (eldiven,gözlük,maske, koruyucu giysi) temin edilmektedir. Hastanın müracatı halinde izolasyon protokolleri başaltılmaktadır. Koruyucu donanımların kullanım zorunluluğu ve el hijyeni eğitimleri işe giriş oryantasyon katılımlarında verilmektedir.	\N	0.5	0.5	15	3.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.67	2026-06-08 13:35:42.67	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Analiz sonuçlarında herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Enfeksiyon	\N	\N	\N	\N	\N
84b448a7-ab98-42c4-bac7-404d8dc0d699	10	3170	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Enfeksiyon etkenleri Grup 4 biyolojik etkenler           (Kırım Kongo Kanamalı Ateş, Ebola vb. )	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Personellere kişisel koruyucu donanım (eldiven,gözlük,maske, koruyucu giysi) temin edilmektedir. Hastanın müracatı halinde izolasyon protokolleri başaltılmaktadır. Koruyucu donanımların kullanım zorunluluğu ve el hijyeni eğitimleri işe giriş oryantasyon katılımlarında verilmektedir.	\N	0.5	0.5	15	3.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.671	2026-06-08 13:35:42.671	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Analiz sonuçlarında herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Enfeksiyon	\N	\N	\N	\N	\N
2f7734b5-39df-4306-bce6-f104a3d1dd74	10	3171	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Aktif Akciğer TF Hasta 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Personellere kişisel koruyucu donanım (eldiven,gözlük,maske, koruyucu giysi) temin edilmektedir. Hastanın müracatı halinde izolasyon protokolleri başaltılmaktadır. Koruyucu donanımların kullanım zorunluluğu ve el hijyeni eğitimleri işe giriş oryantasyon katılımlarında verilmektedir.	\N	1	0.5	40	20	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.673	2026-06-08 13:35:42.673	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Herhangi bir yayılım tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Bulaışıcı Hastalık	\N	\N	\N	\N	\N
a9c3c3d4-64e5-4378-a079-fed12d742fdb	10	3172	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Kızamık-Kızamıkcık / Kabakulak Hasta 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Personellere kişisel koruyucu donanım (eldiven,gözlük,maske, koruyucu giysi) temin edilmektedir. Hastanın müracatı halinde izolasyon protokolleri başaltılmaktadır. Koruyucu donanımların kullanım zorunluluğu ve el hijyeni eğitimleri işe giriş oryantasyon katılımlarında verilmektedir.	\N	1	0.5	15	7.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.674	2026-06-08 13:35:42.674	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Herhangi bir yayılım tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Bulaışıcı Hastalık	\N	\N	\N	\N	\N
853cba89-c9ec-4fee-9e19-1eadb10b7c11	10	3173	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	İnfuluenza Hasta 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Personellere kişisel koruyucu donanım (eldiven,gözlük,maske, koruyucu giysi) temin edilmektedir. Hastanın müracatı halinde izolasyon protokolleri başaltılmaktadır. Koruyucu donanımların kullanım zorunluluğu ve el hijyeni eğitimleri işe giriş oryantasyon katılımlarında verilmektedir.	\N	1	0.5	15	7.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.675	2026-06-08 13:35:42.675	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Herhangi bir yayılım tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Bulaışıcı Hastalık	\N	\N	\N	\N	\N
457df04c-bb86-4d97-9365-406098742ee7	10	3174	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Covid-19 (Yeni varyant) Hasta	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Personellere kişisel koruyucu donanım (eldiven,gözlük,maske, koruyucu giysi) temin edilmektedir. Hastanın müracatı halinde izolasyon protokolleri başaltılmaktadır. Koruyucu donanımların kullanım zorunluluğu ve el hijyeni eğitimleri işe giriş oryantasyon katılımlarında verilmektedir.	\N	1	0.5	15	7.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.676	2026-06-08 13:35:42.676	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Herhangi bir yayılım tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Bulaışıcı Hastalık	\N	\N	\N	\N	\N
972ecd78-b2b0-43d1-af89-5c3f3e3dc55a	10	3175	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Maymun Çiçeği	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Personellere kişisel koruyucu donanım (eldiven,gözlük,maske, koruyucu giysi) temin edilmektedir. Hastanın müracatı halinde izolasyon protokolleri başaltılmaktadır. Koruyucu donanımların kullanım zorunluluğu ve el hijyeni eğitimleri işe giriş oryantasyon katılımlarında verilmektedir.	\N	1	0.5	15	7.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.677	2026-06-08 13:35:42.677	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Enfeksiyon Kontrol Komitesi 	Herhangi bir yayılım tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Bulaışıcı Hastalık	\N	\N	\N	\N	\N
4bbfb197-38c8-45ff-bc43-c13ccd4741b2	10	3176	İş Sağlığı ve Güvenliği	Güvenlik - Biyolojik Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Kemirgen,böcek,haşere vb. bulunması 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Düzenli (ayda en az br defa) kontrol uygulamalarının (ilaçlama vb.) yapılmaktadır. Yiyecek ve içeceklerin alanda yasaklanmıştır. Çalışma alanlarının temizliğigünlük olarak vardiya değişim aralarında yapılmaktadır.	\N	0.5	0.5	1	0.25	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.679	2026-06-08 13:35:42.679	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Otelcilik ve Destek Hizmetleri Müdürlüğü	Yapılan alan denetimlerinde herangi bir uygunsuzluk  tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Enfeksiyon / İşlemlerin aksaması / İmaj zedelenmesi 	\N	\N	\N	\N	\N
27815a4d-a190-405a-b0c9-e2c6760b8901	10	3177	İş Sağlığı ve Güvenliği	Güvenlik - Ergonomik Risk Etmenler	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi	Kurşun geçermez yelek kullanımı 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Çalışma planı ve hasta kabul süreci çalışma süreleri ile hesaplanarak sürdürülmektedir. Ergonomik unsurlara uygun kurşun geçirmez yelek temin edilmeiştir.	\N	0.5	3	3	4.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.68	2026-06-08 13:35:42.68	Tekniker / Teknisyen / Porter	Biyomedikal Müdürlüğü	Yapılan alan denetimlerinde herangi bir uygunsuzluk  tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yorgunluk / El-kol koordinasyonsuzluğu / 	\N	\N	\N	\N	\N
a0e8455a-e19e-4dc1-a231-ec3a4e33e3e0	10	3178	İş Sağlığı ve Güvenliği	Güvenlik - Ergonomik Risk Etmenler	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	 Taşıma esnasında ağır yük kaldırma	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Hasta taşıma esnasında roll-bourd( minder) kullanılmaktadır.  Ağır yük kaldırma-taşıma kurallarına riayet edilmektedir.	\N	0.2	3	3	1.8	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.681	2026-06-08 13:35:42.681	Hastalar / Çalışanlar 	Hasta Bakım Hizmetleri Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Kas-iskelet sistemi rahatsızlıkları/ Yaralanma 	\N	\N	\N	\N	\N
7db33b31-825d-4347-8908-a5a80d2e56df	10	3179	İş Sağlığı ve Güvenliği	Güvenlik - Ergonomik Risk Etmenler	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi	Sandelyelerin ergonomik koşullara uygun olmaması 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Uygun ve sayıca yeterli snadalye temin edilmesi, oturarak çalışmalar konusunda personellerin bilgilendirlmesi 	\N	0.5	0.5	1	0.25	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.682	2026-06-08 13:35:42.682	  Tekniker / Teknisyen / Porter / Temizlik Görevllisi / Tıbbi Atık Personeli 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Kronik ağrılar / Yaralanmalar	\N	\N	\N	\N	\N
ba212e94-ba19-408f-9250-10265bf36a9c	10	3181	İş Sağlığı ve Güvenliği	Güvenlik - Ergonomik Risk Etmenler	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Ekranlı araç kullanımı	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	 Ekranlı araç kullanımına dair alınması gereken önlemlerin eğitimlerde bahsedilmektedir. Monitörler personel uygunluğuna göre mesafe ve hizada ayarlanmaktadır.	\N	0.5	3	7	10.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.683	2026-06-08 13:35:42.683	Çalışanlar	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Göz hastalıkları /  Kas-iskelet sistemi hastalıkları	\N	\N	\N	\N	\N
ab3d760c-eb54-4eb2-bdcb-4e2872bb548a	10	3182	İş Sağlığı ve Güvenliği	Güvenlik - Ergonomik Risk Etmenler	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yanlış çalışma pozisyonları 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Personellere ergonomik koşullara uygun sandalye ve dinlenme alanı temin edilmiştir. Aralıklı molalar hakkında personellerin bilgilendirilmiştir. İşe giriş eğitimlerinde ergonomik çalışma koşulları hakkında bilgilendirme yapılmıştır. 	\N	3	3	1	9	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.684	2026-06-08 13:35:42.684	Çalışanlar	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Kas-iskelet sistemi rahatsızlıkları / Kronik ağrlar 	\N	\N	\N	\N	\N
5f3a1cd8-5117-49b9-abc0-3b169df605d1	10	3183	İş Sağlığı ve Güvenliği	Güvenlik - Psikososyal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Hasta kaybı, zamanla yarış ve yoğun çalışma 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Nöbet süreleri çalışanın dinlenmesine müsaade edecek şekilde düzenlenmektedir ve programa alınmaktadır.	\N	0.5	0.5	1	0.25	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.686	2026-06-08 13:35:42.686	 Çalışanlar 	Hasta Bakım Hizmetleri Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk veya geri bildirim tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Stres / Yorgunluk 	\N	\N	\N	\N	\N
9c1b0d1f-fb32-473a-aa16-c7a1a0011d13	10	3184	İş Sağlığı ve Güvenliği	Güvenlik - Psikososyal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Çalışanlara görev ve harici sorumluluk verilmesi	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Birim bazında uygun iş planlamaları yapılmıştır. Rötasyon-devriyeler aralıklarla gözden geçirilip düzenlenmektedir. Çalışanlara ilk iki ay sonunda ve düzenli olarak değerlendirme anketi sunulup geri bildirimleri alınmaktadır.	\N	1	2	3	6	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.687	2026-06-08 13:35:42.687	 Çalışanlar 	İnsan Kaynakları Müdürlüğü	Herhangi bir meslek hastalağı yaşanmamaştır.	2025-08-07 20:59:04	\N	Gösterge Takibi	Strese bağlı gelişen meslek hastalıkları 	\N	\N	\N	\N	\N
2cb0bcb2-8687-4d4f-81d9-fd87e23bd728	10	3185	İş Sağlığı ve Güvenliği	Güvenlik - Psikososyal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Hasta ve çalışan arasında sözlü veya fiziksel tartışma 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	İşe giriş eğitimlerinde acil kod durum eğitimleri verilmekte olup özellikle "Beyaz Kod" bilgilendirilmesi yapılmaktadır. Olası yaşanan beyaz kod durum sonrasında çalışanlar için talep doğrultusunda bölüm sorumluları veya ilgili uzman tarafıdan psikolojik destek hizmetleri sağlanmaktadır. 	\N	0.5	1	1	0.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.688	2026-06-08 13:35:42.688	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Kalite Müdürlüğü	Beyaz kod bildirimleri takip edilmektedir.	2025-08-07 20:59:04	\N	Gösterge Takibi	Yaralanmalar / Memnuniyetsizlik / Prestij kaybı	\N	\N	\N	\N	\N
fbd0f893-ea66-4d08-b918-c30d9c6b9103	10	3186	İş Sağlığı ve Güvenliği	Güvenlik - Psikososyal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yüksek stres altında çalışma 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Nöbet sürelerinin dinlenmeye müsaade edecek şekilde düzenlenmiştir ve bölüm içinde programa alınmıştır. 	\N	1	3	3	9	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.689	2026-06-08 13:35:42.689	 Çalışanlar 	Hasta Bakım Hizmetleri Müdürlüğü	Nöbet kayıt sistemi kullanılmaktadır. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Cerrahi başarısızlık / Operasyon süresinin uzaması / Hasta memnuniyetsizliği / Stres 	\N	\N	\N	\N	\N
62c12b32-0283-499b-850e-94fac336d1af	10	3187	İş Sağlığı ve Güvenliği	Güvenlik - Psikososyal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Travmatik vaka olayları 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Görev, sorumluluklar alan çalışanları arasında paylaştırılmıştır. Travmatik olay sonrası stres bozukluğunun yönetilmesi alan sorumlusu veya talep doğrultusunda uzman personel tarafından psikolojik destek sağlanmaktadır. Özellikle yeni işe başlayan personellerin adaptasyon süreçlerinin takibi bölüm sorumluları ve ilgili alan tarafından yapılarak performans ölçümleri kayıt altına alınmaktadır. 	\N	1	0.5	1	0.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.691	2026-06-08 13:35:42.691	Çalışanlar 	Hasta Bakım Hizmetleri Müdürlüğü	Olay bildirimleri takip edilmektedir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Stres / Ruhsal hastlıklar 	\N	\N	\N	\N	\N
3c0dfc91-9cda-444a-b116-a2e75701aee9	10	3188	İş Sağlığı ve Güvenliği	Güvenlik - Psikososyal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yoğun çalışma 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Nöbet sürelerinin dinlenmeye müsaade edecek şekilde düzenlenmiştir ve bölüm içinde programa alınmıştır. 	\N	0.5	1	3	1.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.691	2026-06-08 13:35:42.691	Hastalar / Çalışanlar 	Hasta Bakım Hizmetleri Müdürlüğü	Nöbet kayıt sistemi kullanılmaktadır. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Yaralanmalar / Memnuniyetsizlik / Prestij kaybı	\N	\N	\N	\N	\N
6e7b0348-54ef-4289-8c37-7d4e8d95d3be	10	3189	İş Sağlığı ve Güvenliği	Güvenlik - Psikososyal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tedavi sürecinde yaşanan korku ve endişe 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Hasta ve yakınlarına yönelik tedavi öncesi bilgilendirme ve eğitim verilmektedir. Hasta hakları bölümünün tedavi süreçler sonrası değerlendirmelere dahil edilmektedir. Etkili iletişim ile ilgili çalışanlara eğitimler verilmektedir.	\N	0.5	3	3	4.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.693	2026-06-08 13:35:42.693	Hastalar / Çalışanlar 	Diğer	Eğitim etkinlik sonuçları yapılan anketlerle takip edilmektedir.	2025-08-07 20:59:04	\N	Sınav / Değerlendirme	Tedavide başarısızlık oranlarının yükselmesi 	\N	\N	\N	\N	\N
e5346fdc-b559-44eb-b3e5-947d9bef5b8e	10	3190	İş Sağlığı ve Güvenliği	Güvenlik - Psikososyal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Hastalık ve tedaviyle ilgili bilgi eksikliği 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Hasta ve yakınlarına yönelik tedavi öncesi bilgilendirme ve eğitim verilmektedir. Hasta hakları bölümünün tedavi süreçler sonrası değerlendirmelere dahil edilmektedir. Etkili iletişim ile ilgili çalışanlara eğitimler verilmektedir.	\N	0.5	3	3	4.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.694	2026-06-08 13:35:42.694	Hastalar / Hasta yakınları / Çalışanlar / Ziyaretçiler	Diğer	Eğitim etkinlik sonuçları yapılan anketlerle takip edilmektedir.	2025-08-07 20:59:04	\N	Sınav / Değerlendirme	Hasta güvenliğinin tehlikeye girmesi	\N	\N	\N	\N	\N
06af16ed-a21c-44d9-93db-12682be50eb9	10	3191	İş Sağlığı ve Güvenliği	Güvenlik - Psikososyal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Hastaların yakınlarıyla iletişimde kopukluk	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Hasta ve yakınlarına yönelik tedavi öncesi bilgilendirme ve eğitim verilmektedir. Hasta hakları bölümünün tedavi süreçler sonrası değerlendirmelere dahil edilmektedir. Etkili iletişim ile ilgili çalışanlara eğitimler verilmektedir.	\N	0.5	3	3	4.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.695	2026-06-08 13:35:42.695	Hastalar / Hasta yakınları / Çalışanlar / Ziyaretçiler	Diğer	Eğitim etkinlik sonuçları yapılan anketlerle takip edilmektedir.	2025-08-07 20:59:04	\N	Sınav / Değerlendirme	Kurum imajının zedelenmesi 	\N	\N	\N	\N	\N
39a9c305-fc8c-47da-bf4b-f3bb4e89e81f	10	3192	İş Sağlığı ve Güvenliği	Güvenlik - Psikososyal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Uzun süreli bekleme ve belirsizlik durumu	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Hasta ve yakınlarına yönelik tedavi öncesi bilgilendirme ve eğitim verilmektedir. Hasta hakları bölümünün tedavi süreçler sonrası değerlendirmelere dahil edilmektedir. Etkili iletişim ile ilgili çalışanlara eğitimler verilmektedir.	\N	0.5	3	3	4.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.696	2026-06-08 13:35:42.696	Hastalar / Hasta yakınları / Çalışanlar / Ziyaretçiler	Diğer	Eğitim etkinlik sonuçları yapılan anketlerle takip edilmektedir.	2025-08-07 20:59:04	\N	Sınav / Değerlendirme	Yaralanmalar / Memnuniyetsizlik / Prestij kaybı	\N	\N	\N	\N	\N
4906537d-a5f7-4fbb-9905-aeb7dd326e00	10	3193	İş Sağlığı ve Güvenliği	Güvenlik - Psikososyal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Süreçlerin anlaşılmasında yaşanan zorluklar	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Hasta ve yakınlarına yönelik tedavi öncesi bilgilendirme ve eğitim verilmektedir. Hasta hakları bölümünün tedavi süreçler sonrası değerlendirmelere dahil edilmektedir. Etkili iletişim ile ilgili çalışanlara eğitimler verilmektedir.	\N	0.5	3	3	4.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.697	2026-06-08 13:35:42.697	Hastalar / Hasta yakınları / Çalışanlar / Ziyaretçiler	Diğer	Eğitim etkinlik sonuçları yapılan anketlerle takip edilmektedir.	2025-08-07 20:59:04	\N	Sınav / Değerlendirme	Yaralanmalar / Memnuniyetsizlik / Prestij kaybı	\N	\N	\N	\N	\N
01b0049d-edcb-48eb-a91f-6c5ba20ebf9f	10	3194	İş Sağlığı ve Güvenliği	Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yanıcı kimyasalların bulunması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	 Alanlarda kimyasal madde envanter listesi, depolama matrisi ve güvenlik bilgi formları bulunmaktadır.  Personele kullanacağı kimyasallara uygun kişisel koruyucu ekipman temin edilmiştir. Alanda döküntü-saçılma kitleri bulunmaktadır. 	\N	0.5	2	15	15	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.699	2026-06-08 13:35:42.699	Hastalar / Hasta Yakınları / Çalışanlar	Otelcilik ve Destek Hizmetleri Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Yangın / Zehirlenme 	\N	\N	\N	\N	\N
58616426-62a7-493d-896c-b191d0bcb69d	10	3195	İş Sağlığı ve Güvenliği	Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tahriş edici kimyasalların kullanılması  	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	 Alanlarda kimyasal madde envanter listesi, depolama matrisi ve güvenlik bilgi formları bulunmaktadır.  Personele kullanacağı kimyasallara uygun kişisel koruyucu ekipman temin edilmiştir. Alanda döküntü-saçılma kitleri bulunmaktadır. 	\N	0.5	2	15	15	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.7	2026-06-08 13:35:42.7	Hastalar / Hasta Yakınları / Çalışanlar	Otelcilik ve Destek Hizmetleri Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Göz ve deri tahrişleri 	\N	\N	\N	\N	\N
3396cb3a-e20a-48a3-a2bc-890468bbfb00	10	3196	İş Sağlığı ve Güvenliği	Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Temizlik kimyasalların yanlış kullanımı	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	 Alanlarda kimyasal madde envanter listesi, depolama matrisi ve güvenlik bilgi formları bulunmaktadır.  Personele kullanacağı kimyasallara uygun kişisel koruyucu ekipman temin edilmiştir. Alanda döküntü-saçılma kitleri bulunmaktadır. 	\N	0.5	2	15	15	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.701	2026-06-08 13:35:42.701	Hastalar / Hasta Yakınları / Çalışanlar	Otelcilik ve Destek Hizmetleri Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Kimyasal yanıklar / İrritasyon	\N	\N	\N	\N	\N
15b3f095-a568-480f-ad95-6aab1d0d864a	10	3197	İş Sağlığı ve Güvenliği	Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tehlikeli kimyasalların eksik veya yanlış yönetimi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Kimyasalların güncel envantelerinin kontrol edilmekte ve alanda bulunmaktadır. Kimyasalların güvenlik bilgi formlarının (MSDS) firmalardan alınıp arşivlenmektedir.	\N	1	1	3	3	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.703	2026-06-08 13:35:42.703	Çalışanlar	İş Sağlığı ve Güvenliği	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Hasta ve çalışan sağlığının tehlikeye girmesi / İş kazaları 	\N	\N	\N	\N	\N
b3c17ca9-9774-4e70-8705-adf28b556a41	10	3198	İş Sağlığı ve Güvenliği	Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Personellerin eğitim ve bilgilendirme eksikliği	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Kimyasalların alanda bulunan matrikse (uyumluluk tablosu) göre sıralanıp muhafaza edilmektedir. Depolama yerine kullanım ve tükeim hızı ihtiyacına göre stoklama yapılmaktadı. Stok yapılan alanlar için sıcaklık,nem ölçer cihazları ile kontrol sağlanmaktadır. Kimyasalların bulunduğu alanda etiketlemeler yapılmaktadır. 	\N	1	1	3	3	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.708	2026-06-08 13:35:42.708	Çalışanlar 	Otelcilik ve Destek Hizmetleri Müdürlüğü	Eğitim katılım ftomları kayıt altına alınmaktadır.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Ciddi sağlık sorunları / Acil durumlarda etkisiz müdahale 	\N	\N	\N	\N	\N
8544b45f-5d02-44bc-88f3-4d2c8ab68979	10	3199	İş Sağlığı ve Güvenliği	Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tehlikeli kimyasalların yanlış depolanması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Kimyasalların alanda bulunan matrikse (uyumluluk tablosu) göre sıralanıp muhafaza edilmektedir. Depolama yerine kullanım ve tükeim hızı ihtiyacına göre stoklama yapılmaktadı. Stok yapılan alanlar için sıcaklık,nem ölçer cihazları ile kontrol sağlanmaktadır. Kimyasalların bulunduğu alanda etiketlemeler yapılmaktadır. 	\N	1	1	3	3	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.71	2026-06-08 13:35:42.71	Çalışanlar 	İş Sağlığı ve Güvenliği	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Hasta ve çalışan sağlığının tehlikeye girmesi / Alan tesis işletiminin aksaması / Maddi hasar 	\N	\N	\N	\N	\N
b4cb6dbd-2165-4ba8-8d53-b9f33a9193ae	10	3200	İş Sağlığı ve Güvenliği	Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Dökülme-saçılma durumlarında müdahale eksikliği / aksaklığı 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Tehlikeli ve sık kullanılan kimyasallar için dökülme-saçılma müdahale planı oluşturulmuştur. Göz yıkama duşu/solüsyon kiti, dökülme-saçılma kiti kolayca ulaşılabilir alanda mevcuttur.	\N	1	1	7	7	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.711	2026-06-08 13:35:42.711	Hastalar / Hasta Yakınları / Çalışanlar	İş Sağlığı ve Güvenliği	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Ciddi sağlık sorunları / Çalışma alanının uzun süre kullanım dışı kalması 	\N	\N	\N	\N	\N
4e0bdfb9-ef25-4fd7-aa0c-efee0a4e5674	10	3201	İş Sağlığı ve Güvenliği	Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	İlaç stok ve kontrol takibin yapılamaması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	İlaç stoklarının ve takvimlerinin kontrolünün gözle ve sitem üzerinde izlem ve takibi yapılmaktadır.	\N	0.5	0.5	7	1.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.712	2026-06-08 13:35:42.712	Çalışanlar	Hasta Bakım Hizmetleri Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	İlaçların bozulması /  Hastanın rahatsızlığa dair reaksion göstermesi  / Menuniyetsizlik 	\N	\N	\N	\N	\N
02b8c817-dd34-479c-ae52-eb8b6b2382a9	10	3202	İş Sağlığı ve Güvenliği	Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi 	Muhafaza alanlarında sıcaklık ve nemin uygun olmaması 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Depolama alanları sıcaklık, nem ölçerler ile denetim altında tutulmaktadır.	\N	1	1	7	7	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.713	2026-06-08 13:35:42.713	\N	Hasta Bakım Hizmetleri Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Hastanın tedavi sürecinde zarar görmesi / Hukuki sorunlar	\N	\N	\N	\N	\N
78450506-3f74-427b-a580-c797540b180f	10	3203	İş Sağlığı ve Güvenliği	Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi 	Dozaj hataları / İlaç karışıklıkları 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Yapılan ilaç uygulamalarının otomasyon sitem üzerinde kayıt altına alınmaktadır. Çift kontrol sistemi (kimlik doğrulama) aktif olarak uygulanmaktadır.	\N	1	1	7	7	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.715	2026-06-08 13:35:42.715	\N	Hasta Bakım Hizmetleri Müdürlüğü	Yapılan kayıtlarda herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Enfeksiyon / Hastanın tedavi sürecinde zarar görmesi / Hukuki sorunlar 	\N	\N	\N	\N	\N
b85d48b6-603d-46f6-b039-9d96b58bb2db	10	3204	İş Sağlığı ve Güvenliği	Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi 	Isı ve/veya tutuşma kaynaklı ürünlerle temas etmesi 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Kullanımı sırasında yanıcı ve tutuşrucu kaynaklardan uzak tutulmaktadır. Uygulamaya özgü uzmanlar tarafından işlem gerçekleştirilmektedir.	\N	1	1	40	40	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.717	2026-06-08 13:35:42.717	Hasta / Hekim / Hemşire/ Hasta Bakım Perosneli/ Temizlik Görevlisi/ Tıbbi Atık Personeli	Hasta Bakım Hizmetleri Müdürlüğü	Yapılan alan denetimlerde herhangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar / Maddi hasar	\N	\N	\N	\N	\N
8289d22c-2b11-40a7-8f6c-7157ca416742	10	3205	İş Sağlığı ve Güvenliği	Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmesi 	Diğer ilaçlar ile karışması 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Renk kodlaması ile diğer ilaçlardan ayrıştırılmıştır. Uygulamaya özgü uzmanlar tarafından işlem gerçekleştirilmektedir.	\N	0.5	3	3	4.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.718	2026-06-08 13:35:42.718	Hasta / Hekim / Hemşire/ Hasta Bakım Perosneli/ Temizlik Görevlisi/ Tıbbi Atık Personeli	Hasta Bakım Hizmetleri Müdürlüğü	Yapılan alan denetimlerde herhangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Tedavide başarısızlık / Hukuki sorunlar	\N	\N	\N	\N	\N
ff126ae6-9159-473a-94a0-86ae7c5b3925	10	3206	Tesis Güvenliği	Atık Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Kovaların dolum oranının aşması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Tıbbi atık kovalarının dolum oranlarına ulaştığında ve günlük olarak toplanmaktadır.	\N	1	2	3	6	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.719	2026-06-08 13:35:42.719	Hastalar / Hasta Yakınları / Çalışanlar	Otelcilik ve Destek Hizmetleri Müdürlüğü	Tıbbi atıklar düzenli olarak bertaraf edilmektedir.	2025-08-07 20:59:04	\N	Diğer	Enfeksiyon / Yaralanma 	\N	\N	\N	\N	\N
bffbae64-5887-4e66-ba63-da49b562263f	10	3207	Tesis Güvenliği	Atık Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tıbbi atık kovalarında tehlikeli madde bulunması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Kullanım sonrası ilaçların tehlikeli madde variline sıkılmakta ve imha edilmektedir.	\N	1	2	15	30	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.72	2026-06-08 13:35:42.72	Hastalar / Hasta Yakınları / Çalışanlar	Hasta Bakım Hizmetleri Müdürlüğü	Tehlikeli maddeler için atık beratarf süreci prosedürlere uygun devam etmektedir.	2025-08-07 20:59:04	\N	Diğer	Amaç dışı kullanılması / İş kazası / Adli olay 	\N	\N	\N	\N	\N
fec67882-98da-4339-8318-1715235c0033	10	3208	Tesis Güvenliği	Atık Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tıbbi atıklar kovalarına atılmış iğne,kesici alet bulunması ve atık poşetinin hasar alması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Tıbbi atık toplayıcılarının eğitimli ve yetkin kişilerdir. Toplayıcılara koruyucu ekipman (turuncu kıyafet, eldiven, gözlük,bone) temin edilmektedir. Tıbbi atık kovalarına Tıbbi atık personeli hariç müdahale edilmemektedir. Tıbbi atık poşetleri standarda uygun yırtılmaz malzemeden temin edilmiştir.	\N	1	2	3	6	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.721	2026-06-08 13:35:42.721	Çalışanlar	Otelcilik ve Destek Hizmetleri Müdürlüğü	Atık bertaraf süreci prosedürlere uygun devam etmektedir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar / Enfeksiyon 	\N	\N	\N	\N	\N
93d6d6a6-21a2-41b6-ab43-e0b5a0440087	10	3209	Tesis Güvenliği	Atık Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tıbbi atık kovalarının temizlik planlamasının yapılmaması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Gün içinde yapılan iş planı ve dolum oranları da göz önünde bulundurularak temizlik programı düzenlenmektedir ve yapılan denetimlerde kontrol formlarının doluluğu gözlemlenmektedir.	\N	1	3	7	21	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.722	2026-06-08 13:35:42.722	Çalışanlar	Otelcilik ve Destek Hizmetleri Müdürlüğü	Atık bertaraf süreci prosedürlere uygun devam etmektedir.	2025-08-07 20:59:04	\N	Diğer	Enfeksiyon 	\N	\N	\N	\N	\N
1fdb09ec-5920-4f98-8b7b-d6418a202ca9	10	3210	Tesis Güvenliği	Atık Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tıbbi atıkların yanlış sınıflandırılması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Tıbbi atıkların doğru sınıflandırılması için net prosedürler oluşturmuştur.\r\n(OHZ-T05 Tıbbi Atıkların Taşınması ve Son. Asansör ve Geçici Tıbbi Atık Dep. Alanı Tem. referans alınmıştır.) Personellerin yetkiledirilmiş firma tarafından istihdamı sağlanmaktadır ve işe başlangıç eğitimlerinde tıbbi atık sınıflandırma konularında bilgilendirilmektedir. Tıbbi atıkların etiketlenmekte olup toplama süreci yapıaln ayrıma göre sürdürülmektedir.	\N	1	2	3	6	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.723	2026-06-08 13:35:42.723	Çalışanlar	Otelcilik ve Destek Hizmetleri Müdürlüğü	Atık bertaraf süreci prosedürlere uygun devam etmektedir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar / Enfeksiyon 	\N	\N	\N	\N	\N
10b24d3a-ec65-4d97-8e97-603b40dc7bbd	10	3211	Tesis Güvenliği	Atık Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tıbbi atıkların yanlış depolanması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Tıbbi atıkların depolanacağı atık depolarının oluşturulmutur. Depolama alanlarının yapılan planlamalar dorultusunda temizliği yapılmaktadır. Sızdırmaz ve kapalı konteynır kullanılmaktadır.	\N	0.5	2	3	3	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.724	2026-06-08 13:35:42.724	Hastalar / Hasta yakınları / Çalışanlar / Ziyaretçiler	Otelcilik ve Destek Hizmetleri Müdürlüğü	Atık bertaraf süreci prosedürlere uygun devam etmektedir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar / Enfeksiyon 	\N	\N	\N	\N	\N
44f9b46f-bdb5-4b9c-9cff-aec724ee5e38	10	3212	Tesis Güvenliği	Atık Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Atıkların sağlık çalışanı / tıbbi atıkçı tarafından yanlış imha edilmesi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Sağlık personeli ve tıbbi atıkçıların işe giriş eğitimlerinde tıbbi atık yönetimi konuları hakkında bilgilendirilmiştir. Tıbbi atıkların imhası sırasında temin edilen kişisel koruyucucu donanımların kullanılmaktadır. Tıbbi atıkların atılması için otomotik güvenli sistemlerin kullanılmaktadır.( pedal vb.) 	\N	0.5	2	3	3	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.725	2026-06-08 13:35:42.725	Çalışanlar	Otelcilik ve Destek Hizmetleri Müdürlüğü	Atık bertaraf süreci prosedürlere uygun devam etmektedir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar / Enfeksiyon 	\N	\N	\N	\N	\N
751d00f9-a194-4d31-bd5e-5fc99d6eed40	10	3213	Tesis Güvenliği	Atık Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Sharp-boxların kapağının açık tutulması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Sharp-boxların kullanımı hususunda personellere bilgilendirme eğitimi verilmiştir. Tepsilerde uyarıcı/hatırlatıcı etiketlemelerin bulunmaktadır.	\N	0.5	1	1	0.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.727	2026-06-08 13:35:42.727	Çalışanlar	Otelcilik ve Destek Hizmetleri Müdürlüğü	Atık bertaraf süreci prosedürlere uygun devam etmektedir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar / İğne batması / Enfeksiyon 	\N	\N	\N	\N	\N
48dd6be2-b841-461f-b57b-f4f34590b565	10	3214	Tesis Güvenliği	Atık Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tıbbi atık kovalarına koruyucu ekipmansız müdahale 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Tıbbi atık toplayıcılarının eğitimli ve yetkin kişilerdir. Toplayıcılara koruyucu ekipman (turuncu kıyafet, eldiven, gözlük,bone) temin edilmektedir. Tıbbi atık kovalarına Tıbbi atık personeli hariç müdahale edilmemektedir. Tıbbi atık poşetleri standarda uygun yırtılmaz malzemeden temin edilmiştir.	\N	1	2	3	6	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.728	2026-06-08 13:35:42.728	Çalışanlar	Otelcilik ve Destek Hizmetleri Müdürlüğü	Atık bertaraf süreci prosedürlere uygun devam etmektedir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar / Enfeksiyon 	\N	\N	\N	\N	\N
36cf0887-724e-452d-b3bc-3335754b1999	10	3215	Tesis Güvenliği	Atık Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Atık taşıma sürecinde konteynerlerin devrilmesi veya sızdırması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Taşıma konteyner, kova, varillerin; sızdırmaz, kapaklı ve dayanıklı malzemeden tercih edilmiştir.  Taşıma süresi boyunca konteynerlerin fren sistemi ile sabitlenmektedir. Kat ve alanda atık toplayacak personelin kişisel koruyucu ekipmanlarını kullanması zorunlu tutulmuştur.	\N	1	2	7	14	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.729	2026-06-08 13:35:42.729	Çalışanlar	Otelcilik ve Destek Hizmetleri Müdürlüğü	Atık bertaraf süreci prosedürlere uygun devam etmektedir.	2025-08-07 20:59:04	\N	Diğer	Enfeksiyon 	\N	\N	\N	\N	\N
1275b40c-1b55-435e-9bcc-89f139043ccf	10	3216	Tesis Güvenliği	Atık Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Atıkların belirlenen alan yerine rastgele depolanması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Geçici atık depolama alanlarının bulunmaktadır. Günlük olarak alandan toplanan atıklar burada depolanmakta ve günlük bertaraf edilmektedir. Depolama alanları 4'C sıcaklıkta tutulmakta olup yapılan planlama doğrultusunda düzenli olarak dezenfekte edilmektedir ve havalandırma sistemleri aktif çalışmaktadır. 	\N	1	1	7	7	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.73	2026-06-08 13:35:42.73	Çalışanlar	Otelcilik ve Destek Hizmetleri Müdürlüğü	Atık bertaraf süreci prosedürlere uygun devam etmektedir.	2025-08-07 20:59:04	\N	Diğer	Enfeksiyon 	\N	\N	\N	\N	\N
a3b70df2-2891-4f39-ac59-3d2f5ca7b52c	10	3217	Tesis Güvenliği	Atık Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Acil durumlar için hazırlıklı olamama 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Dökülme-saçılma gibi acil durumlar için planlamaların yapılmış olup ve personellere eğitim verilmiştir. Personellerin eğitim ve prosedürlere MLPCare Akademi portalından erişebilmesi sağlanmıştır. Dökülme-saçılma kitlerinin ekipmanları eksiksiz şekilde alanda hazır bulundurulmaktadır.	\N	1	1	7	7	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.731	2026-06-08 13:35:42.731	Hastalar / Çalışanlar 	Otelcilik ve Destek Hizmetleri Müdürlüğü	Atık bertaraf süreci prosedürlere uygun devam etmektedir.	2025-08-07 20:59:04	\N	Diğer	Atıklara maruziyetin artması / Enfeksiyon / Maddi hasar 	\N	\N	\N	\N	\N
a8470b84-5b47-4f41-8e08-0845baec46c2	10	3218	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Hasta yatak başı ünite elementelerinde elektrik kaçağı	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Hastabaşı pendatlarının düzenli olarak Teknik Hizmetler Müdürlüğü takibinde kontrol edilmekte olup teknik denetim etiketlemeleri yapılmıştır. Arızalı elektrik veya oksijen prizleri vb. parçaların tespiti halinde onarımları veya değişimleri sağlanmaktadır. Panelde sabit olmayan veya montajı sağlam yapılmayan ekipman bulunmamaktadır. 	\N	1	1	15	15	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.732	2026-06-08 13:35:42.732	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma ve ekip denetimlerinde herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Yangın / Elektrik ile çarpılma 	\N	\N	\N	\N	\N
77b90522-143d-404f-a47e-75333ea1baa7	10	3219	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	02  tüpünün taşınması ve basıncı	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Kontrollü taşımaya yönelik eğitimler personellere verilmektedir. Taşıma sırasında hasarlı,yıpranmış olmayan uygun tüp taşıma araçlarının kullanılmaktadır. Devrilme/düşmeyi önleyeci kordonlar tüp taşıma aracının üzerinde bulunmaktadır. 	\N	1	1	40	40	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.733	2026-06-08 13:35:42.733	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	 Yaralanmalar / Solunum yolu hastalıkları / Ölüm	\N	\N	\N	\N	\N
1d5fba31-6c11-4845-b2c1-412f84c201e8	10	3220	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	O2 sızıntısı	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Kontrollü taşımaya yönelik eğitimler personellere verilmektedir. Taşıma sırasında hasarlı,yıpranmış olmayan uygun tüp taşıma araçlarının kullanılmaktadır. Devrilme/düşmeyi önleyeci kordonlar tüp taşıma aracının üzerinde bulunmaktadır. 	\N	1	1	40	40	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.735	2026-06-08 13:35:42.735	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	/ Yaralanmalar / Solunum yolu hastalıkları / Ölüm	\N	\N	\N	\N	\N
0613a6aa-266f-46ed-8dbf-a635fc295b98	10	3221	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Alan genelinde prizlerin duvara sabit olmaması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Alan prizleri ölü boşluk, çıkımtı kalmayacak şekilde montajları yapılmıştır. Sabit olmayan prizi bulunmamaktadır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.736	2026-06-08 13:35:42.736	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Elektrik çarpması / Kalp krizi / Yaralanmalar	\N	\N	\N	\N	\N
b7ced098-887f-45a0-89d0-ddf214d842dd	10	3222	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tıbbi cihaz ve UPS prizlerinin ayırt edilmemesi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Alanda tıbbi cihazların kullanım ihtiyacına yönelik yeterli sayıda ups prizi mevcuttur. Prizlere amacına yönelik kullanımı için ups bağlıntı prizi olduğuna dair etiketlemeler yapılmıştır. Tüm cihazların bu prizlerlerle bağlantısı sağlanmaktadır.	\N	1	2	15	30	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.737	2026-06-08 13:35:42.737	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Aşırı yük / Elektrik çarpması / Kalp krizi / Yaralanmalar	\N	\N	\N	\N	\N
d6385407-548c-476d-b783-bb341aaa20e0	10	3223	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Hasarlı,yıpranmış veya açıkta elektrikli ekipman kablolarının bulunması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Tespit edilen kabloların bulunduğu ekipmanlar teknik hizmetler ekibi adına arıza kaydı açıldıkta sonra kullanım dışı bırakılmaktadır. 	\N	1	2	15	30	Olası Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.738	2026-06-08 13:35:42.738	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Müdahale güçlüğü / Yaralanmalar 	\N	\N	\N	\N	\N
e17a6ee1-5d34-4d44-8413-c40396e6b6dd	10	3224	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Alan içindeki elektrik pano odası ve/veya pano kapakların açık bırakılması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Pano odalarına kartlı erişim sistemi ile giriş çıkışlar sağlanmaktadır. Oda için kalmayan panoların kapaklarına kilit montajı yapılmıştır ve anahtaraları sadece yetkili personele teslim edilmiştir. Farkındalığı arttıracak ve panoyu belirtecek etiketlemeler pano kapakları üzerine asılmıştır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.739	2026-06-08 13:35:42.739	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Kalp krizi / Yaralanmalar 	\N	\N	\N	\N	\N
74ff14fe-5e11-4102-9c9c-c7028291de5e	10	3225	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yangın söndürme tüpü tedariği aksaklığı 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yapılan planlamalar doğrultusunda (en az 6 ayda bir kez) bakım ve kontrolleri yapılmaktadır. Kullanım sonrası tüplerin (köpük söndürücü) alandan alınmakta olup stokta olan tüplerden veya yeni temin edilen tüp tedariği sağlanmaktadır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.74	2026-06-08 13:35:42.74	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	 Müdahale güçlüğü / Ciddi maddi hasar / Yaralanmalar 	\N	\N	\N	\N	\N
dc82f0c8-7957-4063-912e-c18e9d13bd58	10	3226	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yangın söndürme tüpünün boş olması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yapılan planlamalar doğrultusunda (en az 6 ayda bir kez) bakım ve kontrolleri yapılmaktadır. Kullanım sonrası tüplerin (köpük söndürücü) alandan alınmakta olup stokta olan tüplerden veya yeni temin edilen tüp tedariği sağlanmaktadır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.741	2026-06-08 13:35:42.741	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yangın / Müdahale güçlüğü 	\N	\N	\N	\N	\N
13fc9772-df98-49a8-b7d2-8b6602304794	10	3227	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yangın söndürme dolabının üzerinde / içinde kontrol kullanım talimatı vb. formların bulunmaması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Olası bir arıza veya değişim olması durumda veya planlama doğrultusunda düzenli yapılan kontrollerin sağlandığına dair formlar ve bakım etiketleri dolaplar üzerinde bulunmktadır. Kullanım talimatları oluşturulmuş olup görsel desteklemesi ile birlikte dolaplara asılmıştır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.743	2026-06-08 13:35:42.743	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Büyüyen yangın / Yaralanmalar 	\N	\N	\N	\N	\N
f1c9177c-93d2-4586-aa81-8f09358f6c1d	10	3228	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Malzeme istifleme alanlarının belirlenmemesi	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Kat içinde cihaz park alanları işaretlenmiştir. Kirli-temiz odaları ve banko arka bölümlerinde malzeme,dosya,eşya yerleştirmek için yaterli alan bulunmaktadır. Yemek arabaları, temizlik arabaları park alanları da geçiş yolu olmayan bir alan üzerinde belirlenmiştir.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.744	2026-06-08 13:35:42.744	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Büyüyen yangın / Zehirlenme / Yaralanmalar	\N	\N	\N	\N	\N
40adf1c5-0c7a-43b1-937a-6e2bc94f3799	10	3229	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Dinlenme odasında bulunan elektrikli ısıtıcılar, \r\nkettle vb. elektrikli \r\naletlerin \r\nbulundurulması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yangın riskine karşı tüm elektrikli ısıtıcıların \r\ntoplanmış ve alandan çıkarılmıştır. Uyarıcı işaretleme ve talimatlar genel saha içerisnde mevcuttur. 	\N	0.5	0.5	15	3.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.745	2026-06-08 13:35:42.745	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Otelcilik ve Destek Hizmetleri Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yangın / Yaralanmalar	\N	\N	\N	\N	\N
756ae506-3f00-44fb-be79-70f5966241aa	10	3230	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	O2 gaz kaçakları / sızıntıları 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Kullanılan medikal gaz sistemleri ve oksijen tüpleri iç ve dış kontroller olarak periyodik bakım ve kontrolleri yapılmaktadır. Özellikle gaz sistemlerinde periyodik olarak kaçak,sızıntı testleri yapılmaktadır. Yapılacak periyodik bakımların tesis yıllık bakım planında programlanmış olup kayıt altına alınmaktadır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.746	2026-06-08 13:35:42.746	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Müdahale güçlüğü / Yangın 	\N	\N	\N	\N	\N
b836045d-8126-40fb-9ded-669b13b82cce	10	3231	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yangın bölmelendirme yetersizliği	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yangına dayanımlı duvar, tavan malzmeleri ve kapılar kullanılmakatdır. Yangın dayanımlılığının test edilmesi içi yıl içinde yapılan planlamalar doğrltusunda kontol ve gerekirse bakımları yapılmıştır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.747	2026-06-08 13:35:42.747	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Can kaybı / Malzeme ve ekipman kaybı / Operasyonların kesitiye uğraması 	\N	\N	\N	\N	\N
d84ca29b-21a1-4031-9b7f-cb8b1f4c3eb4	10	3232	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yangın kapılarının çalışmaması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Otomatik kapı kapanma mekanizmalarının çalışır durumdadır. Yangın kapılarının düzenli olarak bakım ve testlerinin yapılmakta olup kayıt altına alınmaktadır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.748	2026-06-08 13:35:42.748	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Yangının diğer alanlara sıçraması / Kaçış yollarının etkisiz hale gelmesi 	\N	\N	\N	\N	\N
060800c5-5a3d-4cd6-91af-a85d448fcbd4	10	3233	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Havalandırma ve klima sistemlerinin yangın sırasında kapanmaması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yangın durumunda otomatik devre dışı kalan havalandırma sistemlerinin kurulmuştur.  Duman kontrol sistemleri saha algılama ve diğer sitsemlerle entegere olaması için planlama doğrultusunda testlere tabii tutulmaktadır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.749	2026-06-08 13:35:42.749	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Kaçış yollarına duman yayılması / Zehirlenme / Panik 	\N	\N	\N	\N	\N
37789d64-fe22-4b30-8821-a26e2217c659	10	3234	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yangın bölmelerinde açılan deliklerin kapatılmaması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yangına dayanımlı duvar, tavan malzmeleri ve kapılar kullanılmakatdır. Yangın dayanımlılığının test edilmesi içi yıl içinde yapılan planlamalar doğrltusunda kontol ve gerekirse bakımları yapılmıştır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.75	2026-06-08 13:35:42.75	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Yangının tüm binaya yayılması / Müdahale güçlüğü 	\N	\N	\N	\N	\N
759608ee-639d-46d6-b297-7a1bc2f93d3b	10	3235	Tesis Güvenliği	Yangın Güvenliği	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tahliye yollarının ayrılmaması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Tahliye yollarının yangın bölmeleri (yangın holü) tasarımları ile korunmakatdır. Kaçış yollarında duman tahliye sistemlerinin (menfez vb.) bulunmaktadır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.751	2026-06-08 13:35:42.751	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Kaos / Yaralanmalar 	\N	\N	\N	\N	\N
db518010-09f4-446e-b572-c17ce4e9e5dd	10	3236	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yangın dolabı kapaklarının gevşek olması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Tüm yangın dolaplarının ilgili kişiler tarafından yılda en az bir kez kontrollerinin sağlanmaktadır.	\N	0.5	0.5	7	1.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.752	2026-06-08 13:35:42.752	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Yaralanmalar  	\N	\N	\N	\N	\N
54997abb-aadf-4d22-9670-7fd2d136014c	10	3237	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Acil durum butonlarının cam malzeme ile korunması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Kullanımının gerektiği durumlar için kırma aparatının cam yerine kırılması kolay ve yaralanmaya sebebiyet vermeyecek malzeme ile değiştirilmiştir.	\N	1	0.5	3	1.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.753	2026-06-08 13:35:42.753	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar / Müdahale zorluğu 	\N	\N	\N	\N	\N
91c76a39-5a79-4870-8a8d-8662d2f3c6b0	10	3238	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Acil çıkış kapılarının önüne malzeme istiflenmesi / sedye bırakılması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	İşe giriş eğitimlerinde Acil Durum ve Afet Yönetimi eğitimi verilmektedir. Konu hakkında tespiti sonrası uyarı ve bilgilendirme yapılmakatdır. Sedyelerin yerleşimi için park alanı oluşturulmuş olup sınırlandırmanın kırmızı çizgi ile belirtilmiştir.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.754	2026-06-08 13:35:42.754	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Zehirlenme / Yaralanmalar / Ölüm	\N	\N	\N	\N	\N
f764ed2c-9447-4a84-9fb1-b05be0d4a508	10	3239	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Acil çıkış kapılarının tam kapanmaması / açık tutulması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Olası yangın durumunda kapıların açık bırakılma ihtimalini önlemek amacıyla kapılarda pnömatik sistemlerin kullanılmakrtadır.  İşe giriş eğitimlerinde Acil Durum ve Afet Yönetimi eğitimi verilmeketdir. Konu hakkında tespiti sonrası uyarı ve bilgilendirme yapılmakatdır.	\N	0.5	0.5	15	3.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.756	2026-06-08 13:35:42.756	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Zehirlenme	\N	\N	\N	\N	\N
8dd95350-f3b6-408d-93b2-c8a7d50f5481	10	3240	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Acil durumlarda ekiplerin koordine olamaması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	İşe giriş eğitimlerinde Acil Durum ve Afet Yönetimi eğitimi verilmektedir. Acil durum ekipleri ilgili kurum tarafından ortak düzenmiş eğitim sonrasında alan bazlı belirlenmiş kişilerinin bilgilerini içeren olup formları alana asılmıştır. Yıl içinde yangın söndürme ekipleri ile birlikte tatbikatlar düzenlenmektedir.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.757	2026-06-08 13:35:42.757	Hastalar / Çalışanlar 	İş Sağlığı ve Güvenliği	Eğitim katılım ftomları kayıt altına alınmaktadır.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Zehirlenme / Yaralanmalar / Ölüm	\N	\N	\N	\N	\N
1e7903b5-581a-49e9-9942-ba1718c5eea2	10	3241	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Acil kaçış aydınlatmalarının yanmaması veya eksik yanması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Aydınlatma planlarının güncellenmiştir ve yeterli sayıya çıkarılmıştır. Işıklandırma için kör nokta alanda bulunmamaktadır.	\N	1	0.5	15	7.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.758	2026-06-08 13:35:42.758	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Zehirlenme / Yaralanmalar / Ölüm	\N	\N	\N	\N	\N
2c02cf30-eac2-4a83-bd42-2bf92e08a345	10	3242	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Acil durum planlarının kat içinde bulunmaması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	İşe girişte Acil Durum ve Afet Yönetimi eğitimi verilmektedir. Acil durum planların en az yılda bir kez revize edilmekte ve alanda görünür kısımlara (genellikle asansör yanı) asılmıştır. Alan bazlı ve bütünsel tatbikatlar yıl içinde ekiplerle birlikte yapılmaktadır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.759	2026-06-08 13:35:42.759	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Müdahale güçlüğü / Ölüm	\N	\N	\N	\N	\N
ae78df4b-d07f-4d02-a240-560dd4077c74	10	3243	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Acil Durum ve Afet Yönetimi Eğitim eksikliği	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	İşe girişte Acil Durum ve Afet Yönetimi eğitimi verilmektedir. Acil durum planların en az yılda bir kez revize edilmekte ve alanda görünür kısımlara (genellikle asansör yanı) asılmıştır. Alan bazlı ve bütünsel tatbikatlar yıl içinde ekiplerle birlikte yapılmaktadır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.76	2026-06-08 13:35:42.76	Hastalar / Çalışanlar 	İş Sağlığı ve Güvenliği	Eğitim katılım ftomları kayıt altına alınmaktadır.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Acil durum olayında kargaşa / Müdahale güçlüğü / Ölüm	\N	\N	\N	\N	\N
076adeb2-adbb-4b4e-a5a7-1493fbbb3807	10	3244	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	İlkyardımcı eğitim sertifikalı personel bulunmaması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	İlgili birimlerle yapılan organizasyonlar kapsamında ( en az üç yılda bir kez)  eğitimlerin yenilenmektedir.	\N	1	0.5	15	7.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.761	2026-06-08 13:35:42.761	Hastalar / Çalışanlar 	İş Sağlığı ve Güvenliği	Eğitim katılım ftomları kayıt altına alınmaktadır.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Acil durumlarda müdahale güçlüğü	\N	\N	\N	\N	\N
6efddec1-3b28-4ca4-a9b7-48d6edad24f0	10	3245	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yangın söndürme eğitimli perosnel bulunmaması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	İlgili birimlerle yapılan organizasyonlar kapsamında ( en az yılda bir kez)  eğitimlerin yenilenmektedir.	\N	1	0.5	15	7.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.762	2026-06-08 13:35:42.762	Hastalar / Çalışanlar 	İş Sağlığı ve Güvenliği	Eğitim katılım ftomları kayıt altına alınmaktadır.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Yangın olaylarında müdahale güçlüğü	\N	\N	\N	\N	\N
48c0cb8d-fb39-43a3-b93f-344273417bf0	10	3246	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Elektrik kesintisi veya cihaz arızaları 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yedek sistemler (UPS,Jenaratör) sağlanmaktadır. Yedek enerji kaynaklarının yılda en az dört kez ve aylık olmak üzere bakım ve kontrolleri yapılmaktadır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.763	2026-06-08 13:35:42.763	Hastalar / Çalışanlar 	İş Sağlığı ve Güvenliği	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Hizmet aksaması 	\N	\N	\N	\N	\N
c614bdc5-332f-4e90-a12e-409d6a26ff59	10	3247	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Deprem 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Binanın deprem dayanıklılığı arttırılması ve daynakılılık raporlarının tutulmaktadır. Ağır tıbbi cihaz ve dolap,raf vb. ekipmanların sabitlenmektedir. Deprem tahliye tatbikatlarının yılda en az iki kez yapılmaktadır.Acil durum malzemeleri yedeklenmektedir (jeneratör, yedek su tankı, ilaç vb.).	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.764	2026-06-08 13:35:42.764	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Hizmet aksaması / Can kaybı / Yaralanmalar 	\N	\N	\N	\N	\N
aaef67d6-dad9-4c05-aaf0-9b799b5495af	10	3248	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Sel / Su baskını 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Kritik cihazlar ve elektrik panoları için yükseltilmiş alanlar oluşturulmuştur. Tahliye yollarının planlanması ve işaretlenmiştir. Su tahliye sistemlerinin planlamalar doğrultusunda bakım ve kontrolleri yapılmaktadır. 	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.765	2026-06-08 13:35:42.765	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Hastane işeyişinin durması / Kritik hastaların tahliye edilememesi 	\N	\N	\N	\N	\N
546537dd-bde1-4095-8173-983916558ed8	10	3249	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Salgın / Pandemi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	İzolasyon alanlarının oluşturulmuştur. Olası durumlarda kişisel koruyucu ekipmanların stokları arttırılmaktadır. Sağlık personellerine enfeksiyon kontrol eğitimlerinin verilmektedir. Pandemi kriz yönetim planları komiteler toplanması ile oluşturulmaktadır.  	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.766	2026-06-08 13:35:42.766	Hastalar / Çalışanlar 	Diğer	Hazırlık planları mevcuttur.	2025-08-07 20:59:04	\N	Diğer	Hasta ve çalışan güvenliğinin tehlikeye girmesi / Hizmet kapasitesinin aşılması 	\N	\N	\N	\N	\N
461179ed-c7f9-4ef4-a125-c366c1bcd13a	10	3250	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yangın 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yangın algılama ve söndürme sistemlerinin planlamalar doğrultusunda aylık iç kontrol ve yılda en az iki kez dış kontrollerinin ve bakımlarının yapılması / Yangın tatbikatlarının yılda en az iki kez yapılması / Yangın riskini azaltmak için uygun depolama ve kablolama sistemlerinin kullanılması 	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.767	2026-06-08 13:35:42.767	Hastalar / Çalışanlar 	Diğer	Hazırlık planları mevcuttur.	2025-08-07 20:59:04	\N	Diğer	Can kaybı / Maddi zarar / Hizmet kesintisi 	\N	\N	\N	\N	\N
717ee609-ea04-4abd-ae8b-b5a8ee4b89ac	10	3251	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Stok yönetimindeki yetersizlikler 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Kritik malzemeler için minimum-maksimum stok seviyesinin belirlenmektedir. Stok seviyerlerinin düzenli kontrol edilmekte ihtiyaç halinde stoklar yenilenmektedir. Acil durumlar için tedarik zinciri alternatiflerinin altyapısı oluşturulmaktadır.	\N	1	1	15	15	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.768	2026-06-08 13:35:42.768	Hastalar / Çalışanlar 	Diğer	Hazırlık planları mevcuttur.	2025-08-07 20:59:04	\N	Diğer	Hasta bakımının aksaması / Çalışanların tükenmesi 	\N	\N	\N	\N	\N
6595d59b-1a25-4741-93fc-2a11714812d9	10	3252	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Medikal gaz kesintisi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yedek medikal gaz tüplerinin yeterli sayıda stoklaması yapılmıştır. Otomatik gaz kesintisi algılama sitemleri alanda bulunmaktadır. Taşınabilir oksijen konsantratörlerin stoklanması yapılmıştır. Kesinti durumunda kullanılabilecek manuel ekipmanlar alanlarda mevcuttur ve kullanıcılara eğitimleri verilmiştir. Sistemlerinin yapılan planlama doğrultusunda haftalık iç kontrol ve yılda en az iki defa dış kontrollerinin yapılması sağlanmaktadır	\N	0.5	1	40	20	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.769	2026-06-08 13:35:42.769	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan konrollerde herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Kritik hastaların kaybı 	\N	\N	\N	\N	\N
b07f6150-ac30-4810-a600-2e3be7f37de0	10	3253	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Medikal gaz kesintisi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yedek medikal gaz tüplerinin yeterli sayıda stoklaması yapılmıştır. Otomatik gaz kesintisi algılama sitemleri alanda bulunmaktadır. Taşınabilir oksijen konsantratörlerin stoklanması yapılmıştır. Kesinti durumunda kullanılabilecek manuel ekipmanlar alanlarda mevcuttur ve kullanıcılara eğitimleri verilmiştir. Sistemlerinin yapılan planlama doğrultusunda haftalık iç kontrol ve yılda en az iki defa dış kontrollerinin yapılması sağlanmaktadır	\N	0.5	1	40	20	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.77	2026-06-08 13:35:42.77	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan konrollerde herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Ameliyatların, operasyonların durması ve komplikasyonların gelişmesi 	\N	\N	\N	\N	\N
ef3dc9bb-8dc1-4611-a142-2136b3339dbe	10	3254	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Medikal gaz kesintisi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yedek medikal gaz tüplerinin yeterli sayıda stoklaması yapılmıştır. Otomatik gaz kesintisi algılama sitemleri alanda bulunmaktadır. Taşınabilir oksijen konsantratörlerin stoklanması yapılmıştır. Kesinti durumunda kullanılabilecek manuel ekipmanlar alanlarda mevcuttur ve kullanıcılara eğitimleri verilmiştir. Sistemlerinin yapılan planlama doğrultusunda haftalık iç kontrol ve yılda en az iki defa dış kontrollerinin yapılması sağlanmaktadır	\N	0.5	1	40	20	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.771	2026-06-08 13:35:42.771	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan konrollerde herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Yoğun bakım ünitelerinde felç durumu 	\N	\N	\N	\N	\N
1defcaf2-0a8b-4c5f-97a4-3c13c53b3cc0	10	3255	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Medikal gaz kesintisi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yedek medikal gaz tüplerinin yeterli sayıda stoklaması yapılmıştır. Otomatik gaz kesintisi algılama sitemleri alanda bulunmaktadır. Taşınabilir oksijen konsantratörlerin stoklanması yapılmıştır. Kesinti durumunda kullanılabilecek manuel ekipmanlar alanlarda mevcuttur ve kullanıcılara eğitimleri verilmiştir. Sistemlerinin yapılan planlama doğrultusunda haftalık iç kontrol ve yılda en az iki defa dış kontrollerinin yapılması sağlanmaktadır	\N	0.5	1	40	20	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.772	2026-06-08 13:35:42.772	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan konrollerde herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Hasta, hasta yakını ve çalışanlarda stres / İletişim problemleri 	\N	\N	\N	\N	\N
b6aee39a-1b4d-4c4b-976b-c4897f01d08f	10	3256	Tesis Güvenliği	Acil Durum ve Afet Yönetimi	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Medikal gaz kesintisi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yedek medikal gaz tüplerinin yeterli sayıda stoklaması yapılmıştır. Otomatik gaz kesintisi algılama sitemleri alanda bulunmaktadır. Taşınabilir oksijen konsantratörlerin stoklanması yapılmıştır. Kesinti durumunda kullanılabilecek manuel ekipmanlar alanlarda mevcuttur ve kullanıcılara eğitimleri verilmiştir. Sistemlerinin yapılan planlama doğrultusunda haftalık iç kontrol ve yılda en az iki defa dış kontrollerinin yapılması sağlanmaktadır	\N	0.5	1	40	20	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.773	2026-06-08 13:35:42.773	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan konrollerde herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	İlaç ve cihaz bağımlılığı problemleri 	\N	\N	\N	\N	\N
3a12b397-165c-474e-9ebd-d1683a5a7c19	10	3257	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Personel alarm sistemlerinin (hemşire çağrı zili vb.) arızalanması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Alarm sistemlerinin belirlenen planlama doğrultusunda (aylık iç kontol ve yılda en az bir defa dış kontrol) testlerinin yapılmaktadır.	\N	0.5	0.5	15	3.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.774	2026-06-08 13:35:42.774	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan konrollerde herhangi bir olumsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Hasta ve çalışan sağlığının tehlikeye girmesi 	\N	\N	\N	\N	\N
0e1be96a-e274-4f50-97b6-3087533e7322	10	3259	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yetersiz Aydınlatma 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Aydınlatma sistemlerinin düzenl kontrolleri ve testleri yapılmaktadır. Yedek aydınlatma planlarının devreye alınmaktadır.	\N	0.5	0.5	7	1.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.775	2026-06-08 13:35:42.775	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar / Hasta kaybı	\N	\N	\N	\N	\N
472e32c3-8ccc-40b7-abf4-fa9dc8c1ad20	10	3260	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Ani aydınlatma kesintileri 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Acil durum ışıklandırma sistemlerinin çalışır durumdadır.	\N	0.5	0.5	7	1.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.776	2026-06-08 13:35:42.776	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Yaralanmalar / Hasta kaybı	\N	\N	\N	\N	\N
cd8495dd-bdfe-447d-9ab6-5b3d631e758b	10	3261	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Bina altyapısının doğal afetlere dayanıklı olmaması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Acil servis fiziksel donanımlarının olası doğal afetlere göre düzenlenmiştir. (mobilya yerleşimi vb.) Doğal afetler için Hap planları oluşturulmuştur ve tatbikatları yılda en az bir kez olacak şekilde yapılmaktadır. İşe girişlerde afet ve acil durumlar hakkında eğitim verilmektedir.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.777	2026-06-08 13:35:42.777	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	İş Sağlığı ve Güvenliği	Tatibat raporları kayıt altına alınmaktadır.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Sağlık hizmetlerine erişim kısıtlanması / Müdahale güçlüğü 	\N	\N	\N	\N	\N
05e646dd-d1c5-4d99-af5d-48113fd66308	10	3262	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Elektrik kesintisi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Kesintisiz güç kaynaklarının (UPS) ve jeneratörler kullanılmakatdır. Güç kaynaklarının planlamalar doğrultusunda iç ve dış bakım ve kontrollerinin yapılması sağlanmatadır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.778	2026-06-08 13:35:42.778	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	 Hasta kaybı / Cihaz hasarı 	\N	\N	\N	\N	\N
0f9bc1b9-b1c2-424b-b28f-043c436d10f0	10	3263	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Elektrik kaçakları   	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Topraklama sistemlerinin planlamalar doğrultusunda kontrol edilmektedir. Periyodik elektrik devreye alma testleri yapılmaktadır.	\N	0.5	0.5	15	3.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.779	2026-06-08 13:35:42.779	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Elektrik çarpması / Cihaz arızası 	\N	\N	\N	\N	\N
678f1ce8-0637-4ee6-a354-6fefe4f8b6e6	10	3264	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Aşırı yüklenme 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Elektrik sistemi kapasitelerinin yapılan iç ve dış kontroller ve firma kontrolleri ile belirlenmiştir. 	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.78	2026-06-08 13:35:42.78	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Cihaz arızası / Yangın	\N	\N	\N	\N	\N
f835c208-11e9-4d95-b7b4-cf98cae8aa5d	10	3265	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	O2 Sızıntısı 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Gaz kaçağı algılama dedektörlerinin kullanılmaktadır. Gaz sistemlerinin (medikal gaz vb) firma talimatalrı doğrultusunda ve gerek görüldüğü durumlarda bakım ve kontrollerin yapaılmktadır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.781	2026-06-08 13:35:42.781	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Yangın / Patlama 	\N	\N	\N	\N	\N
56247147-8b9b-4f92-b188-787d7981f0df	10	3266	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Anestezi gaz sızıntısı 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Sızıntı monitörlerinin kullanılmaktadır. Hepafiltre vb. havalandırma sistemlerinin yılda en az bir kez değişimleri yapılmaktadır.	\N	0.5	0.5	15	3.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.782	2026-06-08 13:35:42.782	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Kronik sağlık sorunları / Zehirlenme 	\N	\N	\N	\N	\N
d6232037-e604-480f-b2dd-9d3099c4897c	10	3267	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Havalandırma arızası 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Havalandırma sistemlerinin planlamalar doğrultusunda ve gereke görüldüğü durumlarda bakım ve kontrolleri yapılmaktadır.	\N	0.5	0.5	15	3.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.783	2026-06-08 13:35:42.783	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Steril alanın kontaminasyonu / Enfeskiyon 	\N	\N	\N	\N	\N
50f5d5fe-d484-4000-a47f-b1fbb2568fbf	10	3268	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Filtrelerin tıkanması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Hepa filtrelerin belirlenen aralıklarla periyodik bakım ve kontrolleri yapılmaktadır. Gerek duyulursa değişimleri sağlanmaktadır.	\N	0.5	0.5	15	3.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.784	2026-06-08 13:35:42.784	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Hasta enfesksiyonları 	\N	\N	\N	\N	\N
9748cc44-def1-470a-bce6-bdbe1835a1b4	10	3269	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yetersiz havalandırma 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Havalandırma sistemlerinin aktif çalışır durumdadır.	\N	0.5	0.5	3	0.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.785	2026-06-08 13:35:42.785	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Yapılan saha denetimlerinde herhangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Hasta ve çalışan sağlığının bozulması	\N	\N	\N	\N	\N
416085e7-5145-4918-8fdb-8f76e97d9423	10	3270	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Su kesintisi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yedek su tanklarının bulundurulmakta ve su basıncının düzenli olarak kontrolleri yapılmaktadır. Su kalite testleri planlamalar doğrultusunda tekralanmakta ve kayıt altına alınmaktadır.	\N	0.5	0.5	15	3.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.786	2026-06-08 13:35:42.786	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Enfeksiyon / İşlemlerin aksaması 	\N	\N	\N	\N	\N
90073305-c26a-496c-9553-5979602b997c	10	3271	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Su kontaminasyonu 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yedek su tanklarının bulundurulmakta ve su basıncının düzenli olarak kontrolleri yapılmaktadır. Su kalite testleri planlamalar doğrultusunda (yılda en az bir defa)  tekralanmakta ve kayıt altına alınmaktadır.	\N	0.5	0.5	15	3.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.787	2026-06-08 13:35:42.787	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Hijyen sorunları 	\N	\N	\N	\N	\N
d18e8076-217a-45a1-92fb-6d7d6163ac5c	10	3272	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Veri sisteminde altyapı sorunları 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yedekli veri sistemleri kullanılmaktadır. 	\N	1	3	3	9	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.788	2026-06-08 13:35:42.788	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Bilgi Sistemleri Müdürlüğü	Otomasyon sistemi üzerinden gelen kayıtlar yedeklenmektedir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Tedavi süreçlerinin aksaması / Hukuki sorunlar 	\N	\N	\N	\N	\N
26e62952-5c66-4e7d-bac0-f1848c5e9e86	10	3273	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yangın algılama sistemi arızası 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Yangın dedektörlerinin diğer yangın algılama sistemleri ile birlikte kontrol ve testleri yapılmaktadır. Yangın senaryo tatbikatları yapılıp kayırt altına alınmaktadır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.789	2026-06-08 13:35:42.789	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Yangının büyümes / Hasta ve çalışan güvenliğinin tehlikeye girmesi 	\N	\N	\N	\N	\N
9db29049-032d-47f8-9afa-939f365171a7	10	3274	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Söndürme sistemi arızası 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Sulu söndürme sistemleri dahil yangın tesisaatının planlamalar doğrultusunda (yılda en az bir kez)  periyodik kontrollerinin yapılması sonucu bakım-onarımlarının tamamlanmıştır.	\N	0.5	0.5	40	10	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.79	2026-06-08 13:35:42.79	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Yangının kontrol altına alınamaması 	\N	\N	\N	\N	\N
711c75e6-3c8c-4964-bab9-8962b2f30ab5	10	3275	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Hasta taşımaları sırasında prosedür hataları 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Hasta taşıma esnasında kişisel koruyucu ekipmanların kullanılmaktadır. Hasta taşıma güzergahında kontamine alanlarda kullanılması için dezenfeksiyon malzemelerin bulundurulmaktadır. 	\N	1	1	15	15	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.791	2026-06-08 13:35:42.791	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Yapılan alan denetimlerinde herhangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Çverdeki hastaların veya sağlık çalışanlarında enfeksiyon 	\N	\N	\N	\N	\N
c2358abd-e7ef-48e7-9307-45fccd34a67a	10	3276	Tesis Güvenliği	Emniyet	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Hasta eşyalarının  çalınması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Standartlara uygun, özellikle giriş ve çıkışların kör noktası olmayacak şekilde görüntülü izleme sistemi kurulmuştur. Dışarıdan içeriye girişlerde butonla giriş yerine kartlı erişim sisteminin kullanılmaya başlanmıştır.	\N	0.5	0.5	3	0.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.793	2026-06-08 13:35:42.793	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Firma tarafından yapılan kontrollerde herhangi bir olumsuzluk tespit edilmemiştir. 	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Maddi zarar / Hasta endişesi 	\N	\N	\N	\N	\N
6a8b257d-7bee-45bd-9856-8481c867f01a	10	3277	Tesis Güvenliği	Emniyet	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Tıbbi cihazların kötü niyete çalınması veya sabote edilmesi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Envanter yönetimi, yazılımı ve takibi yapılmakatdır. (Lighthouse) / Tıbbi cihazların kullanım dışı kalmaları durumunda kartlı erişim sistemi bulunan güvenli depoda muhafaz edilmekte ve yetkisiz kişilerin bu alana erişiminin engellenmektedir	\N	0.5	0.5	3	0.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.794	2026-06-08 13:35:42.794	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Biyomedikal Müdürlüğü	Herhangi bir olay bildirimi yapılmamıştır.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Cihazların işlev dışı kalamsı / Tedavinin aksaması 	\N	\N	\N	\N	\N
6162a3de-7fe7-4134-a603-352bf04d3cc2	10	3278	Tesis Güvenliği	Emniyet	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Hasta yakınları veya hastane çalışanları arasında fiziksel veya sözlü şiddet, olumsuzluklar 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Standartlara uygun, özellikle giriş ve çıkışların kör noktası olmayacak şekilde görüntülü izleme sistemi kurulmuştur. Hastane girişlerinde güvenlik personeli her saat bulunmaktadır.  Personellere düzenli olarak kriz yönetimi ve iletişim becerileri eğitimleri verilmektedir.	\N	0.5	0.5	3	0.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.795	2026-06-08 13:35:42.795	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Diğer	Beyaz kod bildirimleri takip edilmektedir.	2025-08-07 20:59:04	\N	Gösterge Takibi	İş kazaları / Tükenmişlik sendromu / Hasta güvenliğin tehlikeye girmesi 	\N	\N	\N	\N	\N
a6364485-9f4e-447b-9fa3-dc21759b8a91	10	3280	Tesis Güvenliği	Emniyet	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Alandaki ilaç ve malzeme dolaplarının izinsiz açılması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Dolaplara erişimin sadaece yetkili personel tarafından yapılması için tüm dolapların kilitlilidir. Düzenli olarak alanda bulunan envanter kontrolleri yapılmaktadır.	\N	0.5	0.5	3	0.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.796	2026-06-08 13:35:42.796	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Hasta Bakım Hizmetleri Müdürlüğü	Herhangi bir kaza,olay bildirimi, ramak kala olay , şikayet vb. durum yaşanmamıştır	2025-08-07 20:59:04	\N	Diğer	Tedavi süreçlerinin aksaması 	\N	\N	\N	\N	\N
4b71f739-8a13-446e-906e-00ab63cf1c01	10	3281	Tesis Güvenliği	Emniyet	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Bilinci kapalı ve hareket kabiliyeti olmayan hastaların düşmesi	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Hastalar için yatak korkulukları sürekli kapalı tutulmaktadır. Hasta monitörleme sistemleri ile ani durumlar ( düşme, oksijen saturasyonunun düşmesi vb.) otomatik olarak izlenmektedir.	\N	0.5	0.5	1	0.25	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.797	2026-06-08 13:35:42.797	Hastalar / Çalışanlar 	Hasta Bakım Hizmetleri Müdürlüğü	Herhangi bir kaza,olay bildirimi, ramak kala olay , şikayet vb. durum yaşanmamıştır	2025-08-07 20:59:04	\N	Diğer	Tedavi gecikmesi / Hasta maliyetinde artış 	\N	\N	\N	\N	\N
6e95e437-5b1d-4581-849f-54d26a4ce402	10	3282	Tesis Güvenliği	Emniyet	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Hastaların cilt bakımı ve pozisyon değişikliğini ihmal edilmesi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Cilt bariyer kremleri ve uygun yatak ekipmanları (yastık vb.) kullanılmaktadır. 	\N	1	3	3	9	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.798	2026-06-08 13:35:42.798	Hastalar / Çalışanlar 	Hasta Bakım Hizmetleri Müdürlüğü	Yapılan alan denetimlerinde herhangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Tedavi sürelerinin uzaması 	\N	\N	\N	\N	\N
08c57f75-5840-4484-8187-69df8e042888	10	3283	Tesis Güvenliği	Emniyet	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Hasta verilerinin yetkisiz kişisel tarafından erişilmesi 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Hasta bilgilerinin yalnızca yetkili personel tarafından görülebileceği dijital sistemler kullanılmaktadır. Bilgisayarlara ve yazılımlara kullanıcı adı-şifre ile erişim sağlanmaktadır.	\N	1	1	3	3	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.799	2026-06-08 13:35:42.799	Hastalar / Çalışanlar 	Hasta Bakım Hizmetleri Müdürlüğü	Kayıtlar otomasyon sistem üzerinden yedeklenmekte ve manuel arşivlenmektedir.	2025-08-07 20:59:04	\N	Diğer	Hastane itibarı zedelenmesi / Hukuki sorunlar 	\N	\N	\N	\N	\N
efd79e9c-18fd-43e2-b264-ca326dc3dc6c	10	3284	Tesis Güvenliği	Emniyet	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yetkisiz sağlık çalışanlarının girmesi	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Kartlı geçiş sistemlerinin kullanılmaktadır, personel kimlik katı ile tanımlamaların yapılmakatdır.	\N	0.5	2	1	1	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.8	2026-06-08 13:35:42.8	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Giriş-çıkış kayıtları otomasyon sistemine kaydedilmektedir.	2025-08-07 20:59:04	\N	Diğer	Enfeksiyon 	\N	\N	\N	\N	\N
5e98e260-363d-40ce-9c8e-f628326d927b	10	3285	Tesis Güvenliği	Emniyet	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Alan kapılarının yetkililer tarafından kontrol altında olmaması	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Kartlı geçiş sistemlerinin kullanılmaktadır. Personel kimlik katı ile tanımlamaların yapılmıştır. Dış firma personelleri bildirimli içeri alınmakta ve yaka kartı verilmektedir. Personel ve hastalar için ayrı girişlerin mevcuttur. 	\N	0.5	2	1	1	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.801	2026-06-08 13:35:42.801	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Teknik Hizmetler Müdürlüğü	Giriş-çıkış kayıtları otomasyon sistemine kaydedilmektedir.	2025-08-07 20:59:04	\N	Diğer	Enfeksiyon 	\N	\N	\N	\N	\N
0d209128-8424-403f-b778-e3f6d625b00a	10	3286	Tesis Güvenliği	Emniyet	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Narkotik ilaçların stok kontrolünde eksik bulunması 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Özel dikkat gerektiren ilaçlar saklanma prosedürüne uygun muhafaza edilmeketedir. 	\N	0.5	1	7	3.5	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.802	2026-06-08 13:35:42.802	 Hasta / Tekniker / Teknisyen / Porter / Temizlik Görevllisi / Tıbbi Atık Personeli 	Hasta Bakım Hizmetleri Müdürlüğü	Yapılan alan denetimlerinde herhangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Hukuki Sorunlar / Yasal yaptırımlar	\N	\N	\N	\N	\N
c9180c89-1e90-4c0f-a907-ee607ed60d01	10	3287	Tıbbi Hizmetler	Tedavi ve rehabilitasyon süreci ile ilgili riskler	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Yanlış ilaç hazırlanması	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Çift kontrol mekanizması oluşturulmuş ve kullanımı sağlanmaktadır. E-order sistemi kullanılmakta ve takip edilmektedir.	\N	0.5	0.5	3	0.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.803	2026-06-08 13:35:42.803	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Hasta Bakım Hizmetleri Müdürlüğü	Kayıtlar otomasyon sistem üzerinden yedeklenmekte ve manuel arşivlenmektedir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Yan etkiler / Toksisite veya tedavi etkinliği azalması / Yaralanma / Enfeskiyon	\N	\N	\N	\N	\N
977febcd-448f-4417-b419-866e709cec6d	10	3288	Tıbbi Hizmetler	Tedavi ve rehabilitasyon süreci ile ilgili riskler	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Sterilizasyon eskikliği	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Sadece ameliyathane için steril alan ve ekipman oluşturulmakta ve hastaneden izole edilmektedir. El hijyeni talimatı oluşturulmuştur ve çalışanların görebileceği alanlara (genellikle el yıkama lavabosu yanı) asılmıştır.	\N	1	3	3	9	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.804	2026-06-08 13:35:42.804	Hastalar / Hasta Yakınları / Çalışanlar / Ziyaretçiler 	Hasta Bakım Hizmetleri Müdürlüğü	Yapılan alan denetimleride herhangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Enfeksiyon 	\N	\N	\N	\N	\N
d9caacb2-1d07-439e-af9d-b2e4382539c0	10	3289	Tıbbi Hizmetler	Tedavi ve rehabilitasyon süreci ile ilgili riskler	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Uzman doktorun geç ulaşması veya bulunamaması 	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Alandan istenen konsültasyonlar hastanın aciliyetine göre konsültan hekim tarafından en geç 30 dakika içinde değerlendirmektedir. Bu sürecin takibi ve değerlendirmesi Acil Konsültasyon Ekibi tarafından yapılmaktadır.\r\n	\N	0.5	0.5	3	0.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.805	2026-06-08 13:35:42.805	Hastalar /  Çalışanlar	Başhekimlik	Değerlendirme toplantılaraında herhangi bir olumsuzluk belirtilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Geç kalınmış tedavi / Güven kaybı	\N	\N	\N	\N	\N
03d03676-2e31-455c-abe5-d561a08307c3	10	3290	Tıbbi Hizmetler	Tedavi ve rehabilitasyon süreci ile ilgili riskler	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	İletişim eksikliği	Alınacak önlemler uygulandığı takdirde, var olan tehlike kontrol altına alınacaktır.	Çift kontrol sisteminin aktif kullanılmaktadır. Süreci tamamlanan hastanın/misafirin ilgili birime aktarılmadan ve aktarıldıktan sonra kendisine veya yakınına hekim değişikliği veya süreçlerin değişikliği konusunda bilgi verilmektedir. 	\N	0.5	0.5	3	0.75	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.807	2026-06-08 13:35:42.807	Hastalar /  Çalışanlar	Başhekimlik	Değerlendirme toplantılaraında herhangi bir olumsuzluk belirtilmemiştir.	2025-08-07 20:59:04	\N	Belgelendirme (Rapor, Tatbikat, Kayıt vb.)	Yanlış tedavi / Yanlış değerlendirme 	\N	\N	\N	\N	\N
a0caf533-22a3-4f4a-90f3-356460525575	10	3291	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Basınç kontrol sistemlerinin arızası 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Otomatik hızlı kapama özellikli kapıların kullanılmaktadır. Giriş - çıkışların minimuma indirilmesi için sadece yetkili personellerin alana girmekte ve kartlı erişim sistemi kullanılmaktadır.	\N	1	1	15	15	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.808	2026-06-08 13:35:42.808	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Yapılan alan denetimlerinde herhangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Hasta sağlığının tehlikeye girmesi / Enfeksiyon artışı	\N	\N	\N	\N	\N
132db873-8017-43cf-84bf-2f100697b4d0	10	3292	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Hava filtrasyon sistemindeki sorunlar 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Hepa filtrelerin yapılan planlama doğrultusunda periyodik bakım ve kontrolleri gerektiği durumlarda değişimleri yapılmaktadır.	\N	1	1	15	15	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.809	2026-06-08 13:35:42.809	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Yapılan alan denetimlerinde herhangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Çapraz enfeksiyonlar ve kontaminasyon 	\N	\N	\N	\N	\N
3fec85cb-accf-4ce6-aceb-c0e9adafa1b6	10	3293	Tesis Güvenliği	Altyapı Sistemleri	Radyoloji	Fine Kinney	Mevcut önlem devam ettirilmelidir.	Kapıların sık açılıp kapanması 	Alınacak önlemler uygulandığı takdirde var olan tehlike kontrol altına alınacaktır. 	Otomatik hızlı kapama özellikli kapıların kullanılmaktadır. Giriş - çıkışların minimuma indirilmesi için sadece yetkili personellerin alana girmekte ve kartlı erişim sistemi kullanılmaktadır.	\N	1	1	15	15	Önemsiz Risk	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACIK_TEHLIKE	metin.salik	2026-06-08 13:35:42.81	2026-06-08 13:35:42.81	Hastalar / Çalışanlar 	Teknik Hizmetler Müdürlüğü	Yapılan alan denetimlerinde herhangi bir uygunsuzluk tespit edilmemiştir.	2025-08-07 20:59:04	\N	Diğer	Hava sirkülasyonun etkilenmesi / Enfeksiyon artışı 	\N	\N	\N	\N	\N
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
31	Hasta kabul süreci ile ilgili riskler	6	2026-06-05 09:43:24.845	2026-06-05 09:43:24.845
32	Tanı süreci ile ilgili riskler	6	2026-06-05 09:43:33.358	2026-06-05 09:43:33.358
33	Tedavi ve rehabilitasyon süreci ile ilgili riskler	6	2026-06-05 09:43:44.382	2026-06-05 09:43:44.382
34	Takip ve taburculuk süreci ile ilgili riskler	6	2026-06-05 09:43:54.038	2026-06-05 09:43:54.038
35	Tıbbi kayıt ve arşiv süreci ile ilgili riskler	6	2026-06-05 09:44:31.257	2026-06-05 09:44:31.257
36	İdari süreçler ile ilgili riskler	7	2026-06-05 09:44:56.16	2026-06-05 09:44:56.16
37	Finansal süreçler ile ilgili riskler	7	2026-06-05 09:45:04.701	2026-06-05 09:45:04.701
38	İtibar yönetimi	7	2026-06-05 09:45:13.401	2026-06-05 09:45:13.401
39	Paydaşlarla iletişim süreçlerine yönelik riskler 	7	2026-06-05 09:45:21.926	2026-06-05 09:45:21.926
40	Bilgi yönetimi süreçleri ile ilgili riskler	7	2026-06-05 09:45:31.663	2026-06-05 09:45:31.663
41	Atık yönetimi sürecindeki riskler	8	2026-06-05 09:45:57.592	2026-06-05 09:45:57.592
42	Tıbbi cihaz ve malzeme yönetimi süreci riskleri	8	2026-06-05 09:46:05.522	2026-06-05 09:46:05.522
43	Diğer cihaz ve malzemelerin yönetim süreci riskleri	8	2026-06-05 09:46:12.711	2026-06-05 09:46:12.711
44	Yangın Güvenliği ile ilgili riskler	8	2026-06-05 09:46:20.882	2026-06-05 09:46:20.882
45	Altyapı Sistemleri ile ilgili riskler	8	2026-06-05 09:46:27.903	2026-06-05 09:46:27.903
46	İnşaat ve Renovasyon ile ilgili riskler	8	2026-06-05 09:46:40.461	2026-06-05 09:46:40.461
47	Acil Durum ve Afet Yönetimi ile ilgili riskler	8	2026-06-05 09:46:51.178	2026-06-05 09:46:51.178
48	Emniyet ile ilgili riskler	8	2026-06-05 09:47:04.322	2026-06-05 09:47:04.322
49	Hava kirliliği oluşturabilecek unsurlar	9	2026-06-05 09:47:29.512	2026-06-05 09:47:29.512
50	Atıkların çevreye zarar vermesi	9	2026-06-05 09:47:37.478	2026-06-05 09:47:37.478
51	Çevreden hastaneye gelecek zararlar	9	2026-06-05 09:47:45.383	2026-06-05 09:47:45.383
52	Tehlikeli atıklardan oluşabilecek zararlar	9	2026-06-05 09:47:53.282	2026-06-05 09:47:53.282
53	Güvenlik - Fiziksel Risk Etmenleri	10	2026-06-05 09:48:11.687	2026-06-05 09:48:11.687
54	Güvenlik - Biyolojik Risk Etmenleri	10	2026-06-05 09:48:18.618	2026-06-05 09:48:18.618
55	Güvenlik - Psikososyal Risk Etmenleri	10	2026-06-05 09:48:26.541	2026-06-05 09:48:26.541
56	Güvenlik- Ergonomik Risk Etmenleri	10	2026-06-05 09:48:33.925	2026-06-05 09:48:33.925
57	Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri	10	2026-06-05 09:48:41.533	2026-06-05 09:48:41.533
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

SELECT pg_catalog.setval('public."ActivityLog_id_seq"', 279, true);


--
-- Name: AdministrativeFine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."AdministrativeFine_id_seq"', 1, true);


--
-- Name: Assignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."Assignment_id_seq"', 194, true);


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

SELECT pg_catalog.setval('public."EmployeeCountHistory_id_seq"', 142, true);


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

SELECT pg_catalog.setval('public."NotificationConfig_id_seq"', 4, true);


--
-- Name: NotificationTemplate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."NotificationTemplate_id_seq"', 4, true);


--
-- Name: Notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."Notification_id_seq"', 1, false);


--
-- Name: OSGBCompany_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."OSGBCompany_id_seq"', 10, true);


--
-- Name: Professional_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."Professional_id_seq"', 179, true);


--
-- Name: Reconciliation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."Reconciliation_id_seq"', 1446, true);


--
-- Name: ReportTemplate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."ReportTemplate_id_seq"', 1, false);


--
-- Name: RiskCategorySetting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."RiskCategorySetting_id_seq"', 10, true);


--
-- Name: RiskDepartmentSetting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."RiskDepartmentSetting_id_seq"', 27, true);


--
-- Name: RiskDepartment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."RiskDepartment_id_seq"', 10, true);


--
-- Name: RiskSubCategorySetting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: isguser
--

SELECT pg_catalog.setval('public."RiskSubCategorySetting_id_seq"', 57, true);


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
-- Name: FacilityHazmatItem FacilityHazmatItem_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."FacilityHazmatItem"
    ADD CONSTRAINT "FacilityHazmatItem_pkey" PRIMARY KEY (id);


--
-- Name: Facility Facility_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."Facility"
    ADD CONSTRAINT "Facility_pkey" PRIMARY KEY (id);


--
-- Name: HazmatAdrLabel HazmatAdrLabel_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatAdrLabel"
    ADD CONSTRAINT "HazmatAdrLabel_pkey" PRIMARY KEY (id);


--
-- Name: HazmatAuditLog HazmatAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatAuditLog"
    ADD CONSTRAINT "HazmatAuditLog_pkey" PRIMARY KEY (id);


--
-- Name: HazmatCategory HazmatCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatCategory"
    ADD CONSTRAINT "HazmatCategory_pkey" PRIMARY KEY (id);


--
-- Name: HazmatDepartment HazmatDepartment_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatDepartment"
    ADD CONSTRAINT "HazmatDepartment_pkey" PRIMARY KEY (id);


--
-- Name: HazmatHazardLabel HazmatHazardLabel_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatHazardLabel"
    ADD CONSTRAINT "HazmatHazardLabel_pkey" PRIMARY KEY (id);


--
-- Name: HazmatInventoryItem HazmatInventoryItem_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatInventoryItem"
    ADD CONSTRAINT "HazmatInventoryItem_pkey" PRIMARY KEY (id);


--
-- Name: HazmatMaterialAdrLabel HazmatMaterialAdrLabel_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatMaterialAdrLabel"
    ADD CONSTRAINT "HazmatMaterialAdrLabel_pkey" PRIMARY KEY (id);


--
-- Name: HazmatMaterialHazardLabel HazmatMaterialHazardLabel_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatMaterialHazardLabel"
    ADD CONSTRAINT "HazmatMaterialHazardLabel_pkey" PRIMARY KEY (id);


--
-- Name: HazmatMaterialPpe HazmatMaterialPpe_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatMaterialPpe"
    ADD CONSTRAINT "HazmatMaterialPpe_pkey" PRIMARY KEY (id);


--
-- Name: HazmatMaterial HazmatMaterial_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatMaterial"
    ADD CONSTRAINT "HazmatMaterial_pkey" PRIMARY KEY (id);


--
-- Name: HazmatPpe HazmatPpe_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatPpe"
    ADD CONSTRAINT "HazmatPpe_pkey" PRIMARY KEY (id);


--
-- Name: HazmatSpillKitAction HazmatSpillKitAction_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatSpillKitAction"
    ADD CONSTRAINT "HazmatSpillKitAction_pkey" PRIMARY KEY (id);


--
-- Name: HazmatSpillKitCheck HazmatSpillKitCheck_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatSpillKitCheck"
    ADD CONSTRAINT "HazmatSpillKitCheck_pkey" PRIMARY KEY (id);


--
-- Name: HazmatSpillKitDepartment HazmatSpillKitDepartment_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatSpillKitDepartment"
    ADD CONSTRAINT "HazmatSpillKitDepartment_pkey" PRIMARY KEY (id);


--
-- Name: HazmatSpillKitIncident HazmatSpillKitIncident_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatSpillKitIncident"
    ADD CONSTRAINT "HazmatSpillKitIncident_pkey" PRIMARY KEY (id);


--
-- Name: HazmatSpillKitItem HazmatSpillKitItem_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatSpillKitItem"
    ADD CONSTRAINT "HazmatSpillKitItem_pkey" PRIMARY KEY (id);


--
-- Name: HazmatSpillKitMasterItem HazmatSpillKitMasterItem_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatSpillKitMasterItem"
    ADD CONSTRAINT "HazmatSpillKitMasterItem_pkey" PRIMARY KEY (id);


--
-- Name: HazmatSpillKit HazmatSpillKit_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatSpillKit"
    ADD CONSTRAINT "HazmatSpillKit_pkey" PRIMARY KEY (id);


--
-- Name: HazmatUnit HazmatUnit_pkey; Type: CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatUnit"
    ADD CONSTRAINT "HazmatUnit_pkey" PRIMARY KEY (id);


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
-- Name: FacilityHazmatItem_facilityId_materialId_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "FacilityHazmatItem_facilityId_materialId_key" ON public."FacilityHazmatItem" USING btree ("facilityId", "materialId");


--
-- Name: HazmatAdrLabel_code_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "HazmatAdrLabel_code_key" ON public."HazmatAdrLabel" USING btree (code);


--
-- Name: HazmatAuditLog_materialId_idx; Type: INDEX; Schema: public; Owner: isguser
--

CREATE INDEX "HazmatAuditLog_materialId_idx" ON public."HazmatAuditLog" USING btree ("materialId");


--
-- Name: HazmatHazardLabel_code_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "HazmatHazardLabel_code_key" ON public."HazmatHazardLabel" USING btree (code);


--
-- Name: HazmatInventoryItem_facilityId_departmentId_idx; Type: INDEX; Schema: public; Owner: isguser
--

CREATE INDEX "HazmatInventoryItem_facilityId_departmentId_idx" ON public."HazmatInventoryItem" USING btree ("facilityId", "departmentId");


--
-- Name: HazmatInventoryItem_facilityId_departmentId_materialId_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "HazmatInventoryItem_facilityId_departmentId_materialId_key" ON public."HazmatInventoryItem" USING btree ("facilityId", "departmentId", "materialId");


--
-- Name: HazmatInventoryItem_facilityId_materialId_idx; Type: INDEX; Schema: public; Owner: isguser
--

CREATE INDEX "HazmatInventoryItem_facilityId_materialId_idx" ON public."HazmatInventoryItem" USING btree ("facilityId", "materialId");


--
-- Name: HazmatMaterialAdrLabel_materialId_labelId_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "HazmatMaterialAdrLabel_materialId_labelId_key" ON public."HazmatMaterialAdrLabel" USING btree ("materialId", "labelId");


--
-- Name: HazmatMaterialHazardLabel_materialId_labelId_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "HazmatMaterialHazardLabel_materialId_labelId_key" ON public."HazmatMaterialHazardLabel" USING btree ("materialId", "labelId");


--
-- Name: HazmatMaterialPpe_materialId_ppeId_key; Type: INDEX; Schema: public; Owner: isguser
--

CREATE UNIQUE INDEX "HazmatMaterialPpe_materialId_ppeId_key" ON public."HazmatMaterialPpe" USING btree ("materialId", "ppeId");


--
-- Name: HazmatSpillKitAction_placementId_idx; Type: INDEX; Schema: public; Owner: isguser
--

CREATE INDEX "HazmatSpillKitAction_placementId_idx" ON public."HazmatSpillKitAction" USING btree ("placementId");


--
-- Name: HazmatSpillKitCheck_placementId_idx; Type: INDEX; Schema: public; Owner: isguser
--

CREATE INDEX "HazmatSpillKitCheck_placementId_idx" ON public."HazmatSpillKitCheck" USING btree ("placementId");


--
-- Name: HazmatSpillKitDepartment_kitId_idx; Type: INDEX; Schema: public; Owner: isguser
--

CREATE INDEX "HazmatSpillKitDepartment_kitId_idx" ON public."HazmatSpillKitDepartment" USING btree ("kitId");


--
-- Name: HazmatSpillKitIncident_placementId_idx; Type: INDEX; Schema: public; Owner: isguser
--

CREATE INDEX "HazmatSpillKitIncident_placementId_idx" ON public."HazmatSpillKitIncident" USING btree ("placementId");


--
-- Name: HazmatSpillKitItem_kitId_idx; Type: INDEX; Schema: public; Owner: isguser
--

CREATE INDEX "HazmatSpillKitItem_kitId_idx" ON public."HazmatSpillKitItem" USING btree ("kitId");


--
-- Name: HazmatSpillKitMasterItem_facilityId_idx; Type: INDEX; Schema: public; Owner: isguser
--

CREATE INDEX "HazmatSpillKitMasterItem_facilityId_idx" ON public."HazmatSpillKitMasterItem" USING btree ("facilityId");


--
-- Name: HazmatSpillKit_facilityId_idx; Type: INDEX; Schema: public; Owner: isguser
--

CREATE INDEX "HazmatSpillKit_facilityId_idx" ON public."HazmatSpillKit" USING btree ("facilityId");


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
-- Name: ActivityLog ActivityLog_professionalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."ActivityLog"
    ADD CONSTRAINT "ActivityLog_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES public."Professional"(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: FacilityHazmatItem FacilityHazmatItem_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."FacilityHazmatItem"
    ADD CONSTRAINT "FacilityHazmatItem_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FacilityHazmatItem FacilityHazmatItem_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."FacilityHazmatItem"
    ADD CONSTRAINT "FacilityHazmatItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."HazmatMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FacilityHazmatItem FacilityHazmatItem_unitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."FacilityHazmatItem"
    ADD CONSTRAINT "FacilityHazmatItem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES public."HazmatUnit"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HazmatAuditLog HazmatAuditLog_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatAuditLog"
    ADD CONSTRAINT "HazmatAuditLog_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."HazmatMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatDepartment HazmatDepartment_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatDepartment"
    ADD CONSTRAINT "HazmatDepartment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatInventoryItem HazmatInventoryItem_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatInventoryItem"
    ADD CONSTRAINT "HazmatInventoryItem_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."HazmatDepartment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatInventoryItem HazmatInventoryItem_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatInventoryItem"
    ADD CONSTRAINT "HazmatInventoryItem_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatInventoryItem HazmatInventoryItem_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatInventoryItem"
    ADD CONSTRAINT "HazmatInventoryItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."HazmatMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatMaterialAdrLabel HazmatMaterialAdrLabel_labelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatMaterialAdrLabel"
    ADD CONSTRAINT "HazmatMaterialAdrLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES public."HazmatAdrLabel"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatMaterialAdrLabel HazmatMaterialAdrLabel_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatMaterialAdrLabel"
    ADD CONSTRAINT "HazmatMaterialAdrLabel_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."HazmatMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatMaterialHazardLabel HazmatMaterialHazardLabel_labelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatMaterialHazardLabel"
    ADD CONSTRAINT "HazmatMaterialHazardLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES public."HazmatHazardLabel"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatMaterialHazardLabel HazmatMaterialHazardLabel_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatMaterialHazardLabel"
    ADD CONSTRAINT "HazmatMaterialHazardLabel_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."HazmatMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatMaterialPpe HazmatMaterialPpe_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatMaterialPpe"
    ADD CONSTRAINT "HazmatMaterialPpe_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."HazmatMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatMaterialPpe HazmatMaterialPpe_ppeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatMaterialPpe"
    ADD CONSTRAINT "HazmatMaterialPpe_ppeId_fkey" FOREIGN KEY ("ppeId") REFERENCES public."HazmatPpe"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatMaterial HazmatMaterial_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatMaterial"
    ADD CONSTRAINT "HazmatMaterial_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."HazmatCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HazmatSpillKitAction HazmatSpillKitAction_placementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatSpillKitAction"
    ADD CONSTRAINT "HazmatSpillKitAction_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES public."HazmatSpillKitDepartment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatSpillKitCheck HazmatSpillKitCheck_placementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatSpillKitCheck"
    ADD CONSTRAINT "HazmatSpillKitCheck_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES public."HazmatSpillKitDepartment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatSpillKitDepartment HazmatSpillKitDepartment_kitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatSpillKitDepartment"
    ADD CONSTRAINT "HazmatSpillKitDepartment_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES public."HazmatSpillKit"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatSpillKitIncident HazmatSpillKitIncident_placementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatSpillKitIncident"
    ADD CONSTRAINT "HazmatSpillKitIncident_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES public."HazmatSpillKitDepartment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatSpillKitItem HazmatSpillKitItem_kitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatSpillKitItem"
    ADD CONSTRAINT "HazmatSpillKitItem_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES public."HazmatSpillKit"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatSpillKitMasterItem HazmatSpillKitMasterItem_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatSpillKitMasterItem"
    ADD CONSTRAINT "HazmatSpillKitMasterItem_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HazmatSpillKit HazmatSpillKit_facilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: isguser
--

ALTER TABLE ONLY public."HazmatSpillKit"
    ADD CONSTRAINT "HazmatSpillKit_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES public."Facility"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: isguser
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 36dgtpk15gFULghXKe1bNIydmbnAeXeRKXZ4ZUkKD856Z1rzgzEwTw3UEIlLbIv

