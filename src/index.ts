export const CONTRACT_VERSION = "1.0.0" as const;

export type ContractVersion = typeof CONTRACT_VERSION;

export type AcademicDocumentType =
  | "proyecto_grado"
  | "tesis"
  | "monografia"
  | "plan_negocio"
  | "factibilidad"
  | "prefactibilidad"
  | "otro";

export type CitationStyle =
  | "APA_7"
  | "IEEE"
  | "VANCOUVER"
  | "CHICAGO"
  | "MLA"
  | "ISO_690"
  | "OTHER";

export type AcademicStyle =
  | "formal_academic"
  | "technical_professional"
  | "business_professional"
  | "institutional_template"
  | "other";

export type ConfidenceLevel = "low" | "medium" | "high";

export type EvidenceSourceType =
  | "academic_paper"
  | "official_statistic"
  | "legal_norm"
  | "market_report"
  | "dataset"
  | "web_page"
  | "interview"
  | "internal_input"
  | "calculation";

export type ValidationStatus = "passed" | "failed" | "warning" | "pending_input";
export type ValidationSeverity = "info" | "warning" | "error" | "blocking";
export type BrainResponseStatus = "completed" | "partial" | "needs_input" | "failed";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type ResultValue =
  | string
  | boolean
  | null
  | QuantitativeValue
  | ResultValue[]
  | { [key: string]: ResultValue };

export interface QuantitativeValue {
  kind: "quantitative_value";
  value: number;
  unit: string;
  label?: string;
  method?: string;
  trace_step_ids: string[];
  evidence_ids: string[];
  assumption_ids?: string[];
}

export interface ProjectEnvelope {
  contract_version: ContractVersion;
  project_id: string;
  user_project_ref: string | null;
  document_type: AcademicDocumentType;
  country: string | null;
  city: string | null;
  university: string | null;
  faculty: string | null;
  career: string | null;
  academic_style: AcademicStyle | string | null;
  citation_style: CitationStyle | string | null;
  language: string;
  currency: string | null;
  topic: string;
  business_idea: string | null;
  sector: string | null;
  project_subtype: string | null;
  phase_id: string;
  phase_goal: string;
  approved_phase_outputs: Record<string, ResultValue>;
  current_inputs: Record<string, JsonValue>;
  assumptions: AssumptionItem[];
  constraints: string[];
  requested_outputs: string[];
}

export interface BrainTask {
  task_id: string;
  name: string;
  instructions: string;
  expected_result_shape?: string;
}

export interface BrainRequest {
  contract_version: ContractVersion;
  request_id: string;
  source_brain: string;
  target_brain: string;
  task: BrainTask;
  envelope: ProjectEnvelope;
  contexts: {
    academic?: AcademicContext;
    business?: BusinessContext;
    financial?: FinancialContext;
    market?: MarketContext;
    document?: DocumentContext;
  };
  upstream_handoff: HandoffBlock[];
  requested_outputs: string[];
  meta: {
    created_at: string;
    correlation_id?: string;
    idempotency_key?: string;
  };
}

export interface BrainResponse {
  contract_version: ContractVersion;
  response_id: string;
  request_id: string;
  brain_id: string;
  status: BrainResponseStatus;
  result: Record<string, ResultValue>;
  trace: TraceStep[];
  evidence: EvidenceItem[];
  assumptions: AssumptionItem[];
  validations: ValidationResult[];
  warnings: ContractWarning[];
  handoff: HandoffBlock[];
  meta: {
    generated_at: string;
    engine_version: string;
    model?: string;
    duration?: string;
  };
}

export interface EvidenceItem {
  evidence_id: string;
  source_type: EvidenceSourceType;
  title: string;
  source_name: string;
  citation: string;
  url: string | null;
  locator: string | null;
  published_at: string | null;
  accessed_at: string | null;
  notes?: string;
}

export interface TraceStep {
  trace_step_id: string;
  brain_id: string;
  action: string;
  rationale: string;
  input_refs: string[];
  output_refs: string[];
  evidence_ids: string[];
  assumption_ids: string[];
  depends_on: string[];
  timestamp: string;
}

export interface AssumptionItem {
  assumption_id: string;
  statement: string;
  type: "academic" | "business" | "financial" | "market" | "document" | "technical" | "other";
  confidence: ConfidenceLevel;
  required_validation: boolean;
  affects_outputs: string[];
}

export interface HandoffBlock {
  handoff_id: string;
  from_brain: string;
  to_brains: string[];
  purpose: string;
  feeds_phase_ids: string[];
  payload_refs: string[];
  payload: Record<string, ResultValue>;
  required_inputs: string[];
  expected_outputs: string[];
  blocking: boolean;
}

export interface ValidationResult {
  validation_id: string;
  validator: string;
  status: ValidationStatus;
  severity: ValidationSeverity;
  message: string;
  affected_paths: string[];
  pending_input?: string;
  trace_step_ids: string[];
  evidence_ids: string[];
}

export interface ContractWarning {
  warning_id: string;
  code: string;
  severity: "info" | "warning" | "blocking";
  message: string;
  pending_input?: string;
  affected_paths: string[];
}

export interface AcademicContext {
  country?: string | null;
  city?: string | null;
  university?: string | null;
  faculty?: string | null;
  career?: string | null;
  academic_style?: AcademicStyle | string | null;
  citation_style?: CitationStyle | string | null;
  language?: string;
  document_type?: AcademicDocumentType;
  institutional_rules?: string[];
  advisor_notes?: string[];
}

export interface BusinessContext {
  business_idea?: string | null;
  sector?: string | null;
  value_proposition?: string | null;
  target_customers?: string[];
  channels?: string[];
  revenue_model?: string | null;
  key_partners?: string[];
}

export interface FinancialContext {
  currency?: string | null;
  planning_horizon?: string | null;
  revenue_assumptions?: Record<string, ResultValue>;
  cost_assumptions?: Record<string, ResultValue>;
  investment_assumptions?: Record<string, ResultValue>;
  required_indicators?: string[];
}

export interface MarketContext {
  geography?: string | null;
  sector?: string | null;
  customer_segments?: string[];
  competitors?: string[];
  data_sources?: string[];
  demand_hypotheses?: string[];
}

export interface DocumentContext {
  document_type?: AcademicDocumentType;
  section_id?: string | null;
  section_title?: string | null;
  outline_path?: string[];
  current_draft?: string | null;
  required_format?: string | null;
  citation_style?: CitationStyle | string | null;
  academic_style?: AcademicStyle | string | null;
}

export const DOCUMENT_TYPES: AcademicDocumentType[] = [
  "proyecto_grado",
  "tesis",
  "monografia",
  "plan_negocio",
  "factibilidad",
  "prefactibilidad",
  "otro"
];

export const SCHEMA_IDS = {
  root: "https://academic-brains-contract.dev/schemas/academic-brains-contract.schema.json",
  projectEnvelope: "https://academic-brains-contract.dev/schemas/project-envelope.schema.json",
  brainRequest: "https://academic-brains-contract.dev/schemas/brain-request.schema.json",
  brainResponse: "https://academic-brains-contract.dev/schemas/brain-response.schema.json"
} as const;
