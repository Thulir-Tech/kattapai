'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { 
  Settings as SettingsIcon,
  Globe, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  X,
  Mail,
  Tag,
  Shield,
  Eye
} from 'lucide-react';

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);
import { SettingsService } from '@/services/settings.service';
import { StorageService } from '@/services/storage.service';
import { SiteSettings } from '@/types';

const queryClient = new QueryClient();

// Validation Schema using Zod
const settingsSchema = z.object({
  siteName: z.string().min(2, 'Site Name must be at least 2 characters'),
  siteTitle: z.string().min(3, 'Site Title must be at least 3 characters'),
  siteDescription: z.string().min(10, 'Site Description must be at least 10 characters'),
  contactEmail: z.string().email('Please enter a valid contact email address'),
  amazonAffiliateTag: z.string().min(3, 'Affiliate tag must be at least 3 characters'),
  facebook: z.string().url('Please enter a valid URL').or(z.literal('')),
  twitter: z.string().url('Please enter a valid URL').or(z.literal('')),
  instagram: z.string().url('Please enter a valid URL').or(z.literal('')),
  youtube: z.string().url('Please enter a valid URL').or(z.literal('')),
  themeColor: z.string().optional(),
});

type SettingsFormFields = z.infer<typeof settingsSchema>;

export default function SiteSettingsWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <SiteSettingsPage />
    </QueryClientProvider>
  );
}

function SiteSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'social'>('general');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Logo & Favicon Base64 Preview States
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isProcessingAssets, setIsProcessingAssets] = useState(false);

  // Fetch Live Global Settings from Firestore
  const { data: settings, isLoading, isError, error } = useQuery<SiteSettings>({
    queryKey: ['settings'],
    queryFn: SettingsService.getSettings,
  });

  // React Hook Form Configuration
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SettingsFormFields>({
    resolver: zodResolver(settingsSchema),
  });

  // Populate form fields on initial query resolution
  React.useEffect(() => {
    if (settings) {
      reset({
        siteName: settings.siteName,
        siteTitle: settings.siteTitle,
        siteDescription: settings.siteDescription,
        contactEmail: settings.contactEmail,
        amazonAffiliateTag: settings.amazonAffiliateTag,
        facebook: settings.socialLinks?.facebook || '',
        twitter: settings.socialLinks?.twitter || '',
        instagram: settings.socialLinks?.instagram || '',
        youtube: settings.socialLinks?.youtube || '',
        themeColor: settings.themeColor || 'violet',
      });

      if (settings.logoURL) setLogoPreview(settings.logoURL);
      if (settings.faviconURL) setFaviconPreview(settings.faviconURL);
    }
  }, [settings, reset]);

  // Asset Handling
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = StorageService.validateFile(file);
      if (!validation.isValid) {
        setFormError(`Logo rejection: ${validation.error}`);
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setFormError(null);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = StorageService.validateFile(file, 512 * 1024); // max 512KB for small favicons
      if (!validation.isValid) {
        setFormError(`Favicon rejection: ${validation.error}`);
        return;
      }
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
      setFormError(null);
    }
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const clearFavicon = () => {
    setFaviconFile(null);
    setFaviconPreview(null);
  };

  // Mutate: Save Global Configurations
  const updateSettingsMutation = useMutation({
    mutationFn: async (fields: SettingsFormFields) => {
      setIsProcessingAssets(true);
      setSaveSuccess(false);

      let logoBase64 = logoPreview || '';
      let faviconBase64 = faviconPreview || '';

      // 1. Process and compress branding Logo
      if (logoFile) {
        // High density compress at low width (240px) to keep Base64 document sizes extremely small!
        const compressed = await StorageService.compressImage(logoFile, 0.8, 240);
        logoBase64 = await StorageService.uploadFile('settings/logo', compressed);
      }

      // 2. Process and compress favicon
      if (faviconFile) {
        // High density compress at tiny size (64px)
        const compressed = await StorageService.compressImage(faviconFile, 0.85, 64);
        faviconBase64 = await StorageService.uploadFile('settings/favicon', compressed);
      }

      const payload = {
        siteName: fields.siteName,
        siteTitle: fields.siteTitle,
        siteDescription: fields.siteDescription,
        contactEmail: fields.contactEmail,
        amazonAffiliateTag: fields.amazonAffiliateTag,
        logoURL: logoBase64 || "",
        faviconURL: faviconBase64 || "",
        themeColor: fields.themeColor || 'violet',
        socialLinks: {
          facebook: fields.facebook || "",
          twitter: fields.twitter || "",
          instagram: fields.instagram || "",
          youtube: fields.youtube || "",
        }
      };

      return SettingsService.updateSettings(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveSuccess(true);
      setIsProcessingAssets(false);
      setFormError(null);
      // Auto clear success indicator after 4 seconds
      setTimeout(() => setSaveSuccess(false), 4000);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to save settings configurations.');
      setIsProcessingAssets(false);
    }
  });

  const onSubmitForm = async (fields: SettingsFormFields) => {
    setFormError(null);
    updateSettingsMutation.mutate(fields);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Info */}
      <div className="space-y-0.5">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
          Website Settings
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Manage brand details, global tracking credentials, and integration mappings.
        </p>
      </div>

      {/* Primary Panels Layout */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
          <span className="text-xs uppercase tracking-wider font-semibold">Configuring Settings...</span>
        </div>
      ) : isError ? (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error compiling global settings: {(error as any)?.message || 'Check firebase configurations'}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Left Navigation Tabs (Col 1) */}
          <div className="flex flex-row lg:flex-col bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-2.5 rounded-3xl gap-1 shrink-0 overflow-x-auto lg:overflow-x-visible">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                activeTab === 'general'
                  ? 'bg-violet-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.15)]'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Globe className="w-4.5 h-4.5 shrink-0" />
              General Details
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                activeTab === 'branding'
                  ? 'bg-violet-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.15)]'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <ImageIcon className="w-4.5 h-4.5 shrink-0" />
              Branding Assets
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                activeTab === 'social'
                  ? 'bg-violet-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.15)]'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <FacebookIcon className="w-4.5 h-4.5 shrink-0" />
              Social Handles
            </button>
          </div>

          {/* Right Active Panel Form (Col 3) */}
          <form 
            onSubmit={handleSubmit(onSubmitForm)} 
            className="lg:col-span-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl shadow-sm flex flex-col justify-between overflow-hidden"
          >
            <div className="p-6 space-y-6">
              
              {/* Form alerts */}
              {formError && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-500">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Global configuration settings saved successfully to Firestore!</span>
                </div>
              )}

              {/* TAB 1: GENERAL SETTINGS */}
              {activeTab === 'general' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-zinc-100 dark:border-zinc-800/40 pb-4">
                    <h3 className="font-extrabold text-base text-zinc-800 dark:text-zinc-200">Global Website Metadata</h3>
                    <p className="text-[10px] text-zinc-400">Configure page headers, description metrics, and primary contact tags.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Site Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Site Brand Name</label>
                      <input
                        type="text"
                        disabled={isSubmitting || isProcessingAssets}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
                        {...register('siteName')}
                      />
                      {errors.siteName && <p className="text-xs text-red-500 font-semibold">{errors.siteName.message}</p>}
                    </div>

                    {/* Site Title */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Site Page Title</label>
                      <input
                        type="text"
                        disabled={isSubmitting || isProcessingAssets}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
                        {...register('siteTitle')}
                      />
                      {errors.siteTitle && <p className="text-xs text-red-500 font-semibold">{errors.siteTitle.message}</p>}
                    </div>
                  </div>

                  {/* Site Description */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Default SEO Meta Description</label>
                    <textarea
                      rows={3}
                      disabled={isSubmitting || isProcessingAssets}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors resize-none leading-relaxed"
                      {...register('siteDescription')}
                    />
                    {errors.siteDescription && <p className="text-xs text-red-500 font-semibold">{errors.siteDescription.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800/40 pt-6">
                    {/* Contact Email */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Support / Contact Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          disabled={isSubmitting || isProcessingAssets}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none transition-colors"
                          {...register('contactEmail')}
                        />
                      </div>
                      {errors.contactEmail && <p className="text-xs text-red-500 font-semibold">{errors.contactEmail.message}</p>}
                    </div>

                    {/* Amazon Affiliate Tag */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Amazon Affiliate Tag</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                          <Tag className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. easykart-20"
                          disabled={isSubmitting || isProcessingAssets}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none transition-colors font-mono"
                          {...register('amazonAffiliateTag')}
                        />
                      </div>
                      {errors.amazonAffiliateTag && <p className="text-xs text-red-500 font-semibold">{errors.amazonAffiliateTag.message}</p>}
                      <p className="text-[9px] text-zinc-400">This affiliate tag will be auto-appended to all outbound Amazon product routing cards.</p>
                    </div>
                  </div>

                  {/* UI Theme Color selector */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800/40 pt-6 space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">UI Theme Accent Color</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <select
                        disabled={isSubmitting || isProcessingAssets}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3.5 text-sm outline-none transition-colors font-bold cursor-pointer"
                        {...register('themeColor')}
                      >
                        <option value="violet">Violet Accent (Default)</option>
                        <option value="blue">Blue Accent</option>
                        <option value="emerald">Emerald Green Accent</option>
                        <option value="rose">Rose Accent</option>
                        <option value="amber">Amber Yellow Accent</option>
                        <option value="indigo">Indigo Accent</option>
                      </select>
                      <div className="flex items-center gap-3 px-2 text-xs text-zinc-400 font-medium leading-relaxed">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse shrink-0" />
                        <span>Dynamic Accent will propagate instantly across all public buttons, gradients, tags, outlines, and highlights.</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: BRANDING ASSETS */}
              {activeTab === 'branding' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-zinc-100 dark:border-zinc-800/40 pb-4">
                    <h3 className="font-extrabold text-base text-zinc-800 dark:text-zinc-200">Creative Identity Assets</h3>
                    <p className="text-[10px] text-zinc-400">Upload high-resolution logos and icons. Compress automatically using client side engine.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Website Logo */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Header Logo (Horizontal)</label>
                      
                      {logoPreview ? (
                        <div className="space-y-3">
                          {/* Light/Dark Preview Container Mockup */}
                          <div className="border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 bg-zinc-50 dark:bg-zinc-950/40 space-y-4 flex flex-col items-center justify-center">
                            <div className="w-full text-center">
                              <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block mb-2">On Light Background</span>
                              <div className="bg-white px-6 py-4 rounded-lg flex items-center justify-center border border-zinc-200/50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={logoPreview} alt="Logo Light" className="max-h-8 object-contain" />
                              </div>
                            </div>
                            <div className="w-full text-center">
                              <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block mb-2">On Dark Background</span>
                              <div className="bg-zinc-900 px-6 py-4 rounded-lg flex items-center justify-center border border-zinc-800">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={logoPreview} alt="Logo Dark" className="max-h-8 object-contain" />
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={clearLogo}
                            disabled={isSubmitting || isProcessingAssets}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-bold transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                            Remove Logo
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors relative group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            disabled={isSubmitting || isProcessingAssets}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:scale-105 transition-transform duration-200 mb-2" />
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Click to upload brand logo</span>
                          <span className="text-[10px] text-zinc-400 mt-1 uppercase">Recommended: 120 x 40 px</span>
                        </div>
                      )}
                    </div>

                    {/* Website Favicon */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Tab Favicon (Square)</label>
                      
                      {faviconPreview ? (
                        <div className="space-y-3">
                          {/* Browser Mockup visual representation */}
                          <div className="border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 bg-zinc-50 dark:bg-zinc-950/40 flex flex-col items-center justify-center">
                            <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block mb-3 text-center">Browser Tab Mockup</span>
                            
                            <div className="w-48 bg-zinc-200 dark:bg-zinc-800 rounded-t-lg border-b-0 border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 flex items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={faviconPreview} alt="Favicon Preview" className="w-3.5 h-3.5 object-contain" />
                              <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 truncate font-semibold">EasyKart Tab</span>
                            </div>
                            <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 border-t border-zinc-300 dark:border-zinc-700" />
                          </div>
                          
                          <button
                            type="button"
                            onClick={clearFavicon}
                            disabled={isSubmitting || isProcessingAssets}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-bold transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                            Remove Favicon
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors relative group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFaviconChange}
                            disabled={isSubmitting || isProcessingAssets}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:scale-105 transition-transform duration-200 mb-2" />
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Click to upload favicon</span>
                          <span className="text-[10px] text-zinc-400 mt-1 uppercase">Auto scaled to square 64px</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SOCIAL HANDLES */}
              {activeTab === 'social' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-zinc-100 dark:border-zinc-800/40 pb-4">
                    <h3 className="font-extrabold text-base text-zinc-800 dark:text-zinc-200">Social Integration profiles</h3>
                    <p className="text-[10px] text-zinc-400">Configure outbound redirection profiles linked in headers/footers.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Facebook */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Facebook Link</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                          <FacebookIcon className="w-4.5 h-4.5" />
                        </div>
                        <input
                          type="url"
                          placeholder="https://facebook.com/yourpage"
                          disabled={isSubmitting || isProcessingAssets}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none transition-colors"
                          {...register('facebook')}
                        />
                      </div>
                      {errors.facebook && <p className="text-xs text-red-500 font-semibold">{errors.facebook.message}</p>}
                    </div>

                    {/* Twitter */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Twitter Link</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                          <TwitterIcon className="w-4.5 h-4.5" />
                        </div>
                        <input
                          type="url"
                          placeholder="https://twitter.com/yourhandle"
                          disabled={isSubmitting || isProcessingAssets}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none transition-colors"
                          {...register('twitter')}
                        />
                      </div>
                      {errors.twitter && <p className="text-xs text-red-500 font-semibold">{errors.twitter.message}</p>}
                    </div>

                    {/* Instagram */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Instagram Link</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                          <InstagramIcon className="w-4.5 h-4.5" />
                        </div>
                        <input
                          type="url"
                          placeholder="https://instagram.com/yourhandle"
                          disabled={isSubmitting || isProcessingAssets}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none transition-colors"
                          {...register('instagram')}
                        />
                      </div>
                      {errors.instagram && <p className="text-xs text-red-500 font-semibold">{errors.instagram.message}</p>}
                    </div>

                    {/* Youtube */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">YouTube Link</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                          <YoutubeIcon className="w-4.5 h-4.5" />
                        </div>
                        <input
                          type="url"
                          placeholder="https://youtube.com/c/yourchannel"
                          disabled={isSubmitting || isProcessingAssets}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none transition-colors"
                          {...register('youtube')}
                        />
                      </div>
                      {errors.youtube && <p className="text-xs text-red-500 font-semibold">{errors.youtube.message}</p>}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Form Footer Save controls */}
            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Encrypted Administration console</span>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || isProcessingAssets}
                className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-bold transition-all shadow-[0_4px_15px_rgba(139,92,246,0.2)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isSubmitting || isProcessingAssets ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isProcessingAssets ? 'Processing image canvas...' : 'Saving Changes...'}
                  </>
                ) : (
                  <>
                    Save Settings Configuration
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      )}
    </div>
  );
}
