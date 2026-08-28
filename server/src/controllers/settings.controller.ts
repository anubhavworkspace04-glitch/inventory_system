import { Request, Response, NextFunction } from 'express';
import { BusinessSettings } from '../models/BusinessSettings.js';
import { AppError } from '../utils/appError.js';

export const getSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = new BusinessSettings({});
      await settings.save();
    }
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      businessName,
      gstin,
      address,
      logo,
      invoicePrefix,
      quotationPrefix,
      defaultGstRate,
      allowNegativeStock,
      enableLowStockAlerts
    } = req.body;

    if (businessName !== undefined && !businessName.trim()) {
      throw new AppError('Business name cannot be empty.', 400);
    }
    if (gstin !== undefined && !gstin.trim()) {
      throw new AppError('GSTIN registration cannot be empty.', 400);
    }

    const settings = await BusinessSettings.findOneAndUpdate(
      {},
      {
        businessName: businessName?.trim(),
        gstin: gstin?.trim(),
        address: address?.trim(),
        logo: logo === null ? null : logo?.trim(),
        invoicePrefix: invoicePrefix?.trim(),
        quotationPrefix: quotationPrefix?.trim(),
        defaultGstRate: defaultGstRate === undefined ? undefined : Number(defaultGstRate),
        allowNegativeStock: allowNegativeStock === undefined ? undefined : Boolean(allowNegativeStock),
        enableLowStockAlerts: enableLowStockAlerts === undefined ? undefined : Boolean(enableLowStockAlerts)
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Business profile saved successfully.',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};
