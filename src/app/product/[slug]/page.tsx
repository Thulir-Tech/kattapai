import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { 
  Star, 
  ChevronRight, 
  ShoppingBag, 
  ExternalLink, 
  Check, 
  X, 
  ListChecks, 
  HelpCircle, 
  Info,
  ArrowRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { ProductService } from '@/services/product.service';
import { CategoryService } from '@/services/category.service';
import { logAffiliateClickAndRedirect } from '@/features/clicks/clicks.actions';
import ImageGallery from '@/components/shared/ImageGallery';
import { Product, Category } from '@/types';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60; // Revalidate product detail page cache every minute

/**
 * Dynamically generate product details metadata for search engine indexing.
 */
export async function generateMetadata(props: ProductDetailPageProps): Promise<Metadata> {
  const params = await props.params;
  const slug = params.slug;
  
  try {
    const product = await ProductService.getProductBySlug(slug);
    if (!product) {
      return { title: 'Product Not Found | EasyKart' };
    }
    return {
      title: `${product.title} Review & Features | EasyKart`,
      description: product.description.slice(0, 160),
    };
  } catch (e) {
    return { title: 'Product Review | EasyKart' };
  }
}

export default async function ProductDetailPage(props: ProductDetailPageProps) {
  const params = await props.params;
  const slug = params.slug;

  let product: Product | null = null;
  let categories: Category[] = [];

  try {
    const [fetchedProduct, fetchedCategories] = await Promise.all([
      ProductService.getProductBySlug(slug),
      CategoryService.getAllCategories()
    ]);
    product = fetchedProduct;
    categories = fetchedCategories;
  } catch (e) {
    console.warn('Failed loading server-side product details parameters:', e);
  }

  // 404 Guard if product not active or non-existent
  if (!product || product.status === 'draft') {
    notFound();
  }

  const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'Unassigned';

  // Fetch Related Products (same category, excluding current product)
  let relatedProducts: Product[] = [];
  try {
    const allCategoryProducts = await ProductService.getProductsByCategory(product.categoryId);
    relatedProducts = allCategoryProducts
      .filter(p => p.id !== product.id && p.status !== 'draft')
      .slice(0, 3);
  } catch (e) {
    console.warn('Failed fetching related products collection:', e);
  }

  // Dynamically bind Server Action to trigger click tracking telemetry on form submission
  const handleAffiliateRedirect = logAffiliateClickAndRedirect.bind(
    null, 
    product.id, 
    product.title, 
    product.affiliateLink
  );

  // Structured specifications key-value map fallbacks
  const specs = Object.entries(product.specifications || {});

  // Pre-configured FAQ items
  const faqs = [
    {
      q: `Is the ${product.title} covered by official warranties?`,
      a: `Yes, because this item is redirected and purchased directly through official Amazon channels, it qualifies for all official brand manufacturer warranties, product coverage plans, and consumer protections.`
    },
    {
      q: `What is the return policy for the ${product.title}?`,
      a: `All transactions are securely handled through Amazon's A-to-z checkout. This means your purchase is backed by Amazon's standard 30-day return policy and money-back guarantees.`
    }
  ];

  const host = 'https://easykart.example.com';
  const productUrl = `${host}/product/${product.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": product.mainImage || '',
    "description": product.description,
    "mpn": product.amazonProductId,
    "brand": {
      "@type": "Brand",
      "name": product.specifications?.Brand || "EasyKart Recommendation"
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 animate-fadeIn">
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Breadcrumbs Navigation */}
      <nav className="flex flex-wrap items-center gap-y-2 gap-x-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        <Link href="/" className="hover:text-zinc-600 transition-colors shrink-0">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-zinc-600 transition-colors">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/products?category=${categories.find(c => c.id === product.categoryId)?.slug || ''}`} className="hover:text-zinc-600 transition-colors">{categoryName}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-zinc-500 truncate max-w-[180px]">{product.title}</span>
      </nav>

      {/* Primary Overview layout grid (Col 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Interactive Image Gallery (Span 7) */}
        <div className="lg:col-span-7 space-y-6">
          <ImageGallery mainImage={product.mainImage} images={product.images || []} />
        </div>

        {/* Right Column: CTA & Details Dashboard (Span 5) */}
        <div className="lg:col-span-5 space-y-6 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-6 sm:p-8 rounded-[32px] shadow-sm">
          
          <div className="space-y-3">
            <span className="inline-flex px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest text-violet-600 dark:text-violet-400 bg-violet-500/5 border border-violet-500/10">
              {categoryName}
            </span>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              {product.title}
            </h1>

          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800/40 pt-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
            <span>Product ASIN ID: </span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">{product.amazonProductId}</span>
          </div>

          {/* Secure Server Action Outbound form (STRICTLY NO PRICE METRICS INBOUND!) */}
          <div className="pt-4 space-y-4">
            <form action={handleAffiliateRedirect}>
              <button 
                type="submit" 
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm tracking-wide shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer text-center"
              >
                Check Latest Price On Amazon
                <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </form>
            
            <p className="text-[10px] text-zinc-400 leading-normal text-center">
              *Tapping button redirects to official Amazon US catalogue check. No local pricing indices kept to satisfy Amazon real-time compliance requirements.
            </p>
          </div>

          {/* Value Checklist block */}
          <div className="border-t border-zinc-100 dark:border-zinc-800/40 pt-6 space-y-3.5 text-xs text-zinc-600 dark:text-zinc-400 font-bold">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Full Amazon Return Coverage</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Qualifies for Official Brand Warranties</span>
            </div>
          </div>

        </div>

      </div>

      {/* Overview Block */}
      <section className="bg-white dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800/80 p-6 sm:p-8 rounded-[32px] space-y-4">
        <h3 className="font-extrabold text-lg text-zinc-800 dark:text-zinc-100">Product overview & Analysis</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold whitespace-pre-line">
          {product.description}
        </p>
      </section>

      {/* Pros & Cons Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pros */}
        <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 sm:p-8 rounded-[32px] space-y-4">
          <h3 className="font-extrabold text-base text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <Check className="w-5 h-5 stroke-[2.5]" />
            Pros & Value Highs
          </h3>
          <ul className="space-y-3 text-xs font-bold text-emerald-800/90 dark:text-emerald-400/90">
            {(product.pros || ['Highly rated by customer reviews', 'Excellent build value']).map((pro, idx) => (
              <li key={idx} className="flex gap-2.5 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <span className="leading-relaxed">{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div className="bg-red-500/5 border border-red-500/10 p-6 sm:p-8 rounded-[32px] space-y-4">
          <h3 className="font-extrabold text-base text-red-700 dark:text-red-400 flex items-center gap-2">
            <X className="w-5 h-5 stroke-[2.5]" />
            Cons & Considerations
          </h3>
          <ul className="space-y-3 text-xs font-bold text-red-800/90 dark:text-red-400/90">
            {(product.cons || ['High retail demand might limit supply']).map((con, idx) => (
              <li key={idx} className="flex gap-2.5 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                <span className="leading-relaxed">{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Technical Specifications Map Grid */}
      {specs.length > 0 && (
        <section className="bg-white dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800/80 p-6 sm:p-8 rounded-[32px] space-y-6">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-violet-500" />
            <h3 className="font-extrabold text-lg text-zinc-800 dark:text-zinc-100">Technical Specifications</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2 text-xs font-semibold">
            {specs.map(([key, val]) => (
              <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 py-3 border-b border-zinc-100 dark:border-zinc-800/40">
                <span className="text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px] sm:text-xs shrink-0">{key}</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-bold text-left sm:text-right break-words max-w-full sm:max-w-[65%]">{val}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Native Accordion FAQs */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-violet-500" />
          <h3 className="font-extrabold text-lg text-zinc-800 dark:text-zinc-100">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details 
              key={idx} 
              className="group border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 bg-white dark:bg-zinc-900/40 [&_summary::-webkit-details-marker]:hidden cursor-pointer"
            >
              <summary className="flex justify-between items-start gap-4 font-bold text-sm text-zinc-800 dark:text-zinc-200 select-none">
                {faq.q}
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-zinc-400 shrink-0 mt-0.5" />
              </summary>
              <p className="mt-3.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Related Products Section (NO PRICES!) */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h3 className="font-extrabold text-lg text-zinc-800 dark:text-zinc-100">Related tech recommendations</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <div 
                key={p.id}
                className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image */}
                <div className="h-40 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden flex items-center justify-center border-b border-zinc-100 dark:border-zinc-800/40">
                  {p.mainImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.mainImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="text-zinc-300"><ShoppingBag className="w-8 h-8" /></div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 truncate" title={p.title}>{p.title}</h4>
                                    <div className="flex items-center justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800/40">
                    <Link 
                      href={`/product/${p.slug}`}
                      className="text-xs font-bold text-violet-500 hover:text-violet-600 flex items-center gap-0.5"
                    >
                      Explore
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
  );
}
