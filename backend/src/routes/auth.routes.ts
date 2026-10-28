import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', validateBody(registerSchema), asyncHandler(register));
router.post('/login', validateBody(loginSchema), asyncHandler(login));
router.get('/me', authenticate, asyncHandler(getCurrentUser));

export default router;
