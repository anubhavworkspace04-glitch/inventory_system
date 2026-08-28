import { Request, Response, NextFunction } from 'express';
import { quotationService } from '../services/QuotationService.js';

export const getQuotations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const customerId = req.query.customerId as string;
    const status = req.query.status as string;
    const from = req.query.from as string;
    const to = req.query.to as string;

    const result = await quotationService.getQuotations({
      search,
      customerId,
      status,
      from,
      to,
      page,
      limit
    });

    const mapped = result.quotations.map(q => ({
      id: q._id.toString(),
      quotationNumber: q.quotationNumber,
      quotationDate: q.quotationDate.toISOString().split('T')[0],
      expiryDate: q.expiryDate.toISOString().split('T')[0],
      customerId: q.customerId ? q.customerId.toString() : null,
      customerNameSnapshot: q.customerNameSnapshot,
      customerPhoneSnapshot: q.customerPhoneSnapshot,
      items: q.items,
      subtotal: q.subtotal,
      totalDiscount: q.totalDiscount,
      totalTax: q.totalTax,
      total: q.total,
      status: q.status,
      convertedSaleId: q.convertedSaleId ? q.convertedSaleId.toString() : null,
      convertedAt: q.convertedAt ? q.convertedAt.toISOString() : null,
      notes: q.notes,
      terms: q.terms,
      createdAt: q.createdAt.toISOString()
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

export const getQuotationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = await quotationService.getQuotationById(req.params.id);
    res.status(200).json({
      success: true,
      data: {
        id: q._id.toString(),
        quotationNumber: q.quotationNumber,
        quotationDate: q.quotationDate.toISOString().split('T')[0],
        expiryDate: q.expiryDate.toISOString().split('T')[0],
        customerId: q.customerId ? q.customerId.toString() : null,
        customerNameSnapshot: q.customerNameSnapshot,
        customerPhoneSnapshot: q.customerPhoneSnapshot,
        items: q.items,
        subtotal: q.subtotal,
        totalDiscount: q.totalDiscount,
        totalTax: q.totalTax,
        total: q.total,
        status: q.status,
        convertedSaleId: q.convertedSaleId ? q.convertedSaleId.toString() : null,
        convertedAt: q.convertedAt ? q.convertedAt.toISOString() : null,
        notes: q.notes,
        terms: q.terms,
        createdAt: q.createdAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createQuotation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = await quotationService.createQuotation(req.body);
    res.status(201).json({
      success: true,
      message: 'Quotation created successfully.',
      data: q
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuotation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = await quotationService.updateQuotation(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Quotation updated successfully.',
      data: q
    });
  } catch (error) {
    next(error);
  }
};

export const acceptQuotation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = await quotationService.acceptQuotation(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Quotation accepted.',
      data: q
    });
  } catch (error) {
    next(error);
  }
};

export const rejectQuotation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = await quotationService.rejectQuotation(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Quotation rejected.',
      data: q
    });
  } catch (error) {
    next(error);
  }
};

export const cancelQuotation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = await quotationService.cancelQuotation(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Quotation cancelled.',
      data: q
    });
  } catch (error) {
    next(error);
  }
};

export const convertToSale = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sale = await quotationService.convertToSale(req.params.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Quotation converted to Sale order successfully.',
      data: sale
    });
  } catch (error) {
    next(error);
  }
};

export const duplicateQuotation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = await quotationService.duplicateQuotation(req.params.id);
    res.status(201).json({
      success: true,
      message: 'Quotation duplicated as draft.',
      data: q
    });
  } catch (error) {
    next(error);
  }
};
