import { Supplier, ISupplier } from '../models/Supplier.js';
import { AppError } from '../utils/appError.js';

export class SupplierService {
  /**
   * Retrieves active suppliers with paginated filtering and search support
   */
  public async getSuppliers(params: { search?: string; page?: number; limit?: number }): Promise<{ suppliers: ISupplier[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const query: any = { deletedAt: null };

    if (params.search) {
      const searchRegex = { $regex: params.search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { gstNumber: searchRegex }
      ];
    }

    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    return { suppliers, total };
  }

  /**
   * Fetches detailed supplier by ID
   */
  public async getSupplierById(id: string): Promise<ISupplier> {
    const supplier = await Supplier.findOne({ _id: id, deletedAt: null });
    if (!supplier) {
      throw new AppError('Supplier not found or has been deleted.', 404);
    }
    return supplier;
  }

  /**
   * Creates a new supplier card record
   */
  public async createSupplier(data: { name: string; phone: string; email?: string; address?: string; gstNumber?: string; notes?: string }): Promise<ISupplier> {
    const { name, phone, email, address, gstNumber, notes } = data;

    if (!name) {
      throw new AppError('Supplier name is required.', 400);
    }
    if (!phone) {
      throw new AppError('Supplier phone number is required.', 400);
    }

    // Check duplicate supplier name
    const existing = await Supplier.findOne({ name: name.trim(), deletedAt: null });
    if (existing) {
      throw new AppError('Supplier with this name already exists.', 409);
    }

    const supplier = new Supplier({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim(),
      address: address?.trim(),
      gstNumber: gstNumber?.trim(),
      notes: notes?.trim()
    });

    return await supplier.save();
  }

  /**
   * Updates an existing supplier card
   */
  public async updateSupplier(id: string, data: Partial<ISupplier>): Promise<ISupplier> {
    const supplier = await Supplier.findOne({ _id: id, deletedAt: null });
    if (!supplier) {
      throw new AppError('Supplier not found or has been deleted.', 404);
    }

    const { name, phone, email, address, gstNumber, notes, isActive } = data;

    if (name !== undefined) {
      const cleanName = name.trim();
      if (!cleanName) throw new AppError('Supplier name cannot be empty.', 400);
      
      const duplicate = await Supplier.findOne({ name: cleanName, _id: { $ne: id }, deletedAt: null });
      if (duplicate) {
        throw new AppError('Supplier with this name already exists.', 409);
      }
      supplier.name = cleanName;
    }

    if (phone !== undefined) {
      const cleanPhone = phone.trim();
      if (!cleanPhone) throw new AppError('Supplier phone cannot be empty.', 400);
      supplier.phone = cleanPhone;
    }

    if (email !== undefined) supplier.email = email.trim();
    if (address !== undefined) supplier.address = address.trim();
    if (gstNumber !== undefined) supplier.gstNumber = gstNumber.trim();
    if (notes !== undefined) supplier.notes = notes.trim();
    if (isActive !== undefined) supplier.isActive = isActive;

    return await supplier.save();
  }

  /**
   * Soft deletes a supplier
   */
  public async deactivateSupplier(id: string): Promise<ISupplier> {
    const supplier = await Supplier.findOne({ _id: id, deletedAt: null });
    if (!supplier) {
      throw new AppError('Supplier not found.', 404);
    }

    supplier.isActive = false;
    supplier.deletedAt = new Date();
    return await supplier.save();
  }

  /**
   * Restores a soft-deleted supplier
   */
  public async restoreSupplier(id: string): Promise<ISupplier> {
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      throw new AppError('Supplier not found.', 404);
    }

    supplier.isActive = true;
    supplier.deletedAt = null;
    return await supplier.save();
  }
}

export const supplierService = new SupplierService();
