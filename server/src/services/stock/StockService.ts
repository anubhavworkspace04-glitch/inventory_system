import mongoose from 'mongoose';
import { Product } from '../../models/Product.js';
import { StockMovement, TransactionType } from '../../models/StockMovement.js';
import { AppError } from '../../utils/appError.js';

export interface ApplyMovementInput {
  productId: string;
  variantId: string;
  quantityChange: number;
  transactionType: TransactionType;
  referenceId: string | mongoose.Types.ObjectId;
  referenceNumber: string;
  reason?: string;
  notes?: string;
  session?: mongoose.ClientSession;
}

export class StockService {
  /**
   * Core function to apply stock movements and maintain cachedStock in variants
   */
  public async applyMovement(input: ApplyMovementInput): Promise<{ movement: any; newBalance: number }> {
    const {
      productId,
      variantId,
      quantityChange,
      transactionType,
      referenceId,
      referenceNumber,
      reason,
      notes
    } = input;

    // 1. Basic validation inputs
    if (quantityChange === 0) {
      throw new AppError('Quantity change cannot be zero.', 400);
    }

    // 2. Prevent duplicate reversals
    if (transactionType === 'CANCELLATION_REVERSAL') {
      const existingReversal = await StockMovement.findOne({
        transactionType: 'CANCELLATION_REVERSAL',
        referenceId
      });
      if (existingReversal) {
        throw new AppError('Transaction has already been reversed.', 409);
      }
    }

    // 3. Find and validate product
    const product = await Product.findOne({ _id: productId, deletedAt: null });
    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    // 4. Find and validate variant
    const variant = product.variants.find(v => v._id?.toString() === variantId);
    if (!variant) {
      throw new AppError('Product variant not found.', 404);
    }

    if (!variant.isActive) {
      throw new AppError('Cannot apply movement on an inactive variant.', 400);
    }

    const currentStock = variant.cachedStock;
    const newStock = currentStock + quantityChange;

    // 5. Check negative stock rule
    if (newStock < 0) {
      throw new AppError('Insufficient stock for this operation.', 409, [
        {
          available: currentStock,
          requested: Math.abs(quantityChange)
        }
      ]);
    }

    // 6. Execute atomic writes inside session transaction with sequential fallback
    let movementResult: any = null;

    if (input.session) {
      const activeSession = input.session;
      // Execute within existing session provided by caller
      await Product.updateOne(
        { _id: productId, 'variants._id': variantId },
        { $set: { 'variants.$.cachedStock': newStock } },
        { session: activeSession }
      );

      const movement = new StockMovement({
        productId,
        variantId,
        quantityChange,
        transactionType,
        referenceId,
        referenceNumber,
        balanceAfter: newStock,
        reason,
        notes
      });

      movementResult = await movement.save({ session: activeSession });
    } else {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          // A. Update variant cachedStock
          await Product.updateOne(
            { _id: productId, 'variants._id': variantId },
            { $set: { 'variants.$.cachedStock': newStock } },
            { session }
          );

          // B. Save stock movement log
          const movement = new StockMovement({
            productId,
            variantId,
            quantityChange,
            transactionType,
            referenceId,
            referenceNumber,
            balanceAfter: newStock,
            reason,
            notes
          });

          movementResult = await movement.save({ session });
        });
      } catch (err: any) {
        // Standalone local MongoDB fallback
        const isStandaloneErr = 
          err.message.includes('replica set') || 
          err.message.includes('transaction numbers') ||
          err.codeName === 'TransactionSystemFailed';

        if (isStandaloneErr) {
          console.warn('MongoDB transaction failed (Standalone mode). Running sequential operations fallback.');
          
          // Retry sequential updates without active session boundary
          await Product.updateOne(
            { _id: productId, 'variants._id': variantId },
            { $set: { 'variants.$.cachedStock': newStock } }
          );

          const movement = new StockMovement({
            productId,
            variantId,
            quantityChange,
            transactionType,
            referenceId,
            referenceNumber,
            balanceAfter: newStock,
            reason,
            notes
          });

          movementResult = await movement.save();
        } else {
          throw err; // Re-throw other validation/database errors
        }
      } finally {
        session.endSession();
      }
    }

    return {
      movement: movementResult,
      newBalance: newStock
    };
  }

  /**
   * Development tool to reconcile the running sum of movements with the cached value in the variant
   */
  public async reconcile(productId: string, variantId: string): Promise<{ ledgerStock: number; cachedStock: number; difference: number; status: 'MATCH' | 'MISMATCH' }> {
    // A. Sum movements
    const movements = await StockMovement.find({ productId, variantId });
    const ledgerStock = movements.reduce((sum, m) => sum + m.quantityChange, 0);

    // B. Read cachedStock
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found for reconciliation.', 404);
    }
    const variant = product.variants.find(v => v._id?.toString() === variantId);
    if (!variant) {
      throw new AppError('Variant not found for reconciliation.', 404);
    }

    const cachedStock = variant.cachedStock;
    const difference = ledgerStock - cachedStock;

    return {
      ledgerStock,
      cachedStock,
      difference,
      status: difference === 0 ? 'MATCH' : 'MISMATCH'
    };
  }

  /**
   * Reconciles and synchronizes cachedStock on all variants across all products
   * with the sum of their actual StockMovement ledger entries.
   */
  public async syncAllCachedStocks(): Promise<{ updatedCount: number }> {
    const products = await Product.find({ deletedAt: null });
    let updatedCount = 0;

    for (const p of products) {
      let isModified = false;
      for (const v of p.variants) {
        const movements = await StockMovement.find({ productId: p._id, variantId: v._id });
        const ledgerStock = movements.reduce((sum, m) => sum + m.quantityChange, 0);

        if (v.cachedStock !== ledgerStock) {
          v.cachedStock = ledgerStock;
          isModified = true;
          updatedCount++;
        }
      }
      if (isModified) {
        await p.save();
      }
    }

    return { updatedCount };
  }
}

export const stockService = new StockService();
