import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { JwtModule } from '@nestjs/jwt';
import { JWTSECRET } from 'config';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeOrmConfig from './ormconfig';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    JwtModule.register({
      secret: JWTSECRET,
      signOptions: {
        expiresIn: '30m',
      },
    }),
    UserModule,
    PostModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
