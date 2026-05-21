import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePasswordAddOAuth2026052100000 implements MigrationInterface {
  name = "RemovePasswordAddOAuth2026052100000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "google_id" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "email" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" varchar(500)`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_google_id" ON "users"("google_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_google_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "password_hash" varchar(255) NOT NULL DEFAULT 'legacy-password-disabled'`);
  }
}
