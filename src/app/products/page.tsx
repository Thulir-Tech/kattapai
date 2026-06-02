import React from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Search, 
  FolderTree, 
  SlidersHorizontal, 
  Star, 
  ArrowRight, 
  ArrowLeft, 
  Info,
  Sparkles,
  MousePointerClick,
  TrendingUp,
  X,
  Clock
} from 'lucide-react';
import { ProductService } from '@/services/product.service';
import { CategoryService } from '@/services/category.service';
import { Product, Category } from '@/types';

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

export const revalidate = 30; // Revalidate dynamic catalog every 30 seconds

export default async function ProductsCataloguePage(props: ProductsPageProps) {
  // Await search parameters based on Next.js 16 Async routing rules
  const searchParams = await props.searchParams;
  const categorySlug = searchParams.category || '';
  const searchQuery = searchParams.search || '';
  const sortOption = searchParams.sort || 'latest';
  const pageParam = searchParams.page || '1';

  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    const [fetchedProducts, fetchedCategories] = await Promise.all([
      ProductService.getAllProducts(),
      CategoryService.getAllCategories()
    ]);
    products = fetchedProducts;
    categories = fetchedCategories;
  } catch (e) {
    console.warn('Failed loading products server catalogue, utilizing empty array sets:', e);
  }

  // -------------------------------------------------------------
  // CATALOG FILTERING & SORTING LOGIC (IN-MEMORY)
  // -------------------------------------------------------------
  let filteredProducts = products.filter(p => p.status !== 'draft');

  // 1. Category Filtering
  let activeCategoryId = '';
  let activeCategoryName = '';
  if (categorySlug) {
    const targetCat = categories.find(c => c.slug === categorySlug);
    if (targetCat) {
      activeCategoryId = targetCat.id;
      activeCategoryName = targetCat.name;
      filteredProducts = filteredProducts.filter(p => p.categoryId === targetCat.id);
    }
  }

  // 2. Search Query Filtering
  if (searchQuery) {
    const query = searchQuery.toLowerCase().trim();
    filteredProducts = filteredProducts.filter(p => 
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.amazonProductId.toLowerCase().includes(query)
    );
  }

  // 3. Sorting Options
  if (sortOption === 'featured') {
    // Featured first, then by date
    filteredProducts.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else if (sortOption === 'clicks') {
    // Sorted by dynamic clicksCount
    filteredProducts.sort((a, b) => {
      const clicksA = (a as any).clicksCount || 0;
      const clicksB = (b as any).clicksCount || 0;
      return clicksB - clicksA;
    });
  } else {
    // 'latest' (default): Sorted by date
    filteredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // 4. Pagination Allocations
  const ITEMS_PER_PAGE = 6;
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Helper to build dynamic routes maintaining query queries
  const getFilterUrl = (params: { category?: string | null; search?: string | null; sort?: string | null; page?: number }) => {
    const nextCategory = params.category !== undefined ? params.category : categorySlug;
    const nextSearch = params.search !== undefined ? params.search : searchQuery;
    const nextSort = params.sort !== undefined ? params.sort : sortOption;
    const nextPage = params.page !== undefined ? params.page : 1;

    const queryParts: string[] = [];
    if (nextCategory) queryParts.push(`category=${encodeURIComponent(nextCategory)}`);
    if (nextSearch) queryParts.push(`search=${encodeURIComponent(nextSearch)}`);
    if (nextSort && nextSort !== 'latest') queryParts.push(`sort=${encodeURIComponent(nextSort)}`);
    if (nextPage && nextPage > 1) queryParts.push(`page=${nextPage}`);

    return queryParts.length > 0 ? `/products?${queryParts.join('&')}` : '/products';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      
      {/* 1. Page Header */}
      <div className="border-b border-zinc-200/60 dark:border-zinc-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-950 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
            Recommend Products
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            {activeCategoryName ? `Showing recommendations in "${activeCategoryName}"` : 'Discover expert tech selections and curated buying gear.'}
          </p>
        </div>
        
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 px-3 py-1.5 rounded-full shrink-0">
          {totalItems} items matching
        </span>
      </div>

      {/* 2. Core 2-Column Catalog Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        
        {/* Sidebar Filters (Col 1) */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          
          {/* Quick Search */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-violet-500" />
              Keyword Filter
            </h3>
            
            <form action="/products" method="GET" className="relative">
              {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
              {sortOption !== 'latest' && <input type="hidden" name="sort" value={sortOption} />}
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search catalog..."
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl pl-4 pr-10 py-2.5 text-xs outline-none transition-colors"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                <Search className="w-4 h-4" />
              </button>
            </form>
            
            {searchQuery && (
              <Link 
                href={getFilterUrl({ search: null })}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:underline pt-1"
              >
                <X className="w-3 h-3" /> Clear Search
              </Link>
            )}
          </div>

          {/* Sort Controls */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-violet-500" />
              Sort Strategy
            </h3>
            
            <div className="flex flex-col gap-1.5 text-xs font-bold">
              {[
                { id: 'latest', label: 'Latest Added', icon: Clock },
                { id: 'featured', label: 'Featured Picks', icon: Sparkles },
                { id: 'clicks', label: 'Most Popular', icon: TrendingUp },
              ].map(opt => {
                const isActive = sortOption === opt.id;
                const Icon = opt.icon;
                
                return (
                  <Link
                    key={opt.id}
                    href={getFilterUrl({ sort: opt.id })}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-all ${
                      isActive 
                        ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/10' 
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Categories Sidebar */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-violet-500" />
              Categories
            </h3>
            
            <div className="flex flex-col gap-1 text-xs font-bold max-h-56 overflow-y-auto pr-1">
              <Link
                href={getFilterUrl({ category: null })}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                  !categorySlug 
                    ? 'text-violet-600 dark:text-violet-400 bg-violet-500/5 border border-violet-500/10' 
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50/50'
                }`}
              >
                <span>All Categories</span>
              </Link>
              
              {categories.map((cat) => {
                const isActive = categorySlug === cat.slug;
                
                return (
                  <Link
                    key={cat.id}
                    href={getFilterUrl({ category: cat.slug })}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                      isActive 
                        ? 'text-violet-600 dark:text-violet-400 bg-violet-500/5 border border-violet-500/10' 
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50/50'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

        </aside>

        {/* Product Grid View (Col 3) */}
        <div className="lg:col-span-3 space-y-12">
          
          {paginatedProducts.length === 0 ? (
            <div className="h-64 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center p-8 text-zinc-400 bg-white dark:bg-zinc-900/10 shadow-sm animate-fadeIn">
              <ShoppingBag className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700 animate-pulse" />
              <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">No matching products found</h3>
              <p className="text-xs max-w-xs mt-1 leading-relaxed">
                We couldn't find any products matching your active keyword search or category parameters. Try resetting your filter selectors.
              </p>
              
              <Link 
                href="/products" 
                className="mt-5 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/10 cursor-pointer"
              >
                Reset Catalog Filters
              </Link>
            </div>
          ) : (
            <div className="space-y-10 animate-fadeIn">
              
              {/* Product Cards Grid (NO PRICES OR CURRENCIES!) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((product) => {
                  const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'Unassigned';
                  
                  return (
                    <div 
                      key={product.id}
                      className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                      style={{ contentVisibility: 'auto' }}
                    >
                      {/* Product Thumbnail cover */}
                      <div className="h-44 bg-zinc-100 dark:bg-zinc-800/60 relative overflow-hidden flex items-center justify-center border-b border-zinc-100 dark:border-zinc-800/40">
                        {product.mainImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={product.mainImage} 
                            alt={product.title} 
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-102"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-zinc-300"><ShoppingBag className="w-10 h-10" /></div>
                        )}
                        {/* Category tag */}
                        <div className="absolute top-4 left-4 bg-zinc-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-white uppercase tracking-wider">
                          {categoryName}
                        </div>
                      </div>

                      {/* Product specifications details */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 truncate" title={product.title}>
                            {product.title}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                        </div>


                        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/40 pt-4">
                          <span className="text-[10px] text-zinc-400 font-mono font-bold">ASIN: {product.amazonProductId}</span>
                          <Link 
                            href={`/product/${product.slug}`} 
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold rounded-xl hover:bg-violet-500 hover:text-white transition-colors cursor-pointer"
                          >
                            Details
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800 pt-6">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    {currentPage > 1 ? (
                      <Link 
                        href={getFilterUrl({ page: currentPage - 1 })}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Previous
                      </Link>
                    ) : (
                      <button 
                        disabled 
                        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200/30 dark:border-zinc-800/30 rounded-xl text-xs font-bold text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Previous
                      </button>
                    )}

                    {/* Next Button */}
                    {currentPage < totalPages ? (
                      <Link 
                        href={getFilterUrl({ page: currentPage + 1 })}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        Next
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <button 
                        disabled 
                        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200/30 dark:border-zinc-800/30 rounded-xl text-xs font-bold text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                      >
                        Next
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
