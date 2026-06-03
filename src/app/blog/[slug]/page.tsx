import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  Share2, 
  FolderOpen,
  Sparkles
} from 'lucide-react';
import CopyButton from '@/components/shared/CopyButton';
import { BlogService } from '@/services/blog.service';
import { CategoryService } from '@/services/category.service';
import { Blog, Category } from '@/types';

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60; // Revalidate blog cache every minute

/**
 * Dynamic Next.js Metadata API generation for Blog Details.
 */
export async function generateMetadata(props: BlogDetailPageProps): Promise<Metadata> {
  const params = await props.params;
  const slug = params.slug;

  try {
    const blog = await BlogService.getBlogBySlug(slug);
    if (!blog || blog.status !== 'published') {
      return { title: 'Article Not Found | EasyKart' };
    }
    return {
      title: `${blog.title} | EasyKart Buying Guide`,
      description: blog.excerpt.slice(0, 160),
      openGraph: {
        title: blog.title,
        description: blog.excerpt,
        images: blog.featuredImage ? [{ url: blog.featuredImage }] : [],
        type: 'article',
        publishedTime: blog.createdAt,
        authors: [blog.authorId]
      },
      twitter: {
        card: 'summary_large_image',
        title: blog.title,
        description: blog.excerpt,
        images: blog.featuredImage ? [blog.featuredImage] : []
      }
    };
  } catch (e) {
    return { title: 'Blog Article | EasyKart' };
  }
}

