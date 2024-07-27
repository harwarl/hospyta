import { PostType } from './post.type';

export type CommentType = PostType & { comment: string };
