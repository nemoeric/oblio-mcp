import OblioApi, {
  type AccessToken,
  type AccessTokenHandlerInterface,
} from "@obliosoftware/oblioapi";
import type { EnvConfig } from "./config.js";

/**
 * Keeps the access token in this process only.
 *
 * The SDK's default handler caches it in `<cwd>/storage/.access_token`, in
 * clear, readable by everyone, and never checks which account it belongs to:
 * two servers started from the same directory with different Oblio accounts
 * would pick up each other's token and act on the wrong account.
 */
class MemoryAccessTokenHandler implements AccessTokenHandlerInterface {
  private token: AccessToken | null = null;

  get(): AccessToken {
    const token = this.token;
    const expiresAt = token
      ? Number(token.request_time) + Number(token.expires_in)
      : 0;
    // One minute of margin, so a request never leaves with a token about to expire.
    const valid = expiresAt - 60 > Math.floor(Date.now() / 1000);
    // The SDK's interface says AccessToken, but it treats null as "fetch a new one".
    return (valid ? token : null) as AccessToken;
  }

  set(accessToken: AccessToken): void {
    this.token = accessToken;
  }
}

export function createOblioClient(config: EnvConfig): OblioApi {
  const client = new OblioApi(
    config.OBLIO_API_EMAIL,
    config.OBLIO_API_SECRET,
    new MemoryAccessTokenHandler(),
  );

  if (config.CIF) {
    client.setCif(config.CIF);
  }

  return client;
}

// The SDK rejects the "einvoice" type in createDoc/get, parses every response
// as JSON (the SPV archive is a file) and has no deleteCollect: these calls go
// through its authenticated HTTP client instead.

export async function sendEinvoice(
  client: OblioApi,
  seriesName: string,
  number: number,
) {
  const request = await client.buildRequest();
  const response = await request.post("/api/docs/einvoice", {
    cif: client.getCif(),
    seriesName,
    number,
  });
  client._checkErrorResponse(response);
  return response.data;
}

export async function deleteDocument(
  client: OblioApi,
  type: string,
  seriesName: string,
  number: number,
  deleteCollect = false,
) {
  client._checkType(type);
  const request = await client.buildRequest();
  const response = await request.delete(`/api/docs/${type}`, {
    data: { cif: client.getCif(), seriesName, number, deleteCollect },
  });
  client._checkErrorResponse(response);
  return response.data;
}

export async function getEinvoiceArchive(
  client: OblioApi,
  seriesName: string,
  number: number,
) {
  const token = await client.getAccessToken();
  const query = new URLSearchParams({
    cif: client.getCif(),
    seriesName,
    number: String(number),
  });
  const response = await fetch(`${client._baseURL}/api/docs/einvoice?${query}`, {
    headers: { Authorization: `${token.token_type} ${token.access_token}` },
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("json")) {
    const data = await response.json();
    client._checkErrorResponse({ status: response.status, data });
    return { json: data };
  }
  if (!response.ok) {
    client._checkErrorResponse({ status: response.status, data: {} });
  }
  return {
    file: Buffer.from(await response.arrayBuffer()),
    mimeType: contentType.split(";")[0] || "application/zip",
  };
}
