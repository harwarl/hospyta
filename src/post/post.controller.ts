import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from 'src/user/decorators/user.decorator';
import { IPostsResponse } from './types/postsReponse.interface';
import { IPostResponse } from './types/postResponse.interface';
import { User as UserEntity } from 'src/user/entities/user.entity';
import { AuthGuard } from 'src/user/guards/auth.guard';
import { DeleteResult } from 'typeorm';
import { ICommentResponse } from './types/commentResponse.interface';
import { Reply } from './entities/reply.entity';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getAllPosts(
    @User('_id') currentUserId: string,
    @Query() query: any,
  ): Promise<IPostsResponse> {
    return await this.postService.findAll(currentUserId, query);
  }

  /* -------------------------------------------------------------------------------------------------
   * POST CRUD
   * -----------------------------------------------------------------------------------------------*/

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes()
  async createPost(
    @User() currentUser: UserEntity,
    @Body('post') createPostDto: CreatePostDto,
  ): Promise<IPostResponse> {
    return await this.postService.createPost(currentUser, createPostDto);
  }

  @Get(':slug')
  @UseGuards(AuthGuard)
  async getSinglePost(
    @User('_id') currentUserId: string,
    @Param('slug') slug: string,
  ): Promise<IPostResponse> {
    return await this.postService.getSinglePostBySlug(slug, currentUserId);
  }

  @Put(':slug')
  @UseGuards(AuthGuard)
  @UsePipes()
  async updatePost(
    @User('_id') currentUserId: string,
    @Body('post') updatePostDto: UpdatePostDto,
    @Param('slug') slug: string,
  ): Promise<IPostResponse> {
    return await this.postService.updatePost(
      slug,
      updatePostDto,
      currentUserId,
    );
  }

  @Delete(':slug')
  @UseGuards(AuthGuard)
  async deletePost(
    @User('_id') currentUserId: string,
    @Param('slug') slug: string,
  ): Promise<DeleteResult> {
    return await this.postService.deletePost(currentUserId, slug);
  }

  /* -------------------------------------------------------------------------------------------------
   * COMMENTS
   * -----------------------------------------------------------------------------------------------*/

  @Post(':slug/comment')
  @UseGuards(AuthGuard)
  async commentArticle(
    @User('_id') currentUserId: string,
    @Param('slug') slug: string,
    @Body('comment') comment: { text: string },
  ): Promise<ICommentResponse> {
    return await this.postService.commentPost(
      currentUserId,
      slug,
      comment.text,
    );
  }

  @Delete(':slug/comment/:commentId')
  @UseGuards(AuthGuard)
  async uncommentArticle(
    @User('_id') currentUserId,
    @Param('slug') slug: string,
    @Param('commentId') commentId: string,
  ): Promise<IPostResponse> {
    return await this.postService.uncommentPost(currentUserId, slug, commentId);
  }

  /* -------------------------------------------------------------------------------------------------
   * LIKES AND DISLIKES
   * -----------------------------------------------------------------------------------------------*/

  @Post(':slug/like')
  @UseGuards(AuthGuard)
  async likeArticle(
    @User('_id') currentUserId: string,
    @Param('slug') slug: string,
  ): Promise<IPostResponse> {
    return await this.postService.likePost(currentUserId, slug);
  }

  @Delete(':slug/dislike')
  @UseGuards(AuthGuard)
  async unlikeArticle(
    @User('_id') currentUserId: string,
    @Param('slug') slug: string,
  ): Promise<IPostResponse> {
    return await this.postService.dislikePost(currentUserId, slug);
  }

  /* -------------------------------------------------------------------------------------------------
   * COMMENT AND REPLIES
   * -----------------------------------------------------------------------------------------------*/
  @Post(':slug/comment/:commentId/reply')
  @UseGuards(AuthGuard)
  async replyComment(
    @User('_id') currentUserId: string,
    @Param('commentId') commentId: string,
    @Body('reply') reply: { reply: string },
  ): Promise<Reply> {
    return await this.postService.addReply(
      commentId,
      currentUserId,
      reply.reply,
    );
  }

  @Delete(':slug/comment/:commentId/reply/:replyId')
  @UseGuards(AuthGuard)
  async deleteReply(
    @User('_id') currentUserId: string,
    @Param('commentId') commentId: string,
    @Param('replyId') replyId: string,
  ): Promise<DeleteResult> {
    return await this.postService.deleteReply(
      commentId,
      currentUserId,
      replyId,
    );
  }
}
