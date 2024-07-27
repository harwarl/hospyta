import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity({ name: 'comments' })
export class Comment {
  @ObjectIdColumn()
  _id: string;

  @Column()
  postSlug: string;

  @Column()
  userId: string;

  @Column()
  text: string;

  // @OneToMany(() => Reply, (reply) => reply.comment)
  @Column({ default: [] })
  replies: string[];

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
