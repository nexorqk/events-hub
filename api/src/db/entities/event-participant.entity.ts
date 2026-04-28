import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { EventEntity } from "./event.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "event_participants" })
export class EventParticipantEntity {
  @PrimaryColumn({ name: "event_id", type: "uuid" })
  eventId!: string;

  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => EventEntity, (event) => event.participants, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: EventEntity;

  @ManyToOne(() => UserEntity, (user) => user.participations, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
