import { Request, Response } from 'express';
import {
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
} from '../services/adminOrder.service.js';
import {
  AdminOrderIdParam,
  UpdateOrderStatusInput,
  AdminOrdersQuery,
} from '../validators/admin.validator.js';

export const getAdminOrdersHandler = async (req: Request, res: Response): Promise<void> => {
  const query = req.query as unknown as AdminOrdersQuery;
  const result = await getAdminOrders(query.page, query.limit);

  res.status(200).json({
    status: 'success',
    data: result,
    orders: result.orders,
    pagination: result.pagination,
  });
};

export const getAdminOrderByIdHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as AdminOrderIdParam;
  const order = await getAdminOrderById(id);

  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
    order,
  });
};

export const updateAdminOrderStatusHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params as AdminOrderIdParam;
  const { status } = req.body as UpdateOrderStatusInput;
  const order = await updateAdminOrderStatus(id, status);

  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
    order,
  });
};

