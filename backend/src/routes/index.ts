import { Router } from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';
import productRouter from './product.routes.js';
import cartRouter from './cart.routes.js';
import orderRouter from './order.routes.js';
import adminRouter from './admin.routes.js';

const router = Router();

router.use('/', healthRouter);
router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/admin', adminRouter);

export default router;
