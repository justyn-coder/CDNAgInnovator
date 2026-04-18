// Shared types for the LinkedIn capture pipeline.
// See trellis/specs/linkedin-capture-pipeline-v1.0 for the full design.

export type CaptureSource =
  | "linkedin_post"
  | "linkedin_screenshot"
  | "manual"
  | "test";

export type Classification =
  | "program"
  | "knowledge"
  | "contact_signal"
  | "noise"
  | "error";

export type Confidence = "high" | "medium" | "low";

export type Decision =
  | "queued"
  | "classifying"
  | "auto_added"
  | "pending_review"
  | "duplicate_merged"
  | "rejected"
  | "noise"
  | "error";

export type Seniority =
  | "founder"
  | "operator"
  | "investor"
  | "researcher"
  | "government"
  | "media"
  | "industry"
  | "unknown";

export type OrgType =
  | "program"
  | "startup"
  | "investor"
  | "govt"
  | "research"
  | "media"
  | "industry"
  | "unknown";

export const PROGRAM_CATEGORIES = [
  "Fund",
  "Accel",
  "Pilot",
  "Event",
  "Org",
  "Train",
] as const;
export type ProgramCategory = (typeof PROGRAM_CATEGORIES)[number];

export const STAGES = ["Idea", "MVP", "Pilot", "Comm", "Scale"] as const;
export type Stage = (typeof STAGES)[number];

export const PROVINCES = [
  "BC",
  "AB",
  "SK",
  "MB",
  "ON",
  "QC",
  "NB",
  "NS",
  "PE",
  "NL",
  "YT",
  "NT",
  "NU",
  "National",
] as const;
export type Province = (typeof PROVINCES)[number];

export interface IngestRequest {
  source_url?: string;
  author_name?: string;
  author_url?: string;
  raw_text?: string;
  image_base64?: string;
  captured_by?: string;
  source?: CaptureSource;
}

export interface AuthorCanonical {
  name?: string;
  linkedin_url?: string;
  organization?: string;
  role_title?: string;
  seniority?: Seniority;
  org_type?: OrgType;
  topic_tags?: string[];
  province?: string;
  location?: string;
  bio_snippet?: string;
}

export interface ProgramCanonical {
  name?: string;
  candidate_website?: string;
  category?: ProgramCategory;
  province?: string[];
  stage?: Stage[];
  description?: string;
  funding_type?: string;
  funding_max_cad?: number | null;
  deadline_notes?: string;
  intake_frequency?: string;
  use_case?: string[];
  tech_domains?: string[];
  production_systems?: string[];
  cohort_based?: boolean;
  mentorship?: boolean;
  language?: "en" | "fr" | "bilingual";
}

export interface KnowledgeCanonical {
  title?: string;
  body?: string;
  tags?: string[];
  province?: string[];
  language?: "en" | "fr" | "bilingual";
}

export interface MentionedPerson {
  name?: string;
  linkedin_url?: string;
  organization?: string;
  role_title?: string;
}

export interface CanonicalData {
  schema_version: 1;
  program?: ProgramCanonical;
  knowledge?: KnowledgeCanonical;
  author?: AuthorCanonical;
  mentioned_people?: MentionedPerson[];
}

export interface ClassifierOutput {
  classification: Classification;
  confidence: Confidence;
  reasoning: string;
  canonical_data: CanonicalData;
}
