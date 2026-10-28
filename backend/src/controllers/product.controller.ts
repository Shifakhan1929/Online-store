import { Request, Response } from 'express';
import { getProducts, getProductById } from '../services/product.service.js';
import { GetProductsQuery, ProductIdParam } from '../validators/product.validator.js';

export const listProducts = async (req: Request, res: Response): Promise<void> => {
  const query = req.query as unknown as GetProductsQuery;
  const result = await getProducts(query);

  res.status(200).json({
    status: 'success',
    data: result,
  });
};

export const getProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as ProductIdParam;
  const product = await getProductById(id);

  res.status(200).json({
    status: 'success',
    data: {
      product,
    },
  });
};

