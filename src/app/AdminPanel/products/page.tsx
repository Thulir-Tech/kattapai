'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { 
  ShoppingBag,
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Image as ImageIcon, 
  X, 
  AlertCircle,
  FolderTree,
  ArrowRight,
  Info,
  CheckCircle,
  XCircle,
  Settings as SettingsIcon,
  Eye,
  Star
} from 'lucide-react';
import { ProductService } from '@/services/product.service';
import { CategoryService } from '@/services/category.service';
import { StorageService } from '@/services/storage.service';
import { Product, Category } from '@/types';

// Isolated QueryClient for full cache containment
const queryClient = new QueryClient();

// Validation Schema using Zod
const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, numbers, and hyphens only'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  mainImage: z.string().min(1, 'At least one cover image is required'),
  images: z.array(z.string()).default([]),
  affiliateLink: z.string().url('Please enter a valid Amazon affiliate URL'),
  price: z.preprocess((val) => Number(val), z.number().min(0.01, 'Price must be greater than 0')),
  rating: z.preprocess((val) => Number(val), z.number().min(0, 'Rating cannot be negative').max(5, 'Max rating is 5')),
  reviewsCount: z.preprocess((val) => Number(val), z.number().int().min(0, 'Review count cannot be negative')),
  categoryId: z.string().min(1, 'Please select a category'),
  isFeatured: z.boolean().default(false),
  status: z.enum(['active', 'draft']).default('active'),
  amazonProductId: z.string().min(1, 'ASIN / Amazon Product ID is required'),
});

type ProductFormFields = z.infer<typeof productSchema>;

export default function ProductManagementWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProductManagementPage />
    </QueryClientProvider>
  );
}

