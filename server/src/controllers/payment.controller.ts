import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/PaymentService.js';
import { customerLedgerService } from '../services/CustomerLedgerService.js';

export const getPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const customerId = req.query.customerId as string;
    const saleId = req.query.saleId as string;
    const paymentMethod = req.query.paymentMethod as string;
    const paymentType = req.query.paymentType as string;
    const status = req.query.status as string;
    const from = req.query.from as string;
    const to = req.query.to as string;

    const result = await paymentService.getPayments({
      search,
      customerId,
      saleId,
      paymentMethod,
      paymentType,
      status,
      from,
      to,
      page,
      limit
    });

    const mapped = result.payments.map(p => ({
      id: p._id.toString(),
      paymentNumber: p.paymentNumber,
      paymentDate: p.paymentDate.toISOString().split('T')[0],
      customerId: p.customerId ? p.customerId.toString() : undefined,
      saleId: p.saleId ? p.saleId.toString() : undefined,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      paymentType: p.paymentType,
      referenceNumber: p.referenceNumber,
      status: p.status,
      notes: p.notes,
      createdAt: p.createdAt.toISOString()
    }));

    res.status(200).json({
      success: true,
      data: mapped,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const p = await paymentService.getPaymentById(req.params.id);
    res.status(200).json({
      success: true,
      data: {
        id: p._id.toString(),
        paymentNumber: p.paymentNumber,
        paymentDate: p.paymentDate.toISOString().split('T')[0],
        customerId: p.customerId ? p.customerId.toString() : undefined,
        saleId: p.saleId ? p.saleId.toString() : undefined,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        paymentType: p.paymentType,
        referenceNumber: p.referenceNumber,
        status: p.status,
        notes: p.notes,
        createdAt: p.createdAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payment = await paymentService.createPayment(req.body);
    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

export const reversePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payment = await paymentService.reversePayment(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Payment voucher reversed successfully.',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerLedger = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const from = req.query.from as string;
    const to = req.query.to as string;

    const result = await customerLedgerService.getCustomerLedger(req.params.id, {
      from,
      to,
      page,
      limit
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
