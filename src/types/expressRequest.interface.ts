import { User } from 'src/user/entities/user.entity';

import { Request } from 'express';

export interface ExpressRequest extends Request {
  user?: User;
}
