import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { EventEntity } from "./event.entity";
import { EventParticipantEntity } from "./event-participant.entity";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120, unique: true })
  name!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => EventEntity, (event) => event.createdBy)
  events!: EventEntity[];

  @OneToMany(() => EventParticipantEntity, (participant) => participant.user)
  participations!: EventParticipantEntity[];
}
