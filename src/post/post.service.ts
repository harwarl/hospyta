import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { DeleteResult, MongoRepository } from 'typeorm';
import { Post } from './entities/post.entity';
import { IPostsResponse } from './types/postsReponse.interface';
import { IPostResponse } from './types/postResponse.interface';
import { CreatePostDto, UpdatePostDto } from './dto';
import slugify from 'slugify';
import { ICommentResponse } from './types/commentResponse.interface';
import { Reply } from './entities/reply.entity';
import { Comment } from './entities/comment.entity';
import { ObjectId } from 'mongodb';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: MongoRepository<User>,
    @InjectRepository(Post)
    private readonly postRepository: MongoRepository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepository: MongoRepository<Comment>,
    @InjectRepository(Reply)
    private readonly replyRepository: MongoRepository<Reply>,
  ) {}

  async findAll(currentUserId: string, query: any): Promise<IPostsResponse> {
    const pipeline = [];
    if (query.category) {
      pipeline.push({
        $match: {
          categories: {
            $regex: query.category,
            $options: 'i',
          },
        },
      });
    }

    if (query.author) {
      const author = await this.userRepository.findOne({
        where: { username: query.author },
      });
      if (author) {
        pipeline.push({
          $match: {
            authorId: author._id,
          },
        });
      }
    }

    pipeline.push({
      $sort: {
        createdAt: -1, // Primary sort by createdAt
        likes: -1, // Secondary sort by likes
      },
    });

    if (query.limit) {
      pipeline.push({
        $limit: query.limit,
      });
    }

    if (query.offset) {
      pipeline.push({
        $skip: query.offset,
      });
    }

    const posts = await this.postRepository.aggregate(pipeline).toArray();
    // const postsWithFavourites = posts.map((post) => {
    //   const likedPosts = favouriteIds.includes(post._id.toString());
    //   return { ...post, liked: likedPosts };
    // });
    return this.buildPostsResponse(posts);
  }
  /* -------------------------------------------------------------------------------------------------
   * POST CRUD
   * -----------------------------------------------------------------------------------------------*/

  async createPost(
    currentUser: User,
    createPostDto: CreatePostDto,
  ): Promise<IPostResponse> {
    const newPost = new Post();
    Object.assign(newPost, createPostDto);
    if (!newPost.categories) {
      newPost.categories = [];
    }

    newPost.slug = this.getSlug(createPostDto.title);
    newPost.author = currentUser;
    newPost.authorId = currentUser._id.toString();
    newPost.likes = 0;
    newPost.dislikes = 0;
    newPost.views = 0;
    const post = await this.postRepository.save(newPost);
    return await this.buildPostResponse(post);
  }

  async updatePost(
    slug: string,
    updatePostDto: UpdatePostDto,
    currentUserId: string,
  ): Promise<IPostResponse> {
    const post = await this.findPostBySlug(slug);

    if (!post) {
      throw new HttpException('Post does not exist', HttpStatus.NOT_FOUND);
    }

    if (post.authorId.toString() !== currentUserId.toString()) {
      throw new HttpException('You are not an author', HttpStatus.UNAUTHORIZED);
    }

    Object.assign(post, updatePostDto);
    post.slug = this.getSlug(updatePostDto.title);
    const updatedPost = await this.postRepository.save(post);
    return await this.buildPostResponse(updatedPost);
  }

  async deletePost(currentUserId: string, slug: string): Promise<DeleteResult> {
    const post = await this.findPostBySlug(slug);
    if (!post) {
      throw new HttpException('Post does not exist', HttpStatus.NOT_FOUND);
    }
    if (post.author._id.toString() !== currentUserId.toString())
      throw new HttpException('You are not an author', HttpStatus.NOT_FOUND);

    return await this.postRepository.delete({ slug: slug });
  }

  async getSinglePostBySlug(
    slug: string,
    currentUserId: string,
  ): Promise<IPostResponse> {
    const post = await this.findPostBySlug(slug);
    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }
    if (!post.views) {
      post.views = 0;
    } else {
      if (currentUserId !== post.authorId) {
        post.views++;
      }
    }
    const savedPost = await this.postRepository.save(post);

    return await this.buildPostResponse(savedPost);
  }
  /* -------------------------------------------------------------------------------------------------
   * LIKES FUNCTIONS
   * -----------------------------------------------------------------------------------------------*/

  async likePost(currentUserId: string, slug: string): Promise<IPostResponse> {
    const post = await this.findBySlug(slug);
    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    const user = await this.userRepository.findOne({
      where: { _id: new ObjectId(currentUserId) },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.favourites) {
      user.favourites = [];
    }

    const isAlreadyFavourited = user.favourites.some(
      (favPost) => favPost._id.toString() === post._id.toString(),
    );

    if (!isAlreadyFavourited) {
      user.favourites.push(post);
      post.likes = (post.likes || 0) + 1;
    }

    await this.userRepository.save(user);
    await this.postRepository.save(post);

    return await this.buildPostResponse(post);
  }

  /* -------------------------------------------------------------------------------------------------
   * DISLIKES FUNCTIONS
   * -----------------------------------------------------------------------------------------------*/

  async dislikePost(
    currentUserId: string,
    slug: string,
  ): Promise<IPostResponse> {
    const post = await this.findBySlug(slug);
    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    const user = await this.userRepository.findOne({
      where: { _id: new ObjectId(currentUserId) },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.dislikes) {
      user.dislikes = [];
    }

    const likedPostIndex = user.favourites.findIndex(
      (likedPost) => likedPost._id.toString() === post._id.toString(),
    );

    const dislikePostIndex = user.dislikes.findIndex(
      (dislikedPost) => dislikedPost._id.toString() === post._id.toString(),
    );

    if (likedPostIndex >= 0) {
      user.favourites.splice(likedPostIndex, 1);
      post.likes = (post.likes || 0) - 1;
    }

    if (dislikePostIndex < 0) {
      user.dislikes.push(post);
      post.dislikes = (post.dislikes || 0) + 1;
    }

    await this.userRepository.save(user);
    await this.postRepository.save(post);

    return await this.buildPostResponse(post);
  }

  /* -------------------------------------------------------------------------------------------------
   * COMMENT FUNCTIONS
   * -----------------------------------------------------------------------------------------------*/

  async commentPost(
    currentUserId: string,
    slug: string,
    text: string,
  ): Promise<ICommentResponse> {
    const post = await this.findBySlug(slug);

    const commentExists = await this.commentRepository.findOne({
      where: {
        postSlug: slug,
        commenterId: currentUserId,
      },
    });

    let comment;
    if (!commentExists) {
      console.log('Creating new comment');
      const commentOnPost = new Comment();
      Object.assign(commentOnPost, {
        postSlug: post.slug,
        userId: currentUserId.toString(),
        text,
        replies: [],
      });
      comment = await this.commentRepository.save(commentOnPost);
    } else {
      commentExists.text = text;
      comment = await this.commentRepository.save(commentExists);
    }

    return {
      post,
      comment: comment.text,
    };
  }

  async uncommentPost(
    currentUserId: string,
    slug: string,
    commentId: string,
  ): Promise<IPostResponse> {
    const post = await this.findBySlug(slug);

    const commentExists = await this.commentRepository.findOne({
      where: {
        _id: new ObjectId(commentId),
      },
    });

    if (!commentExists) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    await this.commentRepository.delete({ _id: commentExists._id });

    return await this.buildPostResponse(post);
  }

  /* -------------------------------------------------------------------------------------------------
   * REPLY FUNCTIONS
   * -----------------------------------------------------------------------------------------------*/

  async addReply(commentId: string, currentUserId: string, text: string) {
    const comment = await this.findCommentById(commentId);

    const reply = new Reply();
    reply.comment = comment._id;
    reply.commentId = comment._id.toString();
    reply.userId = currentUserId.toString();
    reply.text = text;
    const savedReply = await this.replyRepository.save(reply);
    comment.replies.push(savedReply._id);
    console.log(comment.replies);
    await this.commentRepository.save(comment);
    return reply;
  }

  async deleteReply(
    commentId: string,
    currentUserId: string,
    replyId: string,
  ): Promise<DeleteResult> {
    const comment = await this.findCommentById(commentId);
    const reply = await this.findReplyById(replyId);
    //find the replyId index
    const replyIndex = comment.replies.findIndex((reply) => {
      reply.toString() === replyId;
    });

    if (replyIndex >= 0) {
      comment.replies.splice(replyIndex, 1);
      await this.commentRepository.save(comment);
    }

    return await this.replyRepository.delete({ _id: reply._id });
  }
  /* -------------------------------------------------------------------------------------------------
   * HELPER FUNCTIONS
   * -----------------------------------------------------------------------------------------------*/

  async getCommentByPostSlug(slug: string): Promise<Comment[]> {
    const comments = await this.commentRepository.find({
      where: {
        postSlug: slug,
      },
    });

    if (!comments) return [];
    return comments;
  }
  async findReplyById(replyId: string): Promise<Reply> {
    const reply = await this.replyRepository.findOne({
      where: {
        _id: new ObjectId(replyId),
      },
    });

    if (!reply) {
      throw new HttpException('Reply does not exist', HttpStatus.NOT_FOUND);
    }
    return reply;
  }

  async findCommentById(commentId: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: {
        _id: new ObjectId(commentId),
      },
    });

    if (!comment) {
      throw new HttpException('Comment does not exist', HttpStatus.NOT_FOUND);
    }
    return comment;
  }

  async findBySlug(slug: string): Promise<Post> {
    const post = await this.findPostBySlug(slug);
    if (!post) {
      throw new HttpException('Post does not exist', HttpStatus.NOT_FOUND);
    }
    return post;
  }

  private async findPostBySlug(slug: string): Promise<Post> {
    return await this.postRepository.findOne({
      where: {
        slug: slug,
      },
    });
  }

  private getSlug(title: string): string {
    return (
      slugify(title, { lower: true }) +
      '-' +
      (Math.random() * (Math.pow(36, 6) | 0)).toString(36)
    );
  }

  buildPostsResponse(posts: Post[]): IPostsResponse {
    return {
      posts: posts,
      postsCount: posts.length,
    };
  }

  async buildPostResponse(post: Post): Promise<any> {
    const comments = await this.getCommentByPostSlug(post.slug);
    return { post: post, comments: comments };
  }
}
