import { Injectable, NestMiddleware } from '@nestjs/common';
import { ExpressRequest } from 'src/types/expressRequest.interface';
import { UserService } from '../user.service';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}
  async use(
    req: ExpressRequest,
    res: any,
    next: (error?: Error | any) => void,
  ) {
    if (!req.headers.authorization) {
      req.user = null;
      next();
      return;
    }
    //Get token
    const token = req.headers.authorization.split(' ')[1];
    try {
      //   const decoded = verify(token, JWTSECRET);
      const decoded = this.jwtService.verify(token);
      if (typeof decoded === 'object' && 'id' in decoded) {
        const user = await this.userService.findById(new ObjectId(decoded.id)); //call user service in here
        req.user = user;
      } else {
        req.user = null;
      }
      next();
    } catch (error) {
      req.user = null;
      next();
    }
  }
}
