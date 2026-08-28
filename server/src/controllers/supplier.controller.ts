import { Request, Response, NextFunction } from 'express';
import { supplierService } from '../services/SupplierService.js';
import { AppError } from '../utils/appError.js';

const mapSupplier = (s: any) => {
  if (!s) return s;
  const sObj = s.toObject ? s.toObject() : s;
  return {
    ...sObj,
    id: sObj._id.toString()
  };
};

export const getSuppliers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;

    const result = await supplierService.getSuppliers({ search, page, limit });

    res.status(200).json({
      success: true,
      data: result.suppliers.map(mapSupplier),
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

export const getSupplierById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    res.status(200).json({
      success: true,
      data: mapSupplier(supplier)
    });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    res.status(201).json({
      success: true,
      message: 'Supplier created successfully.',
      data: mapSupplier(supplier)
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully.',
      data: mapSupplier(supplier)
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const supplier = await supplierService.deactivateSupplier(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Supplier deactivated successfully.',
      data: mapSupplier(supplier)
    });
  } catch (error) {
    next(error);
  }
};

export const restoreSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const supplier = await supplierService.restoreSupplier(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Supplier restored successfully.',
      data: mapSupplier(supplier)
    });
  } catch (error) {
    next(error);
  }
};
