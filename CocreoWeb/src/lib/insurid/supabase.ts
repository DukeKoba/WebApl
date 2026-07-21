import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy singletons — created on first access so build-time evaluation
// doesn't throw when env vars are not yet set.
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}. Set it in .env.local`);
  return v;
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    );
  }
  return _supabase;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    _supabaseAdmin = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _supabaseAdmin;
}

// Convenience shorthands used in API routes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as SupabaseClient, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: (_, prop) => (getSupabase() as any)[prop],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: (_, prop) => (getSupabaseAdmin() as any)[prop],
});
