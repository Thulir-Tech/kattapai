'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dynamic from 'next/dynamic';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
  useMutation, 
  useQueryClient 
  } from '@tanstack/react-query';
import { 
  BookOpen,
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
  Eye,
  Calendar,
  Clock,
  User,
  CheckCircle,
  FileText
} from 'lucide-react';
import { BlogService } from '@/services/blog.service';
import { CategoryService } from '@/services/category.service';
import { StorageService } from '@/services/storage.service';
import { AuthService } from '@/services/auth.service';
import { Blog, Category } from '@/types';

// Lazily load TiptapEditor to prevent any Next.js Server-Side rendering mismatch
const TiptapEditor = dynamic(() => import('@/components/shared/TiptapEditor'), { ssr: false });

const queryClient = new QueryClient();

// Validation Schema using Zod
const blogSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, numbers, and hyphens only'),
  excerpt: z.string().min(10, 'Excerpt must be at least 10 characters'),
  content: z.string().min(10, 'Content is required'),
  featuredImage: z.string().min(1, 'Featured image is required'),
  status: z.enum(['draft', 'published']).default('draft'),
  tagsInput: z.string().optional(),
  categoryIds: z.array(z.string()).default([]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
});

type BlogFormFields = z.infer<typeof blogSchema>;

export default function BlogManagementWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <BlogManagementPage />
    </QueryClientProvider>
  );
}

