import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/CustomerService.js';

export const getCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;

    const result = await customerService.getCustomers({ search, page, limit });

    res.status(200).json({
      success: true,
      data: result.customers,
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

export const getCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Customer updated successfully.',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = await customerService.deactivateCustomer(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Customer deactivated successfully.',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

export const restoreCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = await customerService.restoreCustomer(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Customer restored successfully.',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};
