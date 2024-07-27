import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Reply } from './reply.entity';

@Entity({ name: 'comments' })
export class Comment {
  @PrimaryGeneratedColumn()
  _id: number;

  @Column()
  postSlug: string;

  @Column()
  userId: string;

  @Column()
  text: string;

  @Column()
  @OneToMany(() => Reply, (reply) => reply.comment)
  replies: Reply[];

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
