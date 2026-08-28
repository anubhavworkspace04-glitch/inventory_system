import { Request, Response, NextFunction } from 'express';
import { saleService } from '../services/SaleService.js';

export const getSales = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const customerId = req.query.customerId as string;
    const saleChannel = req.query.saleChannel as string;
    const status = req.query.status as string;
    const from = req.query.from as string;
    const to = req.query.to as string;

    const result = await saleService.getSales({
      search,
      customerId,
      saleChannel,
      status,
      from,
      to,
      page,
      limit
    });

    const mapped = result.sales.map(s => ({
      id: s._id.toString(),
      saleNumber: s.saleNumber,
      saleDate: s.saleDate.toISOString().split('T')[0],
      customerId: s.customerId ? s.customerId.toString() : undefined,
      customerNameSnapshot: s.customerNameSnapshot,
      customerPhoneSnapshot: s.customerPhoneSnapshot,
      items: s.items.map(item => ({
        productId: item.productId.toString(),
        variantId: item.variantId.toString(),
        productNameSnapshot: item.productNameSnapshot,
        variantNameSnapshot: item.variantNameSnapshot,
        skuSnapshot: item.skuSnapshot,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        discount: item.discount,
        tax: item.tax,
        lineTotal: item.lineTotal
      })),
      subtotal: s.subtotal,
      totalDiscount: s.totalDiscount,
      totalTax: s.totalTax,
      total: s.total,
      saleChannel: s.saleChannel,
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentStatus,
      amountReceived: s.amountReceived,
      pendingAmount: s.pendingAmount,
      status: s.status,
      notes: s.notes,
      createdAt: s.createdAt.toISOString()
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

export const getSaleById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const s = await saleService.getSaleById(req.params.id);

    res.status(200).json({
      success: true,
      data: {
        id: s._id.toString(),
        saleNumber: s.saleNumber,
        saleDate: s.saleDate.toISOString().split('T')[0],
        customerId: s.customerId ? s.customerId.toString() : undefined,
        customerNameSnapshot: s.customerNameSnapshot,
        customerPhoneSnapshot: s.customerPhoneSnapshot,
        items: s.items.map(item => ({
          productId: item.productId.toString(),
          variantId: item.variantId.toString(),
          productNameSnapshot: item.productNameSnapshot,
          variantNameSnapshot: item.variantNameSnapshot,
          skuSnapshot: item.skuSnapshot,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
          discount: item.discount,
          tax: item.tax,
          lineTotal: item.lineTotal
        })),
        subtotal: s.subtotal,
        totalDiscount: s.totalDiscount,
        totalTax: s.totalTax,
        total: s.total,
        saleChannel: s.saleChannel,
        paymentMethod: s.paymentMethod,
        paymentStatus: s.paymentStatus,
        amountReceived: s.amountReceived,
        pendingAmount: s.pendingAmount,
        status: s.status,
        notes: s.notes,
        createdAt: s.createdAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createSale = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sale = await saleService.createSale(req.body);
    res.status(201).json({
      success: true,
      message: 'Sale created successfully.',
      data: sale
    });
  } catch (error) {
    next(error);
  }
};

export const cancelSale = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sale = await saleService.cancelSale(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Sale cancelled successfully.',
      data: sale
    });
  } catch (error) {
    next(error);
  }
};
