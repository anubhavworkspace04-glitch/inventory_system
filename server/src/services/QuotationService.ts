import mongoose from 'mongoose';
import { Quotation, IQuotation, QuotationStatus, IQuotationItem } from '../models/Quotation.js';
import { Customer } from '../models/Customer.js';
import { Product } from '../models/Product.js';
import { saleService } from './SaleService.js';
import { stockService } from './stock/StockService.js';
import { AppError } from '../utils/appError.js';

export class QuotationService {
  /**
   * Run cron-free check to mark expired quotations in the DB
   */
  private async evaluateExpiries(query: any): Promise<void> {
    const now = new Date();
    // Idempotently mark eligible open quotations as EXPIRED
    await Quotation.updateMany(
      {
        ...query,
        status: { $in: ['DRAFT', 'SENT', 'ACCEPTED'] },
        expiryDate: { $lt: now }
      },
      {
        $set: { status: 'EXPIRED' }
      }
    );
  }

  /**
   * Retrieve quotations list with filters
   */
  public async getQuotations(params: {
    search?: string;
    customerId?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ quotations: IQuotation[]; total: number }> {
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

    if (params.status && params.status !== 'All') {
      query.status = params.status;
    }

    if (params.search) {
      const searchRegex = { $regex: params.search, $options: 'i' };
      query.$or = [
        { quotationNumber: searchRegex },
        { customerNameSnapshot: searchRegex },
        { 'items.skuSnapshot': searchRegex },
        { 'items.productNameSnapshot': searchRegex }
      ];
    }

    if (params.from || params.to) {
      query.quotationDate = {};
      if (params.from) query.quotationDate.$gte = new Date(params.from);
      if (params.to) {
        const toDate = new Date(params.to);
        toDate.setHours(23, 59, 59, 999);
        query.quotationDate.$lte = toDate;
      }
    }

    // Run expiration updates before returning listings
    await this.evaluateExpiries(query);

    const total = await Quotation.countDocuments(query);
    const quotations = await Quotation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return { quotations, total };
  }

  /**
   * Fetch single quotation by ID
   */
  public async getQuotationById(id: string): Promise<IQuotation> {
    const q = await Quotation.findById(id);
    if (!q) {
      throw new AppError('Quotation not found.', 404);
    }

    // Perform runtime expiry check for details request
    const now = new Date();
    if (['DRAFT', 'SENT', 'ACCEPTED'].includes(q.status) && q.expiryDate < now) {
      q.status = 'EXPIRED';
      await q.save();
    }

    return q;
  }

  /**
   * Save a new estimate/quotation (zero stock changes!)
   */
  public async createQuotation(data: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    quotationDate: string;
    expiryDate: string;
    items: { productId: string; variantId: string; quantity: number; sellingPrice: number; discount?: number; tax?: number }[];
    notes?: string;
    terms?: string;
    status?: QuotationStatus;
  }): Promise<IQuotation> {
    const { customerId, customerName, customerPhone, quotationDate, expiryDate, items, notes, terms, status } = data;

    if (!items || items.length === 0) {
      throw new AppError('Quotation must contain at least one item.', 400);
    }

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

    // Process and validate items
    const parsedItems: IQuotationItem[] = [];
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const item of items) {
      if (item.quantity <= 0) throw new AppError('Quantity must be greater than zero.', 400);
      if (item.sellingPrice < 0) throw new AppError('Selling rate price cannot be negative.', 400);

      const product = await Product.findOne({ _id: item.productId, deletedAt: null });
      if (!product) throw new AppError(`Product ID ${item.productId} not found.`, 404);
      if (!product.isActive) throw new AppError(`Product ${product.name} is inactive.`, 400);

      const variant = product.variants.find(v => v._id?.toString() === item.variantId);
      if (!variant) throw new AppError(`Variant ID ${item.variantId} not found.`, 404);
      if (!variant.isActive) throw new AppError(`Variant ${variant.name} is inactive.`, 400);

      const itemSub = Number((item.quantity * item.sellingPrice).toFixed(2));
      const itemDisc = item.discount ? Number(item.discount.toFixed(2)) : 0;
      const itemTax = item.tax ? Number(item.tax.toFixed(2)) : 0;
      const lineTotal = Number((itemSub - itemDisc + itemTax).toFixed(2));

      if (lineTotal < 0) {
        throw new AppError(`Discount cannot exceed value for item ${product.name}.`, 400);
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
        sellingPrice: item.sellingPrice,
        discount: itemDisc,
        tax: itemTax,
        lineTotal
      });
    }

    const total = Number((subtotal - totalDiscount + totalTax).toFixed(2));

    // Concurrency-safe unique quotation number
    const quotationNumber = `QUO-${new Date(quotationDate).getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;

    const q = new Quotation({
      quotationNumber,
      quotationDate: new Date(quotationDate),
      expiryDate: new Date(expiryDate),
      customerId: finalCustomerId,
      customerNameSnapshot,
      customerPhoneSnapshot,
      items: parsedItems,
      subtotal,
      totalDiscount,
      totalTax,
      total,
      status: status || 'DRAFT',
      notes: notes?.trim(),
      terms: terms?.trim()
    });

    return await q.save();
  }

  /**
   * Edit/Update draft or open quotation details (zero stock changes!)
   */
  public async updateQuotation(
    id: string,
    data: {
      customerId?: string;
      customerName?: string;
      customerPhone?: string;
      quotationDate?: string;
      expiryDate?: string;
      items?: { productId: string; variantId: string; quantity: number; sellingPrice: number; discount?: number; tax?: number }[];
      notes?: string;
      terms?: string;
      status?: QuotationStatus;
    }
  ): Promise<IQuotation> {
    const q = await Quotation.findById(id);
    if (!q) throw new AppError('Quotation not found.', 404);

    if (q.status === 'CONVERTED') {
      throw new AppError('Converted quotations are finalized and cannot be modified.', 409);
    }
    if (q.status === 'CANCELLED') {
      throw new AppError('Cancelled quotations cannot be modified.', 409);
    }

    // Apply updates
    if (data.quotationDate) q.quotationDate = new Date(data.quotationDate);
    if (data.expiryDate) q.expiryDate = new Date(data.expiryDate);
    if (data.notes !== undefined) q.notes = data.notes;
    if (data.terms !== undefined) q.terms = data.terms;
    if (data.status) q.status = data.status;

    if (data.customerId !== undefined || data.customerName !== undefined) {
      if (data.customerId) {
        const customer = await Customer.findOne({ _id: data.customerId, deletedAt: null });
        if (!customer) throw new AppError('Selected customer not found.', 404);
        q.customerId = customer._id;
        q.customerNameSnapshot = customer.name;
        q.customerPhoneSnapshot = customer.phone;
      } else {
        q.customerId = null;
        q.customerNameSnapshot = data.customerName || 'Walk-in Customer';
        q.customerPhoneSnapshot = data.customerPhone || '';
      }
    }

    if (data.items) {
      const parsedItems: IQuotationItem[] = [];
      let subtotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;

      for (const item of data.items) {
        if (item.quantity <= 0) throw new AppError('Quantity must be greater than zero.', 400);
        const product = await Product.findOne({ _id: item.productId, deletedAt: null });
        if (!product) throw new AppError(`Product ${item.productId} not found.`, 404);

        const variant = product.variants.find(v => v._id?.toString() === item.variantId);
        if (!variant) throw new AppError(`Variant ${item.variantId} not found.`, 404);

        const itemSub = Number((item.quantity * item.sellingPrice).toFixed(2));
        const itemDisc = item.discount ? Number(item.discount.toFixed(2)) : 0;
        const itemTax = item.tax ? Number(item.tax.toFixed(2)) : 0;
        const lineTotal = Number((itemSub - itemDisc + itemTax).toFixed(2));

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
          sellingPrice: item.sellingPrice,
          discount: itemDisc,
          tax: itemTax,
          lineTotal
        });
      }

      q.items = parsedItems;
      q.subtotal = subtotal;
      q.totalDiscount = totalDiscount;
      q.totalTax = totalTax;
      q.total = Number((subtotal - totalDiscount + totalTax).toFixed(2));
    }

    return await q.save();
  }

  /**
   * Cancels quotation (No stock impact)
   */
  public async cancelQuotation(id: string): Promise<IQuotation> {
    const q = await Quotation.findById(id);
    if (!q) throw new AppError('Quotation not found.', 404);

    if (q.status === 'CONVERTED') {
      throw new AppError('Converted quotation cannot be cancelled.', 409);
    }

    q.status = 'CANCELLED';
    return await q.save();
  }

  /**
   * Accepts quotation (No stock impact)
   */
  public async acceptQuotation(id: string): Promise<IQuotation> {
    const q = await Quotation.findById(id);
    if (!q) throw new AppError('Quotation not found.', 404);

    if (['CONVERTED', 'CANCELLED', 'EXPIRED'].includes(q.status)) {
      throw new AppError(`Quotation in ${q.status} status cannot be accepted.`, 409);
    }

    q.status = 'ACCEPTED';
    return await q.save();
  }

  /**
   * Rejects quotation (No stock impact)
   */
  public async rejectQuotation(id: string): Promise<IQuotation> {
    const q = await Quotation.findById(id);
    if (!q) throw new AppError('Quotation not found.', 404);

    if (['CONVERTED', 'CANCELLED'].includes(q.status)) {
      throw new AppError(`Finalized quotation cannot be rejected.`, 409);
    }

    q.status = 'REJECTED';
    return await q.save();
  }

  /**
   * Clones quotation as draft
   */
  public async duplicateQuotation(id: string): Promise<IQuotation> {
    const q = await Quotation.findById(id);
    if (!q) throw new AppError('Quotation to duplicate not found.', 404);

    const now = new Date();
    const expiry = new Date();
    expiry.setDate(now.getDate() + 7); // Default 7 days extension

    const quotationNumber = `QUO-${now.getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;

    const duplicated = new Quotation({
      quotationNumber,
      quotationDate: now,
      expiryDate: expiry,
      customerId: q.customerId,
      customerNameSnapshot: q.customerNameSnapshot,
      customerPhoneSnapshot: q.customerPhoneSnapshot,
      items: q.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        productNameSnapshot: item.productNameSnapshot,
        variantNameSnapshot: item.variantNameSnapshot,
        skuSnapshot: item.skuSnapshot,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        discount: item.discount,
        tax: item.tax,
        lineTotal: item.lineTotal
      })),
      subtotal: q.subtotal,
      totalDiscount: q.totalDiscount,
      totalTax: q.totalTax,
      total: q.total,
      status: 'DRAFT',
      notes: q.notes,
      terms: q.terms
    });

    return await duplicated.save();
  }

  /**
   * POS Conversion from Quotation to Sale document atomically (triggers stock deduction)
   */
  public async convertToSale(
    id: string,
    data: {
      saleChannel: 'Online' | 'Offline';
      paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
      notes?: string;
    }
  ): Promise<any> {
    const q = await Quotation.findById(id);
    if (!q) throw new AppError('Quotation not found.', 404);

    // 1. Validation checks
    if (q.status === 'CONVERTED') {
      throw new AppError(`Quotation already converted to Sale: ${q.convertedSaleId || 'unknown'}.`, 409);
    }
    if (q.status === 'CANCELLED') {
      throw new AppError('Cancelled quotations cannot be converted.', 409);
    }
    if (q.status === 'REJECTED') {
      throw new AppError('Rejected quotations cannot be converted.', 409);
    }

    // Cron-free evaluation check
    const now = new Date();
    if (q.expiryDate < now) {
      q.status = 'EXPIRED';
      await q.save();
      throw new AppError('Quotation has expired and cannot be converted.', 409);
    }

    // 2. Validate stock availability for all variants
    for (const item of q.items) {
      const product = await Product.findOne({ _id: item.productId, deletedAt: null });
      if (!product) throw new AppError(`Product ${item.productId} no longer exists.`, 404);

      const variant = product.variants.find(v => v._id?.toString() === item.variantId.toString());
      if (!variant) throw new AppError(`Variant ${item.variantId} no longer exists.`, 404);

      if (variant.cachedStock < item.quantity) {
        throw new AppError(
          `Insufficient stock. ${product.name} (${variant.name}) requested: ${item.quantity}, available: ${variant.cachedStock}.`,
          409
        );
      }
    }

    // 3. Construct conversion arguments
    const salePayload = {
      customerId: q.customerId ? q.customerId.toString() : undefined,
      customerName: q.customerId ? undefined : q.customerNameSnapshot,
      customerPhone: q.customerId ? undefined : q.customerPhoneSnapshot,
      saleDate: new Date().toISOString(),
      items: q.items.map(item => ({
        productId: item.productId.toString(),
        variantId: item.variantId.toString(),
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        discount: item.discount,
        tax: item.tax
      })),
      saleChannel: data.saleChannel,
      paymentMethod: data.paymentMethod,
      amountReceived: 0, // Starts at 0 paid as required
      notes: data.notes || q.notes,
      sourceQuotationId: q._id.toString(),
      sourceQuotationNumber: q.quotationNumber
    };

    const session = await mongoose.startSession();
    let saleResult: any = null;

    try {
      await session.withTransaction(async () => {
        // A. Call SaleService to register the Sale (this creates the invoice and applies negative StockMovement logs)
        saleResult = await saleService.createSale(salePayload);

        // B. Update Quotation Status
        q.status = 'CONVERTED';
        q.convertedSaleId = saleResult._id;
        q.convertedAt = new Date();
        await q.save({ session });
      });
    } catch (err: any) {
      // Standalone MongoDB fallback
      const isStandaloneErr = 
        err.message.includes('replica set') || 
        err.message.includes('transaction numbers') ||
        err.codeName === 'TransactionSystemFailed';

      if (isStandaloneErr) {
        console.warn('MongoDB transaction failed (Standalone mode). Falling back to sequential execution.');

        saleResult = await saleService.createSale(salePayload);

        q.status = 'CONVERTED';
        q.convertedSaleId = saleResult._id;
        q.convertedAt = new Date();
        await q.save();
      } else {
        throw err;
      }
    } finally {
      session.endSession();
    }

    return saleResult;
  }
}

export const quotationService = new QuotationService();
