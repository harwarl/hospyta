import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Comment } from './comment.entity';

@Entity({ name: 'commentReplies' })
export class Reply {
  @PrimaryGeneratedColumn()
  _id: string;

  @Column()
  commentId: string;

  @Column()
  userId: string;

  @Column()
  text: string;

  @ManyToOne(() => Comment, (comment) => comment.replies, { eager: true })
  comment: Comment;

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
