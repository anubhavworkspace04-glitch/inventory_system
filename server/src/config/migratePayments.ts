import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Sale } from '../models/Sale.js';
import { Payment } from '../models/Payment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_app';

const runMigration = async () => {
  try {
    console.log('Connecting to database for payments ledger migration...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected. Running idempotent payments migration...');

    const sales = await Sale.find({ amountReceived: { $gt: 0 } });
    let createdCount = 0;

    for (const sale of sales) {
      // Check if a payment already exists for this sale
      const existingPaymentsCount = await Payment.countDocuments({ saleId: sale._id });

      if (existingPaymentsCount === 0) {
        console.log(`[MIGRATION REQUIRED] Sale: ${sale.saleNumber}, Customer: ${sale.customerNameSnapshot}`);
        console.log(` - amountReceived in Sale document: ₹${sale.amountReceived}`);

        const paymentNumber = `PAY-${sale.saleNumber.replace('SAL-', '')}`;

        // Create the historical payment voucher
        const payment = new Payment({
          paymentNumber,
          paymentDate: sale.saleDate,
          customerId: sale.customerId || null,
          saleId: sale._id,
          amount: sale.amountReceived,
          paymentMethod: sale.paymentMethod || 'UPI',
          paymentType: 'SALE_RECEIPT',
          referenceNumber: 'MIGRATION',
          status: 'Active',
          notes: 'Idempotent historical payment created by migratePayments script.'
        });

        await payment.save();
        console.log(` - Created Payment voucher: ${payment.paymentNumber} with amount ₹${payment.amount}`);
        createdCount++;
      }
    }

    console.log(`Migration finished. Created ${createdCount} payments receipts. Running reconciliation scan...`);

    // Run reconciliation scan
    let mismatchCount = 0;
    const allSales = await Sale.find({ status: 'Active' });

    for (const s of allSales) {
      const activePayments = await Payment.find({ saleId: s._id, status: 'Active' });
      const computedSum = activePayments.reduce((sum, p) => sum + p.amount, 0);

      if (Math.abs(computedSum - s.amountReceived) > 0.01) {
        console.warn(`[MISMATCH] Mismatch found in Sale: ${s.saleNumber}`);
        console.warn(` - Stored in Sale cache: ₹${s.amountReceived}`);
        console.warn(` - Stored in Payments sum: ₹${computedSum}`);
        mismatchCount++;
      }
    }

    if (mismatchCount === 0) {
      console.log('Payments reconciliation SCAN PASSED! All sale payment stats align with payments ledger. ✅');
    } else {
      console.warn(`Payments reconciliation SCAN FAILED with ${mismatchCount} mismatches.`);
    }

    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
