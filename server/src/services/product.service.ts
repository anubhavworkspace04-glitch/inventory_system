import { Product, IProduct, IVariant } from '../models/Product.js';
import { AppError } from '../utils/appError.js';
import { stockService } from './stock/StockService.js';
import mongoose from 'mongoose';

export class ProductService {
  /**
   * Validates if a SKU is globally unique in the database
   */
  public async isSkuUnique(sku: string, excludeProductId?: string, excludeVariantId?: string): Promise<boolean> {
    const query: any = { 
      'variants.sku': sku.trim(),
      deletedAt: null 
    };

    const duplicateProduct = await Product.findOne(query);
    if (!duplicateProduct) return true;

    // If we have a match, check if it's the exact same product and variant we are excluding
    if (excludeProductId && duplicateProduct._id.toString() === excludeProductId) {
      const matchingVariant = duplicateProduct.variants.find(v => v.sku === sku.trim());
      if (matchingVariant && excludeVariantId && matchingVariant._id?.toString() === excludeVariantId) {
        return true; // it is the same variant being edited, so it's allowed
      }
    }

    return false;
  }

  /**
   * Creates a new product with variants
   */
  public async createProduct(productData: any): Promise<IProduct> {
    const { name, category, description, unit, minStockLevel, isActive, variants } = productData;

    if (!name || !category || !unit) {
      throw new AppError('Product name, category, and unit are required fields.', 400);
    }

    if (minStockLevel < 0) {
      throw new AppError('Minimum stock level cannot be negative.', 400);
    }

    // SKU uniqueness validation
    if (variants && Array.isArray(variants)) {
      const skus = new Set<string>();
      for (const variant of variants) {
        if (!variant.sku || !variant.name) {
          throw new AppError('Variant name and SKU are required for all variants.', 400);
        }
        
        const cleanSku = variant.sku.trim();
        if (skus.has(cleanSku)) {
          throw new AppError(`Duplicate SKU inside request payload: ${cleanSku}`, 400);
        }
        skus.add(cleanSku);

        const unique = await this.isSkuUnique(cleanSku);
        if (!unique) {
          throw new AppError(`SKU already exists: ${cleanSku}. Please use a unique SKU.`, 409);
        }

        // openingStock / cachedStock alignment
        variant.openingStock = Math.max(0, parseInt(variant.openingStock) || 0);
        // Force cachedStock to 0 initially, StockService will update it
        variant.cachedStock = 0;
        variant.isActive = variant.isActive !== false;
      }
    } else {
      throw new AppError('A product must contain at least one variant.', 400);
    }

    const newProduct = await Product.create({
      name,
      category,
      description,
      unit,
      minStockLevel,
      isActive: isActive !== false,
      variants
    });

    // Create opening stock movements atomically through StockService
    for (const v of newProduct.variants) {
      if (v.openingStock > 0) {
        await stockService.applyMovement({
          productId: newProduct._id.toString(),
          variantId: v._id!.toString(),
          quantityChange: v.openingStock,
          transactionType: 'OPENING_STOCK',
          referenceId: newProduct._id,
          referenceNumber: `OPN-${v.sku}`,
          reason: 'Initial opening stock',
          notes: 'Auto-generated during product creation.'
        });
      }
    }

    const reloaded = await Product.findById(newProduct._id);
    return reloaded || newProduct;
  }

