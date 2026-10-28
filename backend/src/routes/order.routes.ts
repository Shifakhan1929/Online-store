import { Router } from 'express';
import {
  checkoutHandler,
  getOrdersHandler,
  getOrderByIdHandler,
} from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody, validateParams } from '../middlewares/validate.js';
import { checkoutSchema, orderIdParamSchema } from '../validators/order.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All order endpoints require authentication
router.use(authenticate);

// Checkout endpoint
router.post('/checkout', validateBody(checkoutSchema), asyncHandler(checkoutHandler));

// Customer order history
router.get('/', asyncHandler(getOrdersHandler));

// Single order details
router.get('/:id', validateParams(orderIdParamSchema), asyncHandler(getOrderByIdHandler));

export default router;

