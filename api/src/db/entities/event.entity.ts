import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { EventRsvpEntity } from "./event-rsvp.entity";
import { EventCommentEntity } from "./event-comment.entity";

@Entity({ name: "events" })
export class EventEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 160 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ name: "starts_at", type: "timestamptz" })
  startsAt!: Date;

  @Column({ type: "varchar", length: 200 })
  location!: string;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId!: string;

  @ManyToOne(() => UserEntity, (user) => user.events, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "created_by_user_id" })
  createdBy!: UserEntity;

  @OneToMany(() => EventRsvpEntity, (rsvp) => rsvp.event)
  rsvps!: EventRsvpEntity[];

  @OneToMany(() => EventCommentEntity, (comment) => comment.event)
  comments!: EventCommentEntity[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
