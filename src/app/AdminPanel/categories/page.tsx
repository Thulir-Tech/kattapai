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
  FolderPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Image as ImageIcon, 
  X, 
  AlertCircle,
  FolderTree,
  ArrowRight
} from 'lucide-react';
import { CategoryService } from '@/services/category.service';
import { StorageService } from '@/services/storage.service';
import { Category } from '@/types';

// Instantiate a local QueryClient for self-contained, isolated page caching
const queryClient = new QueryClient();

// Validation Schema using Zod
const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
  description: z.string().optional(),
});

type CategoryFormFields = z.infer<typeof categorySchema>;

export default function CategoryManagementWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <CategoryManagementPage />
    </QueryClientProvider>
  );
}

function CategoryManagementPage() {
  const queryClient = useQueryClient();
  
  // Local UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // TanStack Query: Fetch Categories
  const { data: categories = [], isLoading, isError, error } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: CategoryService.getAllCategories,
  });

  // React Hook Form Configuration
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CategoryFormFields>({
    resolver: zodResolver(categorySchema),
  });

  // Watch Name to auto-generate Slug
  const nameValue = watch('name');
  React.useEffect(() => {
    if (nameValue && !editingCategory) {
      const generatedSlug = nameValue
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
        .replace(/[\s_]+/g, '-')     // replace spaces/underscores with hyphens
        .replace(/-+/g, '-');         // remove duplicates
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [nameValue, setValue, editingCategory]);

  // Handle image selection & preview creation
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = StorageService.validateFile(file);
      if (!validation.isValid) {
        setFormError(validation.error);
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormError(null);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Mutate: Create Category
  const createMutation = useMutation({
    mutationFn: async (data: { category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>; file: File | null }) => {
      let imageURL = '';
      if (data.file) {
        setIsUploading(true);
        const compressed = await StorageService.compressImage(data.file, 0.85);
        imageURL = await StorageService.uploadFile(`categories/${data.category.slug}`, compressed);
      }
      return CategoryService.createCategory({
        ...data.category,
        imageURL: imageURL || ""
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseDrawer();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create category.');
      setIsUploading(false);
    }
  });

  // Mutate: Update Category
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; category: Partial<Category>; file: File | null; oldImageUrl?: string }) => {
      let imageURL = data.category.imageURL || '';
      
      if (data.file) {
        setIsUploading(true);
        // Delete old image if it exists to keep Storage clean
        if (data.oldImageUrl) {
          try {
            await StorageService.deleteFile(data.oldImageUrl);
          } catch (e) {
            console.warn('Failed to delete legacy storage asset:', e);
          }
        }
        const compressed = await StorageService.compressImage(data.file, 0.85);
        imageURL = await StorageService.uploadFile(`categories/${data.category.slug || data.id}`, compressed);
      }
      
      return CategoryService.updateCategory(data.id, {
        ...data.category,
        imageURL: imageURL || ""
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseDrawer();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update category.');
      setIsUploading(false);
    }
  });

  // Mutate: Delete Category
  const deleteMutation = useMutation({
    mutationFn: async (category: Category) => {
      if (category.imageURL) {
        try {
          await StorageService.deleteFile(category.imageURL);
        } catch (e) {
          console.warn('Failed to delete legacy storage asset:', e);
        }
      }
      return CategoryService.deleteCategory(category.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete category.');
    }
  });

  // Drawer Controls
  const handleOpenCreateDrawer = () => {
    setEditingCategory(null);
    setFormError(null);
    clearImage();
    reset({ name: '', slug: '', description: '' });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (category: Category) => {
    setEditingCategory(category);
    setFormError(null);
    clearImage();
    if (category.imageURL) {
      setImagePreview(category.imageURL);
    }
    reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    });
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingCategory(null);
    setFormError(null);
    clearImage();
    setIsUploading(false);
  };

  const onSubmitForm = async (fields: CategoryFormFields) => {
    setFormError(null);
    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        category: fields,
        file: imageFile,
        oldImageUrl: editingCategory.imageURL
      });
    } else {
      createMutation.mutate({
        category: fields,
        file: imageFile
      });
    }
  };

  const handleDelete = (category: Category) => {
    if (confirm(`Are you absolutely sure you want to delete the category "${category.name}"?`)) {
      deleteMutation.mutate(category);
    }
  };

  // Filter Categories by search term
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
            Category Manager
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Configure catalog taxonomy and hierarchical affiliate groupings.
          </p>
        </div>
        <button
          onClick={handleOpenCreateDrawer}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-[0_4px_15px_rgba(139,92,246,0.2)] cursor-pointer"
        >
          <FolderPlus className="w-4.5 h-4.5" />
          Add Category
        </button>
      </div>

      {/* 2. Filters & Searches */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search categories by name or details..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none transition-all focus:border-violet-500 focus:shadow-sm"
        />
      </div>

      {/* 3. Catalog Listing View (Dynamic Card Grid) */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
          <span className="text-xs uppercase tracking-wider font-semibold">Loading Catalog...</span>
        </div>
      ) : isError ? (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading categories: {(error as any)?.message || 'Please check your connection.'}</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="h-64 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center p-8 text-zinc-400">
          <FolderTree className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700" />
          <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">No categories found</h3>
          <p className="text-xs max-w-xs mt-1">
            {searchTerm ? 'Try adjusting your search filter keyword.' : 'Click "Add Category" to get started creating catalog entries.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div 
              key={category.id}
              className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              style={{ contentVisibility: 'auto' }}
            >
              {/* Category Image Cover */}
              <div className="h-44 bg-zinc-100 dark:bg-zinc-800 relative flex items-center justify-center text-zinc-400 overflow-hidden border-b border-zinc-100 dark:border-zinc-800/40">
                {category.imageURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={category.imageURL} 
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-102"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FolderTree className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
                    <span className="text-[10px] uppercase font-bold text-zinc-400">No Cover Image</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-zinc-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-white uppercase tracking-wider">
                  {category.slug}
                </div>
              </div>

              {/* Card Details */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 truncate">
                    {category.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                    {category.description || 'No description available for this category.'}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/40 pt-4 mt-6">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                    ID: {category.id.slice(0, 12)}...
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditDrawer(category)}
                      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-2 rounded-lg border border-red-200 dark:border-red-950/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Sliding Sliding Sidebar Drawer Form Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xs"
            onClick={handleCloseDrawer}
          />
          
          {/* Drawer Inner Content */}
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 h-full shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col border-l border-zinc-200 dark:border-zinc-800 overflow-hidden animate-slideLeft">
            
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                {editingCategory ? 'Modify Category' : 'Create Category'}
              </h3>
              <button 
                onClick={handleCloseDrawer}
                className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form 
              onSubmit={handleSubmit(onSubmitForm)}
              className="flex-1 flex flex-col justify-between overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {formError && (
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-500">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                    Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mechanical Keyboards"
                    disabled={isSubmitting || isUploading}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors disabled:opacity-50"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 font-semibold">{errors.name.message}</p>
                  )}
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. mechanical-keyboards"
                    disabled={isSubmitting || isUploading || !!editingCategory}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    {...register('slug')}
                  />
                  {errors.slug && (
                    <p className="text-xs text-red-500 font-semibold">{errors.slug.message}</p>
                  )}
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    The unique relative route slug for products filter. Unique and lowercase alphanumeric.
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                    Description
                  </label>
                  <textarea
                    placeholder="Provide a brief summary outlining this product class..."
                    rows={4}
                    disabled={isSubmitting || isUploading}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors disabled:opacity-50 resize-none"
                    {...register('description')}
                  />
                </div>

                {/* Image Upload Component */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                    Category Cover Image
                  </label>
                  
                  {imagePreview ? (
                    <div className="relative h-44 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        disabled={isSubmitting || isUploading}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-950/80 backdrop-blur-md text-white hover:bg-zinc-950 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Remove Image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isSubmitting || isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:scale-105 transition-transform duration-200 mb-2" />
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Click to upload image</span>
                      <span className="text-[10px] text-zinc-400 mt-1 uppercase">Supports JPEG, WebP, PNG (Max 2MB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3 bg-zinc-50/50 dark:bg-zinc-900/20">
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  disabled={isSubmitting || isUploading}
                  className="px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-violet-500/10 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {isSubmitting || isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isUploading ? 'Uploading assets...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      Save Category
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
