import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { DeleteResult, MongoRepository, ObjectId } from 'typeorm';
import { Post } from './entities/post.entity';
import { IPostsResponse } from './types/postsReponse.interface';
import { IPostResponse } from './types/postResponse.interface';
import { CreatePostDto, UpdatePostDto } from './dto';
import slugify from 'slugify';
import { ICommentResponse } from './types/commentResponse.interface';
import { Reply } from './entities/reply.entity';
import { Comment } from './entities/comment.entity';

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
      $sort: { createdAt: -1 },
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

    let favouriteIds: string[] = [];
    if (currentUserId) {
      const currentUser = await this.userRepository.findOne({
        where: { _id: currentUserId },
        relations: ['favourites'],
      });
      favouriteIds = currentUser.favourites.map((favourite) =>
        favourite._id.toString(),
      );
    }

    const posts = await this.postRepository.aggregate(pipeline).toArray();
    const postsWithFavourites = posts.map((post) => {
      const likedPosts = favouriteIds.includes(post._id.toString());
      return { ...post, liked: likedPosts };
    });
    return this.buildPostsResponse(postsWithFavourites);
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
    if (post.author._id.toString() !== currentUserId) {
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
    if (post.author._id.toString() !== currentUserId)
      throw new HttpException('You are not an author', HttpStatus.NOT_FOUND);

    return await this.postRepository.delete({ slug: slug });
  }

  async getSinglePostBySlug(slug: string): Promise<IPostResponse> {
    const post = await this.findPostBySlug(slug);
    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }
    post.views += 1;
    const savedPost = await this.postRepository.save(post);

    return await this.buildPostResponse(savedPost);
  }
  /* -------------------------------------------------------------------------------------------------
   * LIKES FUNCTIONS
   * -----------------------------------------------------------------------------------------------*/

  async likePost(currentUserId: string, slug: string): Promise<IPostResponse> {
    const post = await this.findBySlug(slug);
    const user = await this.userRepository.findOne({
      where: { _id: new ObjectId(currentUserId) },
      relations: ['favourites'],
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const isNotFavourited =
      user.favourites.findIndex((favPost) => {
        favPost._id.toString() === post._id.toString();
      }) === -1;

    if (isNotFavourited) {
      //Update user and post
      user.favourites.push(post);
      post.likes += 1;
      await this.userRepository.save(user);
      await this.postRepository.save(post);
    }

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
    const user = await this.userRepository.findOne({
      where: { _id: new ObjectId(currentUserId) },
      relations: ['favourites'],
    });

    //check if post is liked by the user
    const likedPostIndex = user.favourites.findIndex((likedPost) => {
      likedPost._id.toString() === post._id.toString();
    });

    //if Post is already liked by the user
    if (likedPostIndex >= 0) {
      user.favourites.splice(likedPostIndex, 1);
      post.dislikes += 1;
      post.likes -= 1;
      await this.userRepository.save(user);
      await this.postRepository.save(post);
    } else {
      post.dislikes += 1;
      await this.postRepository.save(post);
    }

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

    if (!commentExists) {
      const commentOnPost = new Comment();
      commentOnPost.postSlug = post.slug;
      commentOnPost.userId = currentUserId;
      commentOnPost.text = text;
      await this.commentRepository.save(commentOnPost);
    } else {
      commentExists['text'] = text;
      await this.commentRepository.save(commentExists);
    }

    return {
      post,
      comment: commentExists.text,
    };
  }

  async uncommentPost(
    currentUserId: string,
    slug: string,
  ): Promise<IPostResponse> {
    const post = await this.findBySlug(slug);

    const commentExists = await this.commentRepository.findOne({
      where: {
        postSlug: slug,
        commenterId: currentUserId,
      },
    });

    await this.commentRepository.delete({ _id: commentExists._id });

    return await this.buildPostResponse(post);
  }

  /* -------------------------------------------------------------------------------------------------
   * REPLY FUNCTIONS
   * -----------------------------------------------------------------------------------------------*/

  async addReply(commentId: string, currentUserId: string, text: string) {
    const comment = await this.findCommentById(commentId);

    const reply = new Reply();
    reply.comment = comment;
    reply.commentId = comment._id.toString();
    reply.userId = currentUserId;
    reply.text = text;
    const savedReply = await this.replyRepository.save(reply);
    comment.replies.push(savedReply);
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
      reply._id.toString() === replyId;
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
