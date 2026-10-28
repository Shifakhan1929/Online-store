import { prisma } from '../src/lib/prisma.js';
import { DiscountType } from '../src/generated/prisma/enums.js';

interface DemoProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number; // in integer paise (e.g., 799900 = ₹7,999.00)
  stockQuantity: number;
  imageUrl: string;
}

interface DemoCoupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number; // in integer paise
  expiryDate: Date;
  isActive: boolean;
}

const demoProducts: DemoProduct[] = [
  // Category 1: Electronics
  {
    id: '11111111-1111-1111-1111-111111111001',
    name: 'Wireless Noise-Canceling Headphones',
    description: 'Over-ear Bluetooth headphones with active noise cancellation and 30-hour battery life.',
    category: 'Electronics',
    price: 799900, // ₹7,999.00
    stockQuantity: 45,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '11111111-1111-1111-1111-111111111002',
    name: 'Smart Fitness Watch',
    description: 'Water-resistant smartwatch with heart rate monitoring, GPS tracking, and sleep analysis.',
    category: 'Electronics',
    price: 349900, // ₹3,499.00
    stockQuantity: 60,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '11111111-1111-1111-1111-111111111003',
    name: 'Mechanical Gaming Keyboard',
    description: 'RGB backlit mechanical keyboard with tactile blue switches and detachable braided cable.',
    category: 'Electronics',
    price: 429900, // ₹4,299.00
    stockQuantity: 30,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
  },

  // Category 2: Accessories
  {
    id: '11111111-1111-1111-1111-111111111004',
    name: 'Minimalist Leather Backpack',
    description: 'Handcrafted full-grain leather backpack with a padded 15-inch laptop sleeve.',
    category: 'Accessories',
    price: 599900, // ₹5,999.00
    stockQuantity: 25,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '11111111-1111-1111-1111-111111111005',
    name: 'Polarized Classic Sunglasses',
    description: 'UV400 polarized sunglasses with lightweight acetate frames and scratch-resistant lenses.',
    category: 'Accessories',
    price: 189900, // ₹1,899.00
    stockQuantity: 80,
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '11111111-1111-1111-1111-111111111006',
    name: 'Stainless Steel Insulated Bottle',
    description: 'Double-walled vacuum insulated bottle (750ml) that keeps drinks cold for 24h or hot for 12h.',
    category: 'Accessories',
    price: 129900, // ₹1,299.00
    stockQuantity: 100,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
  },

  // Category 3: Home & Kitchen
  {
    id: '11111111-1111-1111-1111-111111111007',
    name: 'Aroma Essential Oil Diffuser',
    description: 'Ultrasonic aromatherapy humidifier with 7 ambient LED light modes and auto shut-off.',
    category: 'Home & Kitchen',
    price: 219900, // ₹2,199.00
    stockQuantity: 50,
    imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '11111111-1111-1111-1111-111111111008',
    name: 'Ceramic Pour-Over Coffee Maker',
    description: 'Artisan ceramic drip coffee brewer for rich, full-bodied single-cup or small batch coffee.',
    category: 'Home & Kitchen',
    price: 169900, // ₹1,699.00
    stockQuantity: 40,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  },

  // Category 4: Fitness & Lifestyle
  {
    id: '11111111-1111-1111-1111-111111111009',
    name: 'Eco-Friendly Cork Yoga Mat',
    description: 'Non-slip natural cork and rubber workout mat with laser-etched alignment lines.',
    category: 'Fitness & Lifestyle',
    price: 279900, // ₹2,799.00
    stockQuantity: 35,
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '11111111-1111-1111-1111-111111111010',
    name: 'Adjustable Resistance Bands Set',
    description: 'Set of 5 stackable resistance tubes with cushioned handles, door anchor, and ankle straps.',
    category: 'Fitness & Lifestyle',
    price: 149900, // ₹1,499.00
    stockQuantity: 75,
    imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&auto=format&fit=crop&q=80',
  },
];

const demoCoupons: DemoCoupon[] = [
  {
    id: '22222222-2222-2222-2222-222222222001',
    code: 'WELCOME10',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10, // 10% off
    minOrderValue: 99900, // Min order ₹999.00
    expiryDate: new Date('2028-12-31T23:59:59.999Z'),
    isActive: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222002',
    code: 'FLAT500',
    discountType: DiscountType.FLAT,
    discountValue: 50000, // Flat ₹500.00 off
    minOrderValue: 249900, // Min order ₹2,499.00
    expiryDate: new Date('2028-12-31T23:59:59.999Z'),
    isActive: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222003',
    code: 'MEGA20',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 20, // 20% off
    minOrderValue: 499900, // Min order ₹4,999.00
    expiryDate: new Date('2028-12-31T23:59:59.999Z'),
    isActive: true,
  },
];

async function main() {
  console.log('Starting database seeding...');

  // 1. Seed Products (idempotent upsert by stable ID)
  console.log(`Seeding ${demoProducts.length} products across 4 categories...`);
  for (const product of demoProducts) {
    const upserted = await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        stockQuantity: product.stockQuantity,
        imageUrl: product.imageUrl,
      },
      create: {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        stockQuantity: product.stockQuantity,
        imageUrl: product.imageUrl,
      },
    });
    console.log(` - [Product] (${upserted.category}) ${upserted.name} - ₹${(upserted.price / 100).toFixed(2)}`);
  }

  // 2. Seed Coupons (idempotent upsert by unique code)
  console.log(`Seeding ${demoCoupons.length} coupons...`);
  for (const coupon of demoCoupons) {
    const upserted = await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        expiryDate: coupon.expiryDate,
        isActive: coupon.isActive,
      },
      create: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        expiryDate: coupon.expiryDate,
        isActive: coupon.isActive,
      },
    });
    const discountDisplay =
      upserted.discountType === DiscountType.PERCENTAGE
        ? `${upserted.discountValue}%`
        : `₹${(upserted.discountValue / 100).toFixed(2)}`;
    console.log(` - [Coupon] ${upserted.code} (${upserted.discountType}: ${discountDisplay}, Min Order: ₹${(upserted.minOrderValue / 100).toFixed(2)})`);
  }

  const finalProductCount = await prisma.product.count();
  const finalCouponCount = await prisma.coupon.count();

  console.log(`Seeding completed successfully! Total products: ${finalProductCount}, Total coupons: ${finalCouponCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during database seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
