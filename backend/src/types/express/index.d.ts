import { Role } from '@shared/types';

declare global {
  namespace Express {
    export interface Request {
      user?: {
        userId: string;
        role: Role;
      };
    }
  }
}
