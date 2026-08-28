import { Customer, ICustomer } from '../models/Customer.js';
import { AppError } from '../utils/appError.js';

export class CustomerService {
  /**
   * Retrieves active customers with paginated filtering and search support
   */
  public async getCustomers(params: { search?: string; page?: number; limit?: number }): Promise<{ customers: ICustomer[]; total: number }> {
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

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    return { customers, total };
  }

  /**
   * Fetches detailed customer by ID
   */
  public async getCustomerById(id: string): Promise<ICustomer> {
    const customer = await Customer.findOne({ _id: id, deletedAt: null });
    if (!customer) {
      throw new AppError('Customer not found or has been deleted.', 404);
    }
    return customer;
  }

  /**
   * Creates a new customer contact card
   */
  public async createCustomer(data: { name: string; phone: string; email?: string; address?: string; gstNumber?: string; notes?: string }): Promise<ICustomer> {
    const { name, phone, email, address, gstNumber, notes } = data;

    if (!name) {
      throw new AppError('Customer name is required.', 400);
    }
    if (!phone) {
      throw new AppError('Customer phone number is required.', 400);
    }

    // Check active phone conflict
    const existing = await Customer.findOne({ phone: phone.trim(), deletedAt: null });
    if (existing) {
      throw new AppError('Customer with this phone number already exists.', 409);
    }

    const customer = new Customer({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim(),
      address: address?.trim(),
      gstNumber: gstNumber?.trim(),
      notes: notes?.trim()
    });

    return await customer.save();
  }

  /**
   * Updates an existing customer profile card
   */
  public async updateCustomer(id: string, data: Partial<ICustomer>): Promise<ICustomer> {
    const customer = await Customer.findOne({ _id: id, deletedAt: null });
    if (!customer) {
      throw new AppError('Customer not found or has been deleted.', 404);
    }

    const { name, phone, email, address, gstNumber, notes, isActive } = data;

    if (name !== undefined) {
      const cleanName = name.trim();
      if (!cleanName) throw new AppError('Customer name cannot be empty.', 400);
      customer.name = cleanName;
    }

    if (phone !== undefined) {
      const cleanPhone = phone.trim();
      if (!cleanPhone) throw new AppError('Customer phone cannot be empty.', 400);
      
      const duplicate = await Customer.findOne({ phone: cleanPhone, _id: { $ne: id }, deletedAt: null });
      if (duplicate) {
        throw new AppError('Customer with this phone number already exists.', 409);
      }
      customer.phone = cleanPhone;
    }

    if (email !== undefined) customer.email = email.trim();
    if (address !== undefined) customer.address = address.trim();
    if (gstNumber !== undefined) customer.gstNumber = gstNumber.trim();
    if (notes !== undefined) customer.notes = notes.trim();
    if (isActive !== undefined) customer.isActive = isActive;

    return await customer.save();
  }

  /**
   * Soft deletes a customer
   */
  public async deactivateCustomer(id: string): Promise<ICustomer> {
    const customer = await Customer.findOne({ _id: id, deletedAt: null });
    if (!customer) {
      throw new AppError('Customer not found.', 404);
    }

    customer.isActive = false;
    customer.deletedAt = new Date();
    return await customer.save();
  }

  /**
   * Restores a soft-deleted customer profile
   */
  public async restoreCustomer(id: string): Promise<ICustomer> {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw new AppError('Customer not found.', 404);
    }

    customer.isActive = true;
    customer.deletedAt = null;
    return await customer.save();
  }
}

export const customerService = new CustomerService();
