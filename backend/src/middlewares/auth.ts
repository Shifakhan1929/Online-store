import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { prisma } from '../lib/prisma.js';
import { Role } from '../generated/prisma/enums.js';

export interface AuthenticatedUser {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token is required');
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    throw new UnauthorizedError('Authentication token is missing');
  }

  const payload: JwtPayload = verifyToken(token);
  req.user = {
    id: payload.userId,
    role: payload.role,
  };

  next();
};

export const requireAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new UnauthorizedError('Authentication token is required');
  }

  // Confirm the authenticated user's current role using trusted server-side data
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new UnauthorizedError('User account not found');
  }

  if (user.role !== Role.ADMIN) {
    throw new ForbiddenError('Admin access required');
  }

  req.user.role = user.role;
  next();
};

