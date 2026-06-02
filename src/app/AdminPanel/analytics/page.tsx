'use client';

import React, { useState } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { 
  TrendingUp, 
  ShoppingBag, 
  MousePointerClick, 
  DollarSign, 
  Calendar, 
  Loader2, 
  AlertCircle,
  Database,
  RefreshCw,
  FolderTree,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { AnalyticsService, AnalyticsDashboardData } from '@/services/analytics.service';
import { ProductService } from '@/services/product.service';
import { CategoryService } from '@/services/category.service';

const queryClient = new QueryClient();

export default function AnalyticsDashboardWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsDashboardPage />
    </QueryClientProvider>
  );
}

function AnalyticsDashboardPage() {
  const queryClient = useQueryClient();
  const [daysRange, setDaysRange] = useState<number>(7);
  const [seedingStatus, setSeedingStatus] = useState<string | null>(null);

  // Queries
  const { data: analyticsData, isLoading, isError, error, refetch, isRefetching } = useQuery<AnalyticsDashboardData>({
    queryKey: ['analytics', daysRange],
    queryFn: () => AnalyticsService.getDashboardAnalytics(daysRange),
    refetchInterval: 3000, // Background updates every 3 seconds to ensure real-time analytics
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: ProductService.getAllProducts,
  });

  // Mutate: Seed Mock click records
  const seedMockDataMutation = useMutation({
    mutationFn: async () => {
      setSeedingStatus('Initializing database seeder...');
      if (products.length === 0) {
        throw new Error('Please create at least one product in your Catalogue before seeding analytics.');
      }

      const categories = await CategoryService.getAllCategories();
      if (categories.length === 0) {
        throw new Error('Please create at least one category before seeding analytics.');
      }

      setSeedingStatus('Generating click logs for the past 14 days...');
      
      const mockUserAgents = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      ];
      const mockReferrers = [
        'https://www.google.com/',
        'https://t.co/easykart-recommend',
        'https://www.youtube.com/tech-reviews',
        'https://news.ycombinator.com/',
        'https://www.reddit.com/r/mechanicalkeyboards',
        '' // Direct
      ];
      
      // Let's seed between 45 and 90 clicks distributed over the last 14 days
      const totalClicksToSeed = Math.floor(Math.random() * 45) + 45;
      
      for (let i = 0; i < totalClicksToSeed; i++) {
        // Pick a random product
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        // Pick a random day in the past 14 days
        const daysAgo = Math.floor(Math.random() * 14);
        const clickTime = new Date();
        clickTime.setDate(clickTime.getDate() - daysAgo);
        // Random hour
        clickTime.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

        const clickPayload = {
          productId: randomProduct.id,
          affiliateLink: randomProduct.affiliateLink,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
          userAgent: mockUserAgents[Math.floor(Math.random() * mockUserAgents.length)],
          referrer: mockReferrers[Math.floor(Math.random() * mockReferrers.length)],
          userId: Math.random() > 0.8 ? `user_${Math.random().toString(36).substring(4, 9)}` : null
        };

        // Write directly to Firestore with simulated timestamps
        await AnalyticsService.logAffiliateClick(clickPayload);
        
        // Wait 30ms to prevent high-frequency write burst limits
        await new Promise(r => setTimeout(r, 30));
        
        if (i % 15 === 0) {
          setSeedingStatus(`Seeded ${i} of ${totalClicksToSeed} click records...`);
        }
      }

      setSeedingStatus('Finalizing indices...');
    },
    onSuccess: () => {
      setSeedingStatus('Mock clicks database seeded successfully!');
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setTimeout(() => setSeedingStatus(null), 3000);
    },
    onError: (err: any) => {
      alert(err.message || 'Seeding failed.');
      setSeedingStatus(null);
    }
  });

  const handleSeedMockData = () => {
    if (confirm('This will seed dozens of premium click logs distributed randomly across the last 14 days into your Firestore collection. Proceed?')) {
      seedMockDataMutation.mutate();
    }
  };

  // -------------------------------------------------------------
  // RENDER STATS COMPUTATIONS (FALLBACK INCLUDED)
  // -------------------------------------------------------------
  const stats = {
    totalClicks: analyticsData?.totalClicks || 0,
    topProduct: analyticsData?.topProducts?.[0]?.productTitle || 'None configured',
    topCategory: analyticsData?.topCategories?.[0]?.categoryName || 'None configured',
    estimatedEPC: (analyticsData?.totalClicks || 0) * 0.48 // Simulated earnings per click rate
  };

  // -------------------------------------------------------------
  // NATIVE HIGH-FIDELITY SVG CHART PREPARATION
  // -------------------------------------------------------------
  
  // 1. Line Chart Calculations: Daily Clicks Trends
  const trendPoints = analyticsData?.dailyTrends || [];
  const maxTrendClicks = Math.max(...trendPoints.map(p => p.clicks), 5); // Fallback ceiling of 5
  
  // SVG Grid Dimensions
  const lineChartWidth = 600;
  const lineChartHeight = 240;
  const linePadding = 35;
  
  const lineCoordinates = trendPoints.map((point, index) => {
    const x = linePadding + (index * (lineChartWidth - 2 * linePadding)) / Math.max(1, trendPoints.length - 1);
    const y = lineChartHeight - linePadding - (point.clicks / maxTrendClicks) * (lineChartHeight - 2 * linePadding);
    return { x, y, label: point.date.split('-').slice(1).join('/'), value: point.clicks };
  });

  // Polyline coordinates string
  const polylinePointsStr = lineCoordinates.map(c => `${c.x},${c.y}`).join(' ');
  
  // Curved Path Builder (Cubic Bezier curve approximation)
  let linePathD = '';
  let areaPathD = '';
  if (lineCoordinates.length > 0) {
    linePathD = `M ${lineCoordinates[0].x} ${lineCoordinates[0].y}`;
    for (let i = 0; i < lineCoordinates.length - 1; i++) {
      const curr = lineCoordinates[i];
      const next = lineCoordinates[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const cpY2 = next.y;
      linePathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    
    // Close the area path for the gradient fill
    const firstX = lineCoordinates[0].x;
    const lastX = lineCoordinates[lineCoordinates.length - 1].x;
    const bottomY = lineChartHeight - linePadding;
    areaPathD = `${linePathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }

  // 2. Donut Chart Calculations: Category Click Split
  const categorySplit = analyticsData?.topCategories || [];
  const totalCategoryClicks = categorySplit.reduce((sum, item) => sum + item.clicks, 0) || 1;
  
  // Compute donut segment angles
  let accumulatedPercent = 0;
  const donutSegments = categorySplit.map((cat, idx) => {
    const percent = cat.clicks / totalCategoryClicks;
    const startAngle = accumulatedPercent * 360;
    accumulatedPercent += percent;
    const endAngle = accumulatedPercent * 360;
    
    // Define a premium HSL color mapping for visual variety
    const colors = [
      'stroke-violet-500', 
      'stroke-indigo-500', 
      'stroke-emerald-500', 
      'stroke-amber-500', 
      'stroke-pink-500', 
      'stroke-sky-500'
    ];
    const fillColors = [
      'bg-violet-500', 
      'bg-indigo-500', 
      'bg-emerald-500', 
      'bg-amber-500', 
      'bg-pink-500', 
      'bg-sky-500'
    ];
    
    return {
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      clicks: cat.clicks,
      percent: Math.round(percent * 100),
      startAngle,
      endAngle,
      colorClass: colors[idx % colors.length],
      bgColorClass: fillColors[idx % fillColors.length]
    };
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
            Affiliate Analytics
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Track user conversion pipelines, high-converting categories, and click logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Days selector */}
          <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 text-xs font-semibold">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setDaysRange(days)}
                disabled={isLoading || seedMockDataMutation.isPending}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  daysRange === days 
                    ? 'bg-violet-600 text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
            title="Reload Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>

          {/* Database Seeder */}
          <button
            onClick={handleSeedMockData}
            disabled={isLoading || seedMockDataMutation.isPending || products.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700/30"
          >
            <Database className="w-4 h-4" />
            Seed Clicks
          </button>
        </div>
      </div>

      {/* Seeding Loading Banner */}
      {(seedMockDataMutation.isPending || seedingStatus) && (
        <div className="flex items-center gap-4 bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 p-4 rounded-2xl text-xs font-bold animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{seedingStatus || 'Seeding Firestore clicks collection...'}</span>
        </div>
      )}

      {/* KPI Summary Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Failed to compile click statistics: {(error as any)?.message || 'Check connection'}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Click Logs */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl shadow-sm flex items-center justify-between group hover:border-violet-500/40 transition-colors">
            <div className="space-y-1.5 overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Total Click Logs</span>
              <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 truncate">{stats.totalClicks}</h2>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-semibold"><Sparkles className="w-3.5 h-3.5 text-violet-500" /> Active trackers</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
              <MousePointerClick className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
            </div>
          </div>

          {/* Card 2: Simulated EPC Earnings */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl shadow-sm flex items-center justify-between group hover:border-violet-500/40 transition-colors">
            <div className="space-y-1.5 overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Simulated Earnings</span>
              <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 truncate">${stats.estimatedEPC.toFixed(2)}</h2>
              <span className="text-[10px] text-zinc-400 font-semibold">EPC Rate: $0.48 / click</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <DollarSign className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
            </div>
          </div>

          {/* Card 3: Top Active Product */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl shadow-sm flex items-center justify-between group hover:border-violet-500/40 transition-colors">
            <div className="space-y-1.5 overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Top Performer</span>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 truncate max-w-[150px]" title={stats.topProduct}>
                {stats.topProduct}
              </h2>
              <span className="text-[10px] text-zinc-400 block font-semibold">Highest conversion rate</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ShoppingBag className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
            </div>
          </div>

          {/* Card 4: Top Category */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl shadow-sm flex items-center justify-between group hover:border-violet-500/40 transition-colors">
            <div className="space-y-1.5 overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Leading Category</span>
              <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 truncate max-w-[150px]" title={stats.topCategory}>
                {stats.topCategory}
              </h2>
              <span className="text-[10px] text-zinc-400 block font-semibold">Top vertical share</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <FolderTree className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
            </div>
          </div>
        </div>
      )}

      {/* Main Charts Viewport (Double columns) */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart 1: Daily Clicks Trends Curve (Span 2) */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl shadow-sm lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-base text-zinc-800 dark:text-zinc-200">Daily Click Trends</h3>
                <p className="text-[10px] text-zinc-400">Visitor click velocity aggregated daily over past {daysRange} days.</p>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-500/5 border border-violet-500/10 px-2 py-0.5 rounded-md">
                Live Sparkline
              </span>
            </div>

            {/* SVG Sparkline viewport wrapper */}
            {trendPoints.length === 0 ? (
              <div className="h-[240px] flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/50 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                <Info className="w-8 h-8 mb-2 text-zinc-300 dark:text-zinc-700 animate-pulse" />
                <span className="text-xs uppercase font-bold tracking-wider">No trend data logged yet</span>
                <span className="text-[10px] text-zinc-400 mt-1 max-w-[200px] text-center">Click "Seed Clicks" to instantly generate detailed visual simulations.</span>
              </div>
            ) : (
              <div className="w-full overflow-hidden">
                <svg 
                  viewBox={`0 0 ${lineChartWidth} ${lineChartHeight}`} 
                  className="w-full h-auto text-zinc-400 dark:text-zinc-600 select-none"
                >
                  <defs>
                    {/* Glowing neon stroke drop shadow */}
                    <filter id="neonGlow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#8b5cf6" floodOpacity="0.3" />
                    </filter>
                    
                    {/* Area curve bottom fill gradient */}
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = linePadding + ratio * (lineChartHeight - 2 * linePadding);
                    const gridVal = Math.round(maxTrendClicks - ratio * maxTrendClicks);
                    return (
                      <g key={ratio} className="opacity-40">
                        <line 
                          x1={linePadding} 
                          y1={y} 
                          x2={lineChartWidth - linePadding} 
                          y2={y} 
                          stroke="currentColor" 
                          strokeWidth="0.5" 
                          strokeDasharray="4"
                        />
                        <text 
                          x={linePadding - 8} 
                          y={y + 3} 
                          className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 fill-current text-right"
                          textAnchor="end"
                        >
                          {gridVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill under curve */}
                  {areaPathD && (
                    <path d={areaPathD} fill="url(#areaGradient)" />
                  )}

                  {/* Bezier glow path */}
                  {linePathD && (
                    <path 
                      d={linePathD} 
                      fill="none" 
                      stroke="#8b5cf6" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                      filter="url(#neonGlow)"
                    />
                  )}

                  {/* Hover interactive circle nodes */}
                  {lineCoordinates.map((pt, idx) => (
                    <g key={idx} className="group/node cursor-pointer">
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r="3.5" 
                        className="fill-white dark:fill-zinc-950 stroke-violet-500 stroke-2 hover:r-5 transition-all duration-100" 
                      />
                      {/* Tooltip value block */}
                      <g className="opacity-0 group-hover/node:opacity-100 transition-opacity duration-200">
                        <rect 
                          x={pt.x - 22} 
                          y={pt.y - 28} 
                          width="44" 
                          height="18" 
                          rx="5" 
                          className="fill-zinc-900 dark:fill-white shadow-md" 
                        />
                        <text 
                          x={pt.x} 
                          y={pt.y - 16} 
                          className="text-[9px] font-mono font-extrabold fill-white dark:fill-zinc-900 text-center"
                          textAnchor="middle"
                        >
                          {pt.value}
                        </text>
                      </g>
                      
                      {/* X Axis Labels */}
                      {idx % Math.max(1, Math.floor(trendPoints.length / 7)) === 0 && (
                        <text 
                          x={pt.x} 
                          y={lineChartHeight - linePadding + 14} 
                          className="text-[8px] font-bold fill-zinc-400 dark:fill-zinc-500 text-center"
                          textAnchor="middle"
                        >
                          {pt.label}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>
            )}
          </div>

          {/* Chart 2: Category Split Donut Chart (Span 1) */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-base text-zinc-800 dark:text-zinc-200">Category split</h3>
              <p className="text-[10px] text-zinc-400">Total clicks share parsed by catalog groupings.</p>
            </div>

            {categorySplit.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-zinc-400">
                <FolderTree className="w-8 h-8 mb-2 text-zinc-300 dark:text-zinc-700 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">No categories logged</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-6 py-2">
                {/* SVG Donut */}
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 select-none">
                    <circle cx="50" cy="50" r="40" className="stroke-zinc-100 dark:stroke-zinc-800/30 fill-transparent stroke-[12]" />
                    {donutSegments.map((seg, idx) => {
                      const radius = 40;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDasharray = `${(seg.percent / 100) * circumference} ${circumference}`;
                      
                      // Calculate offset angle
                      let offsetAngle = 0;
                      for (let i = 0; i < idx; i++) {
                        offsetAngle += donutSegments[i].percent;
                      }
                      const strokeDashoffset = - (offsetAngle / 100) * circumference;

                      return (
                        <circle
                          key={seg.categoryId}
                          cx="50"
                          cy="50"
                          r={radius}
                          className={`fill-transparent stroke-[12.5] stroke-linecap-round hover:stroke-[14] transition-all duration-200 ${seg.colorClass}`}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-zinc-400">Clicks</span>
                    <span className="text-xl font-black text-zinc-800 dark:text-zinc-100 leading-none">{totalCategoryClicks}</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="w-full space-y-2 max-h-36 overflow-y-auto pr-1">
                  {donutSegments.slice(0, 4).map((seg) => (
                    <div key={seg.categoryId} className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${seg.bgColorClass}`} />
                        <span className="text-zinc-600 dark:text-zinc-300 truncate max-w-[120px]" title={seg.categoryName}>{seg.categoryName}</span>
                      </div>
                      <span className="text-zinc-400 font-mono text-[10px]">{seg.percent}% ({seg.clicks})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart 3: Most Clicked Products Horizontal Bars Table */}
      {!isLoading && !isError && (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-base text-zinc-800 dark:text-zinc-200">Most Clicked Products</h3>
            <p className="text-[10px] text-zinc-400">List of top 5 Amazon items ranked by click logging frequency.</p>
          </div>

          {(analyticsData?.topProducts || []).length === 0 ? (
            <div className="h-44 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-400">
              <ShoppingBag className="w-8 h-8 mb-2 text-zinc-300 dark:text-zinc-700 animate-pulse" />
              <span className="text-xs uppercase font-bold tracking-wider">No product clicks tracked yet</span>
            </div>
          ) : (
            <div className="space-y-5">
              {(analyticsData?.topProducts || []).map((prod, idx) => {
                const maxVal = Math.max(...(analyticsData?.topProducts || []).map(p => p.clicks), 1);
                const percentVal = Math.round((prod.clicks / maxVal) * 100);
                
                // Color spectrum progression based on rank index
                const barColors = [
                  'from-violet-600 to-indigo-600',
                  'from-indigo-500 to-sky-500',
                  'from-emerald-500 to-teal-500',
                  'from-amber-500 to-orange-500',
                  'from-pink-500 to-rose-500'
                ];
                
                return (
                  <div key={prod.productId} className="space-y-1.5">
                    {/* Bar details label */}
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="w-5 h-5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center font-mono text-[10px] shrink-0 border border-zinc-200 dark:border-zinc-700">
                          #{idx + 1}
                        </span>
                        <span className="text-zinc-700 dark:text-zinc-200 truncate max-w-[280px] sm:max-w-md md:max-w-xl" title={prod.productTitle}>
                          {prod.productTitle}
                        </span>
                      </div>
                      <span className="font-mono text-zinc-400 flex items-center gap-1.5 shrink-0">
                        {prod.clicks} clicks
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="h-4 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-zinc-200/40 dark:border-zinc-800/40 relative">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${barColors[idx % barColors.length]} transition-all duration-500`}
                        style={{ width: `${percentVal}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
