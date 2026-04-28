import { env } from "./config/env";
import { AppDataSource } from "./db/data-source";
import { TypeOrmEventsRepository } from "./db/typeormEventsRepository";
import { createApp } from "./http/app";

async function main() {
  await AppDataSource.initialize();
  const eventsRepository = new TypeOrmEventsRepository(AppDataSource);
  const app = await createApp({ eventsRepository });

  await app.listen({ host: env.host, port: env.port });

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    await app.close();
    await AppDataSource.destroy();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
