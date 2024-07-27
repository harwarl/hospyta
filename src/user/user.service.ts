import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { MongoRepository, ObjectId } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { IAuthResponse, IUserResponse } from './types/user.responses';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
import { compare } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: MongoRepository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const userByEmail = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });
    const userByUsername = await this.userRepository.findOneBy({
      username: createUserDto.username,
    });

    if (userByEmail) {
      throw new HttpException(
        'Email has already been taken',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (userByUsername) {
      throw new HttpException(
        'Username has already been taken',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const newUser = new User();
    Object.assign(newUser, createUserDto);
    return await this.userRepository.save(newUser);
  }

  async loginUser(loginUserDto: LoginUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        email: loginUserDto.email,
      },
      select: {
        _id: true,
        username: true,
        email: true,
        profilePic: true,
        bio: true,
        password: true,
      },
    });

    if (!user) {
      throw new HttpException(
        'Credentials are not valid',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isPasswordValid = await compare(loginUserDto.password, user.password);
    if (!isPasswordValid) {
      throw new HttpException(
        'Credentials are not valid',
        HttpStatus.BAD_REQUEST,
      );
    }

    delete user.password;
    return user;
  }

  async updateUser(
    userId: ObjectId,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findById(new ObjectId(userId));
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async findById(id: ObjectId): Promise<User> {
    return await this.userRepository.findOne({
      where: {
        _id: id,
      },
    });
  }

  generateJwt(user: User): string {
    return this.jwtService.sign({
      id: user._id,
      email: user.email,
      username: user.username,
    });
  }

  buildAuthResponse(user: User): IAuthResponse {
    return {
      user: {
        ...user,
        token: this.generateJwt(user),
      },
    };
  }

  buildUserResponse(user: User): IUserResponse {
    return {
      user: user,
    };
  }
}
