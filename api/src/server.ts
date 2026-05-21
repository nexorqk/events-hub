import cors from "@fastify/cors";
import { env } from "./config/env";
import { AppDataSource } from "./db/data-source";
import { TypeOrmEventsRepository } from "./db/typeormEventsRepository";
import { TypeOrmUserRepository } from "./db/typeormUserRepository";
import { createApp } from "./http/app";

async function main() {
  await AppDataSource.initialize();
  const userRepository = new TypeOrmUserRepository(AppDataSource);
  const eventsRepository = new TypeOrmEventsRepository(AppDataSource);
  const app = await createApp({
    userRepository,
    eventsRepository,
    configureApp: async (app) => {
      await app.register(cors, {
        origin: true,
        methods: ["GET", "POST", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      });
    },
  });

  await app.listen({ host: env.host, port: env.port });

  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    app.log.info(`Received ${signal}, shutting down gracefully...`);

    try {
      await app.close();
      await AppDataSource.destroy();
    } catch (error) {
      app.log.error(error);
      process.exit(1);
    }

    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
