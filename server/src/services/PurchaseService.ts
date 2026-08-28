import mongoose from 'mongoose';
import { Purchase, IPurchase, IPurchaseItem } from '../models/Purchase.js';
import { Supplier } from '../models/Supplier.js';
import { Product } from '../models/Product.js';
import { stockService } from './stock/StockService.js';
import { AppError } from '../utils/appError.js';

export class PurchaseService {
  /**
   * List purchases with paginated filters
   */
  public async getPurchases(params: {
    search?: string;
    supplierId?: string;
    paymentStatus?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ purchases: IPurchase[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (params.supplierId && params.supplierId !== 'All') {
      query.supplierId = params.supplierId;
    }

    if (params.paymentStatus && params.paymentStatus !== 'All') {
      query.paymentStatus = params.paymentStatus;
    }

    if (params.status && params.status !== 'All') {
      query.status = params.status;
    }

    if (params.search) {
      const searchRegex = { $regex: params.search, $options: 'i' };
      query.$or = [
        { purchaseNumber: searchRegex },
        { supplierNameSnapshot: searchRegex },
        { 'items.skuSnapshot': searchRegex },
        { 'items.productNameSnapshot': searchRegex }
      ];
    }

    if (params.from || params.to) {
      query.purchaseDate = {};
      if (params.from) query.purchaseDate.$gte = new Date(params.from);
      if (params.to) {
        const toDate = new Date(params.to);
        toDate.setHours(23, 59, 59, 999);
        query.purchaseDate.$lte = toDate;
      }
    }

    const total = await Purchase.countDocuments(query);
    const purchases = await Purchase.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return { purchases, total };
  }

  /**
   * Get single purchase details
   */
  public async getPurchaseById(id: string): Promise<IPurchase> {
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      throw new AppError('Purchase record not found.', 404);
    }
    return purchase;
  }

  /**
   * Creates a purchase voucher and updates variant stock balances atomically
   */
  public async createPurchase(data: {
    supplierId: string;
    purchaseDate: string;
    items: { productId: string; variantId: string; quantity: number; unitPurchasePrice: number }[];
    additionalCosts?: { name: string; amount: number }[];
    paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
    amountPaid: number;
    notes?: string;
  }): Promise<IPurchase> {
    const { supplierId, purchaseDate, items, additionalCosts = [], paymentMode, amountPaid, notes } = data;

    // 1. Basic validations
    if (!supplierId) throw new AppError('Supplier selection is required.', 400);
    if (!items || items.length === 0) throw new AppError('Purchase must contain at least one item.', 400);

    const supplier = await Supplier.findOne({ _id: supplierId, deletedAt: null });
    if (!supplier) throw new AppError('Supplier not found or is inactive.', 404);

    // 2. Map and validate items
    const parsedItems: IPurchaseItem[] = [];
    let baseAmount = 0;

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new AppError('Quantity must be greater than zero.', 400);
      }
      if (item.unitPurchasePrice < 0) {
        throw new AppError('Unit purchase price cannot be negative.', 400);
      }

      const product = await Product.findOne({ _id: item.productId, deletedAt: null });
      if (!product) throw new AppError(`Product ${item.productId} not found.`, 404);

      const variant = product.variants.find(v => v._id?.toString() === item.variantId);
      if (!variant) throw new AppError(`Variant ${item.variantId} not found in product ${product.name}.`, 404);

      const itemBase = Number((item.quantity * item.unitPurchasePrice).toFixed(2));
      baseAmount += itemBase;

      parsedItems.push({
        productId: new mongoose.Types.ObjectId(item.productId),
        variantId: new mongoose.Types.ObjectId(item.variantId),
        productNameSnapshot: product.name,
        variantNameSnapshot: variant.name,
        skuSnapshot: variant.sku,
        quantity: item.quantity,
        unitPurchasePrice: item.unitPurchasePrice,
        baseAmount: itemBase
      });
    }

    // 3. Compute costs and totals
    const totalAdditionalCosts = additionalCosts.reduce((sum, cost) => {
      if (cost.amount < 0) throw new AppError('Additional cost amount cannot be negative.', 400);
      return sum + cost.amount;
    }, 0);

    const totalPurchaseCost = Number((baseAmount + totalAdditionalCosts).toFixed(2));

    if (amountPaid < 0 || amountPaid > totalPurchaseCost) {
      throw new AppError(`Amount paid must be between 0 and the total cost (₹${totalPurchaseCost}).`, 400);
    }

    let paymentStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
    if (amountPaid === totalPurchaseCost) {
      paymentStatus = 'Paid';
    } else if (amountPaid > 0) {
      paymentStatus = 'Partially Paid';
    }

    const pendingAmount = Number((totalPurchaseCost - amountPaid).toFixed(2));

