import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createProductSchema,
  updateProductSchema,
  adminProductIdParamSchema,
  adminOrderIdParamSchema,
  updateOrderStatusSchema,
  adminOrdersQuerySchema,
} from '../validators/admin.validator.js';
import {
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} from '../controllers/adminProduct.controller.js';
import {
  getAdminOrdersHandler,
  getAdminOrderByIdHandler,
  updateAdminOrderStatusHandler,
} from '../controllers/adminOrder.controller.js';

const router = Router();

// All admin endpoints require authentication and server-verified ADMIN role
router.use(authenticate, asyncHandler(requireAdmin));

// Admin Product Management
router.post('/products', validateBody(createProductSchema), asyncHandler(createProductHandler));
router.patch(
  '/products/:id',
  validateParams(adminProductIdParamSchema),
  validateBody(updateProductSchema),
  asyncHandler(updateProductHandler)
);
router.delete(
  '/products/:id',
  validateParams(adminProductIdParamSchema),
  asyncHandler(deleteProductHandler)
);

// Admin Order Management
router.get('/orders', validateQuery(adminOrdersQuerySchema), asyncHandler(getAdminOrdersHandler));
router.get(
  '/orders/:id',
  validateParams(adminOrderIdParamSchema),
  asyncHandler(getAdminOrderByIdHandler)
);
router.patch(
  '/orders/:id/status',
  validateParams(adminOrderIdParamSchema),
  validateBody(updateOrderStatusSchema),
  asyncHandler(updateAdminOrderStatusHandler)
);

export default router;

