'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  FolderTree, 
  BookOpen, 
  MousePointerClick, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Activity,
  Plus,
  ArrowRight,
  Loader2,
  Sparkles,
  Info
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product, Category, Blog, AffiliateClick } from '@/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  
  // Real-time Collections States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [clicks, setClicks] = useState<AffiliateClick[]>([]);
  
  // Loading State
  const [loading, setLoading] = useState(true);
  
  // Chart Hover Node Tooltip State
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number; label: string } | null>(null);

  // 1. Subscribe to Firestore Collections in Real-time
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(items);
    });

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const items: Category[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(items);
    });

    const unsubBlogs = onSnapshot(collection(db, 'blogs'), (snapshot) => {
      const items: Blog[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Blog);
      });
      setBlogs(items);
    });

    const unsubClicks = onSnapshot(
      query(collection(db, 'affiliate_clicks'), orderBy('timestamp', 'desc')), 
      (snapshot) => {
        const items: AffiliateClick[] = [];
        snapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() } as AffiliateClick);
        });
        setClicks(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to clicks collection:', err);
        setLoading(false);
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      unsubProducts();
      unsubCategories();
      unsubBlogs();
      unsubClicks();
    };
  }, []);

  // 2. Compute KPI Metrics
  const activeProductsCount = products.filter(p => p.status === 'active').length;
  const publishedBlogsCount = blogs.filter(b => b.status === 'published').length;

  const topProductRank = () => {
    if (clicks.length === 0) return 'None tracked';
    const counts: Record<string, number> = {};
    clicks.forEach(c => {
      counts[c.productId] = (counts[c.productId] || 0) + 1;
    });
    const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!topEntry) return 'None tracked';
    return products.find(p => p.id === topEntry[0])?.title || 'Unknown Product';
  };

  const topCategoryRank = () => {
    if (clicks.length === 0) return 'None tracked';
    const counts: Record<string, number> = {};
    clicks.forEach(c => {
      const product = products.find(p => p.id === c.productId);
      if (product && product.categoryId) {
        counts[product.categoryId] = (counts[product.categoryId] || 0) + 1;
      }
    });
    const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!topEntry) return 'None tracked';
    return categories.find(c => c.id === topEntry[0])?.name || 'Unknown Category';
  };

  const kpis = [
    {
      title: 'Active Products',
      value: activeProductsCount.toString(),
      subtext: `Out of ${products.length} catalogued`,
      icon: ShoppingBag,
      color: 'from-violet-500 to-fuchsia-500',
      shadowColor: 'rgba(139,92,246,0.2)'
    },
    {
      title: 'Active Categories',
      value: categories.length.toString(),
      subtext: 'Structuring catalog verticals',
      icon: FolderTree,
      color: 'from-blue-500 to-cyan-500',
      shadowColor: 'rgba(59,130,246,0.2)'
    },
    {
      title: 'Published Articles',
      value: publishedBlogsCount.toString(),
      subtext: `Out of ${blogs.length} written guides`,
      icon: BookOpen,
      color: 'from-emerald-500 to-teal-500',
      shadowColor: 'rgba(16,185,129,0.2)'
    },
    {
      title: 'Affiliate Clicks',
      value: clicks.length.toLocaleString(),
      subtext: 'Conversion clicks tracked live',
      icon: MousePointerClick,
      color: 'from-amber-500 to-orange-500',
      shadowColor: 'rgba(245,158,11,0.2)'
    }
  ];

  // 3. Compute dynamic Click Trends (Last 7 Days)
  const getWeeklyTrendData = () => {
    const daysName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendData: { label: string; value: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = daysName[d.getDay()];
      const dateString = d.toISOString().split('T')[0];
      
      const count = clicks.filter(c => c.timestamp && c.timestamp.startsWith(dateString)).length;
      trendData.push({ label: dayLabel, value: count });
    }
    return trendData;
  };

  const trendData = getWeeklyTrendData();
  const maxTrendClicks = Math.max(...trendData.map(t => t.value), 5); // Fallback scale ceiling of 5

  // SVG Chart Geometry Calculations
  const chartHeight = 220;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 20;

  const points = trendData.map((d, index) => {
    const x = paddingX + (index * (chartWidth - paddingX * 2)) / (trendData.length - 1);
    const y = chartHeight - paddingY - (d.value / maxTrendClicks) * (chartHeight - paddingY * 2);
    return { x, y, value: d.value, label: d.label };
  });

  // Smooth Bezier Curve Path Builder
  let linePath = '';
  let fillPath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const cpY2 = next.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    fillPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
  }

  // 4. Compute Real-time Activity Logs (Latest 5 clicks or updates)
  const getRecentActivities = () => {
    const logs: { id: string; type: 'product' | 'blog' | 'click' | 'settings'; message: string; time: string }[] = [];
    
    // Sort clicks by timestamp desc and take latest 4
    clicks.slice(0, 4).forEach(click => {
      const product = products.find(p => p.id === click.productId);
      const productName = product ? product.title : `Product ID: ${click.productId.slice(0, 6)}...`;
      
      let relativeTime = 'Just now';
      if (click.timestamp) {
        const diffMs = new Date().getTime() - new Date(click.timestamp).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins > 0) {
          relativeTime = diffMins < 60 ? `${diffMins} mins ago` : `${Math.floor(diffMins / 60)} hours ago`;
        }
      }

      logs.push({
        id: click.id,
        type: 'click',
        message: `Affiliate check clicked for "${productName}"`,
        time: relativeTime
      });
    });

    // Inject fallback if no clicks tracked
    if (logs.length === 0) {
      logs.push({
        id: 'fallback-setup',
        type: 'settings',
        message: 'EasyKart system monitor fully active & waiting for customer click conversions.',
        time: 'Active'
      });
    }

    return logs;
  };

  const recentActivities = getRecentActivities();

  // 5. Compute Top Category Conversion Percentages
  const getTopConvertingCategories = () => {
    const categoryClicks: Record<string, number> = {};
    clicks.forEach(click => {
      const product = products.find(p => p.id === click.productId);
      if (product && product.categoryId) {
        categoryClicks[product.categoryId] = (categoryClicks[product.categoryId] || 0) + 1;
      }
    });

    const totalClicksCount = Math.max(1, clicks.length);

    const data = Object.entries(categoryClicks)
      .map(([catId, count]) => {
        const category = categories.find(c => c.id === catId);
        return {
          id: catId,
          name: category ? category.name : 'Unknown Vertical',
          count,
          percent: Math.round((count / totalClicksCount) * 100)
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // top 3

    // Fallback template defaults if empty
    if (data.length === 0) {
      return [
        { id: '1', name: 'No conversion data registered', count: 0, percent: 0 }
      ];
    }

    return data;
  };

  const topConvertingCategories = getTopConvertingCategories();

  if (loading) {
    return (
      <div className="h-[70vh] w-full flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
        <p className="text-xs uppercase font-extrabold tracking-widest animate-pulse">Syncing real-time parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
            Overview Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time analytics, affiliate conversions, and core system controls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/AdminPanel/products')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-[0_4px_15px_rgba(139,92,246,0.2)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Manage Catalogue
          </button>
        </div>
      </div>

      {/* 2. KPIs Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((metric) => {
          const Icon = metric.icon;
          return (
            <div 
              key={metric.title}
              className="relative overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group"
              style={{ contentVisibility: 'auto' }}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {metric.title}
                  </p>
                  <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {metric.value}
                  </h3>
                </div>
                <div className={`p-3 rounded-2xl bg-gradient-to-tr ${metric.color} text-white shadow-lg`} style={{ boxShadow: `0 4px 14px ${metric.shadowColor}` }}>
                  <Icon className="w-5 h-5 shrink-0" />
                </div>
              </div>

              {/* Spark Subtext */}
              <div className="flex items-center gap-2 mt-4 text-[10px] text-zinc-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{metric.subtext}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Performance Graph & Recent Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Click trends sparkline (Span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-violet-500" />
                  Weekly Click Velocity
                </h3>
                <p className="text-xs text-zinc-400">Live conversion and visitor click traffic trends.</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-violet-650 bg-violet-500/5 border border-violet-500/10 px-2.5 py-1 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-violet-500" />
                Real-time
              </span>
            </div>

            {/* Custom Responsive SVG Chart */}
            <div className="relative w-full h-[220px] mt-6 flex justify-center items-center">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible text-zinc-400 dark:text-zinc-650">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines */}
                {[0, 0.5, 1].map((ratio) => {
                  const y = paddingY + ratio * (chartHeight - paddingY * 2);
                  const gridVal = Math.round(maxTrendClicks - ratio * maxTrendClicks);
                  return (
                    <g key={ratio} className="opacity-45">
                      <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} className="stroke-zinc-100 dark:stroke-zinc-800 stroke-[0.75]" strokeDasharray="3" />
                      <text x={paddingX - 8} y={y + 3} className="text-[9px] font-mono fill-zinc-400 text-right" textAnchor="end">{gridVal}</text>
                    </g>
                  );
                })}

                {/* Filled Gradient Path */}
                {fillPath && <path d={fillPath} fill="url(#chartGradient)" />}

                {/* Main Glowing Smooth Curve Line */}
                {linePath && <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" />}

                {/* Axis Tick Labels */}
                {points.map((p, i) => (
                  <g key={i}>
                    {/* Tick Label */}
                    <text x={p.x} y={chartHeight - 4} textAnchor="middle" className="fill-zinc-400 text-[10px] font-bold tracking-wider uppercase">
                      {p.label}
                    </text>

                    {/* Interactive Circles / Anchors */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="4" 
                      className="fill-white dark:fill-zinc-950 stroke-violet-500 stroke-2 hover:r-6 hover:stroke-indigo-500 cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, value: p.value, label: p.label })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                ))}
              </svg>

              {/* Dynamic Interactive Tooltip */}
              {hoveredPoint && (
                <div 
                  className="absolute bg-zinc-900/95 dark:bg-white text-white dark:text-zinc-900 px-3 py-2 rounded-xl text-xs font-bold border border-zinc-800 dark:border-zinc-200 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-12 animate-fadeIn"
                  style={{ left: `${(hoveredPoint.x / chartWidth) * 100}%`, top: `${(hoveredPoint.y / chartHeight) * 100}%` }}
                >
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">{hoveredPoint.label}</p>
                  <p className="mt-0.5">{hoveredPoint.value} Clicks</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-400 mt-6">
            <span>Dynamic daily resolution</span>
            <span 
              onClick={() => router.push('/AdminPanel/analytics')}
              className="flex items-center gap-1 font-bold text-violet-500 hover:text-violet-600 cursor-pointer hover:underline"
            >
              Detailed Analytics Workspace
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Live Operations Activity Logger */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
              Live Operations
            </h3>
            <p className="text-xs text-zinc-400 mb-6">Real-time logs of customer click conversions.</p>

            <div className="space-y-4">
              {recentActivities.map((log) => {
                let badgeColor = 'bg-violet-500/10 text-violet-600 dark:text-violet-400';
                if (log.type === 'settings') badgeColor = 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400';

                return (
                  <div key={log.id} className="flex gap-3 items-start text-xs border-b border-zinc-150 dark:border-zinc-805 pb-3 last:border-0 last:pb-0 animate-fadeIn">
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] shrink-0 ${badgeColor}`}>
                      {log.type}
                    </span>
                    <div className="space-y-0.5 overflow-hidden">
                      <p className="text-zinc-700 dark:text-zinc-300 font-bold leading-relaxed truncate" title={log.message}>
                        {log.message}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-semibold">{log.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={() => router.push('/AdminPanel/analytics')}
            className="w-full py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors mt-6 cursor-pointer"
          >
            Access Full Conversion Table
          </button>
        </div>

      </div>

      {/* 4. Real-time Converting Categories share trackers */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 mb-1">
          Top Converting Categories
        </h3>
        <p className="text-xs text-zinc-400 mb-6">Percentage share of affiliate link clicks computed in real-time by category.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topConvertingCategories.map((item, idx) => {
            const progressColors = [
              'from-violet-500 to-indigo-500',
              'from-blue-500 to-cyan-500',
              'from-emerald-500 to-teal-500'
            ];
            
            return (
              <div key={item.id} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[180px]" title={item.name}>{item.name}</span>
                  <span className="text-violet-500 dark:text-violet-400">{item.percent}% clicks ({item.count})</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-zinc-200/40 dark:border-zinc-800/40">
                  <div 
                    className={`h-full bg-gradient-to-r ${progressColors[idx % progressColors.length]} rounded-full transition-all duration-500`} 
                    style={{ width: `${item.percent}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
