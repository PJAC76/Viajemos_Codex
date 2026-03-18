export const env = {
  insforgeBaseUrl: import.meta.env.VITE_INSFORGE_BASE_URL ?? "",
  insforgeAnonKey: import.meta.env.VITE_INSFORGE_ANON_KEY ?? "",
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ""
};

export const isTestEnv = import.meta.env.MODE === "test";
export const hasInsforgeEnv = !isTestEnv && Boolean(env.insforgeBaseUrl && env.insforgeAnonKey);
export const hasGoogleMapsEnv = Boolean(env.googleMapsApiKey);
