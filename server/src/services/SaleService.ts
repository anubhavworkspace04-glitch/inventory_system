import mongoose from 'mongoose';
import { Sale, ISale, ISaleItem } from '../models/Sale.js';
import { Customer } from '../models/Customer.js';
import { Product } from '../models/Product.js';
import { Payment } from '../models/Payment.js';
import { stockService } from './stock/StockService.js';
import { AppError } from '../utils/appError.js';

export class SaleService {
  /**
   * List sales with paginated filters
   */
  public async getSales(params: {
    search?: string;
    customerId?: string;
    saleChannel?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ sales: ISale[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (params.customerId && params.customerId !== 'All') {
      if (params.customerId === 'Walk-in') {
        query.customerId = null;
      } else {
        query.customerId = params.customerId;
      }
    }

    if (params.saleChannel && params.saleChannel !== 'All') {
      query.saleChannel = params.saleChannel;
    }

    if (params.status && params.status !== 'All') {
      query.status = params.status;
    }

    if (params.search) {
      const searchRegex = { $regex: params.search, $options: 'i' };
      query.$or = [
        { saleNumber: searchRegex },
        { customerNameSnapshot: searchRegex },
        { 'items.skuSnapshot': searchRegex },
        { 'items.productNameSnapshot': searchRegex }
      ];
    }

    if (params.from || params.to) {
      query.saleDate = {};
      if (params.from) {
        query.saleDate.$gte = new Date(params.from);
      }
      if (params.to) {
        const toDate = new Date(params.to);
        toDate.setUTCDate(toDate.getUTCDate() + 1);
        query.saleDate.$lt = toDate;
      }
    }

    const total = await Sale.countDocuments(query);
    const sales = await Sale.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return { sales, total };
  }

  /**
   * Get single sale details
   */
  public async getSaleById(id: string): Promise<ISale> {
    const sale = await Sale.findById(id);
    if (!sale) {
      throw new AppError('Sale record not found.', 404);
    }
    return sale;
  }

  /**
   * Creates a sale POS order and reduces stock via Stock Ledger Engine atomically
   */
  public async createSale(data: {
    customerId?: string;
    customerName?: string; // Optional name input for walk-ins
    customerPhone?: string; // Optional phone input for walk-ins
    saleDate: string;
    items: { productId: string; variantId: string; quantity: number; sellingPrice: number; discount?: number; tax?: number }[];
    saleChannel: 'Online' | 'Offline';
    paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
    amountReceived: number;
    notes?: string;
    sourceQuotationId?: string;
    sourceQuotationNumber?: string;
  }): Promise<ISale> {
    const { 
      customerId, customerName, customerPhone, saleDate, items, saleChannel, paymentMethod, amountReceived, notes, 
      sourceQuotationId, sourceQuotationNumber 
    } = data;

    // 1. Basic validations
    if (!items || items.length === 0) throw new AppError('Sale must contain at least one item.', 400);

    let finalCustomerId: mongoose.Types.ObjectId | null = null;
    let customerNameSnapshot = 'Walk-in Customer';
    let customerPhoneSnapshot = customerPhone || '';

    if (customerId) {
      const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
      if (!customer) throw new AppError('Selected customer not found.', 404);
      if (!customer.isActive) throw new AppError('Selected customer is inactive.', 400);
      finalCustomerId = customer._id;
      customerNameSnapshot = customer.name;
      customerPhoneSnapshot = customer.phone;
    } else if (customerName) {
      customerNameSnapshot = customerName.trim();
    }

    // 2. Map and validate items
    const parsedItems: ISaleItem[] = [];
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new AppError('Quantity must be greater than zero.', 400);
      }
      if (item.sellingPrice < 0) {
        throw new AppError('Selling price cannot be negative.', 400);
      }

      const product = await Product.findOne({ _id: item.productId, deletedAt: null });
      if (!product) throw new AppError(`Product ${item.productId} not found.`, 404);
      if (!product.isActive) throw new AppError(`Product ${product.name} is inactive.`, 400);

      const variant = product.variants.find(v => v._id?.toString() === item.variantId);
      if (!variant) throw new AppError(`Specification variant ${item.variantId} not found.`, 404);
      if (!variant.isActive) throw new AppError(`Specification variant ${variant.name} is inactive.`, 400);

      // Verify stock level on server
      const currentAvailable = variant.cachedStock;
      if (currentAvailable < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name} (${variant.name}). Available: ${currentAvailable}, Requested: ${item.quantity}`,
          409,
          [{ available: currentAvailable, requested: item.quantity }]
        );
      }

      const itemSub = Number((item.quantity * item.sellingPrice).toFixed(2));
      const itemDisc = item.discount ? Number(item.discount.toFixed(2)) : 0;
      const itemTax = item.tax ? Number(item.tax.toFixed(2)) : 0;
      
      const lineTotal = Number((itemSub - itemDisc + itemTax).toFixed(2));
      if (lineTotal < 0) {
        throw new AppError(`Discount cannot make line subtotal negative for product ${product.name}.`, 400);
      }

      subtotal += itemSub;
      totalDiscount += itemDisc;
      totalTax += itemTax;

      parsedItems.push({
        productId: new mongoose.Types.ObjectId(item.productId),
        variantId: new mongoose.Types.ObjectId(item.variantId),
        productNameSnapshot: product.name,
        variantNameSnapshot: variant.name,
        skuSnapshot: variant.sku,
        quantity: item.quantity,
        unit: (product.unit || 'PCS').toUpperCase(),
        sellingPrice: item.sellingPrice,
        discount: itemDisc,
        tax: itemTax,
        lineTotal
      });
    }

    const total = Number((subtotal - totalDiscount + totalTax).toFixed(2));

    if (amountReceived < 0 || amountReceived > total) {
      throw new AppError(`Amount received must be between 0 and the total sale value (₹${total}).`, 400);
    }

    let paymentStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
    if (amountReceived === total) {
      paymentStatus = 'Paid';
    } else if (amountReceived > 0) {
      paymentStatus = 'Partially Paid';
    }

    const pendingAmount = Number((total - amountReceived).toFixed(2));

    // Generate unique short sale number
    const saleNumber = `SAL-${new Date(saleDate).getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;

    const session = await mongoose.startSession();
    let saleResult: ISale | null = null;

    try {
      await session.withTransaction(async () => {
        // A. Save the sale record
        const sale = new Sale({
          saleNumber,
          saleDate: new Date(saleDate),
          customerId: finalCustomerId,
          customerNameSnapshot,
          customerPhoneSnapshot,
          items: parsedItems,
          subtotal,
          totalDiscount,
          totalTax,
          total,
          saleChannel,
          paymentMethod,
          paymentStatus,
          amountReceived,
          pendingAmount,
          status: 'Active',
          notes,
          sourceQuotationId: sourceQuotationId ? new mongoose.Types.ObjectId(sourceQuotationId) : null,
          sourceQuotationNumber: sourceQuotationNumber || null
        });

        saleResult = await sale.save({ session });

        // B. Apply negative stock movements via StockService using this session
        for (const item of parsedItems) {
          await stockService.applyMovement({
            productId: item.productId.toString(),
            variantId: item.variantId.toString(),
            quantityChange: -item.quantity, // Negative impact
            transactionType: 'SALE',
            referenceId: saleResult._id,
            referenceNumber: saleNumber,
            reason: 'POS Customer Invoice',
            notes: `Sale checkout: ${saleNumber}`,
            session
          });
        }

        // C. If payment was received at checkout (amountReceived > 0), create corresponding Payment voucher atomically
        if (amountReceived > 0) {
          const existingPayment = await Payment.findOne({ saleId: saleResult._id, paymentType: 'SALE_RECEIPT' }).session(session);
          if (!existingPayment) {
            const paymentNumber = `PAY-${new Date(saleDate).getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
            const payment = new Payment({
              paymentNumber,
              paymentDate: new Date(saleDate),
              customerId: finalCustomerId,
              saleId: saleResult._id,
              amount: amountReceived,
              paymentMethod,
              paymentType: 'SALE_RECEIPT',
              referenceNumber: saleNumber,
              status: 'Active',
              notes: notes ? notes.trim() : `POS Checkout Payment (${saleNumber})`
            });
            await payment.save({ session });
          }
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
        const sale = new Sale({
          saleNumber,
          saleDate: new Date(saleDate),
          customerId: finalCustomerId,
          customerNameSnapshot,
          customerPhoneSnapshot,
          items: parsedItems,
          subtotal,
          totalDiscount,
          totalTax,
          total,
          saleChannel,
          paymentMethod,
          paymentStatus,
          amountReceived,
          pendingAmount,
          status: 'Active',
          notes,
          sourceQuotationId: sourceQuotationId ? new mongoose.Types.ObjectId(sourceQuotationId) : null,
          sourceQuotationNumber: sourceQuotationNumber || null
        });

        saleResult = await sale.save();

        for (const item of parsedItems) {
          await stockService.applyMovement({
            productId: item.productId.toString(),
            variantId: item.variantId.toString(),
            quantityChange: -item.quantity,
            transactionType: 'SALE',
            referenceId: saleResult._id,
            referenceNumber: saleNumber,
            reason: 'POS Customer Invoice',
            notes: `Sale checkout: ${saleNumber}`
          });
        }

        if (amountReceived > 0) {
          const existingPayment = await Payment.findOne({ saleId: saleResult._id, paymentType: 'SALE_RECEIPT' });
          if (!existingPayment) {
            const paymentNumber = `PAY-${new Date(saleDate).getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
            const payment = new Payment({
              paymentNumber,
              paymentDate: new Date(saleDate),
              customerId: finalCustomerId,
              saleId: saleResult._id,
              amount: amountReceived,
              paymentMethod,
              paymentType: 'SALE_RECEIPT',
              referenceNumber: saleNumber,
              status: 'Active',
              notes: notes ? notes.trim() : `POS Checkout Payment (${saleNumber})`
            });
            await payment.save();
          }
        }
      } else {
        throw err;
      }
    } finally {
      session.endSession();
    }

    return saleResult!;
  }

  /**
   * Cancels a sale and restores variant stock balances atomically
   */
  public async cancelSale(id: string): Promise<ISale> {
    const sale = await Sale.findById(id);
    if (!sale) throw new AppError('Sale record not found.', 404);

    if (sale.status === 'Cancelled') {
      throw new AppError('Sale has already been cancelled.', 409);
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // A. Set sale status
        sale.status = 'Cancelled';
        await sale.save({ session });

        // B. Apply cancellation reversals (positive quantityChange)
        for (const item of sale.items) {
          await stockService.applyMovement({
            productId: item.productId.toString(),
            variantId: item.variantId.toString(),
            quantityChange: item.quantity, // Positive impact to restore stock!
            transactionType: 'CANCELLATION_REVERSAL',
            referenceId: sale._id,
            referenceNumber: sale.saleNumber,
            reason: 'Sale Cancelled Reversal',
            notes: `Reversal of sale checkout: ${sale.saleNumber}`,
            session
          });
        }

        // C. Reverse any active payments linked to this sale
        const activePayments = await Payment.find({ saleId: sale._id, status: 'Active' }).session(session);
        for (const p of activePayments) {
          p.status = 'Reversed';
          await p.save({ session });
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
        sale.status = 'Cancelled';
        await sale.save();

        for (const item of sale.items) {
          await stockService.applyMovement({
            productId: item.productId.toString(),
            variantId: item.variantId.toString(),
            quantityChange: item.quantity,
            transactionType: 'CANCELLATION_REVERSAL',
            referenceId: sale._id,
            referenceNumber: sale.saleNumber,
            reason: 'Sale Cancelled Reversal',
            notes: `Reversal of sale checkout: ${sale.saleNumber}`
          });
        }

        const activePayments = await Payment.find({ saleId: sale._id, status: 'Active' });
        for (const p of activePayments) {
          p.status = 'Reversed';
          await p.save();
        }
      } else {
        throw err;
      }
    } finally {
      session.endSession();
    }

    return sale;
  }
}

export const saleService = new SaleService();
