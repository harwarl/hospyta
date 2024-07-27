import { Comment } from '../entities/comment.entity';
import { Post } from '../entities/post.entity';

export interface IPostResponse {
  post: Post;
  comments: Comment[];
}
