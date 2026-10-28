import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import { CreateProductInput, UpdateProductInput } from '../validators/admin.validator.js';
import { Product } from '../generated/prisma/client.js';

export const createAdminProduct = async (input: CreateProductInput): Promise<Product> => {
  const priceInPaise = Math.round(input.price * 100);

  const product = await prisma.product.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      category: input.category,
      price: priceInPaise,
      stockQuantity: input.stockQuantity,
      imageUrl: input.imageUrl && input.imageUrl.trim() !== '' ? input.imageUrl : null,
    },
  });

  return product;
};

export const updateAdminProduct = async (
  id: string,
  input: UpdateProductInput
): Promise<Product> => {
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new NotFoundError('Product not found');
  }

  const dataToUpdate: any = {};

  if (input.name !== undefined) {
    dataToUpdate.name = input.name;
  }
  if (input.description !== undefined) {
    dataToUpdate.description = input.description;
  }
  if (input.category !== undefined) {
    dataToUpdate.category = input.category;
  }
  if (input.price !== undefined) {
    dataToUpdate.price = Math.round(input.price * 100);
  }
  if (input.stockQuantity !== undefined) {
    dataToUpdate.stockQuantity = input.stockQuantity;
  }
  if (input.imageUrl !== undefined) {
    dataToUpdate.imageUrl = input.imageUrl && input.imageUrl.trim() !== '' ? input.imageUrl : null;
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: dataToUpdate,
  });

  return updatedProduct;
};

export const deleteAdminProduct = async (id: string): Promise<void> => {
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new NotFoundError('Product not found');
  }

  // Deleting the product safely triggers database-level foreign key behaviors:
  // 1. CartItem has ON DELETE CASCADE -> removes orphaned cart entries
  // 2. OrderItem has ON DELETE SET NULL -> sets OrderItem.productId = NULL while
  //    preserving all historical data (productName, unitPrice, quantity, lineTotal)
  await prisma.product.delete({
    where: { id },
  });
};

