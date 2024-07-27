import { Post } from 'src/post/entities/post.entity';
import {
  Entity,
  ObjectId,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { hash } from 'bcrypt';
import { Comment } from 'src/post/entities/comment.entity';
import { Reply } from 'src/post/entities/reply.entity';

@Entity()
export class User {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({ type: 'string', default: '' })
  firstName: string;

  @Column({ type: 'string', default: '' })
  lastName: string;

  @Column({ type: 'string', unique: true })
  username: string;

  @Column({ type: 'string' })
  password: string;

  @Column({ type: 'string', unique: true })
  email: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  @Column({ type: 'string', default: '' })
  bio: string;

  @Column({ type: 'string', default: '' })
  profilePic: string;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @ManyToMany(() => Post, (Post) => Post.favouritedBy)
  @JoinTable()
  favourites: Post[];

  @ManyToMany(() => Comment, (comment) => comment.userId)
  @JoinTable()
  comments: Comment[];

  @ManyToMany(() => Reply, (replies) => replies.userId)
  @JoinTable()
  replies: Reply[];

  @BeforeInsert()
  async hashPassword() {
    this.password = await hash(this.password, 10);
  }
}
