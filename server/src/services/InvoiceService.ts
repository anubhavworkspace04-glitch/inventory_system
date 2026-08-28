import mongoose from 'mongoose';
import { Invoice, IInvoice } from '../models/Invoice.js';
import { Sale } from '../models/Sale.js';
import { Customer } from '../models/Customer.js';
import { Product } from '../models/Product.js';
import { BusinessSettings } from '../models/BusinessSettings.js';
import { AppError } from '../utils/appError.js';

export class InvoiceService {
  /**
   * Retrieves invoices with paginated filtering and search support
   */
  public async getInvoices(params: {
    search?: string;
    customerId?: string;
    paymentStatus?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ invoices: any[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const query: any = {};

    // Filter by customerId
    if (params.customerId && params.customerId !== 'All') {
      if (params.customerId === 'Walk-in') {
        query.customerId = null;
      } else {
        query.customerId = params.customerId;
      }
    }

    // Filter by paymentStatus (resolved dynamically via Sale status)
    if (params.paymentStatus && params.paymentStatus !== 'All') {
      const matchingSales = await Sale.find({ paymentStatus: params.paymentStatus }).select('_id');
      const saleIds = matchingSales.map(s => s._id);
      query.saleId = { $in: saleIds };
    }

    // Search query
    if (params.search) {
      const searchRegex = { $regex: params.search, $options: 'i' };
      
      // We also find sales matching the search term to include their invoices
      const matchingSales = await Sale.find({
        $or: [
          { saleNumber: searchRegex },
          { 'items.skuSnapshot': searchRegex }
        ]
      }).select('_id');
      const saleIds = matchingSales.map(s => s._id);

      query.$or = [
        { invoiceNumber: searchRegex },
        { customerNameSnapshot: searchRegex },
        { customerPhoneSnapshot: searchRegex },
        { saleNumber: searchRegex },
        { saleId: { $in: saleIds } }
      ];
    }

    // Date range filter
    if (params.from || params.to) {
      query.invoiceDate = {};
      if (params.from) {
        query.invoiceDate.$gte = new Date(params.from);
      }
      if (params.to) {
        const toDate = new Date(params.to);
        toDate.setUTCDate(toDate.getUTCDate() + 1);
        query.invoiceDate.$lt = toDate;
      }
    }

    const total = await Invoice.countDocuments(query);
    const invoicesList = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Dynamic resolution of live payment properties from Sale documents
    const populatedInvoices = [];
    for (const inv of invoicesList) {
      const sale = await Sale.findById(inv.saleId).select('amountReceived pendingAmount paymentStatus');
      populatedInvoices.push({
        ...inv.toObject(),
        id: inv._id.toString(),
        amountPaid: sale ? sale.amountReceived : 0,
        amountPending: sale ? sale.pendingAmount : inv.grandTotal,
        paymentStatus: sale ? sale.paymentStatus : 'Pending'
      });
    }

    return { invoices: populatedInvoices, total };
  }

  /**
   * Fetches single invoice detailed snapshot with live payments
   */
  public async getInvoiceById(id: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid invoice resource identifier.', 400);
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      throw new AppError('Invoice document not found.', 404);
    }

    // Resolve live payment values
    const sale = await Sale.findById(invoice.saleId).select('amountReceived pendingAmount paymentStatus');

    return {
      ...invoice.toObject(),
      id: invoice._id.toString(),
      amountPaid: sale ? sale.amountReceived : 0,
      amountPending: sale ? sale.pendingAmount : invoice.grandTotal,
      paymentStatus: sale ? sale.paymentStatus : 'Pending'
    };
  }

  /**
   * Fetches single invoice by its sale ID reference
   */
  public async getInvoiceBySaleId(saleId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      throw new AppError('Invalid sale resource identifier.', 400);
    }

    const invoice = await Invoice.findOne({ saleId });
    if (!invoice) {
      return null;
    }

    const sale = await Sale.findById(invoice.saleId).select('amountReceived pendingAmount paymentStatus');

    return {
      ...invoice.toObject(),
      id: invoice._id.toString(),
      amountPaid: sale ? sale.amountReceived : 0,
      amountPending: sale ? sale.pendingAmount : invoice.grandTotal,
      paymentStatus: sale ? sale.paymentStatus : 'Pending'
    };
  }

  /**
   * Generates a tax invoice document snapshot from a source Sale transaction
   */
  public async createInvoice(saleId: string): Promise<IInvoice> {
    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      throw new AppError('Invalid sale resource identifier.', 400);
    }

