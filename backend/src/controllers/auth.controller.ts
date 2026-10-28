import { Request, Response } from 'express';
import { registerUser, loginUser, getMe } from '../services/auth.service.js';
import { UnauthorizedError } from '../utils/errors.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  const result = await registerUser(req.body);
  res.status(201).json({
    user: result.user,
    token: result.token,
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const result = await loginUser(req.body);
  res.status(200).json({
    user: result.user,
    token: result.token,
  });
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.id) {
    throw new UnauthorizedError('Authentication token is required');
  }

  const user = await getMe(req.user.id);
  res.status(200).json({
    user,
  });
};
