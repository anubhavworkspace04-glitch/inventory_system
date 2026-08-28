import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/Product.js';
import { StockMovement } from '../models/StockMovement.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_app';

const runMigration = async () => {
  try {
    console.log('Connecting to database for stock ledger migration...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected. Running idempotent migration...');

    const products = await Product.find({ deletedAt: null });
    let migratedCount = 0;

    for (const p of products) {
      let productModified = false;

      for (const v of p.variants) {
        const variantIdStr = v._id!.toString();

        // Check if any movements exist for this variant
        const movementCount = await StockMovement.countDocuments({
          productId: p._id,
          variantId: v._id
        });

        if (movementCount === 0) {
          console.log(`[MIGRATION REQUIRED] Product: ${p.name}, Variant: ${v.name} (${v.sku})`);
          console.log(` - Old cachedStock: ${v.cachedStock}`);
          console.log(` - Opening stock: ${v.openingStock}`);

          const balance = v.openingStock;

          // Create the opening stock movement log
          const movement = new StockMovement({
            productId: p._id,
            variantId: v._id,
            quantityChange: v.openingStock,
            transactionType: 'OPENING_STOCK',
            referenceId: p._id,
            referenceNumber: `OPN-${v.sku}`,
            balanceAfter: balance,
            reason: 'Opening stock migration',
            notes: 'Created automatically by migrate:stock migration runner.'
          });

          await movement.save();
          console.log(` - Created Movement: ${movement._id} with quantity +${v.openingStock}`);

          // Set cachedStock consistently
          v.cachedStock = balance;
          productModified = true;
          migratedCount++;
          
          console.log(` - Final cachedStock: ${v.cachedStock}`);
        }
      }

      if (productModified) {
        await p.save();
      }
    }

    console.log(`Migration finished. Migrated ${migratedCount} variants. Running reconciliation scan...`);

    // Run reconciliation check
    let mismatchCount = 0;
    const allProducts = await Product.find({ deletedAt: null });

    for (const p of allProducts) {
      for (const v of p.variants) {
        const movements = await StockMovement.find({ productId: p._id, variantId: v._id });
        const expectedStock = movements.reduce((sum, m) => sum + m.quantityChange, 0);

        if (expectedStock !== v.cachedStock) {
          console.warn(`[MISMATCH] Mismatch found in Product: ${p.name}, Variant: ${v.name} (${v.sku})`);
          console.warn(` - Expected (Ledger sum): ${expectedStock}`);
          console.warn(` - Actual (Variant cache): ${v.cachedStock}`);
          mismatchCount++;
        }
      }
    }

    if (mismatchCount === 0) {
      console.log('Reconciliation SCAN PASSED! All variant stocks are in complete ledger alignment. ✅');
    } else {
      console.warn(`Reconciliation SCAN FAILED with ${mismatchCount} mismatches. Mismatches must be reconciled manually.`);
    }

    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
