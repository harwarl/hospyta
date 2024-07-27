import { Post } from '../entities/post.entity';

export type PostType = Omit<Post, 'updated_at'>;
