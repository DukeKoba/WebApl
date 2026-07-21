export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          role: "reader" | "editor" | "admin";
          plan: "free" | "premium" | "enterprise";
          stripe_customer_id: string | null;
          org_id: string | null;
          preferences: {
            categories?: string[];
            frequency?: "daily" | "weekly" | "none";
            newsletter?: boolean;
          } | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          role?: "reader" | "editor" | "admin";
          plan?: "free" | "premium" | "enterprise";
          stripe_customer_id?: string | null;
          org_id?: string | null;
          preferences?: Json | null;
          created_at?: string;
        };
        Update: {
          display_name?: string | null;
          role?: "reader" | "editor" | "admin";
          plan?: "free" | "premium" | "enterprise";
          stripe_customer_id?: string | null;
          org_id?: string | null;
          preferences?: Json | null;
        };
      };
      bookmarks: {
        Row: {
          user_id: string;
          article_slug: string;
          article_title: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          article_slug: string;
          article_title: string;
          created_at?: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Bookmark = Database["public"]["Tables"]["bookmarks"]["Row"];
