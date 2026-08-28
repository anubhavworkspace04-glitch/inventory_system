import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Trash2, Save, Upload, AlertCircle } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { Variant } from '../types';
import { uploadApi } from '../api/services';
import { getImageUrl } from '../utils';

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().min(3, 'SKU must be at least 3 chars'),
  image: z.string().optional(),
  openingStock: z.number().min(0, 'Opening stock cannot be negative'),
  cachedStock: z.number().optional(),
  isActive: z.boolean().default(true)
});

const productSchema = z.object({
  name: z.string().min(2, 'Product Name must be at least 2 characters'),
  category: z.string().min(2, 'Category is required'),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit (e.g. sqft, pcs) is required'),
  minStockLevel: z.number().min(0, 'Minimum stock cannot be negative'),
  isActive: z.boolean().default(true),
  variants: z.array(variantSchema).min(1, 'At least one variant is required')
});

type ProductFormValues = z.infer<typeof productSchema>;

export const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { products, addProduct, updateProduct, showToast } = useInventoryStore();
  const productToEdit = products.find((p) => p.id === id);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      unit: 'sqft',
      minStockLevel: 10,
      isActive: true,
      variants: [{ name: '', sku: '', openingStock: 0, isActive: true }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants'
  });

  // Load existing product values if in Edit Mode
  useEffect(() => {
    if (isEditMode && productToEdit) {
      setValue('name', productToEdit.name);
      setValue('category', productToEdit.category);
      setValue('description', productToEdit.description);
      setValue('unit', productToEdit.unit);
      setValue('minStockLevel', productToEdit.minStockLevel);
      setValue('isActive', productToEdit.isActive);
      setValue(
        'variants',
        productToEdit.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          image: v.image,
          openingStock: v.openingStock,
          cachedStock: v.cachedStock,
          isActive: v.isActive
        }))
      );
    }
  }, [isEditMode, productToEdit, setValue]);

  // Handle real image upload for a variant
  const handleRealImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size exceeds the 5 MB limit. Please upload a smaller image.', 'warning');
      return;
    }

    try {
      setErrorMsg(null);
      const res = await uploadApi.uploadImage(file, 'variants');
      if (res.success) {
        setValue(`variants.${index}.image`, res.data.url);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Image upload failed.');
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    setErrorMsg(null);
    try {
      if (isEditMode && id) {
        // map form variants back to Variant types
        const currentVariants = values.variants.map((v) => ({
          id: v.id || "",
          name: v.name,
          sku: v.sku,
          image: v.image,
          openingStock: v.openingStock,
          cachedStock: v.cachedStock ?? v.openingStock,
          isActive: v.isActive
        }));
        await updateProduct(id, {
          name: values.name,
          category: values.category,
          description: values.description || '',
          unit: values.unit,
          minStockLevel: values.minStockLevel,
          isActive: values.isActive,
          variants: currentVariants
        });
        navigate(`/inventory/products/${id}`);
      } else {
        await addProduct({
          name: values.name,
          category: values.category,
          description: values.description || '',
          unit: values.unit,
          minStockLevel: values.minStockLevel,
          isActive: values.isActive,
          variants: values.variants.map((v) => ({
            id: "",
            name: v.name,
            sku: v.sku,
            image: v.image,
            openingStock: v.openingStock,
            cachedStock: v.openingStock,
            isActive: v.isActive
          }))
        });
        navigate('/inventory');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Action failed. Please verify unique SKU and all required fields.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link 
          to={isEditMode ? `/inventory/products/${id}` : '/inventory'} 
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> 
          Back to {isEditMode ? 'Product Details' : 'Inventory'}
        </Link>
        <h2 className="text-xl font-bold text-gray-900">
          {isEditMode ? 'Edit Product Catalog' : 'Create New Product'}
        </h2>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start space-x-2.5 text-sm font-medium">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Core Product Info card */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
            Base Product Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Product Name *</label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Glass or Plywood sheet"
                className={`w-full bg-white border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.name ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-300 focus:ring-brand-500/20 focus:border-brand-500'
                }`}
              />
              {errors.name && (
                <p className="text-[10px] text-red-600 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" /> {errors.name.message}
                </p>
              )}
            </div>

            {/* Product Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Category *</label>
              <input
                type="text"
                {...register('category')}
                placeholder="e.g. Glass, Wood, Steel"
                className={`w-full bg-white border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.category ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-300 focus:ring-brand-500/20 focus:border-brand-500'
                }`}
              />
              {errors.category && (
                <p className="text-[10px] text-red-600 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" /> {errors.category.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Description</label>
              <textarea
                {...register('description')}
                placeholder="Detailed specifications, thickness ranges, application criteria..."
                rows={3}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
              />
            </div>

            {/* Base Unit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Unit of Measurement (UOM) *</label>
              <select
                {...register('unit')}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="pcs">pcs (Pieces)</option>
                <option value="box">box (Boxes)</option>
                <option value="kg">kg (Kilograms)</option>
                <option value="sqft">sqft (Square Feet)</option>
                <option value="meter">meter (Meters)</option>
                <option value="ltr">ltr (Liters)</option>
              </select>
              {errors.unit && (
                <p className="text-[10px] text-red-600">{errors.unit.message}</p>
              )}
            </div>

            {/* Min Stock Alert Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Minimum Stock Alert Level *</label>
              <input
                type="number"
                {...register('minStockLevel', { valueAsNumber: true })}
                placeholder="Alert trigger stock level..."
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              {errors.minStockLevel && (
                <p className="text-[10px] text-red-600">{errors.minStockLevel.message}</p>
              )}
            </div>

            {/* Active Switch */}
            <div className="flex items-center space-x-3 pt-3">
              <input
                type="checkbox"
                id="p-active"
                {...register('isActive')}
                className="h-4.5 w-4.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500/20"
              />
              <label htmlFor="p-active" className="text-sm font-medium text-gray-800 cursor-pointer select-none">
                Product Catalog is Active
              </label>
            </div>
          </div>
        </div>

        {/* Product Variants Subdocuments grid */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-sm font-bold text-gray-900">Product Variant Models</h3>
            <button
              type="button"
              onClick={() => append({ name: '', sku: '', openingStock: 0, isActive: true })}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-white hover:bg-gray-50 text-brand-700 font-semibold border border-gray-200 rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Variant</span>
            </button>
          </div>

          {errors.variants && !Array.isArray(errors.variants) && (
            <p className="text-[10px] text-red-600 flex items-center">
              <AlertCircle className="h-3.5 w-3.5 mr-1" /> {errors.variants.message}
            </p>
          )}

          <div className="space-y-4 divide-y divide-gray-100">
            {fields.map((field, index) => {
              const watchedImage = watch(`variants.${index}.image`);
              return (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-4 first:pt-0">
                  {/* Variant Title */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Variant Name *</label>
                    <input
                      type="text"
                      {...register(`variants.${index}.name` as const)}
                      placeholder="e.g. 6mm Clear or Toughened"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    {errors.variants?.[index]?.name && (
                      <p className="text-[10px] text-red-600">{errors.variants[index]?.name?.message}</p>
                    )}
                  </div>

                  {/* SKU */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">SKU Code *</label>
                    <input
                      type="text"
                      {...register(`variants.${index}.sku` as const)}
                      placeholder="e.g. GLS-6CLR"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    {errors.variants?.[index]?.sku && (
                      <p className="text-[10px] text-red-600">{errors.variants[index]?.sku?.message}</p>
                    )}
                  </div>

                  {/* Opening Stock (locked in edit mode) */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Opening Stock</label>
                    <input
                      type="number"
                      disabled={isEditMode}
                      {...register(`variants.${index}.openingStock` as const, { valueAsNumber: true })}
                      placeholder="Initial count"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    />
                    {errors.variants?.[index]?.openingStock && (
                      <p className="text-[10px] text-red-600">{errors.variants[index]?.openingStock?.message}</p>
                    )}
                  </div>

                  {/* Image upload */}
                  <div className="md:col-span-3 flex items-center space-x-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase">Upload Image</label>
                      <input
                        type="file"
                        id={`variant-file-${index}`}
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleRealImageUpload(index, e)}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById(`variant-file-${index}`)?.click()}
                        className="w-full flex items-center justify-center space-x-1 py-1.5 border border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 text-gray-600 rounded-lg hover:text-gray-800 text-xs font-medium transition-colors"
                      >
                        <Upload className="h-3 w-3" />
                        <span className="truncate">{watchedImage ? 'Replace Image' : 'Upload Image'}</span>
                      </button>
                    </div>

                    {watchedImage && (
                      <div className="relative mt-5 group shrink-0">
                        <div className="h-10 w-10 rounded border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                          <img
                            src={getImageUrl(watchedImage)}
                            alt="preview"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setValue(`variants.${index}.image`, '')}
                          className="absolute -top-1 -right-1 hidden group-hover:flex bg-red-600 text-white rounded-full px-1 py-0.5 text-[7px] leading-none hover:bg-red-700 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions (Delete variant row) */}
                  <div className="md:col-span-1 text-right">
                    <button
                      type="button"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom submit bar */}
        <div className="flex justify-end space-x-3 bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm">
          <Link
            to={isEditMode ? `/inventory/products/${id}` : '/inventory'}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex items-center space-x-1.5 px-5 py-2 bg-brand-500 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Save className="h-4 w-4" />
            <span>{isEditMode ? 'Save Changes' : 'Create Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
