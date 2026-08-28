import { Request, Response, NextFunction } from 'express';
import { purchaseService } from '../services/PurchaseService.js';
import { AppError } from '../utils/appError.js';

export const getPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const supplierId = req.query.supplierId as string;
    const paymentStatus = req.query.paymentStatus as string;
    const status = req.query.status as string;
    const from = req.query.from as string;
    const to = req.query.to as string;

    const result = await purchaseService.getPurchases({
      search,
      supplierId,
      paymentStatus,
      status,
      from,
      to,
      page,
      limit
    });

    const mapped = result.purchases.map(p => ({
      id: p._id.toString(),
      purchaseNumber: p.purchaseNumber,
      supplierId: p.supplierId.toString(),
      supplierNameSnapshot: p.supplierNameSnapshot,
      purchaseDate: p.purchaseDate.toISOString().split('T')[0],
      items: p.items.map(item => ({
        productId: item.productId.toString(),
        variantId: item.variantId.toString(),
        productNameSnapshot: item.productNameSnapshot,
        variantNameSnapshot: item.variantNameSnapshot,
        skuSnapshot: item.skuSnapshot,
        quantity: item.quantity,
        unitPurchasePrice: item.unitPurchasePrice,
        baseAmount: item.baseAmount
      })),
      additionalCosts: p.additionalCosts,
      baseAmount: p.baseAmount,
      totalAdditionalCosts: p.totalAdditionalCosts,
      totalPurchaseCost: p.totalPurchaseCost,
      paymentMode: p.paymentMode,
      paymentStatus: p.paymentStatus,
      amountPaid: p.amountPaid,
      pendingAmount: p.pendingAmount,
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

export const getPurchaseById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const p = await purchaseService.getPurchaseById(req.params.id);

    res.status(200).json({
      success: true,
      data: {
        id: p._id.toString(),
        purchaseNumber: p.purchaseNumber,
        supplierId: p.supplierId.toString(),
        supplierNameSnapshot: p.supplierNameSnapshot,
        purchaseDate: p.purchaseDate.toISOString().split('T')[0],
        items: p.items.map(item => ({
          productId: item.productId.toString(),
          variantId: item.variantId.toString(),
          productNameSnapshot: item.productNameSnapshot,
          variantNameSnapshot: item.variantNameSnapshot,
          skuSnapshot: item.skuSnapshot,
          quantity: item.quantity,
          unitPurchasePrice: item.unitPurchasePrice,
          baseAmount: item.baseAmount
        })),
        additionalCosts: p.additionalCosts,
        baseAmount: p.baseAmount,
        totalAdditionalCosts: p.totalAdditionalCosts,
        totalPurchaseCost: p.totalPurchaseCost,
        paymentMode: p.paymentMode,
        paymentStatus: p.paymentStatus,
        amountPaid: p.amountPaid,
        pendingAmount: p.pendingAmount,
        status: p.status,
        notes: p.notes,
        createdAt: p.createdAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createPurchase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const purchase = await purchaseService.createPurchase(req.body);
    res.status(201).json({
      success: true,
      message: 'Purchase created successfully.',
      data: purchase
    });
  } catch (error) {
    next(error);
  }
};

export const cancelPurchase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const purchase = await purchaseService.cancelPurchase(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Purchase cancelled successfully.',
      data: purchase
    });
  } catch (error) {
    next(error);
  }
};
