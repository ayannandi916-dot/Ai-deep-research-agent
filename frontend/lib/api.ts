import type {
  CreateSessionRequest,
  CreateSessionResponse,
  GetSessionResponse,
} from "../../src/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

/** Start a new research session */
export async function startResearch(
  payload: CreateSessionRequest
): Promise<CreateSessionResponse> {
  return apiFetch<CreateSessionResponse>("/api/research", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Fetch session state + payment events */
export async function fetchSession(id: string): Promise<GetSessionResponse> {
  return apiFetch<GetSessionResponse>(`/api/sessions/${id}`);
}