import React from 'react';
import { SettingsService } from '@/services/settings.service';
import { ShieldCheck, Calendar, ArrowLeft, Mail, Lock, Eye, Globe } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 3600; // Cache for 1 hour

export default async function PrivacyPolicyPage() {
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
          <ShieldCheck className="w-4 h-4" />
          Trust & Transparency
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
          Privacy Policy
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-semibold pt-1">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Last Updated: {updatedAtStr}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span>Global Compliance Policy</span>
        </div>
      </header>

      {/* 4. Primary Content Layout */}
      <main className="max-w-4xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-12 relative z-10">
        
        {/* Sticky Sidebar Navigation (Desktop) */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6 shrink-0">
          <div className="sticky top-24 space-y-2 border-l border-zinc-200 dark:border-zinc-800/80 pl-4 py-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <p className="mb-4 text-[10px] text-zinc-500">Document Outline</p>
            <a href="#intro" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">1. Introduction</a>
            <a href="#collection" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">2. Info Collection</a>
            <a href="#usage" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">3. How We Use Info</a>
            <a href="#amazon" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">4. Affiliate Disclosure</a>
            <a href="#cookies" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">5. Cookies & Trackers</a>
            <a href="#retention" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">6. Data Security</a>
            <a href="#rights" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">7. User Rights</a>
            <a href="#contact" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">8. Contact Us</a>
          </div>
        </aside>

        {/* Detailed Policy Prose Card */}
        <section className="col-span-1 lg:col-span-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-8 sm:p-10 shadow-sm space-y-10 leading-relaxed text-sm text-zinc-650 dark:text-zinc-350">
          
          {/* Section 1 */}
          <div id="intro" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              1. Introduction & Scope
            </h2>
            <p>
              Welcome to <strong>{siteName}</strong>. Your privacy is critical to us. This Privacy Policy documents the types of information {siteName} gathers, tracks, and processes, and explains how we protect your personal identity when you interact with our curated reviews, guides, and recommendation catalog.
            </p>
            <p>
              By accessing and using {siteName}, you signify your agreement to the collection and processing of parameters described in this policy. If you disagree with any terms in this document, please cease your use of our platform immediately.
            </p>
          </div>

          {/* Section 2 */}
          <div id="collection" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              2. Information We Collect
            </h2>
            <p>
              We gather information through two core pathways: voluntary submissions by you and automated telemetry records compiled as you navigate our platform.
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li><strong>Newsletter Signups:</strong> If you sign up for our curated tech digests, you provide us with your active email address.</li>
              <li><strong>Technical Metadata:</strong> Our servers automatically log details such as IP address, browser type, operating system version, referring URLs, and page navigation history to deliver a tailored interface.</li>
              <li><strong>Click Telemetry:</strong> To improve our recommendations, we track anonymous clicks on our external product recommendations, helping us identify trending products.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div id="usage" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              3. How We Use Your Information
            </h2>
            <p>
              We utilize collected indicators to deliver the highest quality affiliate catalog possible:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
                <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-violet-500" /> Security & Performance
                </h4>
                <p className="text-[11px] text-zinc-400">Monitoring telemetry coordinates to stop malicious behavior, block spam, and optimize loading thresholds.</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
                <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-violet-500" /> Analytics Curation
                </h4>
                <p className="text-[11px] text-zinc-400">Analyzing review popularity, click-through ratios, and search queries to curate highly relevant gaming and office technology.</p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div id="amazon" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              4. Amazon Affiliate Program & Disclosures
            </h2>
            <div className="bg-violet-500/5 border border-violet-500/10 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-sm text-violet-650 dark:text-violet-400 flex items-center gap-1.5">
                <Globe className="w-4 h-4 shrink-0 animate-pulse" /> Amazon Associate Disclosure
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <strong>{siteName}</strong> is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for websites to earn advertising fees by advertising and linking to Amazon.com.
              </p>
            </div>
            <p>
              As an Amazon Associate, we earn referral fees from qualifying purchases made through our external links. This process does not alter the retail price of items on Amazon, and it guarantees that our review platform stays sustainable and ad-free.
            </p>
          </div>

          {/* Section 5 */}
          <div id="cookies" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              5. Third-Party Cookies & Tracking
            </h2>
            <p>
              When you click on an outbound recommendation card within our catalog, third-party associates (specifically Amazon) place tracking cookies on your device to keep record of qualifying purchases made during active window sessions (typically 24 hours).
            </p>
            <p>
              These trackers record referral indicators, purchase attributes, and browser parameters. For an exhaustive description of how these are managed, please read our dedicated <Link href="/cookie-policy" className="text-violet-600 dark:text-violet-400 hover:underline font-bold">Cookie Policy</Link>.
            </p>
          </div>

          {/* Section 6 */}
          <div id="retention" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              6. Data Security & Storage
            </h2>
            <p>
              We enforce high-security standards to safeguard your email addresses and metadata. We store subscriber entries inside cloud environments managed by secure providers, implementing advanced access restrictions and continuous audit triggers to stop unauthorized access or leakage.
            </p>
          </div>

          {/* Section 7 */}
          <div id="rights" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              7. User Rights & Data Control
            </h2>
            <p>
              Depending on your regional regulations (such as GDPR or CCPA), you are entitled to several user rights regarding your personal profiles:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Request access to historical copies of your profile stored by us.</li>
              <li>Request immediate amendment or correction of inaccurate parameters.</li>
              <li>Request complete eradication or deletion of your email records from our systems.</li>
              <li>Opt-out of any marketing campaigns instantly by clicking "Unsubscribe" in email headers.</li>
            </ul>
          </div>

          {/* Section 8 */}
          <div id="contact" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              8. Contact & Compliance Officer
            </h2>
            <p>
              For general questions regarding this Privacy Policy, your user rights, or data controls, please contact our trust representative directly:
            </p>
            <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-550 dark:text-violet-400 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Email Inquiry Point</p>
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