function BlogManagementPage() {
  const queryClient = useQueryClient();

  // Local UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'editor' | 'seo'>('basic');
  const [editingBlog, setEditingBlog] = useState<Blog & { seoTitle?: string; seoDescription?: string; seoKeywords?: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Cover image states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Queries
  const { data: blogs = [], isLoading: isBlogsLoading, isError: isBlogsError } = useQuery<Blog[]>({
    queryKey: ['blogs'],
    queryFn: BlogService.getAllBlogs,
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
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      status: 'draft' as 'draft' | 'published',
      tagsInput: '',
      categoryIds: [] as string[],
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    }
  });

  // Auto Slug Generator from Title
  const titleValue = watch('title');
  React.useEffect(() => {
    if (titleValue && !editingBlog) {
      const generatedSlug = titleValue
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-');
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [titleValue, setValue, editingBlog]);

  // Image Selection Handler
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
      setValue('featuredImage', 'pending-upload', { shouldValidate: true });
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setValue('featuredImage', '', { shouldValidate: true });
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: { blog: Omit<Blog, 'id' | 'createdAt' | 'updatedAt' | 'readTime' | 'authorId'>; file: File | null; readTime: number; authorId: string }) => {
      setIsUploading(true);
      let featuredImageUrl = '';

      if (data.file) {
        const compressed = await StorageService.compressImage(data.file, 0.75, 900);
        featuredImageUrl = await StorageService.uploadFile(`blogs/${data.blog.slug}`, compressed);
      }

      const payload = {
        ...data.blog,
        featuredImage: featuredImageUrl,
        readTime: data.readTime,
        authorId: data.authorId,
      };

      return BlogService.createBlog(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      handleCloseDrawer();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create blog post.');
      setIsUploading(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; blog: Partial<Blog>; file: File | null; oldBlog: Blog; readTime: number }) => {
      setIsUploading(true);
      let featuredImageUrl = data.blog.featuredImage || '';

      if (data.file) {
        const compressed = await StorageService.compressImage(data.file, 0.75, 900);
        featuredImageUrl = await StorageService.uploadFile(`blogs/${data.oldBlog.slug}`, compressed);
      }

      const payload = {
        ...data.blog,
        featuredImage: featuredImageUrl,
        readTime: data.readTime,
      };

      return BlogService.updateBlog(data.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      handleCloseDrawer();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update blog post.');
      setIsUploading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return BlogService.deleteBlog(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete blog post.');
    }
  });

  // Drawer Controls
  const handleOpenCreateDrawer = () => {
    setEditingBlog(null);
    setFormError(null);
    setActiveTab('basic');
    setImagePreview(null);
    setImageFile(null);
    reset({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      status: 'draft',
      tagsInput: '',
      categoryIds: [],
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (blog: Blog & { seoTitle?: string; seoDescription?: string; seoKeywords?: string }) => {
    setEditingBlog(blog);
    setFormError(null);
    setActiveTab('basic');
    setImagePreview(blog.featuredImage || null);
    setImageFile(null);
    
    // Parse tags to comma separated list
    const tagsString = (blog.tagIds || []).join(', ');

    reset({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      featuredImage: blog.featuredImage || 'existing',
      status: blog.status || 'draft',
      tagsInput: tagsString,
      categoryIds: blog.categoryIds || [],
      seoTitle: blog.seoTitle || '',
      seoDescription: blog.seoDescription || '',
      seoKeywords: blog.seoKeywords || '',
    });
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingBlog(null);
    setFormError(null);
    setImageFile(null);
    setImagePreview(null);
    setIsUploading(false);
  };

  const onSubmitForm = async (fields: any) => {
    setFormError(null);

    if (!imagePreview) {
      setFormError('Featured image is required.');
      return;
    }

    if (!fields.content || fields.content === '<p></p>') {
      setFormError('Blog post content is required.');
      return;
    }

    // Parse tag inputs
    const tagsInput = fields.tagsInput as string | undefined;
    const tagIds = tagsInput 
      ? tagsInput.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    // Calculate dynamic read time (assume 200 wpm)
    const textOnly = fields.content.replace(/<[^>]*>/g, '');
    const wordsCount = textOnly.split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.ceil(wordsCount / 200));

    // Retrieve active logged in user credentials
    const currentUser = AuthService.getCurrentUser();
    const authorId = currentUser?.email || 'admin@easykart.com';

    // Build payload matching service specs
    const blogData: any = {
      title: fields.title,
      slug: fields.slug,
      excerpt: fields.excerpt,
      content: fields.content,
      featuredImage: fields.featuredImage === 'pending-upload' ? '' : fields.featuredImage,
      status: fields.status,
      categoryIds: fields.categoryIds,
      tagIds: tagIds,
      seoTitle: fields.seoTitle || fields.title,
      seoDescription: fields.seoDescription || fields.excerpt,
      seoKeywords: fields.seoKeywords || '',
    };

    if (fields.status === 'published') {
      blogData.publishedAt = editingBlog?.publishedAt || new Date().toISOString();
    }

    if (editingBlog) {
      updateMutation.mutate({
        id: editingBlog.id,
        blog: blogData,
        file: imageFile,
        oldBlog: editingBlog,
        readTime
      });
    } else {
      createMutation.mutate({
        blog: blogData,
        file: imageFile,
        readTime,
        authorId
      });
    }
  };

  const handleDelete = (blog: Blog) => {
    if (confirm(`Are you absolutely sure you want to delete "${blog.title}"?`)) {
      deleteMutation.mutate(blog.id);
    }
  };

  // Filter lists
  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
            Blog & Article Manager
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Publish reviews, shopping guides, and high-converting affiliate blogs.
          </p>
        </div>
        <button
          onClick={handleOpenCreateDrawer}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-[0_4px_15px_rgba(139,92,246,0.2)] cursor-pointer animate-fadeIn"
        >
          <Plus className="w-4.5 h-4.5" />
          Create Blog Post
        </button>
      </div>

      {/* Filters & Searches */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search articles by title or snippet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none transition-all focus:border-violet-500 focus:shadow-sm"
        />
      </div>

      {/* Catalog Listing */}
      {isBlogsLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
          <span className="text-xs uppercase tracking-wider font-semibold">Loading Articles...</span>
        </div>
      ) : isBlogsError ? (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading blog posts. Please verify Firestore connections.</span>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="h-64 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center p-8 text-zinc-400">
          <BookOpen className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700 animate-pulse" />
          <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">No blog posts found</h3>
          <p className="text-xs max-w-xs mt-1">
            {searchTerm ? 'Try adjusting your search query filter.' : 'Click "Create Blog Post" to launch your first affiliate marketing article.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <div 
              key={blog.id} 
              className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              style={{ contentVisibility: 'auto' }}
            >
              {/* Cover Featured Image */}
              <div className="h-48 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden border-b border-zinc-100 dark:border-zinc-800/40">
                {blog.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={blog.featuredImage} 
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-103"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700">
                    <BookOpen className="w-10 h-10 mb-2" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">No Cover Image</span>
                  </div>
                )}
                {/* Publish Badge */}
                <div className={`absolute top-4 left-4 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-white uppercase tracking-wider ${
                  blog.status === 'published' ? 'bg-emerald-500/80' : 'bg-amber-500/80'
                }`}>
                  {blog.status}
                </div>
              </div>

              {/* Card Meta & Info */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400 font-semibold uppercase">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {blog.authorId.split('@')[0]}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {blog.readTime} min read</span>
                  </div>
                  
                  <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug hover:text-violet-500 dark:hover:text-violet-400 transition-colors">
                    {blog.title}
                  </h3>
                  
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                    {blog.excerpt || 'No excerpt summary configured.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {(blog.tagIds || []).slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[9px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/5 px-2 py-0.5 rounded-md border border-violet-500/10">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/40 pt-4">
                  <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'Draft'}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditDrawer(blog)}
                      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                      title="Edit Article"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(blog)}
                      className="p-2 rounded-lg border border-red-200 dark:border-red-950/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete Article"
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

      {/* Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xs animate-fadeIn" onClick={handleCloseDrawer} />
          
          <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 overflow-hidden animate-slideLeft">
            
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                {editingBlog ? 'Edit Blog Post' : 'Create Blog Post'}
              </h3>
              <button onClick={handleCloseDrawer} className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-sm font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`flex-1 py-3 text-center transition-colors cursor-pointer border-b-2 ${activeTab === 'basic' ? 'border-violet-600 text-violet-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
              >
                Article Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`flex-1 py-3 text-center transition-colors cursor-pointer border-b-2 ${activeTab === 'editor' ? 'border-violet-600 text-violet-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
              >
                Tiptap Rich-Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={`flex-1 py-3 text-center transition-colors cursor-pointer border-b-2 ${activeTab === 'seo' ? 'border-violet-600 text-violet-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
              >
                SEO & Tags
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

                {/* TAB 1: BASIC INFO */}
                {activeTab === 'basic' && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Title */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Blog Title</label>
                      <input
                        type="text"
                        placeholder="e.g. The Ultimate Mechanical Keyboards Buying Guide"
                        disabled={isSubmitting || isUploading}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
                        {...register('title')}
                      />
                      {errors.title && <p className="text-xs text-red-500 font-semibold">{errors.title.message}</p>}
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">URL Route Slug</label>
                      <input
                        type="text"
                        placeholder="e.g. ultimate-mechanical-keyboards-buying-guide"
                        disabled={isSubmitting || isUploading || !!editingBlog}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors disabled:opacity-75"
                        {...register('slug')}
                      />
                      {errors.slug && <p className="text-xs text-red-500 font-semibold">{errors.slug.message}</p>}
                    </div>

                    {/* Categories Select */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Catalog Categories</label>
                      <div className="grid grid-cols-2 gap-3 max-h-36 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50 dark:bg-zinc-950/20">
                        {categories.map((cat) => (
                          <label key={cat.id} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              value={cat.id}
                              disabled={isSubmitting || isUploading}
                              className="rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 h-4 w-4"
                              {...register('categoryIds')}
                            />
                            {cat.name}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Article Short Excerpt</label>
                      <textarea
                        rows={3}
                        placeholder="Provide a quick summary or click-bait intro to entice readers from catalogs..."
                        disabled={isSubmitting || isUploading}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors resize-none"
                        {...register('excerpt')}
                      />
                      {errors.excerpt && <p className="text-xs text-red-500 font-semibold">{errors.excerpt.message}</p>}
                    </div>

                    {/* Featured Image */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Featured Image Cover</label>
                      
                      {imagePreview ? (
                        <div className="relative h-48 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imagePreview} alt="Featured Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={clearImage}
                            disabled={isSubmitting || isUploading}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-950/80 backdrop-blur-md text-white hover:bg-zinc-950 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors relative group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={isSubmitting || isUploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:scale-105 transition-transform duration-200 mb-2" />
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Click to upload featured cover image</span>
                          <span className="text-[10px] text-zinc-400 mt-1 uppercase">Supports JPEG, WebP, PNG (Max 2MB)</span>
                        </div>
                      )}
                      {errors.featuredImage && <p className="text-xs text-red-500 font-semibold">{errors.featuredImage.message}</p>}
                    </div>

                    {/* Status Select & Toggle */}
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pt-4">
                      <div className="space-y-0.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Publish Article</label>
                        <p className="text-[10px] text-zinc-400">Make this article live and visible on the website immediately.</p>
                      </div>
                      <select
                        disabled={isSubmitting || isUploading}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-violet-500 cursor-pointer"
                        {...register('status')}
                      >
                        <option value="draft">Save as Draft</option>
                        <option value="published">Publish Now</option>
                      </select>
                    </div>

                  </div>
                )}

                {/* TAB 2: RICH EDITOR */}
                {activeTab === 'editor' && (
                  <div className="space-y-3 animate-fadeIn h-full flex flex-col justify-between">
                    <div className="space-y-0.5 shrink-0">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Rich Content Editor</label>
                      <p className="text-[10px] text-zinc-400">Construct premium formatted headings, review details, and affiliate tables.</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                      <Controller
                        name="content"
                        control={control}
                        render={({ field }) => (
                          <TiptapEditor
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isSubmitting || isUploading}
                          />
                        )}
                      />
                    </div>
                    {errors.content && <p className="text-xs text-red-500 font-semibold shrink-0">{errors.content.message}</p>}
                  </div>
                )}

                {/* TAB 3: SEO & TAGS */}
                {activeTab === 'seo' && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Tags Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Article Keywords / Tags</label>
                      <input
                        type="text"
                        placeholder="keyboards, review, tech, recommendations (comma separated)"
                        disabled={isSubmitting || isUploading}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
                        {...register('tagsInput')}
                      />
                      <p className="text-[10px] text-zinc-400">Separate keywords using comma characters. Auto converts to lowercased hashes.</p>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800/40 pt-6 space-y-4">
                      <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                        <FileText className="w-5 h-5 text-violet-500" />
                        <h4 className="font-bold text-sm">Meta SEO overrides</h4>
                      </div>

                      {/* SEO Title */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">SEO Page Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Best Mechanical Keyboards of 2026 | EasyKart"
                          disabled={isSubmitting || isUploading}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
                          {...register('seoTitle')}
                        />
                      </div>

                      {/* SEO Description */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">SEO Meta Description</label>
                        <textarea
                          rows={3}
                          placeholder="Provide a high-quality summary matching Google search engine results snippets..."
                          disabled={isSubmitting || isUploading}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors resize-none"
                          {...register('seoDescription')}
                        />
                      </div>

                      {/* SEO Keywords */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">SEO Meta Keywords</label>
                        <input
                          type="text"
                          placeholder="tech reviews, best electronics, amazon buying guide"
                          disabled={isSubmitting || isUploading}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
                          {...register('seoKeywords')}
                        />
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                  {activeTab === 'basic' ? 'Step 1 of 3: Details' : activeTab === 'editor' ? 'Step 2 of 3: Content' : 'Step 3 of 3: Metadata'}
                </span>
                
                <div className="flex items-center gap-3">
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
                        {isUploading ? 'Compressing cover image...' : 'Saving Post...'}
                      </>
                    ) : (
                      <>
                        Save Article
                        <CheckCircle className="w-4 h-4" />
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