  /**
   * Updates an existing product and its variants
   */
  public async updateProduct(productId: string, updateData: any): Promise<IProduct> {
    const product = await Product.findOne({ _id: productId, deletedAt: null });
    if (!product) {
      throw new AppError('Product not found or has been deleted.', 404);
    }

    // Keep track of original variant IDs to identify new ones later
    const existingIds = new Set(product.variants.map(v => v._id?.toString()).filter(Boolean));

    const { name, category, description, unit, minStockLevel, isActive, variants } = updateData;

    // 1. Update core product level properties
    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (unit !== undefined) product.unit = unit;
    if (minStockLevel !== undefined) {
      if (minStockLevel < 0) throw new AppError('Minimum stock level cannot be negative.', 400);
      product.minStockLevel = minStockLevel;
    }
    if (isActive !== undefined) product.isActive = isActive;

    // 2. Manage variants subdocuments array
    if (variants && Array.isArray(variants)) {
      const updatedVariants: IVariant[] = [];

      for (const vData of variants) {
        const cleanSku = vData.sku?.trim();
        if (!cleanSku || !vData.name) {
          throw new AppError('Variant SKU and name are required.', 400);
        }

        // If it's an existing variant
        if (vData._id || vData.id) {
          const varId = vData._id || vData.id;
          const existingVar = product.variants.find(ev => ev._id?.toString() === varId.toString());
          if (!existingVar) {
            throw new AppError(`Variant ID ${varId} not found in this product.`, 404);
          }

          // SKU validation checks
          const unique = await this.isSkuUnique(cleanSku, productId, varId.toString());
          if (!unique) {
            throw new AppError(`SKU already exists on another item: ${cleanSku}`, 409);
          }

          // Update variant properties
          existingVar.name = vData.name;
          existingVar.sku = cleanSku;
          if (vData.image !== undefined) {
            if (existingVar.image && existingVar.image !== vData.image && existingVar.image.includes('cloudinary.com')) {
              // Asynchronously clean up replaced Cloudinary asset
              import('../services/storage/CloudinaryStorageService.js').then(({ storageService }) => {
                storageService.deleteFile(existingVar.image!).catch(err => console.warn('Cloudinary image cleanup notice:', err.message));
              });
            }
            existingVar.image = vData.image;
          }
          if (vData.isActive !== undefined) existingVar.isActive = vData.isActive;

          // Crucial Stock Security: DO NOT allow manual current/cached stock editing
          if (vData.openingStock !== undefined && vData.openingStock !== existingVar.openingStock) {
            throw new AppError(`Opening stock cannot be edited directly. Please use stock adjustment instead.`, 400);
          }

          updatedVariants.push(existingVar);
        } else {
          // If it's a new variant to be added
          const unique = await this.isSkuUnique(cleanSku);
          if (!unique) {
            throw new AppError(`SKU already exists: ${cleanSku}`, 409);
          }

          const opStock = Math.max(0, parseInt(vData.openingStock) || 0);

          updatedVariants.push({
            name: vData.name,
            sku: cleanSku,
            image: vData.image || '',
            openingStock: opStock,
            cachedStock: 0, // initially 0, StockService will update it
            isActive: vData.isActive !== false
          } as IVariant);
        }
      }

      product.variants = updatedVariants;
    }

    await product.save();

    // Reload product to identify and apply opening stock for newly generated subdocuments
    const reloadedProduct = await Product.findById(productId);
    if (reloadedProduct) {
      for (const v of reloadedProduct.variants) {
        if (!existingIds.has(v._id?.toString() || '') && v.openingStock > 0) {
          await stockService.applyMovement({
            productId: reloadedProduct._id.toString(),
            variantId: v._id!.toString(),
            quantityChange: v.openingStock,
            transactionType: 'OPENING_STOCK',
            referenceId: reloadedProduct._id,
            referenceNumber: `OPN-${v.sku}`,
            reason: 'Initial opening stock',
            notes: 'Auto-generated during variant creation.'
          });
        }
      }
      const finalProduct = await Product.findById(productId);
      return finalProduct || reloadedProduct;
    }

    return product;
  }

  /**
   * Checks if a product has any historical transactions or stock balances
   */
  private async hasHistory(productId: string): Promise<boolean> {
    const cleanId = new mongoose.Types.ObjectId(productId);

    // 1. Check stock movements
    const movement = await mongoose.model('StockMovement').findOne({ productId: cleanId });
    if (movement) return true;

    // 2. Check purchases
    const purchase = await mongoose.model('Purchase').findOne({ 'items.productId': cleanId });
    if (purchase) return true;

    // 3. Check sales
    const sale = await mongoose.model('Sale').findOne({ 'items.productId': cleanId });
    if (sale) return true;

    // 4. Check quotations
    const quotation = await mongoose.model('Quotation').findOne({ 'items.productId': cleanId });
    if (quotation) return true;

    // 5. Check variants stock values
    const product = await Product.findById(productId);
    if (product) {
      const hasStock = product.variants.some(v => v.cachedStock > 0 || v.openingStock > 0);
      if (hasStock) return true;
    }

    return false;
  }

  /**
   * Soft deletes / deactivates a product depending on transaction history
   */
  public async deactivateProduct(productId: string): Promise<{ success: boolean; message: string; mode: 'deactivated' | 'deleted' }> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const hasHistory = await this.hasHistory(productId);

    if (hasHistory) {
      product.isActive = false;
      product.deletedAt = null; // keep in database so it is visible to inactive filter
      await product.save();
      return {
        success: true,
        message: 'This product has transaction history and cannot be permanently deleted. It will be deactivated instead.',
        mode: 'deactivated'
      };
    } else {
      // Clean up any Cloudinary images for variants of permanently deleted products
      for (const v of product.variants) {
        if (v.image && v.image.includes('cloudinary.com')) {
          import('../services/storage/CloudinaryStorageService.js').then(({ storageService }) => {
            storageService.deleteFile(v.image!).catch(err => console.warn('Cloudinary deletion notice:', err.message));
          });
        }
      }
      await Product.deleteOne({ _id: productId });
      return {
        success: true,
        message: 'Product deleted successfully.',
        mode: 'deleted'
      };
    }
  }

  /**
   * Restores an inactive/deleted product
   */
  public async activateProduct(productId: string): Promise<IProduct> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    product.isActive = true;
    product.deletedAt = null;
    await product.save();
    return product;
  }
}

export const productService = new ProductService();
