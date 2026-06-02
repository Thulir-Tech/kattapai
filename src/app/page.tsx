import React from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Laptop, 
  ChevronRight, 
  Star, 
  Calendar, 
  Clock, 
  ShieldCheck,
  CheckCircle,
  ThumbsUp,
  FolderTree
} from 'lucide-react';
import { ProductService } from '@/services/product.service';
import { CategoryService } from '@/services/category.service';
import { BlogService } from '@/services/blog.service';
import FeaturedCarousel from '@/components/shared/FeaturedCarousel';
import { Product, Category, Blog } from '@/types';

export const revalidate = 60; // Revalidate home page cache every minute

export default async function HomePage() {
  let products: Product[] = [];
  let categories: Category[] = [];
  let blogs: Blog[] = [];

  try {
    const [fetchedProducts, fetchedCategories, fetchedBlogs] = await Promise.all([
      ProductService.getAllProducts(),
      CategoryService.getAllCategories(),
      BlogService.getAllBlogs()
    ]);
    products = fetchedProducts;
    categories = fetchedCategories;
    blogs = fetchedBlogs;
  } catch (e) {
    console.warn('Failed to load server-side home page data, using empty sets:', e);
  }

  // Filter segments
  const activeProducts = products.filter(p => p.status !== 'draft');
  const featuredProducts = activeProducts.filter(p => p.isFeatured);
  const latestProducts = activeProducts.slice(0, 6);
  const latestBlogs = blogs.filter(b => b.status === 'published').slice(0, 3);
  const popularCategories = categories.slice(0, 4);

  return (
    <div className="space-y-20 pb-20">
      
      {/* 1. Hero Section (Premium Curated Tech Showcase) */}
      <section className="relative overflow-hidden py-24 sm:py-32 bg-zinc-900 text-white rounded-b-[40px] md:rounded-b-[60px] shadow-lg">
        {/* Glow ambient background graphics */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Hero details text */}
          <div className="space-y-6 max-w-xl text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider animate-fadeIn">
              <Sparkles className="w-3.5 h-3.5" />
              Expert Product Curation
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Discover the best and affordable products
            </h1>
            
            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed font-medium">
              We analyze top specifications and features to recommend each product.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link 
                href="/products" 
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-[0_4px_15px_rgba(139,92,246,0.25)] cursor-pointer w-full sm:w-auto hover:translate-x-0.5"
              >
                Explore Recommendations
                <ArrowRight className="w-4.5 h-4.5" />
              </Link>
              <Link 
                href="/blog" 
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold border border-zinc-700 bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300 transition-all cursor-pointer w-full sm:w-auto"
              >
                Read Buying Guides
              </Link>
            </div>
          </div>

          {/* Hero visual grid mockup */}
          <div className="hidden lg:grid grid-cols-2 gap-4 relative">
            {/* Ambient card 1 */}
            <div className="bg-zinc-800/30 backdrop-blur-md border border-zinc-700/50 p-6 rounded-3xl space-y-4 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-white">Unbiased Analytics</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Multi-dimensional parameters matching technical performance standards.</p>
            </div>
            
            {/* Ambient card 2 */}
            <div className="bg-zinc-800/30 backdrop-blur-md border border-zinc-700/50 p-6 rounded-3xl space-y-4 translate-y-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-white">100% Affiliate Safe</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Direct compliance routing protecting your shopping tags under Amazon policy.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 space-y-24">
        
        {/* 2. Featured Snaps Carousel Section */}
        {featuredProducts.length > 0 && (
          <section className="animate-fadeIn">
            <FeaturedCarousel products={featuredProducts} categories={categories} />
          </section>
        )}

        {/* 3. Popular Categories Segment */}
        {popularCategories.length > 0 && (
          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-violet-500" />
                Popular Categories
              </h2>
              <p className="text-xs text-zinc-400">Filter catalogue entries instantly by technical verticals.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group relative h-48 bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800/80 shadow-sm block hover:shadow-md transition-all duration-300"
                >
                  {cat.imageURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={cat.imageURL} 
                      alt={cat.name} 
                      className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-103 group-hover:opacity-60 transition-all duration-500" 
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-violet-900/50 to-indigo-900/50 opacity-40 group-hover:opacity-60 transition-opacity" />
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent p-6 flex flex-col justify-end">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">Explore category</span>
                    <h3 className="font-extrabold text-base text-white flex items-center gap-1.5 group-hover:text-violet-400 transition-colors">
                      {cat.name}
                      <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. Latest Products Grid Section (NO PRICES!) */}
        {latestProducts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-violet-500" />
                  Recently Analyzed Gear
                </h2>
                <p className="text-xs text-zinc-400">Our latest fully-reviewed product indices catalogued live.</p>
              </div>
              
              <Link 
                href="/products" 
                className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                View Full catalogue
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestProducts.map((product) => {
                const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'Unassigned';
                
                return (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Cover image cover */}
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
                      {/* Category Badge */}
                      <div className="absolute top-4 left-4 bg-zinc-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-white uppercase tracking-wider">
                        {categoryName}
                      </div>
                    </div>

                    {/* Content Details (NO PRICES displayed!) */}
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
                        <span className="text-[10px] text-zinc-400 font-bold uppercase shrink-0">ASIN: {product.amazonProductId}</span>
                        <Link 
                          href={`/product/${product.slug}`} 
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold hover:bg-violet-500 hover:text-white transition-colors cursor-pointer"
                        >
                          View Review
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Latest Articles / Blogs Grid */}
        {latestBlogs.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-violet-500" />
                  Latest Articles & Buying Guides
                </h2>
                <p className="text-xs text-zinc-400">Read our expert recommendations on buying keyboards, mice, and other modern workspace tech.</p>
              </div>
              <Link 
                href="/blog" 
                className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                View All Articles
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  {/* cover image */}
                  <div className="h-44 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden border-b border-zinc-100 dark:border-zinc-800/40">
                    {blog.featuredImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={blog.featuredImage} alt={blog.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* blog summary details */}
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(blog.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {blog.readTime} min read</span>
                      </div>
                      
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 line-clamp-2 hover:text-violet-500 transition-colors">
                        {blog.title}
                      </h3>
                      
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {blog.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/40">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Author: {blog.authorId.split('@')[0]}</span>
                      <Link 
                        href={`/blog/${blog.slug}`} 
                        className="text-xs font-bold text-violet-500 hover:text-violet-600 dark:text-violet-400 flex items-center gap-1"
                      >
                        Read Post
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