function ProductManagementPage() {
  const queryClient = useQueryClient();

  // Local UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'details'>('basic');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Custom Dynamic Fields States
  const [prosList, setProsList] = useState<string[]>([]);
  const [consList, setConsList] = useState<string[]>([]);
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [specsMap, setSpecsMap] = useState<Record<string, string>>({});
  
  // Dynamic Inputs
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecVal, setNewSpecVal] = useState('');

  // Image Upload States
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  
  const [galleryImages, setGalleryImages] = useState<Array<{ id: string; preview: string; file: File | null; isExisting: boolean }>>([]);
  const [deletedGalleryUrls, setDeletedGalleryUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Queries
  const { data: products = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: ProductService.getAllProducts,
  });

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: CategoryService.getAllCategories,
  });

  // Form Setup
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(productSchema),
  });

  // Auto Slug Generator from Title
  const titleValue = watch('title');
  React.useEffect(() => {
    if (titleValue && !editingProduct) {
      const generatedSlug = titleValue
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-');
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [titleValue, setValue, editingProduct]);

  // Image Handlers
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = StorageService.validateFile(file);
      if (!validation.isValid) {
        setFormError(validation.error);
        return;
      }
      setMainImageFile(file);
      setMainImagePreview(URL.createObjectURL(file));
      setValue('mainImage', 'pending-upload', { shouldValidate: true });
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newItems = Array.from(files).map(file => {
        const validation = StorageService.validateFile(file);
        if (!validation.isValid) {
          alert(`Image "${file.name}" rejected: ${validation.error}`);
          return null;
        }
        return {
          id: Math.random().toString(36).substring(7),
          preview: URL.createObjectURL(file),
          file,
          isExisting: false
        };
      }).filter(item => item !== null) as Array<{ id: string; preview: string; file: File | null; isExisting: boolean }>;

      setGalleryImages(prev => [...prev, ...newItems]);
    }
  };

  const removeGalleryImage = (itemToRemove: typeof galleryImages[0]) => {
    if (itemToRemove.isExisting) {
      setDeletedGalleryUrls(prev => [...prev, itemToRemove.preview]);
    }
    setGalleryImages(prev => prev.filter(img => img.id !== itemToRemove.id));
  };

  // Dynamic Array Adders
  const addProItem = () => {
    if (newPro.trim()) {
      setProsList(prev => [...prev, newPro.trim()]);
      setNewPro('');
    }
  };

  const addConItem = () => {
    if (newCon.trim()) {
      setConsList(prev => [...prev, newCon.trim()]);
      setNewCon('');
    }
  };

  const addFeatureItem = () => {
    if (newFeature.trim()) {
      setFeaturesList(prev => [...prev, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const addSpecItem = () => {
    if (newSpecKey.trim() && newSpecVal.trim()) {
      setSpecsMap(prev => ({
        ...prev,
        [newSpecKey.trim()]: newSpecVal.trim()
      }));
      setNewSpecKey('');
      setNewSpecVal('');
    }
  };

  const removeSpecItem = (key: string) => {
    const next = { ...specsMap };
    delete next[key];
    setSpecsMap(next);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: { product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>; mainFile: File | null; galleryItems: Array<{ file: File | null }> }) => {
      setIsUploading(true);
      let mainImageUrl = '';
      
      // Upload Main Image
      if (data.mainFile) {
        const compressed = await StorageService.compressImage(data.mainFile, 0.85);
        mainImageUrl = await StorageService.uploadFile(`products/${data.product.slug}/cover`, compressed);
      }

      // Upload Gallery Images
      const galleryUrls: string[] = [];
      for (const item of data.galleryItems) {
        if (item.file) {
          const compressed = await StorageService.compressImage(item.file, 0.85);
          const pathId = Math.random().toString(36).substring(7);
          const url = await StorageService.uploadFile(`products/${data.product.slug}/gallery_${pathId}`, compressed);
          galleryUrls.push(url);
        }
      }

      return ProductService.createProduct({
        ...data.product,
        mainImage: mainImageUrl,
        images: galleryUrls,
        pros: prosList,
        cons: consList,
        specifications: specsMap,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseDrawer();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to save product.');
      setIsUploading(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; product: Partial<Product>; mainFile: File | null; galleryItems: typeof galleryImages; oldProduct: Product }) => {
      setIsUploading(true);
      let mainImageUrl = data.product.mainImage || '';
      
      // 1. Handle Cover image replacement
      if (data.mainFile) {
        if (data.oldProduct.mainImage) {
          try { await StorageService.deleteFile(data.oldProduct.mainImage); } catch (e) {}
        }
        const compressed = await StorageService.compressImage(data.mainFile, 0.85);
        mainImageUrl = await StorageService.uploadFile(`products/${data.oldProduct.slug}/cover`, compressed);
      }

      // 2. Delete deleted gallery images
      for (const deleteUrl of deletedGalleryUrls) {
        try { await StorageService.deleteFile(deleteUrl); } catch (e) {}
      }

      // 3. Keep old gallery URLs that were not deleted
      const finalGalleryUrls = data.galleryItems
        .filter(img => img.isExisting)
        .map(img => img.preview);

      // 4. Upload newly added gallery images
      for (const item of data.galleryItems) {
        if (!item.isExisting && item.file) {
          const compressed = await StorageService.compressImage(item.file, 0.85);
          const pathId = Math.random().toString(36).substring(7);
          const url = await StorageService.uploadFile(`products/${data.oldProduct.slug}/gallery_${pathId}`, compressed);
          finalGalleryUrls.push(url);
        }
      }

      return ProductService.updateProduct(data.id, {
        ...data.product,
        mainImage: mainImageUrl,
        images: finalGalleryUrls,
        pros: prosList,
        cons: consList,
        specifications: specsMap,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseDrawer();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update product.');
      setIsUploading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (product: Product) => {
      // Clean up Storage cover image
      if (product.mainImage) {
        try { await StorageService.deleteFile(product.mainImage); } catch (e) {}
      }
      // Clean up Storage gallery images
      if (product.images && product.images.length > 0) {
        for (const url of product.images) {
          try { await StorageService.deleteFile(url); } catch (e) {}
        }
      }
      return ProductService.deleteProduct(product.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete product.');
    }
  });

  // Drawer Controls
  const handleOpenCreateDrawer = () => {
    setEditingProduct(null);
    setFormError(null);
    setActiveTab('basic');
    setProsList([]);
    setConsList([]);
    setFeaturesList([]);
    setSpecsMap({});
    setMainImagePreview(null);
    setMainImageFile(null);
    setGalleryImages([]);
    setDeletedGalleryUrls([]);
    reset({
      title: '',
      slug: '',
      description: '',
      mainImage: '',
      images: [],
      affiliateLink: '',
      price: 0,
      rating: 4.5,
      reviewsCount: 0,
      categoryId: '',
      isFeatured: false,
      status: 'active',
      amazonProductId: '',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (product: Product) => {
    setEditingProduct(product);
    setFormError(null);
    setActiveTab('basic');
    
    // Mount arrays/maps
    setProsList(product.pros || []);
    setConsList(product.cons || []);
    setSpecsMap(product.specifications || []);
    
    // Mount media previews
    setMainImageFile(null);
    setMainImagePreview(product.mainImage || null);
    
    const initialGallery = (product.images || []).map(url => ({
      id: Math.random().toString(36).substring(7),
      preview: url,
      file: null,
      isExisting: true
    }));
    setGalleryImages(initialGallery);
    setDeletedGalleryUrls([]);

    reset({
      title: product.title,
      slug: product.slug,
      description: product.description,
      mainImage: product.mainImage || 'existing',
      images: product.images || [],
      affiliateLink: product.affiliateLink,
      price: product.price,
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      categoryId: product.categoryId,
      isFeatured: product.isFeatured || false,
      status: product.status || 'active',
      amazonProductId: product.amazonProductId,
    });
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingProduct(null);
    setFormError(null);
    setMainImageFile(null);
    setMainImagePreview(null);
    setGalleryImages([]);
    setDeletedGalleryUrls([]);
    setIsUploading(false);
  };

  const onSubmitForm = async (fields: any) => {
    setFormError(null);

    // Cover Validation check
    if (!mainImagePreview) {
      setFormError('Cover Image is required.');
      return;
    }

    if (editingProduct) {
      updateMutation.mutate({
        id: editingProduct.id,
        product: fields,
        mainFile: mainImageFile,
        galleryItems: galleryImages,
        oldProduct: editingProduct
      });
    } else {
      createMutation.mutate({
        product: fields,
        mainFile: mainImageFile,
        galleryItems: galleryImages.filter(item => item.file !== null)
      });
    }
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Are you absolutely sure you want to delete "${product.title}"?`)) {
      deleteMutation.mutate(product);
    }
  };

  // Filter Catalog
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          prod.amazonProductId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || prod.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
            Product Catalogue
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Control items list, pricing strategies, and Amazon tracking credentials.
          </p>
        </div>
        <button
          onClick={handleOpenCreateDrawer}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-[0_4px_15px_rgba(139,92,246,0.2)] cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Add Product
        </button>
      </div>

      {/* 2. Filters & Searches Row */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search catalog by title or ASIN code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none transition-all focus:border-violet-500 focus:shadow-sm"
          />
        </div>

        {/* Category Select Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-violet-500 max-w-[240px] cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* 3. Products List View (Data Table) */}
      {isProductsLoading || isCategoriesLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
          <span className="text-xs uppercase tracking-wider font-semibold">Loading Catalog...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="h-64 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center p-8 text-zinc-400">
          <ShoppingBag className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700" />
          <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">No products configured</h3>
          <p className="text-xs max-w-xs mt-1">
            {searchTerm || categoryFilter !== 'all' ? 'Try adjusting your search criteria.' : 'Click "Add Product" to create your first Amazon affiliate product.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">ASIN Code</th>
                  <th className="px-6 py-4">Pricing</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-sm">
                {filteredProducts.map((product) => {
                  const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'Unassigned';
                  return (
                    <tr key={product.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 transition-colors">
                      {/* Name / Cover */}
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                          {product.mainImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.mainImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300"><ImageIcon className="w-5 h-5" /></div>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]" title={product.title}>
                              {product.title}
                            </span>
                            {product.isFeatured && (
                              <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[9px] font-bold uppercase shrink-0">
                                Featured
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 block tracking-wider uppercase mt-0.5">{product.slug}</span>
                        </div>
                      </td>

                      {/* ASIN */}
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {product.amazonProductId}
                      </td>

                      {/* Pricing */}
                      <td className="px-6 py-4 font-bold text-zinc-800 dark:text-zinc-200">
                        ${product.price.toFixed(2)}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {categoryName}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          product.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                          {product.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditDrawer(product)}
                            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-2 rounded-lg border border-red-200 dark:border-red-950/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Sliding Sidebar Drawer Form */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={handleCloseDrawer} />
          
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 overflow-hidden animate-slideLeft">
            
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0">
              <div className="space-y-0.5">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                  {editingProduct ? 'Modify Product' : 'Add Product'}
                </h3>
              </div>
              <button onClick={handleCloseDrawer} className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selectors */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-sm font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`flex-1 py-3 text-center transition-colors cursor-pointer border-b-2 ${activeTab === 'basic' ? 'border-violet-600 text-violet-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
              >
                Basic Specs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('media')}
                className={`flex-1 py-3 text-center transition-colors cursor-pointer border-b-2 ${activeTab === 'media' ? 'border-violet-600 text-violet-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
              >
                Descriptions & Media
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-3 text-center transition-colors cursor-pointer border-b-2 ${activeTab === 'details' ? 'border-violet-600 text-violet-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
              >
                Specs & Highlights
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {formError && (
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-500">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* TAB 1: BASIC SPECS */}
                {activeTab === 'basic' && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Title */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Product Title</label>
                      <input
                        type="text"
                        placeholder="e.g. ASUS ROG Zephyrus G14 (2026)"
                        disabled={isSubmitting || isUploading}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
                        {...register('title')}
                      />
                      {errors.title && <p className="text-xs text-red-500 font-semibold">{errors.title.message}</p>}
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block font-semibold">URL Route Slug</label>
                      <input
                        type="text"
                        placeholder="e.g. asus-rog-zephyrus-g14-2026"
                        disabled={isSubmitting || isUploading || !!editingProduct}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors disabled:opacity-70"
                        {...register('slug')}
                      />
                      {errors.slug && <p className="text-xs text-red-500 font-semibold">{errors.slug.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Category */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Category Select</label>
                        <select
                          disabled={isSubmitting || isUploading}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors cursor-pointer"
                          {...register('categoryId')}
                        >
                          <option value="">Select a Category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        {errors.categoryId && <p className="text-xs text-red-500 font-semibold">{errors.categoryId.message}</p>}
                      </div>

                      {/* Amazon Product ID (ASIN) */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block font-semibold">Amazon ASIN Code</label>
                        <input
                          type="text"
                          placeholder="e.g. B0CV4D1R5Y"
                          disabled={isSubmitting || isUploading}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors font-mono"
                          {...register('amazonProductId')}
                        />
                        {errors.amazonProductId && <p className="text-xs text-red-500 font-semibold">{errors.amazonProductId.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Price */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block font-semibold">Retail Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="1499.99"
                          disabled={isSubmitting || isUploading}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
                          {...register('price')}
                        />
                        {errors.price && <p className="text-xs text-red-500 font-semibold">{errors.price.message}</p>}
                      </div>

                      {/* Rating */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block font-semibold">Rating (0 - 5)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="4.5"
                          disabled={isSubmitting || isUploading}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
                          {...register('rating')}
                        />
                        {errors.rating && <p className="text-xs text-red-500 font-semibold">{errors.rating.message}</p>}
                      </div>

                      {/* Reviews Count */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block font-semibold">Reviews Count</label>
                        <input
                          type="number"
                          placeholder="142"
                          disabled={isSubmitting || isUploading}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
                          {...register('reviewsCount')}
                        />
                        {errors.reviewsCount && <p className="text-xs text-red-500 font-semibold">{errors.reviewsCount.message}</p>}
                      </div>
                    </div>

                    {/* Affiliate Link */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block font-semibold">Amazon Affiliate Link URL</label>
                      <input
                        type="url"
                        placeholder="https://www.amazon.com/dp/B0CV4D1R5Y?tag=yourtag-20"
                        disabled={isSubmitting || isUploading}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
                        {...register('affiliateLink')}
                      />
                      {errors.affiliateLink && <p className="text-xs text-red-500 font-semibold">{errors.affiliateLink.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/40">
                      {/* Featured toggle */}
                      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        <div className="space-y-0.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Featured Product</label>
                          <p className="text-[10px] text-zinc-400">Display item prominently in front banners.</p>
                        </div>
                        <input
                          type="checkbox"
                          disabled={isSubmitting || isUploading}
                          className="w-5 h-5 accent-violet-600 rounded-lg cursor-pointer"
                          {...register('isFeatured')}
                        />
                      </div>

                      {/* Status select */}
                      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        <div className="space-y-0.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Publishing Status</label>
                          <p className="text-[10px] text-zinc-400">Set visibility of the product card.</p>
                        </div>
                        <select
                          disabled={isSubmitting || isUploading}
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1 text-xs font-bold outline-none cursor-pointer"
                          {...register('status')}
                        >
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 2: TEXT DESCRIPTIONS & MEDIA */}
                {activeTab === 'media' && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Description */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Product Long Description</label>
                      <textarea
                        placeholder="Write a comprehensive review or summary for the product. Full markdown styling supported..."
                        rows={6}
                        disabled={isSubmitting || isUploading}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors resize-none"
                        {...register('description')}
                      />
                      {errors.description && <p className="text-xs text-red-500 font-semibold">{errors.description.message}</p>}
                    </div>

                    {/* Main Image Cover */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Cover / Thumbnail Image</label>
                      
                      {mainImagePreview ? (
                        <div className="relative h-44 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={mainImagePreview} alt="Cover Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => { setMainImagePreview(null); setMainImageFile(null); setValue('mainImage', ''); }}
                            disabled={isSubmitting || isUploading}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-950/80 backdrop-blur-md text-white hover:bg-zinc-950 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50/50 relative group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleMainImageChange}
                            disabled={isSubmitting || isUploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:scale-105 transition-transform duration-200 mb-2" />
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Click to upload Cover</span>
                          <span className="text-[10px] text-zinc-400 mt-1 uppercase">JPEG, WebP, PNG (Max 2MB)</span>
                        </div>
                      )}
                      {errors.mainImage && <p className="text-xs text-red-500 font-semibold">{errors.mainImage.message}</p>}
                    </div>

                    {/* Multiple Images Gallery */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Product Gallery Images</label>
                        <span className="text-[10px] text-zinc-400 uppercase font-semibold">{galleryImages.length} uploaded</span>
                      </div>

                      {/* Image Preview Grid */}
                      {galleryImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                          {galleryImages.map((img) => (
                            <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.preview} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeGalleryImage(img)}
                                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-zinc-950/80 backdrop-blur-md text-white hover:bg-red-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Gallery Upload box */}
                      <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50/50 relative group">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGalleryChange}
                          disabled={isSubmitting || isUploading}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Plus className="w-8 h-8 text-zinc-400 group-hover:scale-105 transition-transform duration-200 mb-2" />
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Click to add Gallery Images</span>
                        <span className="text-[10px] text-zinc-400 mt-1 uppercase">Upload multiple images (Max 2MB each)</span>
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 3: SPECS & HIGHLIGHTS */}
                {activeTab === 'details' && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Pros dynamic builder */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Product Pros</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Breathtaking OLED screen quality"
                          value={newPro}
                          onChange={(e) => setNewPro(e.target.value)}
                          className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-2.5 text-sm outline-none"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addProItem(); } }}
                        />
                        <button
                          type="button"
                          onClick={addProItem}
                          className="px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Add Pro
                        </button>
                      </div>
                      
                      {prosList.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                          {prosList.map((pro, index) => (
                            <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              {pro}
                              <button type="button" onClick={() => setProsList(prev => prev.filter((_, i) => i !== index))} className="hover:text-red-500">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cons dynamic builder */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Product Cons</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Battery life could be better under heavy load"
                          value={newCon}
                          onChange={(e) => setNewCon(e.target.value)}
                          className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-2.5 text-sm outline-none"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addConItem(); } }}
                        />
                        <button
                          type="button"
                          onClick={addConItem}
                          className="px-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Add Con
                        </button>
                      </div>
                      
                      {consList.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                          {consList.map((con, index) => (
                            <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400">
                              {con}
                              <button type="button" onClick={() => setConsList(prev => prev.filter((_, i) => i !== index))} className="hover:text-amber-500">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Specifications Map builder */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/40">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Technical Specifications Map</label>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Key (e.g. Memory)"
                          value={newSpecKey}
                          onChange={(e) => setNewSpecKey(e.target.value)}
                          className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-2.5 text-sm outline-none"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Value (e.g. 16GB LPDDR5X)"
                            value={newSpecVal}
                            onChange={(e) => setNewSpecVal(e.target.value)}
                            className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-2.5 text-sm outline-none"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSpecItem(); } }}
                          />
                          <button
                            type="button"
                            onClick={addSpecItem}
                            className="px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {Object.keys(specsMap).length > 0 && (
                        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 divide-y divide-zinc-200 dark:divide-zinc-800/40 text-xs font-medium">
                          {Object.entries(specsMap).map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                              <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">{key}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-zinc-800 dark:text-zinc-200">{val}</span>
                                <button type="button" onClick={() => removeSpecItem(key)} className="text-red-500 hover:text-red-600">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0">
                <div className="flex gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${activeTab === 'basic' ? 'bg-violet-600' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                  <span className={`w-2.5 h-2.5 rounded-full ${activeTab === 'media' ? 'bg-violet-600' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                  <span className={`w-2.5 h-2.5 rounded-full ${activeTab === 'details' ? 'bg-violet-600' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    disabled={isSubmitting || isUploading}
                    className="px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-violet-500/10 cursor-pointer"
                  >
                    {isSubmitting || isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isUploading ? 'Compressing & uploading media...' : 'Saving Product...'}
                      </>
                    ) : (
                      <>
                        Save Product
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
