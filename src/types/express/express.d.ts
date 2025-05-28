import { Request } from 'express';

declare module 'express' {
  export interface Request {
    user?: any; // or use a proper User type
  }
}
