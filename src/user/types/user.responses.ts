import { UserType } from './user.type';

export interface IAuthResponse {
  user: UserType & { token: string };
}

export interface IUserResponse {
  user: UserType;
}
