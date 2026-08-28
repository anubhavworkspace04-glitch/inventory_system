import { Sale } from '../models/Sale.js';
import { Payment } from '../models/Payment.js';
import { Customer } from '../models/Customer.js';
import { AppError } from '../utils/appError.js';

export interface ILedgerRow {
  date: Date;
  referenceId: string;
  referenceNumber: string;
  type: 'debit' | 'credit';
  description: string;
  debit: number;
  credit: number;
  balanceAfter: number;
}

export class CustomerLedgerService {
  /**
   * Generates chronological, deterministic account statement ledger details for a customer
   */
  public async getCustomerLedger(
    customerId: string,
    params: { from?: string; to?: string; page?: number; limit?: number }
  ): Promise<{
    openingBalance: number;
    closingBalance: number;
    transactions: ILedgerRow[];
    total: number;
  }> {
    const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
    if (!customer) throw new AppError('Customer not found.', 404);

    // 1. Retrieve all sales (including cancelled ones)
    const sales = await Sale.find({ customerId: customer._id });

    // 2. Retrieve all payments (including reversed ones)
    const payments = await Payment.find({ customerId: customer._id });

    const rawRows: { date: Date; referenceId: string; referenceNumber: string; debit: number; credit: number; description: string }[] = [];

    // A. Map Sales to debits & credit adjustments
    for (const s of sales) {
      // Debit entry: Original sale total invoice value
      rawRows.push({
        date: s.saleDate,
        referenceId: s._id.toString(),
        referenceNumber: s.saleNumber,
        debit: s.total,
        credit: 0,
        description: `Tax Invoice Order`
      });

      // If cancelled, insert a Credit adjusting entry to clear the debit balance
      if (s.status === 'Cancelled') {
        // Use updatedAt as the cancellation date
        rawRows.push({
          date: s.updatedAt,
          referenceId: s._id.toString(),
          referenceNumber: s.saleNumber,
          debit: 0,
          credit: s.total,
          description: `Invoice Cancellation Adjustment`
        });
      }
    }

    // B. Map Payments to credits & debit adjustments
    for (const p of payments) {
      // Credit entry: Payment receipt amount received
      rawRows.push({
        date: p.paymentDate,
        referenceId: p._id.toString(),
        referenceNumber: p.paymentNumber,
        debit: 0,
        credit: p.amount,
        description: `Payment Receipt: ${p.paymentMethod} (${p.referenceNumber || 'Counter cash'})`
      });

      // If reversed, insert a Debit adjusting entry to restore the outstanding balance
      if (p.status === 'Reversed') {
        rawRows.push({
          date: p.updatedAt,
          referenceId: p._id.toString(),
          referenceNumber: p.paymentNumber,
          debit: p.amount,
          credit: 0,
          description: `Receipt Reversal: ${p.paymentNumber}`
        });
      }
    }

    // 3. Chronological sorting (oldest first!)
    rawRows.sort((a, b) => a.date.getTime() - b.date.getTime());

    // 4. Calculate running balances chronologically
    let runningBalance = 0;
    const ledgerRows: ILedgerRow[] = rawRows.map(row => {
      runningBalance = Number((runningBalance + row.debit - row.credit).toFixed(2));
      return {
        date: row.date,
        referenceId: row.referenceId,
        referenceNumber: row.referenceNumber,
        type: row.debit > 0 ? 'debit' : 'credit',
        description: row.description,
        debit: row.debit,
        credit: row.credit,
        balanceAfter: runningBalance
      };
    });

    // 5. Filter by Date Bounds (split pre-period for Opening Balance)
    const fromDate = params.from ? new Date(params.from) : null;
    const toDate = params.to ? new Date(params.to) : null;
    if (toDate) toDate.setHours(23, 59, 59, 999);

    let openingBalance = 0;
    let periodRows: ILedgerRow[] = [];

    if (fromDate) {
      // Find last entry before the start date
      const preTransactions = ledgerRows.filter(r => r.date.getTime() < fromDate.getTime());
      if (preTransactions.length > 0) {
        openingBalance = preTransactions[preTransactions.length - 1].balanceAfter;
      }
      
      periodRows = ledgerRows.filter(r => {
        const time = r.date.getTime();
        const afterFrom = time >= fromDate.getTime();
        const beforeTo = toDate ? time <= toDate.getTime() : true;
        return afterFrom && beforeTo;
      });
    } else {
      periodRows = ledgerRows.filter(r => {
        return toDate ? r.date.getTime() <= toDate.getTime() : true;
      });
    }

    const total = periodRows.length;
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const paginatedTransactions = periodRows.slice(skip, skip + limit);

    // Closing Balance is the running balance of the final row
    const closingBalance = ledgerRows.length > 0 ? ledgerRows[ledgerRows.length - 1].balanceAfter : 0;

    return {
      openingBalance,
      closingBalance,
      transactions: paginatedTransactions,
      total
    };
  }
}

export const customerLedgerService = new CustomerLedgerService();
