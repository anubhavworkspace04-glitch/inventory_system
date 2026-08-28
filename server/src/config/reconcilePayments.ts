import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Sale } from '../models/Sale.js';
import { Payment } from '../models/Payment.js';
import { Customer } from '../models/Customer.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_app';

const runReconciliation = async () => {
  try {
    console.log('Connecting to database for financial reconciliation check...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected. Running reconciliation...');

    let paymentsMismatch = 0;
    let customersMismatch = 0;

    // 1. Payment Reconciliation
    console.log('\n--- 1. Reconciling Payment Vouchers against Sale Summaries ---');
    const sales = await Sale.find();

    for (const s of sales) {
      const activePayments = await Payment.find({ saleId: s._id, status: 'Active' });
      const computedSum = Number(activePayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2));
      const cacheReceived = Number(s.amountReceived.toFixed(2));

      if (Math.abs(computedSum - cacheReceived) > 0.01) {
        console.warn(`[MISMATCH] Sale: ${s.saleNumber}`);
        console.warn(` - Stored Sale amountReceived: ₹${cacheReceived}`);
        console.warn(` - Payments ledger sum: ₹${computedSum}`);
        paymentsMismatch++;
      }
    }

    if (paymentsMismatch === 0) {
      console.log('Payment reconciliation PASSED. All Sale cash caches match the Payment ledger. ✅');
    } else {
      console.warn(`Payment reconciliation FAILED with ${paymentsMismatch} discrepancies.`);
    }

    // 2. Customer Ledger Reconciliation
    console.log('\n--- 2. Reconciling Customer Ledger Balances against Sale Outstanding Balances ---');
    const customers = await Customer.find({ deletedAt: null });

    for (const c of customers) {
      // Aggregate chronologically
      const custSales = await Sale.find({ customerId: c._id });
      const custPayments = await Payment.find({ customerId: c._id });

      let debits = 0;
      let credits = 0;

      for (const s of custSales) {
        debits += s.total;
        if (s.status === 'Cancelled') {
          credits += s.total;
        }
      }

      for (const p of custPayments) {
        credits += p.amount;
        if (p.status === 'Reversed') {
          debits += p.amount;
        }
      }

      const ledgerBalance = Number((debits - credits).toFixed(2));

      // Outstanding from Active Sales
      const activeSales = custSales.filter(s => s.status === 'Active');
      const salesOutstanding = Number(activeSales.reduce((sum, s) => sum + s.pendingAmount, 0).toFixed(2));

      if (Math.abs(ledgerBalance - salesOutstanding) > 0.01) {
        console.warn(`[MISMATCH] Customer: ${c.name} (${c.phone})`);
        console.warn(` - Chronological ledger balance: ₹${ledgerBalance}`);
        console.warn(` - Sum of active sales pendingAmount: ₹${salesOutstanding}`);
        customersMismatch++;
      }
    }

    if (customersMismatch === 0) {
      console.log('Customer Ledger reconciliation PASSED. All chronological statements align. ✅');
    } else {
      console.warn(`Customer Ledger reconciliation FAILED with ${customersMismatch} discrepancies.`);
    }

    console.log('\n--- Final Reconciliation Report ---');
    if (paymentsMismatch === 0 && customersMismatch === 0) {
      console.log('Financial Reconciliation: PASSED 🏆');
    } else {
      console.error('Financial Reconciliation: FAILED ❌');
    }

    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (err) {
    console.error('Reconciliation failed:', err);
    process.exit(1);
  }
};

runReconciliation();
