import React from 'react';
import { SettingsService } from '@/services/settings.service';
import { FileText, Calendar, ArrowLeft, Mail, AlertTriangle, HelpCircle, CheckSquare } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 3600; // Cache for 1 hour

export default async function TermsOfServicePage() {
  const settings = await SettingsService.getSettings();
  const siteName = settings.siteName || 'EasyKart';
  const contactEmail = settings.contactEmail || 'admin@easykart.com';
  const updatedAtStr = new Date(settings.updatedAt || new Date()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 pb-24">
      {/* 1. Ambient Background Glows */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-[350px] h-[350px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 translate-y-12 -translate-x-12 w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* 2. Top Navigation Breadcrumb */}
      <div className="max-w-4xl mx-auto px-6 pt-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>
      </div>

      {/* 3. Hero Header Section */}
      <header className="max-w-4xl mx-auto px-6 pt-8 pb-12 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          Usage Regulations
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
          Terms of Service
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-semibold pt-1">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Last Updated: {updatedAtStr}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span>User Agreement Rules</span>
        </div>
      </header>

      {/* 4. Primary Content Layout */}
      <main className="max-w-4xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-12 relative z-10">
        
        {/* Sticky Sidebar Navigation (Desktop) */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6 shrink-0">
          <div className="sticky top-24 space-y-2 border-l border-zinc-200 dark:border-zinc-800/80 pl-4 py-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <p className="mb-4 text-[10px] text-zinc-500">Outline</p>
            <a href="#acceptance" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">1. Terms Acceptance</a>
            <a href="#disclaimer" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">2. Affiliate Disclaimer</a>
            <a href="#pricing" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">3. Pricing Guarantee</a>
            <a href="#intellectual" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">4. Intellectual Property</a>
            <a href="#limitations" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">5. Liability Limit</a>
            <a href="#links" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">6. Outbound Links</a>
            <a href="#modifications" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">7. Adjustments</a>
            <a href="#governing" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">8. Governing Law</a>
          </div>
        </aside>

        {/* Detailed Policy Prose Card */}
        <section className="col-span-1 lg:col-span-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-8 sm:p-10 shadow-sm space-y-10 leading-relaxed text-sm text-zinc-650 dark:text-zinc-350">
          
          {/* Section 1 */}
          <div id="acceptance" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or utilizing the website catalog, newsletter triggers, or reviews provided by <strong>{siteName}</strong> ("we", "us", "our"), you signify that you have read, understood, and agree to be legally bound by this Terms of Service agreement. 
            </p>
            <p>
              These regulations govern all interactions with our system. If you do not accept these rules in their entirety, please terminate your access to the platform immediately.
            </p>
          </div>

          {/* Section 2 */}
          <div id="disclaimer" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              2. Amazon Affiliate Curation Disclaimer
            </h2>
            <p>
              {siteName} operates strictly as an independent product review and tech curation registry. We compile detailed specifications, expert pros and cons, buying guides, and user testimonials.
            </p>
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-sm text-amber-650 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" /> E-Commerce Transactions & Accountability
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We are <strong>NOT</strong> an online storefront, e-commerce shop, or direct product seller. All review catalog items redirect out of {siteName} to Amazon.com. When you make a purchase, the final e-commerce transaction, fulfillment, warranty, shipping, and product support are handled exclusively by Amazon.com Inc. and its independent merchants. 
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div id="pricing" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              3. Pricing & Stock Guarantees
            </h2>
            <p>
              To stay fully compliant with affiliate guidelines and ensure honest, independent evaluation:
            </p>
            <ul className="space-y-3 pl-1">
              <li className="flex items-start gap-2.5">
                <CheckSquare className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                <span><strong>No Price Display Policy:</strong> We do not show live product prices on this website, as price structures are determined dynamically on Amazon.com. We direct you outbound via <em>"Check Latest Price on Amazon"</em> to review accurate values.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckSquare className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                <span><strong>No Availability Indicators:</strong> We do not display real-time inventory levels, shipping speeds, or stocking parameters. Final availability is checked dynamically on Amazon.com.</span>
              </li>
            </ul>
          </div>

          {/* Section 4 */}
          <div id="intellectual" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              4. Intellectual Property Rights
            </h2>
            <p>
              All reviews, buying analysis summaries, specifications curation structures, graphics, UI themes, custom visual assets, design tokens, and coding components contained on {siteName} are the exclusive intellectual property of {siteName} Inc. 
            </p>
            <p>
              Reproduction, scraping, automated harvesting, mirroring, or republishing of our reviews or product comparisons without prior written permission is strictly prohibited and subject to legal actions.
            </p>
          </div>

          {/* Section 5 */}
          <div id="limitations" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              5. Limitation of Liability
            </h2>
            <p>
              In no event shall {siteName}, its founders, directors, employees, or tech curation experts be liable for any damages (including, without limitation, direct, indirect, incidental, punitive, or consequential damages) arising from:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Inaccuracies in product reviews, specs lists, or comparison charts.</li>
              <li>Product failures, shipping delays, defective components, or refund disputes resulting from transactions finalized on Amazon.com.</li>
              <li>System downtime, cache errors, or connectivity interruptions.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div id="links" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              6. External Outbound Links
            </h2>
            <p>
              This catalog contains numerous outbound links to external sites (specifically Amazon.com and third-party brands). We do not control, audit, review, or assume responsibility for the content, privacy practices, or operating behaviors of any external platforms. Clicking outbound referral links is done entirely at your own risk.
            </p>
          </div>

          {/* Section 7 */}
          <div id="modifications" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              7. Agreement Modifications
            </h2>
            <p>
              We reserve the right to modify, adjust, amend, or rewrite this Terms of Service agreement at any given moment. All adjustments take effect immediately upon their publication on this page. Your continued use of the platform following the publication of changes signifies your formal acceptance of the modified Terms.
            </p>
          </div>

          {/* Section 8 */}
          <div id="governing" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              8. Governing Law & Dispute Resolution
            </h2>
            <p>
              This User Agreement and all regulatory disputes, interpretations, or claims arising from your interaction with {siteName} shall be governed by, interpreted, and enforced in accordance with the laws of the jurisdiction where {siteName} Inc. is registered, without giving effect to conflicts of laws provisions.
            </p>
            
            <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl mt-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-550 dark:text-violet-400 shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Inquiries & Clarifications</p>
                <a href={`mailto:${contactEmail}`} className="text-sm font-bold text-zinc-800 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  {contactEmail}
                </a>
              </div>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}
