import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

export interface RCAResponse {
  equipment_tag: string;
  rca_report: string; // Markdown formatted report
}

export interface GapDetail {
  description: string;
  severity: string; // "High" | "Medium" | "Low"
  section: string | null;
}

export interface ComplianceResponse {
  regulation: string;
  status: string; // "COMPLIANT" | "NON_COMPLIANT" | "DEGRADED"
  gaps: GapDetail[];
}

export const agentsApi = {
  /**
   * Run Root Cause Analysis for a given equipment tag.
   * Retrieves relevant docs from vector store and generates an RCA markdown report via LLM.
   * POST /api/agents/rca
   * Body: { equipment_tag: string }
   * Returns: { equipment_tag, rca_report (markdown string) }
   */
  runRCA: (equipmentTag: string): Promise<RCAResponse> =>
    apiClient.post<RCAResponse>(API_ENDPOINTS.agents.rca, { equipment_tag: equipmentTag }),

  /**
   * Run a regulatory compliance check against indexed SOPs and inspection records.
   * POST /api/agents/compliance-check
   * Body: { regulation: string } e.g. "Factory Act", "OISD"
   * Returns: { regulation, status, gaps }
   */
  checkCompliance: (regulation: string): Promise<ComplianceResponse> =>
    apiClient.post<ComplianceResponse>(API_ENDPOINTS.agents.complianceCheck, { regulation }),
};
