'use client';

import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

interface ImageGalleryProps {
  mainImage: string;
  images: string[];
}

export default function ImageGallery({ mainImage, images = [] }: ImageGalleryProps) {
  // Combine mainImage and gallery images into a single array
  const allImages = [mainImage, ...images].filter(Boolean);
  const [activeImage, setActiveImage] = useState<string>(allImages[0] || '');

  if (allImages.length === 0) {
    return (
      <div className="h-72 sm:h-96 w-full rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center text-zinc-300">
        <ShoppingBag className="w-12 h-12 mb-2" />
        <span className="text-xs uppercase font-bold tracking-wider">No cover assets</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary Display Viewport */}
      <div className="h-[280px] sm:h-[400px] w-full rounded-3xl bg-zinc-100 dark:bg-zinc-800/40 relative overflow-hidden flex items-center justify-center border border-zinc-200/50 dark:border-zinc-800/40 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={activeImage} 
          alt="Product details" 
          className="w-full h-full object-cover transition-all duration-300"
        />
      </div>

      {/* Thumbnail Strips Strip Panel */}
      {allImages.length > 1 && (
        <div className="flex flex-wrap gap-3.5 pt-1">
          {allImages.map((img, idx) => {
            const isActive = activeImage === img;
            return (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all bg-zinc-50 ${
                  isActive 
                    ? 'border-violet-600 scale-102 shadow-sm' 
                    : 'border-zinc-200/60 dark:border-zinc-800/60 opacity-60 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
