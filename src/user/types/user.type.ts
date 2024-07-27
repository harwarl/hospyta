import { User } from '../entities/user.entity';

export type UserType = Omit<User, 'hashPassword'>;
