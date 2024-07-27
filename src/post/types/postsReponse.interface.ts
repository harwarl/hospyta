import { PostType } from './post.type';

export interface IPostsResponse {
  posts: PostType[];
  postsCount: number;
}
