import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Sale } from '../models/Sale.js';
import { Purchase } from '../models/Purchase.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Supplier } from '../models/Supplier.js';
import { Invoice } from '../models/Invoice.js';
import { AppError } from '../utils/appError.js';

// Inclusive date parsing helper for India Timezone
const getQueryDateRange = (from?: string, to?: string) => {
  const queryRange: any = {};
  if (from) {
    queryRange.$gte = new Date(from);
  }
  if (to) {
    const toDate = new Date(to);
    toDate.setUTCDate(toDate.getUTCDate() + 1); // inclusive next day midnight boundary
    queryRange.$lt = toDate;
  }
  return Object.keys(queryRange).length > 0 ? queryRange : null;
};

// Cost basis loader helper
const loadCostBasisMap = async () => {
  const activePurchases = await Purchase.find({ status: 'Active' }).sort({ purchaseDate: -1 });
  const costMap = new Map<string, number>();
  for (const p of activePurchases) {
    for (const item of p.items) {
      const key = `${item.productId.toString()}_${item.variantId.toString()}`;
      if (!costMap.has(key)) {
        costMap.set(key, item.unitPurchasePrice);
      }
    }
  }
  return costMap;
};

/**
 * GET /api/reports/sales
 */
export const getSalesDetailReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { from, to, customerId, saleChannel, paymentStatus, search } = req.query;

    const matchQuery: any = { status: 'Active' };
    const dateRange = getQueryDateRange(from as string, to as string);
    if (dateRange) matchQuery.saleDate = dateRange;

    if (customerId && customerId !== 'All') {
      matchQuery.customerId = customerId === 'Walk-in' ? null : new mongoose.Types.ObjectId(customerId as string);
    }
    if (saleChannel && saleChannel !== 'All') {
      matchQuery.saleChannel = saleChannel;
    }
    if (paymentStatus && paymentStatus !== 'All') {
      matchQuery.paymentStatus = paymentStatus;
    }

    if (search) {
      const searchRegex = { $regex: search as string, $options: 'i' };
      matchQuery.$or = [
        { saleNumber: searchRegex },
        { customerNameSnapshot: searchRegex },
        { 'items.skuSnapshot': searchRegex }
      ];
    }

    // 1. Group summary values
    const summaries = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          count: { $sum: 1 },
          totalDiscount: { $sum: '$totalDiscount' },
          totalTax: { $sum: '$totalTax' },
          grossSalesValue: { $sum: '$subtotal' },
          netSalesValue: { $sum: '$total' }
        }
      }
    ]);

    const summary = summaries[0] || {
      totalSales: 0,
      count: 0,
      totalDiscount: 0,
      totalTax: 0,
      grossSalesValue: 0,
      netSalesValue: 0
    };

    const averageSaleValue = summary.count > 0 ? Number((summary.totalSales / summary.count).toFixed(2)) : 0;

    // 2. Daily Sales
    const dailySales = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
          amount: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const salesOverTime = dailySales.map(d => ({
      date: d._id,
      amount: d.amount,
      count: d.count
    }));

    // 3. Sales by Channel
    const channelStats = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$saleChannel',
          amount: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);

    const salesByChannel = channelStats.map(c => ({
      channel: c._id,
      amount: c.amount,
      count: c.count,
      percentage: summary.totalSales > 0 ? Number(((c.amount / summary.totalSales) * 100).toFixed(1)) : 0
    }));

    // 4. Sales by Payment Status
    const statusStats = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentStatus',
          amount: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);

    const salesByPaymentStatus = statusStats.map(s => ({
      status: s._id,
      amount: s.amount,
      count: s.count
    }));

    // 5. Top Selling Products
    const topProductsAgg = await Sale.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            productId: '$items.productId',
            variantId: '$items.variantId',
            productName: '$items.productNameSnapshot',
            variantName: '$items.variantNameSnapshot',
            sku: '$items.skuSnapshot'
          },
          quantitySold: { $sum: '$items.quantity' },
          salesAmount: { $sum: '$items.lineTotal' }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 10 }
    ]);

    const topSellingProducts = topProductsAgg.map(tp => ({
      productId: tp._id.productId.toString(),
      variantId: tp._id.variantId.toString(),
      productName: tp._id.productName,
      variantName: tp._id.variantName,
      sku: tp._id.sku,
      quantitySold: tp.quantitySold,
      salesAmount: tp.salesAmount
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSales: summary.totalSales,
          count: summary.count,
          averageSaleValue,
          totalDiscount: summary.totalDiscount,
          totalTax: summary.totalTax,
          grossSalesValue: summary.grossSalesValue,
          netSalesValue: summary.netSalesValue
        },
        salesOverTime,
        salesByChannel,
        salesByPaymentStatus,
        topSellingProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/purchases
 */
export const getPurchasesReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { from, to, supplierId, search } = req.query;

    const matchQuery: any = { status: 'Active' };
    const dateRange = getQueryDateRange(from as string, to as string);
    if (dateRange) matchQuery.purchaseDate = dateRange;

    if (supplierId && supplierId !== 'All') {
      matchQuery.supplierId = new mongoose.Types.ObjectId(supplierId as string);
    }

    if (search) {
      const searchRegex = { $regex: search as string, $options: 'i' };
      matchQuery.$or = [
        { purchaseNumber: searchRegex },
        { supplierNameSnapshot: searchRegex },
        { 'items.skuSnapshot': searchRegex }
      ];
    }

    // group summary totals
    const summaries = await Purchase.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: '$totalPurchaseCost' },
          count: { $sum: 1 },
          amountPaid: { $sum: '$amountPaid' },
          amountPending: { $sum: '$pendingAmount' }
        }
      }
    ]);

    const summary = summaries[0] || {
      totalPurchases: 0,
      count: 0,
      amountPaid: 0,
      amountPending: 0
    };

    // Purchases over time
    const dailyPurchases = await Purchase.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$purchaseDate' } },
          amount: { $sum: '$totalPurchaseCost' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const purchasesOverTime = dailyPurchases.map(d => ({
      date: d._id,
      amount: d.amount,
      count: d.count
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPurchases: summary.totalPurchases,
          count: summary.count,
          amountPaid: summary.amountPaid,
          amountPending: summary.amountPending
        },
        purchasesOverTime
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/inventory
 */
export const getInventoryReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, search, status } = req.query;

    const query: any = { deletedAt: null };
    if (category && category !== 'All') query.category = category as string;
    if (status && status !== 'All') query.isActive = status === 'Active';
    if (search) {
      const searchRegex = { $regex: search as string, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { 'variants.sku': searchRegex }
      ];
    }

    const products = await Product.find(query);
    const costMap = await loadCostBasisMap();

    // Fetch quantity sold mapping from all active Sales
    const salesAgg = await Sale.aggregate([
      { $match: { status: 'Active' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            productId: '$items.productId',
            variantId: '$items.variantId'
          },
          totalSold: { $sum: '$items.quantity' }
        }
      }
    ]);

    const soldMap = new Map<string, number>();
    for (const sa of salesAgg) {
      const key = `${sa._id.productId.toString()}_${sa._id.variantId.toString()}`;
      soldMap.set(key, sa.totalSold);
    }

    const rows: any[] = [];
    let totalStockValue = 0;

    for (const p of products) {
      for (const v of p.variants) {
        const key = `${p._id.toString()}_${v._id?.toString()}`;
        const costBasis = costMap.get(key) || 0;
        const unitsSold = soldMap.get(key) || 0;
        const stockValue = Number((v.cachedStock * costBasis).toFixed(2));
        
        totalStockValue += stockValue;

        rows.push({
          productId: p._id.toString(),
          variantId: v._id?.toString() || '',
          productName: p.name,
          variantName: v.name,
          sku: v.sku,
          openingStock: v.openingStock,
          currentStock: v.cachedStock,
          unitsSold,
          costBasis,
          stockValue,
          status: v.isActive && p.isActive ? 'Active' : 'Inactive',
          minAlertLevel: p.minStockLevel
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalStockValue,
          limitation: 'Purchase cost is only retrieved from the latest recorded Purchase order. If a product has no recorded purchase history, its cost basis defaults to 0.'
        },
        rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/payments
 */
export const getPaymentsReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { from, to, customerId, search } = req.query;

    const matchQuery: any = { status: 'Active' };
    const dateRange = getQueryDateRange(from as string, to as string);
    if (dateRange) matchQuery.paymentDate = dateRange;

    if (customerId && customerId !== 'All') {
      matchQuery.customerId = customerId === 'Walk-in' ? null : new mongoose.Types.ObjectId(customerId as string);
    }

    if (search) {
      const searchRegex = { $regex: search as string, $options: 'i' };
      matchQuery.$or = [
        { paymentNumber: searchRegex },
        { referenceNumber: searchRegex }
      ];
    }

    // Method breakdown
    const methodStats = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentMethod',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const paymentMethodBreakdown = methodStats.map(m => ({
      method: m._id,
      amount: m.amount,
      count: m.count
    }));

    const totalAmount = paymentMethodBreakdown.reduce((sum, m) => sum + m.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAmount,
          count: paymentMethodBreakdown.reduce((sum, m) => sum + m.count, 0)
        },
        paymentMethodBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/customers
 */
export const getCustomersReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerStats = await Sale.aggregate([
      { $match: { status: 'Active', customerId: { $ne: null } } },
      {
        $group: {
          _id: '$customerId',
          customerName: { $first: '$customerNameSnapshot' },
          ordersCount: { $sum: 1 },
          totalPurchased: { $sum: '$total' },
          amountPaid: { $sum: '$amountReceived' },
          amountPending: { $sum: '$pendingAmount' }
        }
      },
      { $sort: { totalPurchased: -1 } }
    ]);

    const rows = customerStats.map(c => ({
      customerId: c._id.toString(),
      customerName: c.customerName,
      ordersCount: c.ordersCount,
      totalPurchased: c.totalPurchased,
      amountPaid: c.amountPaid,
      amountPending: c.amountPending
    }));

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/suppliers
 */
export const getSuppliersReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const supplierStats = await Purchase.aggregate([
      { $match: { status: 'Active' } },
      {
        $group: {
          _id: '$supplierId',
          supplierName: { $first: '$supplierNameSnapshot' },
          purchasesCount: { $sum: 1 },
          totalPurchased: { $sum: '$totalPurchaseCost' },
          amountPaid: { $sum: '$amountPaid' },
          amountPending: { $sum: '$pendingAmount' }
        }
      },
      { $sort: { totalPurchased: -1 } }
    ]);

    const rows = supplierStats.map(s => ({
      supplierId: s._id.toString(),
      supplierName: s.supplierName,
      purchasesCount: s.purchasesCount,
      totalPurchased: s.totalPurchased,
      amountPaid: s.amountPaid,
      amountPending: s.amountPending
    }));

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/dashboard
 */
export const getDashboardStatsReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { from, to } = req.query;

    const matchQuery: any = { status: 'Active' };
    const dateRange = getQueryDateRange(from as string, to as string);
    if (dateRange) {
      matchQuery.saleDate = dateRange;
    }

    // 1. Sales totals (filtered by date)
    const salesSum = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          pendingAmount: { $sum: '$pendingAmount' }
        }
      }
    ]);

    // 2. Purchases totals (filtered by date)
    const purchaseMatchQuery: any = { status: 'Active' };
    if (dateRange) purchaseMatchQuery.purchaseDate = dateRange;
    const purchasesSum = await Purchase.aggregate([
      { $match: purchaseMatchQuery },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: '$totalPurchaseCost' }
        }
      }
    ]);

    // 3. Amount Received from Payments (filtered by date)
    const paymentMatchQuery: any = { status: 'Active' };
    if (dateRange) paymentMatchQuery.paymentDate = dateRange;
    const paymentsSum = await Payment.aggregate([
      { $match: paymentMatchQuery },
      {
        $group: {
          _id: null,
          totalReceived: { $sum: '$amount' }
        }
      }
    ]);

    // 4. Counts
    const activeProductsCount = await Product.countDocuments({ isActive: true, deletedAt: null });
    const customersCount = await Customer.countDocuments({ isActive: true, deletedAt: null });
    const suppliersCount = await Supplier.countDocuments({ isActive: true, deletedAt: null });
    const invoicesCount = await Invoice.countDocuments(dateRange ? { invoiceDate: dateRange } : {});

    // 5. Stock Valuation (using purchase costs)
    const products = await Product.find({ deletedAt: null });
    const costMap = await loadCostBasisMap();
    let currentStockValue = 0;
    
    // Low stock items detection
    const lowStockItems: any[] = [];
    for (const p of products) {
      for (const v of p.variants) {
        const key = `${p._id.toString()}_${v._id?.toString()}`;
        const costBasis = costMap.get(key) || 0;
        currentStockValue += (v.cachedStock * costBasis);

        if (v.isActive && v.cachedStock <= p.minStockLevel) {
          lowStockItems.push({
            productId: p._id.toString(),
            productName: p.name,
            variantName: v.name,
            sku: v.sku,
            stock: v.cachedStock,
            min: p.minStockLevel
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalSales: salesSum[0]?.totalSales || 0,
        totalPurchases: purchasesSum[0]?.totalPurchases || 0,
        amountReceived: paymentsSum[0]?.totalReceived || 0,
        amountPending: salesSum[0]?.pendingAmount || 0,
        currentStockValue: Number(currentStockValue.toFixed(2)),
        activeProductsCount,
        customersCount,
        suppliersCount,
        invoicesCount,
        lowStockItems: lowStockItems.slice(0, 10), // return top 10 low stock
        lowStockCount: lowStockItems.length
      }
    });
  } catch (error) {
    next(error);
  }
};
