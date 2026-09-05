import { z } from "zod";
import { logger } from "@/lib/logger";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1).default("file:./dev.db"),
  OTP_PROVIDER: z.enum(["dev"]).default("dev"),
  APP_ORIGIN: z.string().url().or(z.literal("")).optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  TRUST_PROXY: z
    .enum(["true", "1", "false", "0"])
    .default("false")
    .transform((v) => v === "true" || v === "1"),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
  const messages = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  if (process.env.NODE_ENV === "production") {
    throw new Error(`Invalid or missing environment variables: ${messages}`);
  }

  logger.warn(
    "env",
    `invalid environment variables, using defaults: ${messages}`,
  );
}

export const env = result.success
  ? result.data
  : EnvSchema.parse({ NODE_ENV: process.env.NODE_ENV ?? "development" });

export const isProduction = env.NODE_ENV === "production";
