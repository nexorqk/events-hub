import "dotenv/config";

export type Env = {
  databaseUrl: string;
  host: string;
  port: number;
  jwtSecret: string;
};

export function validateEnv(source: NodeJS.ProcessEnv): Env {
  const databaseUrl =
    source.DATABASE_URL ?? "postgres://events_hub:events_hub_password@localhost:5432/events_hub";
  const host = source.API_HOST ?? "0.0.0.0";
  const rawPort = source.API_PORT ?? "3000";
  const jwtSecret = source.JWT_SECRET ?? "dev-only-secret-change-me";

  const port = Number(rawPort);

  if (!databaseUrl.trim()) {
    throw new Error("DATABASE_URL must not be empty");
  }

  if (!host.trim()) {
    throw new Error("API_HOST must not be empty");
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("API_PORT must be an integer between 1 and 65535");
  }

  if (!jwtSecret.trim()) {
    throw new Error("JWT_SECRET must not be empty");
  }

  return {
    databaseUrl,
    host,
    port,
    jwtSecret,
  };
}

export const env = validateEnv(process.env);
