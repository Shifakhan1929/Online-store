import { Router } from 'express';
import { listProducts, getProduct } from '../controllers/product.controller.js';
import { validateQuery, validateParams } from '../middlewares/validate.js';
import { getProductsQuerySchema, productIdParamSchema } from '../validators/product.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', validateQuery(getProductsQuerySchema), asyncHandler(listProducts));
router.get('/:id', validateParams(productIdParamSchema), asyncHandler(getProduct));

export default router;

