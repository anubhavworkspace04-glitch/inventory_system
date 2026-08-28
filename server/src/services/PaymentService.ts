import mongoose from 'mongoose';
import { Payment, IPayment, PaymentMethodType, PaymentTypeVal, PaymentStatusType } from '../models/Payment.js';
import { Sale } from '../models/Sale.js';
import { AppError } from '../utils/appError.js';

export class PaymentService {
  /**
   * Retrieves payments with pagination and filter criteria
   */
  public async getPayments(params: {
    search?: string;
    customerId?: string;
    saleId?: string;
    paymentMethod?: string;
    paymentType?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ payments: IPayment[]; total: number }> {
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

    if (params.saleId) {
      query.saleId = params.saleId;
    }

    if (params.paymentMethod && params.paymentMethod !== 'All') {
      query.paymentMethod = params.paymentMethod;
    }

    if (params.paymentType && params.paymentType !== 'All') {
      query.paymentType = params.paymentType;
    }

    if (params.status && params.status !== 'All') {
      query.status = params.status;
    }

    if (params.search) {
      const searchRegex = { $regex: params.search, $options: 'i' };
      query.$or = [
        { paymentNumber: searchRegex },
        { referenceNumber: searchRegex },
        { notes: searchRegex }
      ];
    }

    if (params.from || params.to) {
      query.paymentDate = {};
      if (params.from) query.paymentDate.$gte = new Date(params.from);
      if (params.to) {
        const toDate = new Date(params.to);
        toDate.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = toDate;
      }
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return { payments, total };
  }

  /**
   * Fetches single payment document
   */
  public async getPaymentById(id: string): Promise<IPayment> {
    const payment = await Payment.findById(id);
    if (!payment) {
      throw new AppError('Payment voucher not found.', 404);
    }
    return payment;
  }

  /**
   * Registers a customer payment allocation receipt atomically
   */
  public async createPayment(data: {
    saleId: string;
    amount: number;
    paymentMethod: PaymentMethodType;
    paymentDate: string;
    referenceNumber?: string;
    notes?: string;
  }): Promise<IPayment> {
    const { saleId, amount, paymentMethod, paymentDate, referenceNumber, notes } = data;

    // 1. Validations
    if (!saleId) throw new AppError('Sale reference ID is required.', 400);
    if (!amount || amount <= 0) throw new AppError('Payment amount must be greater than zero.', 400);

    const sale = await Sale.findById(saleId);
    if (!sale) throw new AppError('Associated sale invoice not found.', 404);
    if (sale.status === 'Cancelled') {
      throw new AppError('Sale is cancelled and cannot receive payments.', 409);
    }

    // Recalculate outstanding balance on server
    const activePayments = await Payment.find({ saleId: sale._id, status: 'Active' });
    const amountReceivedCache = activePayments.reduce((sum, p) => sum + p.amount, 0);
    const outstanding = Number((sale.total - amountReceivedCache).toFixed(2));

    if (amount > outstanding) {
      throw new AppError(
        `Overpayment blocked. Outstanding amount: ₹${outstanding}. Max payment allowed: ₹${outstanding}.`,
        409
      );
    }

    // Generate unique short payment code
    const paymentNumber = `PAY-${new Date(paymentDate).getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;

    const session = await mongoose.startSession();
    let paymentResult: IPayment | null = null;

    try {
      await session.withTransaction(async () => {
        // A. Insert the Payment document
        const payment = new Payment({
          paymentNumber,
          paymentDate: new Date(paymentDate),
          customerId: sale.customerId,
          saleId: sale._id,
          amount,
          paymentMethod,
          paymentType: 'SALE_RECEIPT',
          referenceNumber: referenceNumber?.trim(),
          status: 'Active',
          notes: notes?.trim()
        });

        paymentResult = await payment.save({ session });

        // B. Recompute and cache Sale summaries
        const finalReceived = Number((amountReceivedCache + amount).toFixed(2));
        const finalPending = Number((sale.total - finalReceived).toFixed(2));

        let finalStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
        if (finalPending <= 0) {
          finalStatus = 'Paid';
        } else if (finalReceived > 0) {
          finalStatus = 'Partially Paid';
        }

        sale.amountReceived = finalReceived;
        sale.pendingAmount = finalPending;
        sale.paymentStatus = finalStatus;

        await sale.save({ session });
      });
    } catch (err: any) {
      // Standalone MongoDB fallback
      const isStandaloneErr = 
        err.message.includes('replica set') || 
        err.message.includes('transaction numbers') ||
        err.codeName === 'TransactionSystemFailed';

      if (isStandaloneErr) {
        console.warn('MongoDB transaction failed (Standalone mode). Falling back to sequential execution.');

        const payment = new Payment({
          paymentNumber,
          paymentDate: new Date(paymentDate),
          customerId: sale.customerId,
          saleId: sale._id,
          amount,
          paymentMethod,
          paymentType: 'SALE_RECEIPT',
          referenceNumber: referenceNumber?.trim(),
          status: 'Active',
          notes: notes?.trim()
        });

        paymentResult = await payment.save();

        const finalReceived = Number((amountReceivedCache + amount).toFixed(2));
        const finalPending = Number((sale.total - finalReceived).toFixed(2));

        let finalStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
        if (finalPending <= 0) {
          finalStatus = 'Paid';
        } else if (finalReceived > 0) {
          finalStatus = 'Partially Paid';
        }

        sale.amountReceived = finalReceived;
        sale.pendingAmount = finalPending;
        sale.paymentStatus = finalStatus;

        await sale.save();
      } else {
        throw err;
      }
    } finally {
      session.endSession();
    }

    return paymentResult!;
  }

  /**
   * Reverses a payment receipt voucher atomically
   */
  public async reversePayment(id: string): Promise<IPayment> {
    const payment = await Payment.findById(id);
    if (!payment) throw new AppError('Payment voucher not found.', 404);

    if (payment.status === 'Reversed') {
      throw new AppError('Payment voucher has already been reversed.', 409);
    }

    const sale = await Sale.findById(payment.saleId);
    if (!sale) throw new AppError('Associated sale invoice not found for reversal.', 404);

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // A. Set payment status to Reversed
        payment.status = 'Reversed';
        await payment.save({ session });

        // B. Recompute Sale summary statistics excluding the reversed amount
        const activePayments = await Payment.find({ saleId: sale._id, status: 'Active', _id: { $ne: payment._id } });
        const finalReceived = Number(activePayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2));
        const finalPending = Number((sale.total - finalReceived).toFixed(2));

        let finalStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
        if (finalPending <= 0) {
          finalStatus = 'Paid';
        } else if (finalReceived > 0) {
          finalStatus = 'Partially Paid';
        }

        sale.amountReceived = finalReceived;
        sale.pendingAmount = finalPending;
        sale.paymentStatus = finalStatus;

        await sale.save({ session });
      });
    } catch (err: any) {
      // Standalone MongoDB fallback
      const isStandaloneErr = 
        err.message.includes('replica set') || 
        err.message.includes('transaction numbers') ||
        err.codeName === 'TransactionSystemFailed';

      if (isStandaloneErr) {
        console.warn('MongoDB transaction failed (Standalone mode). Falling back to sequential execution.');

        payment.status = 'Reversed';
        await payment.save();

        const activePayments = await Payment.find({ saleId: sale._id, status: 'Active', _id: { $ne: payment._id } });
        const finalReceived = Number(activePayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2));
        const finalPending = Number((sale.total - finalReceived).toFixed(2));

        let finalStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
        if (finalPending <= 0) {
          finalStatus = 'Paid';
        } else if (finalReceived > 0) {
          finalStatus = 'Partially Paid';
        }

        sale.amountReceived = finalReceived;
        sale.pendingAmount = finalPending;
        sale.paymentStatus = finalStatus;

        await sale.save();
      } else {
        throw err;
      }
    } finally {
      session.endSession();
    }

    return payment;
  }
}

export const paymentService = new PaymentService();
