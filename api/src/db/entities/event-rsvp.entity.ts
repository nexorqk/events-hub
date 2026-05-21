import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { EventEntity } from "./event.entity";
import { UserEntity } from "./user.entity";

export type RsvpStatus = "going" | "maybe" | "not_going";

@Entity({ name: "event_rsvps" })
export class EventRsvpEntity {
  @PrimaryColumn({ name: "event_id", type: "uuid" })
  eventId!: string;

  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "varchar", length: 20, default: "going" })
  status!: RsvpStatus;

  @ManyToOne(() => EventEntity, (event) => event.rsvps, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: EventEntity;

  @ManyToOne(() => UserEntity, (user) => user.rsvps, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  @CreateDateColumn({ name: "responded_at", type: "timestamptz" })
  respondedAt!: Date;
}
