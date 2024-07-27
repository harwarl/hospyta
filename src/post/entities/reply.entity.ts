import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { Comment } from './comment.entity';

@Entity({ name: 'commentReplies' })
export class Reply {
  @ObjectIdColumn()
  _id: string;

  @Column()
  commentId: string;

  @Column()
  userId: string;

  @Column()
  text: string;

  @Column()
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
