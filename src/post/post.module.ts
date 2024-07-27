import { Module } from '@nestjs/common';
import { Comment } from './entities/comment.entity';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { User } from 'src/user/entities/user.entity';
import { Reply } from './entities/reply.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, Comment, Reply])],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
