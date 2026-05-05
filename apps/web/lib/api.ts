/**
 * Typed API client using axios. All calls go through Next.js rewrite → FastAPI.
 */
import axios from "axios";

export const apiClient = axios.create({
  baseURL: typeof window === "undefined"
    ? (process.env.API_URL ?? "http://localhost:8000")
    : "",
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("sahayak_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Types ──────────────────────────────────────────────
export interface Scheme {
  id: string;
  name: string;
  ministry: string;
  category: string;
  level: "central" | "state";
  state_code: string | null;
  description: string;
  benefit_amount: string | null;
  eligibility_criteria: Record<string, unknown>;
  required_documents: string[];
  application_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchemeListResponse {
  items: Scheme[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Right {
  id: string;
  title: string;
  category: string;
  description: string;
  articles: Array<{ number: string; title: string }>;
  action_steps: string[];
  created_at: string;
}

export interface MatchedScheme {
  scheme_id: string;
  name: string;
  ministry: string;
  category: string;
  benefit_amount: string | null;
  confidence_score: number;
  match_reasons: string[];
  application_url: string | null;
}

export interface ProfileData {
  state?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  annual_income?: string;
  caste_category?: "general" | "obc" | "sc" | "st" | "ews";
  occupation?: string;
  has_land?: boolean;
  land_area_hectares?: number;
}

// ── Fetchers ───────────────────────────────────────────
export async function fetchSchemes(params: {
  category?: string;
  state?: string;
  level?: string;
  page?: number;
  limit?: number;
}): Promise<SchemeListResponse> {
  const { data } = await apiClient.get<SchemeListResponse>("/api/schemes", { params });
  return data;
}

export async function fetchScheme(id: string): Promise<Scheme> {
  const { data } = await apiClient.get<Scheme>(`/api/schemes/${id}`);
  return data;
}

export async function fetchRights(category?: string): Promise<Right[]> {
  const { data } = await apiClient.get<Right[]>("/api/rights", {
    params: category ? { category } : {},
  });
  return data;
}

export async function checkEligibility(body: {
  occupation: string;
  annual_income: string;
  caste_category: string;
  has_land: boolean;
  state?: string;
  age?: number;
  gender?: string;
}): Promise<MatchedScheme[]> {
  const { data } = await apiClient.post<MatchedScheme[]>("/api/eligibility/check", body);
  return data;
}

export async function saveProfile(profile: ProfileData): Promise<ProfileData> {
  const { data } = await apiClient.post<ProfileData>("/api/profile", profile);
  return data;
}

export async function fetchProfile(): Promise<ProfileData> {
  const { data } = await apiClient.get<ProfileData>("/api/profile");
  return data;
}
