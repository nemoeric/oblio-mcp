import OblioApi from "@obliosoftware/oblioapi";
import type { EnvConfig } from "./config.js";

export function createOblioClient(config: EnvConfig): OblioApi {
  const client = new OblioApi(
    config.OBLIO_API_EMAIL,
    config.OBLIO_API_SECRET
  );
  
  if (config.CIF) {
    client.setCif(config.CIF);
  }
  
  return client;
}