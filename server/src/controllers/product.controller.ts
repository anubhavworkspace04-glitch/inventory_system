import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product.js';
import { productService } from '../services/product.service.js';
import { stockService } from '../services/stock/StockService.js';
import { AppError } from '../utils/appError.js';

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Ensure cachedStock on all variants is synchronized with StockMovement ledger
    await stockService.syncAllCachedStocks();

    const query: any = { deletedAt: null };

    // Search filter: Matches product name, category, or nested variants SKU/name
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search as string, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { category: searchRegex },
        { 'variants.sku': searchRegex },
        { 'variants.name': searchRegex }
      ];
    }

    // Category filter
    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category as string;
    }

    // Status filter
    if (req.query.status && req.query.status !== 'All') {
      query.isActive = req.query.status === 'Active';
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Map _id to id to match what the frontend model expects
    const mappedProducts = products.map(p => {
      const pObj = p.toObject();
      return {
        ...pObj,
        id: pObj._id.toString(),
        variants: pObj.variants.map((v: any) => ({
          ...v,
          id: v._id.toString()
        }))
      };
    });

    res.status(200).json({
      success: true,
      data: mappedProducts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await Product.findOne({ _id: req.params.id, deletedAt: null });
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    const pObj = product.toObject();
    res.status(200).json({
      success: true,
      data: {
        ...pObj,
        id: pObj._id.toString(),
        variants: pObj.variants.map((v: any) => ({
          ...v,
          id: v._id.toString()
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newProduct = await productService.createProduct(req.body);
    const pObj = newProduct.toObject();

    res.status(201).json({
      success: true,
      data: {
        ...pObj,
        id: pObj._id.toString(),
        variants: pObj.variants.map((v: any) => ({
          ...v,
          id: v._id.toString()
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const updated = await productService.updateProduct(req.params.id, req.body);
    const pObj = updated.toObject();

    res.status(200).json({
      success: true,
      data: {
        ...pObj,
        id: pObj._id.toString(),
        variants: pObj.variants.map((v: any) => ({
          ...v,
          id: v._id.toString()
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await productService.deactivateProduct(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
      data: { id: req.params.id, mode: result.mode }
    });
  } catch (error) {
    next(error);
  }
};

export const restoreProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const activated = await productService.activateProduct(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Product activated successfully.',
      data: { id: activated._id.toString() }
    });
  } catch (error) {
    next(error);
  }
};

export const validateSku = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sku, productId, variantId } = req.query;
    if (!sku) {
      return next(new AppError('SKU query parameter is required', 400));
    }

    const unique = await productService.isSkuUnique(
      sku as string,
      productId as string,
      variantId as string
    );

    res.status(200).json({
      success: true,
      data: {
        unique,
        message: unique ? 'SKU is available' : 'SKU is already in use'
      }
    });
  } catch (error) {
    next(error);
  }
};
