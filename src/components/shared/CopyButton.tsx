'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  url: string;
}

export default function CopyButton({ url }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:bg-zinc-50 dark:text-zinc-350 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-500" />
          <span>Copied Link!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 text-violet-500" />
          <span>Copy Link</span>
        </>
      )}
    </button>
  );
}
