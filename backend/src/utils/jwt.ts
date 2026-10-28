import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UnauthorizedError } from './errors.js';

dotenv.config();

export interface JwtPayload {
  userId: string;
  role: string;
}

export const getJwtSecret = (): Secret => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }
  return secret;
};

export const getJwtExpiresIn = (): string => {
  return process.env.JWT_EXPIRES_IN || '7d';
};

export const generateToken = (payload: JwtPayload, expiresIn?: string): string => {
  const secret = getJwtSecret();
  const options: SignOptions = {
    expiresIn: (expiresIn || getJwtExpiresIn()) as any,
  };
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired');
    }
    throw new UnauthorizedError('Invalid token');
  }
};
