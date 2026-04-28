import "dotenv/config";

export const env = {
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://events_hub:events_hub_password@localhost:5432/events_hub",
  host: process.env.API_HOST ?? "0.0.0.0",
  port: Number(process.env.API_PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
};
