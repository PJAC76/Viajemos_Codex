import { createClient } from "@insforge/sdk";
import { env, hasInsforgeEnv } from "../env";

let insforgeClient: ReturnType<typeof createClient> | null = null;

export function getInsforgeClient() {
  if (!hasInsforgeEnv) {
    return null;
  }

  if (!insforgeClient) {
    insforgeClient = createClient({
      baseUrl: env.insforgeBaseUrl,
      anonKey: env.insforgeAnonKey
    });
  }

  return insforgeClient;
}
