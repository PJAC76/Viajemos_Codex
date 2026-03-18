import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, hasSupabaseEnv } from "../env";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!hasSupabaseEnv) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }

  return supabaseClient;
}
