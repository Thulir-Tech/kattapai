import React from 'react';
import { SettingsService } from '@/services/settings.service';
import { Cookie, Calendar, ArrowLeft, Mail, Info, Settings, Eye } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 3600; // Cache for 1 hour

export default async function CookiePolicyPage() {
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
          <Cookie className="w-4 h-4" />
          Cookie Guidelines
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
          Cookie Policy
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-semibold pt-1">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Last Updated: {updatedAtStr}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span>Tracking Disclosures</span>
        </div>
      </header>

      {/* 4. Primary Content Layout */}
      <main className="max-w-4xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-12 relative z-10">
        
        {/* Sticky Sidebar Navigation (Desktop) */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6 shrink-0">
          <div className="sticky top-24 space-y-2 border-l border-zinc-200 dark:border-zinc-800/80 pl-4 py-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <p className="mb-4 text-[10px] text-zinc-500">Outline</p>
            <a href="#what" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">1. What are Cookies</a>
            <a href="#how" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">2. How We Use Them</a>
            <a href="#types" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">3. Cookie Categories</a>
            <a href="#third-party" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">4. Third-Party Trackers</a>
            <a href="#management" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">5. Cookie Control</a>
            <a href="#updates" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">6. Policy Changes</a>
            <a href="#inquiries" className="block py-1.5 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">7. Contact Info</a>
          </div>
        </aside>

        {/* Detailed Policy Prose Card */}
        <section className="col-span-1 lg:col-span-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-8 sm:p-10 shadow-sm space-y-10 leading-relaxed text-sm text-zinc-650 dark:text-zinc-350">
          
          {/* Section 1 */}
          <div id="what" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are tiny text files containing small amounts of data that are downloaded and stored securely on your browser or device when you visit websites. They act as a memory key, enabling web platforms to distinguish your device, recognize browsing preferences, and retain state across page transitions.
            </p>
            <p>
              Cookies are either <strong>"Session Cookies"</strong> (which are erased automatically once you close your active browser) or <strong>"Persistent Cookies"</strong> (which stay on your device for a pre-determined expiration period to retain indicators such as session tokens or custom settings).
            </p>
          </div>

          {/* Section 2 */}
          <div id="how" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              2. How We Use Cookies
            </h2>
            <p>
              At <strong>{siteName}</strong>, we use cookies to deliver a responsive, visually consistent, and robust layout. Cookies help us authenticate administrative dashboard entries, retain dark/light preferences, keep track of newsletter registrations, and gather anonymous analytics about which products are most frequently evaluated.
            </p>
          </div>

          {/* Section 3 */}
          <div id="types" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              3. Categories of Cookies We Use
            </h2>
            <p>
              We classify cookies into three distinct usage categories:
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60">
                <Info className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Strictly Necessary Cookies</h4>
                  <p className="text-xs text-zinc-400 mt-1">Essential for site operations. They secure administrative portals (`/AdminPanel`) by storing active authorization session tokens and safeguarding database integrations against CSRF attacks. These cannot be disabled.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60">
                <Settings className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Preferences & Functionality Cookies</h4>
                  <p className="text-xs text-zinc-400 mt-1">These retain preference markers such as theme modes (Light or Dark dashboard selection) and site configurations across visits, preventing layout shifts and delivering a unified UX.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60">
                <Eye className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Analytics & Performance Tracking</h4>
                  <p className="text-xs text-zinc-400 mt-1">Compile aggregate, anonymous records of visitor volume, average session times, referral sources, and button click parameters. We use these metrics to identify popular reviews and trending catalog recommendations.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div id="third-party" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              4. Third-Party Affiliate Tracking Cookies
            </h2>
            <p>
              Because {siteName} is a curated Amazon Affiliate recommendation engine, <strong>third-party affiliate cookies</strong> are utilized.
            </p>
            <p>
              When you click on any outbound referral button (e.g. <em>"Check Latest Price on Amazon"</em>), you redirect to Amazon.com. During this transition, Amazon Services LLC places tracking cookies in your browser to log that your routing originated from {siteName}. 
            </p>
            <p>
              These cookies typically remain active for a 24-hour window, during which any qualifying purchase you complete compiles a referral fee to sustain this review platform. These cookies are governed exclusively by Amazon.com's own Privacy and Cookie Policies.
            </p>
          </div>

          {/* Section 5 */}
          <div id="management" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              5. How to Control and Manage Cookies
            </h2>
            <p>
              You have the full authority to accept, decline, block, or delete cookies at any given moment by accessing your browser settings:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Google Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data.</li>
              <li><strong>Mozilla Firefox:</strong> Settings &gt; Privacy & Security &gt; Enhanced Tracking Protection.</li>
              <li><strong>Apple Safari:</strong> Preferences &gt; Privacy &gt; Prevent cross-site tracking / Block all cookies.</li>
              <li><strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions &gt; Manage and delete cookies.</li>
            </ul>
            <p className="text-xs text-zinc-400 mt-2">
              * Note: Disabling or blocking functionality cookies may result in certain visual preferences (like dark mode styling) resetting upon every page load.
            </p>
          </div>

          {/* Section 6 */}
          <div id="updates" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              6. Policy Modifications
            </h2>
            <p>
              We reserve the right to modify, adjust, or update this Cookie Policy document to comply with new privacy directives or changes in tracking standards. All adjustments will be instantly recorded on this page, with an updated date marker.
            </p>
          </div>

          {/* Section 7 */}
          <div id="inquiries" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-violet-600 shrink-0" />
              7. Cookie Inquiries & Support
            </h2>
            <p>
              For general questions or support inquiries regarding how we employ cookie trackers, please submit a direct message to our support coordinate:
            </p>
            
            <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl mt-4">
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
