import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env";
import { EventParticipantEntity } from "./entities/event-participant.entity";
import { EventEntity } from "./entities/event.entity";
import { UserEntity } from "./entities/user.entity";
import { InitEventsHub2026042800000 } from "./migrations/2026042800000-InitEventsHub";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.databaseUrl,
  synchronize: false,
  logging: false,
  entities: [UserEntity, EventEntity, EventParticipantEntity],
  migrations: [InitEventsHub2026042800000],
});
