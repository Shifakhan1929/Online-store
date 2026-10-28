import { Request, Response } from 'express';
import {
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from '../services/adminProduct.service.js';
import {
  CreateProductInput,
  UpdateProductInput,
  AdminProductIdParam,
} from '../validators/admin.validator.js';

export const createProductHandler = async (req: Request, res: Response): Promise<void> => {
  const input = req.body as CreateProductInput;
  const product = await createAdminProduct(input);

  res.status(201).json({
    status: 'success',
    data: {
      product,
    },
    product,
  });
};

export const updateProductHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as AdminProductIdParam;
  const input = req.body as UpdateProductInput;
  const product = await updateAdminProduct(id, input);

  res.status(200).json({
    status: 'success',
    data: {
      product,
    },
    product,
  });
};

export const deleteProductHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as AdminProductIdParam;
  await deleteAdminProduct(id);

  res.status(200).json({
    status: 'success',
    message: 'Product deleted successfully',
  });
};

