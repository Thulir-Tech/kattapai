import React from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  Clock, 
  Calendar, 
  ChevronRight, 
  ArrowRight, 
  ArrowLeft, 
  X,
  Tag
} from 'lucide-react';
import { BlogService } from '@/services/blog.service';
import { Blog } from '@/types';

interface BlogPageProps {
  searchParams: Promise<{
    search?: string;
    tag?: string;
    page?: string;
  }>;
}

export const revalidate = 60; // Revalidate blogs cache every minute

export default async function BlogListingPage(props: BlogPageProps) {
  // Await searchParams as required by Next.js 16 Async Routing rules
  const searchParams = await props.searchParams;
  const searchQuery = searchParams.search || '';
  const activeTag = searchParams.tag || '';
  const pageParam = searchParams.page || '1';

  let blogs: Blog[] = [];

  try {
    blogs = await BlogService.getAllBlogs();
  } catch (e) {
    console.error('Failed loading server-side blog data:', e);
  }

  // Filter published blogs
  let filteredBlogs = blogs.filter(b => b.status === 'published');

  // Extract all unique tags dynamically from all published blogs
  const allTagsMap = new Map<string, number>();
  filteredBlogs.forEach(blog => {
    if (blog.tagIds && Array.isArray(blog.tagIds)) {
      blog.tagIds.forEach(t => {
        const cleaned = t.trim().toLowerCase();
        if (cleaned) {
          allTagsMap.set(cleaned, (allTagsMap.get(cleaned) || 0) + 1);
        }
      });
    }
  });
  const uniqueTags = Array.from(allTagsMap.keys()).sort();

  // Apply filters
  // 1. Keyword Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    filteredBlogs = filteredBlogs.filter(b => 
      b.title.toLowerCase().includes(q) ||
      b.excerpt.toLowerCase().includes(q) ||
      b.content.toLowerCase().includes(q)
    );
  }

  // 2. Tag Filter
  if (activeTag) {
    const targetTag = activeTag.toLowerCase().trim();
    filteredBlogs = filteredBlogs.filter(b => 
      b.tagIds && b.tagIds.map(t => t.toLowerCase()).includes(targetTag)
    );
  }

  // 3. Pagination Setup
  const ITEMS_PER_PAGE = 6;
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const totalItems = filteredBlogs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);

  // Helper to build URL query strings safely
  const getFilterUrl = (params: { tag?: string | null; search?: string | null; page?: number }) => {
    const nextTag = params.tag !== undefined ? params.tag : activeTag;
    const nextSearch = params.search !== undefined ? params.search : searchQuery;
    const nextPage = params.page !== undefined ? params.page : 1;

    const queryParts: string[] = [];
    if (nextTag) queryParts.push(`tag=${encodeURIComponent(nextTag)}`);
    if (nextSearch) queryParts.push(`search=${encodeURIComponent(nextSearch)}`);
    if (nextPage && nextPage > 1) queryParts.push(`page=${nextPage}`);

    return queryParts.length > 0 ? `/blog?${queryParts.join('&')}` : '/blog';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      
      {/* 1. Glassmorphic Hero Banner */}
      <section className="relative overflow-hidden py-16 sm:py-20 bg-zinc-900 text-white rounded-3xl shadow-lg border border-zinc-800">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-[350px] h-[350px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center px-6 relative z-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5" />
            EasyKart Knowledge Hub
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent leading-tight">
            Tech buying guides & advice
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            In-depth breakdowns, expert setup guides, and critical reviews of top-performing modern workspace gear. Written by tech minimalists.
          </p>
        </div>
      </section>

      {/* 2. Interactive Navigation Filters Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl shadow-sm">
        
        {/* Topic Tags Flex Grid (Span 8) */}
        <div className="lg:col-span-8 space-y-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-violet-500" />
            Filter by tag topic
          </span>
          
          <div className="flex flex-wrap gap-2">
            <Link
              href={getFilterUrl({ tag: null })}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                !activeTag 
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              All Topics
            </Link>
            
            {uniqueTags.map(t => {
              const isActive = activeTag.toLowerCase() === t;
              return (
                <Link
                  key={t}
                  href={getFilterUrl({ tag: t })}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${
                    isActive 
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {t}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Dynamic Search Box (Span 4) */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
            Search articles
          </span>
          
          <form action="/blog" method="GET" className="relative">
            {activeTag && <input type="hidden" name="tag" value={activeTag} />}
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Search keyword..."
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl pl-4 pr-10 py-2 text-xs font-medium outline-none transition-colors"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {searchQuery && (
            <Link
              href={getFilterUrl({ search: null })}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:underline pt-1"
            >
              <X className="w-3 h-3" /> Clear filter
            </Link>
          )}
        </div>

      </div>

      {/* 3. Dynamic Blogs Cards Grid */}
      {paginatedBlogs.length === 0 ? (
        <div className="h-64 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center p-8 text-zinc-400 bg-white dark:bg-zinc-900/10 shadow-sm animate-fadeIn">
          <BookOpen className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700 animate-pulse" />
          <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">No guides matching filters</h3>
          <p className="text-xs max-w-xs mt-1 leading-relaxed">
            We couldn't find any articles matching your search phrase or tag selections. Try resetting filters.
          </p>
          <Link
            href="/blog"
            className="mt-5 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Clear Filters
          </Link>
        </div>
      ) : (
        <div className="space-y-12 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedBlogs.map(blog => (
              <article
                key={blog.id}
                className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Visual Cover image banner */}
                <div className="h-48 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden border-b border-zinc-100 dark:border-zinc-800/40">
                  {blog.featuredImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={blog.featuredImage} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                      loading="lazy" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                      <BookOpen className="w-10 h-10" />
                    </div>
                  )}
                </div>

                {/* Article Info details */}
                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    
                    {/* Timestamp & Metadata badges */}
                    <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-violet-500" />
                        {new Date(blog.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-violet-500" />
                        {blog.readTime || 5} min read
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">
                      <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                    </h3>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {blog.excerpt}
                    </p>
                  </div>

                  {/* Authorship & CTA footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-150 dark:border-zinc-805">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black text-zinc-450 uppercase tracking-widest block">Author</span>
                      <span className="text-[10px] font-extrabold text-zinc-700 dark:text-zinc-350">{blog.authorId.split('@')[0]}</span>
                    </div>

                    <Link 
                      href={`/blog/${blog.slug}`} 
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 group/link"
                    >
                      Read Post
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                    </Link>
                  </div>

                </div>

              </article>
            ))}
          </div>

          {/* 4. Dynamic Paging controls */}
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
                    className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Previous
                  </Link>
                ) : (
                  <button 
                    disabled 
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200/30 dark:border-zinc-80/30 rounded-xl text-xs font-bold text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Previous
                  </button>
                )}

                {/* Next Button */}
                {currentPage < totalPages ? (
                  <Link 
                    href={getFilterUrl({ page: currentPage + 1 })}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button 
                    disabled 
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200/30 dark:border-zinc-80/30 rounded-xl text-xs font-bold text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
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
  );
}
