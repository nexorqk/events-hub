import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { EventEntity } from "./event.entity";
import { EventParticipantEntity } from "./event-participant.entity";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ name: "google_id", type: "varchar", length: 255, nullable: true, unique: true })
  googleId!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null;

  @Column({ name: "avatar_url", type: "varchar", length: 500, nullable: true })
  avatarUrl!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => EventEntity, (event) => event.createdBy)
  events!: EventEntity[];

  @OneToMany(() => EventParticipantEntity, (participant) => participant.user)
  participations!: EventParticipantEntity[];
}
