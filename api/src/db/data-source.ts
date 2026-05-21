import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env";
import { EventCommentEntity } from "./entities/event-comment.entity";
import { EventRsvpEntity } from "./entities/event-rsvp.entity";
import { EventEntity } from "./entities/event.entity";
import { UserEntity } from "./entities/user.entity";
import { InitEventsHub2026042800000 } from "./migrations/2026042800000-InitEventsHub";
import { AddUserPasswordHash2026042900000 } from "./migrations/2026042900000-AddUserPasswordHash";
import { RemovePasswordAddOAuth2026052100000 } from "./migrations/2026052100000-RemovePasswordAddOAuth";
import { AddRsvpAndComments2026052100001 } from "./migrations/2026052100001-AddRsvpAndComments";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.databaseUrl,
  uuidExtension: "pgcrypto",
  synchronize: false,
  logging: false,
  entities: [UserEntity, EventEntity, EventRsvpEntity, EventCommentEntity],
  migrations: [
    InitEventsHub2026042800000,
    AddUserPasswordHash2026042900000,
    RemovePasswordAddOAuth2026052100000,
    AddRsvpAndComments2026052100001,
  ],
});
