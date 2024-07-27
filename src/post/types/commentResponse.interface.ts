import { Post } from '../entities/post.entity';

export interface ICommentResponse {
  post: Post;
  comment: string;
}
