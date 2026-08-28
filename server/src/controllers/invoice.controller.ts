import { Request, Response, NextFunction } from 'express';
import { invoiceService } from '../services/InvoiceService.js';
import { AppError } from '../utils/appError.js';

export const getInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const customerId = req.query.customerId as string;
    const paymentStatus = req.query.paymentStatus as string;
    const from = req.query.from as string;
    const to = req.query.to as string;

    const result = await invoiceService.getInvoices({
      search,
      customerId,
      paymentStatus,
      from,
      to,
      page,
      limit
    });

    res.status(200).json({
      success: true,
      data: result.invoices,
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

export const getInvoiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceBySaleId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const invoice = await invoiceService.getInvoiceBySaleId(req.params.saleId);
    if (!invoice) {
      return next(new AppError('No invoice found for this sale ID', 404));
    }
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { saleId } = req.body;
    if (!saleId) {
      return next(new AppError('Sale reference ID is required to generate invoice.', 400));
    }

    const invoice = await invoiceService.createInvoice(saleId);
    const resolved = await invoiceService.getInvoiceById(invoice._id.toString());

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully.',
      data: resolved
    });
  } catch (error: any) {
    // If invoice already exists, send 409 conflict code and the existing invoice data if present
    if (error.statusCode === 409) {
      const existing = await invoiceService.getInvoiceBySaleId(req.body.saleId);
      res.status(409).json({
        success: false,
        message: error.message,
        data: existing
      });
      return;
    }
    next(error);
  }
};

export const downloadInvoicePdf = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    // Return the detailed printable data configuration back to client for rendering/saving
    res.status(200).json({
      success: true,
      message: 'Print layout prepared.',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { notes, terms } = req.body;
    const invoice = await invoiceService.updateInvoice(req.params.id, { notes, terms });
    res.status(200).json({
      success: true,
      message: 'Invoice notes updated successfully.',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};
