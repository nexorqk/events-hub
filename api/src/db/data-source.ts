import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env";
import { EventParticipantEntity } from "./entities/event-participant.entity";
import { EventEntity } from "./entities/event.entity";
import { UserEntity } from "./entities/user.entity";
import { InitEventsHub2026042800000 } from "./migrations/2026042800000-InitEventsHub";
import { AddUserPasswordHash2026042900000 } from "./migrations/2026042900000-AddUserPasswordHash";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.databaseUrl,
  uuidExtension: "pgcrypto",
  synchronize: false,
  logging: false,
  entities: [UserEntity, EventEntity, EventParticipantEntity],
  migrations: [InitEventsHub2026042800000, AddUserPasswordHash2026042900000],
});
