// src/types/express/index.d.ts
declare namespace Express {
  interface User {
    id: string;
    email: string;
  }

  interface Request {
    user?: User;
  }
}
