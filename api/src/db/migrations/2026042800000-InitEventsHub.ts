import { MigrationInterface, QueryRunner } from "typeorm";

export class InitEventsHub2026042800000 implements MigrationInterface {
  name = "InitEventsHub2026042800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL UNIQUE,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" varchar(160) NOT NULL,
        "description" text NOT NULL,
        "starts_at" timestamptz NOT NULL,
        "location" varchar(200) NOT NULL,
        "created_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_events_created_by_user_id" ON "events" ("created_by_user_id")`);

    await queryRunner.query(`
      CREATE TABLE "event_participants" (
        "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("event_id", "user_id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_event_participants_user_id" ON "event_participants" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "event_participants"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
