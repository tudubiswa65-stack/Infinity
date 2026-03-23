import { createClient, SupabaseClient } from "@supabase/supabase-js";

let anonClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

export function createSupabaseClient(role: "anon" | "service"): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (role === "anon") {
    if (!anonClient) {
      anonClient = createClient(url, anonKey);
    }
    return anonClient;
  }

  // Service role for inserts (bypasses RLS if needed, but we also have open policies)
  // Falls back to anon if no service key set (open RLS policies handle it)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? anonKey;
  if (!serviceClient) {
    serviceClient = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }
  return serviceClient;
}
