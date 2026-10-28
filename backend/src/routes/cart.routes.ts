import { Router } from 'express';
import {
  getCartHandler,
  addItemHandler,
  updateItemHandler,
  removeItemHandler,
  clearCartHandler,
} from '../controllers/cart.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody, validateParams } from '../middlewares/validate.js';
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemIdParamSchema,
} from '../validators/cart.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All shopping cart operations require authentication
router.use(authenticate);

// GET /api/cart - Return current user's cart
router.get('/', asyncHandler(getCartHandler));

// DELETE /api/cart - Clear current user's entire cart
router.delete('/', asyncHandler(clearCartHandler));

// POST /api/cart/items - Add item or increment existing item in cart
router.post('/items', validateBody(addCartItemSchema), asyncHandler(addItemHandler));

// PATCH /api/cart/items/:itemId - Update quantity of a cart item
router.patch(
  '/items/:itemId',
  validateParams(cartItemIdParamSchema),
  validateBody(updateCartItemSchema),
  asyncHandler(updateItemHandler)
);

// DELETE /api/cart/items/:itemId - Remove specific item from cart
router.delete(
  '/items/:itemId',
  validateParams(cartItemIdParamSchema),
  asyncHandler(removeItemHandler)
);

export default router;

