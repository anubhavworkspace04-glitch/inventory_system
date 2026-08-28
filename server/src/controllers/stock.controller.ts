import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { StockMovement } from '../models/StockMovement.js';
import { Product } from '../models/Product.js';
import { stockService } from '../services/stock/StockService.js';
import { AppError } from '../utils/appError.js';

export const getStockHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (req.query.productId && req.query.productId !== 'All') {
      query.productId = req.query.productId as string;
    }

    if (req.query.variantId && req.query.variantId !== 'All') {
      query.variantId = req.query.variantId as string;
    }

    if (req.query.transactionType && req.query.transactionType !== 'All') {
      query.transactionType = req.query.transactionType as string;
    }

    // Date range filter support
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) {
        query.createdAt.$gte = new Date(req.query.from as string);
      }
      if (req.query.to) {
        const toDate = new Date(req.query.to as string);
        toDate.setHours(23, 59, 59, 999); // include full end day
        query.createdAt.$lte = toDate;
      }
    }

    const total = await StockMovement.countDocuments(query);
    const movements = await StockMovement.find(query)
      .populate('productId', 'name variants')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const mapped = movements.map((m: any) => {
      const prod = m.productId;
      const variant = (prod && prod.variants && Array.isArray(prod.variants))
        ? prod.variants.find((v: any) => v && v._id && m.variantId && v._id.toString() === m.variantId.toString())
        : null;

      return {
        id: m._id ? m._id.toString() : '',
        productId: (prod && prod._id) ? prod._id.toString() : (m.productId ? m.productId.toString() : ''),
        productName: prod ? prod.name : 'Unknown Product',
        variantId: m.variantId ? m.variantId.toString() : '',
        variantName: variant ? variant.name : 'Unknown Variant',
        quantityChange: m.quantityChange,
        transactionType: m.transactionType,
        referenceId: m.referenceId ? m.referenceId.toString() : '',
        referenceNumber: m.referenceNumber || '',
        balanceAfter: m.balanceAfter,
        reason: m.reason || '',
        notes: m.notes || '',
        createdAt: m.createdAt ? m.createdAt.toISOString() : new Date().toISOString()
      };
    });

    res.status(200).json({
      success: true,
      data: mapped,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getStockMovementById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const m: any = await StockMovement.findById(req.params.id).populate('productId');
    if (!m) {
      return next(new AppError('Stock movement log not found.', 404));
    }

    const prod = m.productId;
    const variant = prod?.variants?.find((v: any) => v._id.toString() === m.variantId.toString());

    res.status(200).json({
      success: true,
      data: {
        id: m._id.toString(),
        productId: prod ? prod._id.toString() : m.productId.toString(),
        productName: prod ? prod.name : 'Unknown Product',
        variantId: m.variantId.toString(),
        variantName: variant ? variant.name : 'Unknown Variant',
        quantityChange: m.quantityChange,
        transactionType: m.transactionType,
        referenceId: m.referenceId,
        referenceNumber: m.referenceNumber,
        balanceAfter: m.balanceAfter,
        reason: m.reason || '',
        notes: m.notes || '',
        createdAt: m.createdAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, variantId, quantityChange, reason, notes } = req.body;

    if (!productId || !variantId || quantityChange === undefined || !reason) {
      return next(new AppError('Product ID, Variant ID, Quantity Change, and Reason are required fields.', 400));
    }

    const change = parseInt(quantityChange);
    if (isNaN(change)) {
      return next(new AppError('Quantity change must be a valid integer.', 400));
    }

    // Unique reference tracking number for manual adjustments
    const referenceNumber = `ADJ-${Date.now().toString().slice(-6)}`;

    const result = await stockService.applyMovement({
      productId,
      variantId,
      quantityChange: change,
      transactionType: 'STOCK_ADJUSTMENT',
      referenceId: new mongoose.Types.ObjectId(), // generate unique ID for this adjustment event
      referenceNumber,
      reason,
      notes
    });

    res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully.',
      data: {
        movement: result.movement,
        newBalance: result.newBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

export const reconcileVariantStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, variantId } = req.params;
    if (!productId || !variantId) {
      return next(new AppError('Product ID and Variant ID parameters are required.', 400));
    }

    const result = await stockService.reconcile(productId, variantId);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
