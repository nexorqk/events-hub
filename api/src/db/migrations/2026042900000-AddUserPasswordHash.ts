import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserPasswordHash2026042900000 implements MigrationInterface {
  name = "AddUserPasswordHash2026042900000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "password_hash" varchar(255)`);
    await queryRunner.query(`UPDATE "users" SET "password_hash" = 'legacy-password-disabled'`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
  }
}
