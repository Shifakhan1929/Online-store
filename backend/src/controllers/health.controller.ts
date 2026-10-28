import { Request, Response } from 'express';
import { getHealthStatus } from '../services/health.service.js';

export const getHealth = (_req: Request, res: Response): void => {
  const health = getHealthStatus();
  res.json(health);
};
