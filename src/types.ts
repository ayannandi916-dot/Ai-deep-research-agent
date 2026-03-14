// ─── Research Session ───────────────────────────────────────────────────────

export type ResearchStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface ResearchSession {
  id: string;
  query: string;
  status: ResearchStatus;
  budgetUSDC: number;         // total budget in USDC (e.g. 1.00)
  spentUSDC: number;          // running total spent
  createdAt: string;          // ISO timestamp
  completedAt?: string;
  report?: string;            // final markdown report
  error?: string;
}

// ─── Payment / X-402 ────────────────────────────────────────────────────────

export type PaymentStatus = "pending" | "success" | "failed";

export interface PaymentEvent {
  id: string;
  sessionId: string;
  agentName: string;          // e.g. "web-search", "news", "academic"
  endpoint: string;           // URL that required payment
  amountUSDC: number;
  status: PaymentStatus;
  txHash?: string;
  createdAt: string;
}

// ─── Agent ──────────────────────────────────────────────────────────────────

export type AgentName = "web-search" | "news" | "academic" | "synthesizer";

export interface AgentResult {
  agentName: AgentName;
  content: string;
  sources: string[];
  paymentEvents: PaymentEvent[];
  tokensUsed?: number;
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

export interface OrchestratorInput {
  sessionId: string;
  query: string;
  budgetUSDC: number;
}

export interface OrchestratorOutput {
  sessionId: string;
  agentResults: AgentResult[];
  report: string;
  totalSpentUSDC: number;
}

// ─── API Request / Response shapes ──────────────────────────────────────────

export interface CreateSessionRequest {
  query: string;
  budgetUSDC: number;
}

export interface CreateSessionResponse {
  sessionId: string;
}

export interface GetSessionResponse {
  session: ResearchSession;
  payments: PaymentEvent[];
}