import { z } from "zod";

// Environment variable schema with validation and detailed error descriptions
const envSchema = z.object({
  OBLIO_API_EMAIL: z
    .email(
      "OBLIO_API_EMAIL must be a valid email address (e.g., user@company.com)",
    )
    .min(1, "OBLIO_API_EMAIL cannot be empty"),
  OBLIO_API_SECRET: z
    .string({
      message:
        "OBLIO_API_SECRET is required. Get it from Oblio > Settings > API and add to .env file.",
    })
    .min(1, "OBLIO_API_SECRET cannot be empty"),
  CIF: z
    .string({
      message:
        "CIF must be a string (e.g., RO12345678). Check your .env file format.",
    })
    .optional()
    .refine((val) => !val || val.length >= 2, {
      message:
        "CIF must be at least 2 characters when provided (e.g., RO12345678)",
    })
    .describe(
      "When set, the server is locked to this company: set_cif is not exposed and documents cannot be created for another CIF",
    ),
  OBLIO_ACCESS: z
    .enum(["read", "write", "full"], {
      message:
        "OBLIO_ACCESS must be one of: read (default), write, full",
    })
    .optional()
    .default("read")
    .describe(
      "read: consult only. write: also create, collect, cancel/restore, send to SPV. full: also delete",
    ),
  PORT: z
    .string({
      message:
        "PORT must be a string number (e.g., '3000'). Check your .env file format.",
    })
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => !val || (val >= 1 && val <= 65535), {
      message:
        "PORT must be a valid port number between 1 and 65535 (e.g., '3000')",
    }),
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "debug"])
    .optional()
    .default("info")
    .describe("LOG_LEVEL must be one of: error, warn, info, debug"),
  
  // Optional API timeout in milliseconds
  API_TIMEOUT: z
    .string({
      message: "API_TIMEOUT must be a string number (e.g., '30000'). Check your .env file format."
    })
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 30000)
    .refine((val) => val >= 1000, {
      message: "API_TIMEOUT must be at least 1000ms (1 second). Example: '30000' for 30 seconds"
    })
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates and returns the environment configuration
 */
export function getConfig() {
  return envSchema.parse(process.env);
}
