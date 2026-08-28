import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product.js';
import { Sale } from '../models/Sale.js';
import { Purchase } from '../models/Purchase.js';
import { Payment } from '../models/Payment.js';

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productsList = await Product.find({ deletedAt: null });

    // 1. Total Products & Variants counts
    const totalProducts = productsList.length;
    let totalVariants = 0;
    let totalStock = 0;
    let lowStockCount = 0;
    const lowStockItems: any[] = [];

    productsList.forEach(p => {
      p.variants.forEach(v => {
        if (v.isActive) {
          totalVariants += 1;
          totalStock += v.cachedStock;
          if (v.cachedStock <= p.minStockLevel) {
            lowStockCount += 1;
            lowStockItems.push({
              productName: p.name,
              variantName: v.name,
              sku: v.sku,
              stock: v.cachedStock,
              min: p.minStockLevel
            });
          }
        }
      });
    });

    // 2. Today's Sales (mock today: 2026-08-23)
    const today = new Date('2026-08-23');
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todaySalesDocs = await Sale.find({
      saleDate: { $gte: startOfDay, $lte: endOfDay },
      status: 'Active'
    });
    const todaySales = todaySalesDocs.reduce((sum, s) => sum + s.total, 0);

    // 3. Today's Purchases
    const todayPurchasesDocs = await Purchase.find({
      purchaseDate: { $gte: startOfDay, $lte: endOfDay },
      status: 'Active'
    });
    const todayPurchases = todayPurchasesDocs.reduce((sum, p) => sum + p.totalPurchaseCost, 0);

    // 4. Pending Payments (Sales receivables outstanding)
    const activeSales = await Sale.find({ status: 'Active' });
    const allSaleIds = activeSales.map(s => s._id);
    const paymentsList = await Payment.find({ saleId: { $in: allSaleIds } });

    const totalSalesBilled = activeSales.reduce((sum, s) => sum + s.total, 0);
    const totalPaymentsReceived = paymentsList
      .filter(p => p.status === 'Active')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = Math.max(0, totalSalesBilled - totalPaymentsReceived);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalVariants,
        totalStock,
        todaySales,
        todayPurchases,
        pendingPayments,
        lowStockCount,
        lowStockItems: lowStockItems.slice(0, 10) // Cap at 10 items
      }
    });
  } catch (error) {
    next(error);
  }
};
