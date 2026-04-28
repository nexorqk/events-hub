import { env } from "./config/env";
import { AppDataSource } from "./db/data-source";
import { TypeOrmEventsRepository } from "./db/typeormEventsRepository";
import { createApp } from "./http/app";

async function main() {
  await AppDataSource.initialize();
  const eventsRepository = new TypeOrmEventsRepository(AppDataSource);
  const app = await createApp({ eventsRepository });

  await app.listen({ host: env.host, port: env.port });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
