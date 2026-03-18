export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ""
};

export const hasSupabaseEnv = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const hasGoogleMapsEnv = Boolean(env.googleMapsApiKey);