export default async function BlogDetailPage(props: BlogDetailPageProps) {
  const params = await props.params;
  const slug = params.slug;

  let blog: Blog | null = null;
  let categories: Category[] = [];

  try {
    const [fetchedBlog, fetchedCategories] = await Promise.all([
      BlogService.getBlogBySlug(slug),
      CategoryService.getAllCategories()
    ]);
    blog = fetchedBlog;
    categories = fetchedCategories;
  } catch (e) {
    console.error('Failed loading server-side blog detail inputs:', e);
  }

  // 404 Guard
  if (!blog || blog.status !== 'published') {
    notFound();
  }

  // Reading time safety fallback
  const wordsCount = blog.content ? blog.content.split(/\s+/).length : 0;
  const computedReadTime = blog.readTime || Math.max(1, Math.ceil(wordsCount / 200));

  // Fetch Category Info
  const blogCategoryNames = categories
    .filter(cat => blog?.categoryIds?.includes(cat.id))
    .map(cat => cat.name);

  // Fetch Related Articles (from same categories/tags, excluding current blog)
  let allBlogs: Blog[] = [];
  let relatedBlogs: Blog[] = [];
  try {
    allBlogs = await BlogService.getAllBlogs();
    const currentId = blog.id;
    const currentCategories = blog.categoryIds || [];
    const currentTags = blog.tagIds || [];

    relatedBlogs = allBlogs
      .filter(b => b.id !== currentId && b.status === 'published')
      .filter(b => {
        const catMatch = (b.categoryIds || []).some(cid => currentCategories.includes(cid));
        const tagMatch = (b.tagIds || []).some(tid => currentTags.includes(tid));
        return catMatch || tagMatch;
      })
      .slice(0, 3);

    // Fallback if no matching related blogs: get newest published blogs
    if (relatedBlogs.length === 0) {
      relatedBlogs = allBlogs
        .filter(b => b.id !== currentId && b.status === 'published')
        .slice(0, 3);
    }
  } catch (e) {
    console.error('Failed retrieving related blog suggestions:', e);
  }

  // Social Share Paths (Outbound URL builders)
  // Since we are running dynamically, we construct relative or absolute paths.
  const host = 'https://easykart.example.com'; // Fallback domain
  const shareUrl = `${host}/blog/${blog.slug}`;
  const shareText = blog.title;

  const twitterShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  // Structured JSON-LD Data for SEO Articles
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "description": blog.excerpt,
    "image": blog.featuredImage || '',
    "datePublished": blog.createdAt,
    "dateModified": blog.updatedAt || blog.createdAt,
    "author": {
      "@type": "Person",
      "name": blog.authorId.split('@')[0]
    },
    "publisher": {
      "@type": "Organization",
      "name": "EasyKart",
      "logo": {
        "@type": "ImageObject",
        "url": `${host}/favicon.ico`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": shareUrl
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
      
      {/* 1. Dynamic JSON-LD SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 2. Page Navigation Header */}
      <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800 pb-4 shrink-0">
        <Link 
          href="/blog" 
          className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-650 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Articles
        </Link>

        {blogCategoryNames.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-wider">
            <FolderOpen className="w-3.5 h-3.5" />
            {blogCategoryNames[0]}
          </span>
        )}
      </div>

      {/* 3. Article Hero Details */}
      <header className="space-y-6 text-center md:text-left">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
          {blog.title}
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs font-bold text-zinc-450 uppercase tracking-wider">
          <div className="flex items-center justify-center md:justify-start gap-1.5">
            <Calendar className="w-4 h-4 text-violet-500" />
            <span>Published on {new Date(blog.createdAt).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}</span>
          </div>
          <span className="hidden sm:inline text-zinc-300">|</span>
          <div className="flex items-center justify-center md:justify-start gap-1.5">
            <Clock className="w-4 h-4 text-violet-500" />
            <span>{computedReadTime} min read duration</span>
          </div>
        </div>
      </header>

      {/* 4. Featured Banner Cover */}
      {blog.featuredImage && (
        <div className="relative h-[300px] sm:h-[400px] rounded-[32px] overflow-hidden border border-zinc-200 dark:border-zinc-800/80 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={blog.featuredImage} 
            alt={blog.title} 
            className="w-full h-full object-cover" 
            loading="eager"
          />
        </div>
      )}

      {/* 5. Article Layout Grid (Left: content, Right: social widget) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Content Block (Span 9) */}
        <main className="lg:col-span-9 bg-white dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800/80 p-6 sm:p-10 rounded-[32px] shadow-sm">
          {/* Safely inject the rich text editor output using custom visual guidelines */}
          <div 
            className="prose prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm font-medium space-y-6
              [&_p]:leading-relaxed [&_p]:font-medium
              [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-zinc-900 [&_h1]:dark:text-zinc-50 [&_h1]:mt-8 [&_h1]:mb-4
              [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-zinc-900 [&_h2]:dark:text-zinc-50 [&_h2]:mt-6 [&_h2]:mb-4
              [&_h3]:text-lg [&_h3]:font-extrabold [&_h3]:text-zinc-900 [&_h3]:dark:text-zinc-50 [&_h3]:mt-6 [&_h3]:mb-3
              [&_strong]:font-extrabold [&_strong]:text-zinc-900 [&_strong]:dark:text-white
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:my-4 [&_ul_li]:leading-normal
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_ol]:my-4 [&_ol_li]:leading-normal
              [&_blockquote]:border-l-4 [&_blockquote]:border-violet-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_blockquote]:dark:text-zinc-400 [&_blockquote]:my-6
              [&_pre]:bg-zinc-50 [&_pre]:dark:bg-zinc-950 [&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-zinc-200 [&_pre]:dark:border-zinc-800 [&_pre]:my-6
              [&_code]:font-mono [&_code]:text-xs [&_code]:bg-zinc-100 [&_code]:dark:bg-zinc-900 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-violet-600 [&_code]:dark:text-violet-400
              [&_img]:rounded-2xl [&_img]:border [&_img]:border-zinc-100 [&_img]:dark:border-zinc-800 [&_img]:shadow-sm [&_img]:my-6"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Tags Footer pills list */}
          {blog.tagIds && blog.tagIds.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-10 border-t border-zinc-100 dark:border-zinc-800/40 mt-10">
              {blog.tagIds.map(t => (
                <Link
                  key={t}
                  href={`/blog?tag=${encodeURIComponent(t)}`}
                  className="px-3 py-1 bg-zinc-55 hover:bg-zinc-100 dark:bg-zinc-805 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-450 rounded-full capitalize transition-colors"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </main>

        {/* Social sharing Sidebar Widgets (Span 3) */}
        <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
          
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-violet-500" />
              Share Guide
            </h4>

            <div className="flex flex-col gap-2.5">
              {/* Twitter / X */}
              <a
                href={twitterShare}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:bg-zinc-50 dark:text-zinc-350 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <svg className="w-4 h-4 text-zinc-955 dark:text-white fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on X
              </a>

              {/* Facebook */}
              <a
                href={facebookShare}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:bg-zinc-50 dark:text-zinc-350 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <svg className="w-4 h-4 text-[#1877F2] fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </a>

              {/* LinkedIn */}
              <a
                href={linkedinShare}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:bg-zinc-50 dark:text-zinc-350 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <svg className="w-4 h-4 text-[#0A66C2] fill-current" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>

              {/* Copy URL Client Button */}
              <CopyButton url={shareUrl} />
            </div>
          </div>

          <div className="bg-violet-500/5 border border-violet-500/10 p-6 rounded-3xl space-y-2.5 text-xs text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
            <span className="font-extrabold text-violet-600 dark:text-violet-400 flex items-center gap-1">
              <BookOpen className="w-4 h-4 shrink-0" />
              EasyKart Advice
            </span>
            <p>Our buying guides analyze mechanical features, hardware profiles, and review patterns to deliver unbiased recommendations.</p>
          </div>

        </aside>

      </div>

      {/* 6. Related Articles Grid */}
      {relatedBlogs.length > 0 && (
        <section className="space-y-6 pt-10 border-t border-zinc-200/60 dark:border-zinc-800/80">
          <h3 className="font-extrabold text-lg text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500 animate-pulse" />
            Related recommendations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedBlogs.map((b) => (
              <div 
                key={b.id}
                className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Cover Image */}
                <div className="h-40 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden flex items-center justify-center border-b border-zinc-100 dark:border-zinc-800/40">
                  {b.featuredImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.featuredImage} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102" loading="lazy" />
                  ) : (
                    <div className="text-zinc-300"><BookOpen className="w-8 h-8" /></div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{b.readTime || 5} min read</span>
                    <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug group-hover:text-violet-550 transition-colors" title={b.title}>
                      <Link href={`/blog/${b.slug}`}>{b.title}</Link>
                    </h4>
                  </div>

                  <div className="flex items-center justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800/40 mt-3">
                    <Link 
                      href={`/blog/${b.slug}`}
                      className="text-xs font-bold text-violet-500 hover:text-violet-600 flex items-center gap-0.5 group/link"
                    >
                      Read Guide
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