    // 1. Verify Sale exists
    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new AppError('Associated sale transaction not found.', 404);
    }

    // 2. Verify Sale is active
    if (sale.status === 'Cancelled') {
      throw new AppError('Invoice cannot be generated for a cancelled sale.', 409);
    }

    // 3. Verify duplicate invoice
    const existing = await Invoice.findOne({ saleId });
    if (existing) {
      throw new AppError(`Invoice already exists for Sale ${sale.saleNumber}.`, 409);
    }

    // 4. Load Business Settings snapshot
    const settings = await BusinessSettings.findOne();
    const businessName = settings?.businessName || 'GG Glassware Co.';
    const businessGst = settings?.gstin || '09CBNPG5284Q1ZP';
    const businessAddress = settings?.address || 'Infront of Balveer Cold Araon Road Sirsaganj, Firozabad, UP, 283151';
    const businessLogo = settings?.logo || null;

    // 5. Load Customer snapshot (latest address and GSTIN)
    let customerAddress = 'Self pickup at outlet warehouse counter.';
    let customerGst = 'Not Provided';
    if (sale.customerId) {
      const customer = await Customer.findById(sale.customerId);
      if (customer) {
        if (customer.address) customerAddress = customer.address;
        if (customer.gstNumber) customerGst = customer.gstNumber;
      }
    }

    // 6. Generate concurrency-safe invoice number using customizable prefix
    const invoicePrefix = settings?.invoicePrefix || 'INV-YYYY-';
    const year = new Date().getFullYear();
    let finalPrefix = invoicePrefix.replace('YYYY', year.toString());
    if (!finalPrefix.includes(year.toString())) {
      finalPrefix = `${finalPrefix}${year}-`;
    }

    let invoiceNumber = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      attempts++;
      const randomDigits = `${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
      invoiceNumber = `${finalPrefix}${randomDigits}`;
      const duplicate = await Invoice.findOne({ invoiceNumber });
      if (!duplicate) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      throw new AppError('Failed to generate a unique invoice number. Please try again.', 500);
    }

    // 7. Map items copying unit format from sale item or product configuration
    const productIds = sale.items.map((i: any) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map<string, any>(products.map((p: any) => [p._id.toString(), p]));

    const invoiceItems = sale.items.map((item: any) => {
      const prod = productMap.get(item.productId.toString());
      const itemUnit = item.unit || prod?.unit || 'PCS';
      return {
        productId: item.productId,
        variantId: item.variantId,
        productNameSnapshot: item.productNameSnapshot,
        variantNameSnapshot: item.variantNameSnapshot,
        skuSnapshot: item.skuSnapshot,
        quantity: item.quantity,
        unit: itemUnit.toUpperCase(),
        rate: item.sellingPrice,
        discount: item.discount,
        tax: item.tax,
        lineTotal: item.lineTotal
      };
    });

    // 8. Create the Invoice document
    const invoice = new Invoice({
      invoiceNumber,
      invoiceDate: new Date(),
      saleId: sale._id,
      saleNumber: sale.saleNumber,
      quotationId: sale.sourceQuotationId || null,
      quotationNumber: sale.sourceQuotationNumber || null,
      customerId: sale.customerId || null,
      customerNameSnapshot: sale.customerNameSnapshot,
      customerPhoneSnapshot: sale.customerPhoneSnapshot || '',
      customerAddressSnapshot: customerAddress,
      customerGSTINSnapshot: customerGst,
      businessNameSnapshot: businessName,
      businessGSTINSnapshot: businessGst,
      businessAddressSnapshot: businessAddress,
      businessLogoSnapshot: businessLogo,
      items: invoiceItems,
      subtotal: sale.subtotal,
      totalDiscount: sale.totalDiscount,
      totalTax: sale.totalTax,
      grandTotal: sale.total,
      notes: sale.notes || '',
      terms: '1. Goods once sold will not be returned or exchanged.\n2. Interest @18% p.a. will be charged for delayed payments.'
    });

    return await invoice.save();
  }

  /**
   * Updates invoice-specific notes or terms
   */
  public async updateInvoice(id: string, data: { notes?: string; terms?: string }): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid invoice resource identifier.', 400);
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      throw new AppError('Invoice document not found.', 404);
    }

    if (data.notes !== undefined) {
      invoice.notes = data.notes;
    }
    if (data.terms !== undefined) {
      invoice.terms = data.terms;
    }

    await invoice.save();
    return this.getInvoiceById(id);
  }
}

export const invoiceService = new InvoiceService();
