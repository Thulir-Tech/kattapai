'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';
import { Product, Category } from '@/types';

interface FeaturedCarouselProps {
  products: Product[];
  categories: Category[];
}

export default function FeaturedCarousel({ products, categories }: FeaturedCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      
      scrollContainerRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 relative group/carousel">
      {/* Title / Controls */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Sparkles className="w-5 h-5 text-violet-500 animate-pulse" />
            Curated featured picks
          </h2>
          <p className="text-xs text-zinc-400">Our absolute top recommended items, analyzed and reviewed.</p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Snap Track */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 scroll-smooth"
      >
        {products.map((product) => {
          const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'Unassigned';
          
          return (
            <div
              key={product.id}
              className="w-[280px] sm:w-[320px] shrink-0 snap-start bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              {/* Product Cover image */}
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
                <div className="absolute top-4 left-4 bg-violet-600 px-2.5 py-1 rounded-full text-[9px] font-bold text-white uppercase tracking-wider">
                  {categoryName}
                </div>
              </div>

              {/* Product details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 truncate" title={product.title}>
                    {product.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>


                {/* CTA Link details (NO PRICES!) */}
                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/40 pt-4">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Featured Pick</span>
                  <Link 
                    href={`/product/${product.slug}`} 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold hover:bg-violet-500 hover:text-white transition-colors cursor-pointer"
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
    </div>
  );
}