    // Generate unique short purchase number
    const purchaseNumber = `PUR-${new Date(purchaseDate).getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;

    const session = await mongoose.startSession();
    let purchaseResult: IPurchase | null = null;

    try {
      await session.withTransaction(async () => {
        // A. Save the purchase record
        const purchase = new Purchase({
          purchaseNumber,
          supplierId: supplier._id,
          supplierNameSnapshot: supplier.name,
          purchaseDate: new Date(purchaseDate),
          items: parsedItems,
          additionalCosts,
          baseAmount,
          totalAdditionalCosts,
          totalPurchaseCost,
          paymentMode,
          paymentStatus,
          amountPaid,
          pendingAmount,
          status: 'Active',
          notes
        });

        purchaseResult = await purchase.save({ session });

        // B. Apply stock movements via StockService using this session
        for (const item of parsedItems) {
          await stockService.applyMovement({
            productId: item.productId.toString(),
            variantId: item.variantId.toString(),
            quantityChange: item.quantity,
            transactionType: 'PURCHASE',
            referenceId: purchaseResult._id,
            referenceNumber: purchaseNumber,
            reason: 'Supplier Purchase Invoice',
            notes: `Purchase number: ${purchaseNumber}`,
            session
          });
        }
      });
    } catch (err: any) {
      // Standalone MongoDB fallback
      const isStandaloneErr = 
        err.message.includes('replica set') || 
        err.message.includes('transaction numbers') ||
        err.codeName === 'TransactionSystemFailed';

      if (isStandaloneErr) {
        console.warn('MongoDB transaction failed (Standalone mode). Falling back to sequential execution.');

        // Retry sequentially
        const purchase = new Purchase({
          purchaseNumber,
          supplierId: supplier._id,
          supplierNameSnapshot: supplier.name,
          purchaseDate: new Date(purchaseDate),
          items: parsedItems,
          additionalCosts,
          baseAmount,
          totalAdditionalCosts,
          totalPurchaseCost,
          paymentMode,
          paymentStatus,
          amountPaid,
          pendingAmount,
          status: 'Active',
          notes
        });

        purchaseResult = await purchase.save();

        for (const item of parsedItems) {
          await stockService.applyMovement({
            productId: item.productId.toString(),
            variantId: item.variantId.toString(),
            quantityChange: item.quantity,
            transactionType: 'PURCHASE',
            referenceId: purchaseResult._id,
            referenceNumber: purchaseNumber,
            reason: 'Supplier Purchase Invoice',
            notes: `Purchase number: ${purchaseNumber}`
          });
        }
      } else {
        throw err;
      }
    } finally {
      session.endSession();
    }

    return purchaseResult!;
  }

  /**
   * Cancels a purchase and reverses stock updates atomically
   */
  public async cancelPurchase(id: string): Promise<IPurchase> {
    const purchase = await Purchase.findById(id);
    if (!purchase) throw new AppError('Purchase not found.', 404);

    if (purchase.status === 'Cancelled') {
      throw new AppError('Purchase has already been cancelled.', 409);
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // A. Set purchase status
        purchase.status = 'Cancelled';
        await purchase.save({ session });

        // B. Apply cancellation reversals (negative quantityChange)
        for (const item of purchase.items) {
          await stockService.applyMovement({
            productId: item.productId.toString(),
            variantId: item.variantId.toString(),
            quantityChange: -item.quantity,
            transactionType: 'CANCELLATION_REVERSAL',
            referenceId: purchase._id,
            referenceNumber: purchase.purchaseNumber,
            reason: 'Purchase Cancelled Reversal',
            notes: `Reversal of purchase: ${purchase.purchaseNumber}`,
            session
          });
        }
      });
    } catch (err: any) {
      // Standalone MongoDB fallback
      const isStandaloneErr = 
        err.message.includes('replica set') || 
        err.message.includes('transaction numbers') ||
        err.codeName === 'TransactionSystemFailed';

      if (isStandaloneErr) {
        console.warn('MongoDB transaction failed (Standalone mode). Falling back to sequential execution.');

        // Retry sequentially
        purchase.status = 'Cancelled';
        await purchase.save();

        for (const item of purchase.items) {
          await stockService.applyMovement({
            productId: item.productId.toString(),
            variantId: item.variantId.toString(),
            quantityChange: -item.quantity,
            transactionType: 'CANCELLATION_REVERSAL',
            referenceId: purchase._id,
            referenceNumber: purchase.purchaseNumber,
            reason: 'Purchase Cancelled Reversal',
            notes: `Reversal of purchase: ${purchase.purchaseNumber}`
          });
        }
      } else {
        throw err;
      }
    } finally {
      session.endSession();
    }

    return purchase;
  }
}

export const purchaseService = new PurchaseService();
