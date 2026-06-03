import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CategoryService } from "@/services/category.service";
import { SettingsService } from "@/services/settings.service";
import PublicLayoutShell from "@/components/shared/PublicLayoutShell";
import { Category, SiteSettings } from "@/types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Dynamically generate page metadata on the server using Firestore global configurations.
 * Instantly synchronizes site title and descriptions from the Settings admin panel.
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await SettingsService.getSettings();
    return {
      title: settings.siteTitle || settings.siteName || "Katta Pai",
      description: settings.siteDescription || "Discover expert reviews and buying recommendations.",
      icons: {
        icon: settings.faviconURL || "/favicon.ico",
      }
    };
  } catch (e) {
    return {
      title: "EasyKart | Curated Products & Amazon Top Deals",
      description: "Discover expert  reviews, buying guides, and top amazon affiliate deals.",
      icons: {
        icon: "/favicon.ico",
      }
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch site settings and categories concurrently on the server
  let categories: Category[] = [];
  let settings: SiteSettings = {
    siteName: "EasyKart",
    siteTitle: "EasyKart | Premium Curated Products",
    siteDescription: "Discover expert reviews, buying guides, and top Amazon recommendations.",
    contactEmail: "admin@easykart.com",
    amazonAffiliateTag: "easykart26-20",
    logoURL: "",
    themeColor: "violet",
    updatedAt: new Date().toISOString()
  };

  try {
    const [fetchedCategories, fetchedSettings] = await Promise.all([
      CategoryService.getAllCategories(),
      SettingsService.getSettings()
    ]);
    categories = fetchedCategories;
    settings = fetchedSettings;
  } catch (e) {
    console.warn("Failed fetching server-side layout parameters, loading fallbacks:", e);
  }

  // Map selected theme color to dynamic CSS primary variable values
  const themeColor = settings.themeColor || 'violet';
  const themeColorMapping: Record<string, { p400: string; p500: string; p600: string }> = {
    violet: { p400: '#a78bfa', p500: '#8b5cf6', p600: '#7c3aed' },
    blue: { p400: '#60a5fa', p500: '#3b82f6', p600: '#2563eb' },
    emerald: { p400: '#34d399', p500: '#10b981', p600: '#059669' },
    rose: { p400: '#fb7185', p500: '#f43f5e', p600: '#e11d48' },
    amber: { p400: '#fbbf24', p500: '#f59e0b', p600: '#d97706' },
    indigo: { p400: '#818cf8', p500: '#6366f1', p600: '#4f46e5' }
  };
  const activeColor = themeColorMapping[themeColor] || themeColorMapping.violet;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href={settings.faviconURL || "/favicon.ico"} />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary-400: ${activeColor.p400};
            --primary-500: ${activeColor.p500};
            --primary-600: ${activeColor.p600};
          }
        ` }} />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
        <PublicLayoutShell categories={categories} settings={settings}>
          {children}
        </PublicLayoutShell>
      </body>
    </html>
  );
}
