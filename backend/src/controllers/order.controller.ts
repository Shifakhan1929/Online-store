import { Request, Response } from 'express';
import {
  checkoutOrder,
  getCustomerOrders,
  getCustomerOrderById,
} from '../services/order.service.js';
import { CheckoutInput, OrderIdParam } from '../validators/order.validator.js';

export const checkoutHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const input = req.body as CheckoutInput;
  const order = await checkoutOrder(userId, input);

  res.status(201).json({
    status: 'success',
    data: {
      order,
    },
    order,
  });
};

export const getOrdersHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const orders = await getCustomerOrders(userId);

  res.status(200).json({
    status: 'success',
    data: {
      orders,
    },
    orders,
  });
};

export const getOrderByIdHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { id } = req.params as OrderIdParam;
  const order = await getCustomerOrderById(userId, id);

  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
    order,
  });
};

