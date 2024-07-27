import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IAuthResponse, IUserResponse } from './types/user.responses';
import { LoginUserDto } from './dto';
import { AuthGuard } from './guards/auth.guard';
import { User as UserEntity } from './entities/user.entity';
import { User } from './decorators/user.decorator';
import { ObjectId } from 'typeorm';

@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes()
  async createUser(
    @Body('user') createUserDto: CreateUserDto,
  ): Promise<IAuthResponse> {
    const user = await this.userService.createUser(createUserDto);
    delete user.password;
    return this.userService.buildAuthResponse(user);
  }

  @Post('login')
  @UsePipes()
  async loginUser(
    @Body('user') loginUserDto: LoginUserDto,
  ): Promise<IAuthResponse> {
    const user = await this.userService.loginUser(loginUserDto);
    return this.userService.buildAuthResponse(user);
  }

  @Get()
  @UseGuards(AuthGuard)
  async currentUser(@User() user: UserEntity): Promise<IAuthResponse> {
    return this.userService.buildAuthResponse(user);
  }

  @Put()
  @UseGuards(AuthGuard)
  async updateCurrentUser(
    @User('_id') currentUserId: ObjectId,
    @Body('user') updateUserDto: UpdateUserDto,
  ): Promise<IUserResponse> {
    const user = await this.userService.updateUser(
      currentUserId,
      updateUserDto,
    );
    return this.userService.buildUserResponse(user);
  }
}
