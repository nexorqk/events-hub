import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRsvpAndComments2026052100001 implements MigrationInterface {
  name = "AddRsvpAndComments2026052100001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // RSVP table (replaces/extends event_participants)
    await queryRunner.query(`
      CREATE TABLE "event_rsvps" (
        "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "status" varchar(20) NOT NULL DEFAULT 'going',
        "responded_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("event_id", "user_id")
      )
    `);

    // Migrate existing participants as 'going'
    await queryRunner.query(`
      INSERT INTO "event_rsvps" ("event_id", "user_id", "status")
      SELECT "event_id", "user_id", 'going' FROM "event_participants"
    `);

    await queryRunner.query(`DROP TABLE "event_participants"`);

    // Comments table
    await queryRunner.query(`
      CREATE TABLE "event_comments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "content" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_comments_event_id" ON "event_comments"("event_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_comments_created_at" ON "event_comments"("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_comments_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_comments_event_id"`);
    await queryRunner.query(`DROP TABLE "event_comments"`);

    await queryRunner.query(`
      CREATE TABLE "event_participants" (
        "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("event_id", "user_id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "event_participants" ("event_id", "user_id")
      SELECT "event_id", "user_id" FROM "event_rsvps" WHERE "status" = 'going'
    `);

    await queryRunner.query(`DROP TABLE "event_rsvps"`);
  }
}
