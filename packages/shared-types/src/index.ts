/** Shared TypeScript types used across web and any tooling. */

export interface Scheme {
  id: string;
  name: string;
  ministry: string;
  category: SchemeCategory;
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

export type SchemeCategory =
  | "agriculture"
  | "health"
  | "housing"
  | "education"
  | "employment"
  | "savings"
  | "loan"
  | "insurance"
  | "welfare"
  | "pension";

export interface Right {
  id: string;
  title: string;
  category: RightCategory;
  description: string;
  articles: Article[];
  action_steps: string[];
  created_at: string;
}

export type RightCategory = "fundamental_rights" | "statutory_rights" | "women_rights";

export interface Article {
  number: string;
  title: string;
}

export interface UserProfile {
  state?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  annual_income?: string;
  caste_category?: "general" | "obc" | "sc" | "st" | "ews";
  occupation?: string;
  has_land?: boolean;
  land_area_hectares?: number;
}

export interface MatchedScheme {
  scheme_id: string;
  name: string;
  ministry: string;
  category: SchemeCategory;
  benefit_amount: string | null;
  confidence_score: number;
  match_reasons: string[];
  application_url: string | null;
}

export type SupportedLocale =
  | "en" | "hi" | "ta" | "te" | "mr" | "bn" | "gu" | "kn" | "ml" | "pa";
