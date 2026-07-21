export type Category = "broker" | "insurer" | "market" | "claims" | "regulation" | "strategy" | "howto";
export type Region = "us" | "uk" | "eu" | "asia" | "jp" | "global";
export type Paywall = "none" | "premium" | "enterprise";

export interface Source {
  id: string;
  name: string;
  url: string;
  kind: "rss" | "api" | "scrape" | "manual";
  region: Region;
  language: "en" | "ja" | "zh";
  trust_score: number;
  active: boolean;
  created_at: string;
}

export interface Candidate {
  id: string;
  source_id?: string;
  url: string;
  title_original?: string;
  excerpt_original?: string;
  fetched_at: string;
  importance_score?: number;
  state: "new" | "drafted" | "rejected" | "published";
  draft_id?: string;
}

export interface Draft {
  id: string;
  candidate_id: string;
  title_jp: string;
  summary_jp: string;
  body_jp: string;
  category: Category;
  region: Region;
  tags: string[];
  related_player_ids: string[];
  ai_model: string;
  generated_at: string;
  state: "pending" | "edited" | "approved" | "rejected";
  candidate?: Candidate;
}

export interface DbArticle {
  id: string;
  slug: string;
  title: string;
  lead_excerpt: string;
  body_md: string;
  category: Category;
  region: Region;
  tags: string[];
  player_ids: string[];
  ai_draft_id?: string;
  editor_id?: string;
  source_links: { outlet: string; url: string }[];
  paywall: Paywall;
  published_at?: string;
  updated_at?: string;
  status: "scheduled" | "published" | "corrected" | "archived";
  view_count: number;
  image_url?: string;
}
