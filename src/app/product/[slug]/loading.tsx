import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 animate-fadeIn">
      
      {/* 1. Breadcrumbs Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
        <div className="h-3 w-3 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
        <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
        <div className="h-3 w-3 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
        <div className="h-4.5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
        <div className="h-3 w-3 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
        <div className="h-4.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
      </div>

      {/* 2. Overview Layout Grid (Image left, CTA right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Image Skeleton */}
        <div className="lg:col-span-7 space-y-6">
          <div className="h-[320px] sm:h-[400px] w-full rounded-[32px] bg-zinc-200 dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 animate-pulse flex items-center justify-center text-zinc-300 dark:text-zinc-700">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <div className="flex gap-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-900 animate-pulse shrink-0 border border-zinc-200/40 dark:border-zinc-800/40" />
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-900 animate-pulse shrink-0 border border-zinc-200/40 dark:border-zinc-800/40" />
          </div>
        </div>

        {/* Right Column: CTA Panel Skeleton */}
        <div className="lg:col-span-5 space-y-6 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-6 sm:p-8 rounded-[32px] shadow-sm">
          <div className="space-y-4">
            <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
            <div className="h-8 w-[85%] bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
            <div className="h-8 w-[50%] bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800/40 pt-4 flex gap-2">
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
            <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
          </div>

          <div className="pt-4 space-y-4">
            <div className="w-full h-14 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse flex items-center justify-center">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-650 flex items-center gap-1.5">
                Fetching Best Affiliate Match...
                <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
              </span>
            </div>
            <div className="h-3 w-[75%] mx-auto bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800/40 pt-6 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse shrink-0" />
              <div className="h-4 w-44 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse shrink-0" />
              <div className="h-4 w-52 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
            </div>
          </div>
        </div>

      </div>

      {/* 3. Overview Paragraph Block Skeleton */}
      <section className="bg-white dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800/80 p-6 sm:p-8 rounded-[32px] space-y-4">
        <div className="h-6 w-56 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
        <div className="space-y-2.5 pt-2">
          <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
          <div className="h-4 w-[95%] bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
          <div className="h-4 w-[98%] bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
          <div className="h-4 w-[85%] bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
        </div>
      </section>

    </div>
  );
}
