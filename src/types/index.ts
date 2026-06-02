export type UserRole = 'admin' | 'user';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageURL?: string;
  parentCategoryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  mainImage: string;
  images: string[];
  affiliateLink: string; // Amazon affiliate link with affiliate tag
  price: number;
  rating: number;
  reviewsCount: number;
  categoryId: string;
  specifications: Record<string, string>;
  pros: string[];
  cons: string[];
  isFeatured: boolean;
  status: 'active' | 'draft';
  amazonProductId: string; // ASIN (Amazon Standard Identification Number)
  createdAt: string;
  updatedAt: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string; // Rich text / Markdown content
  excerpt: string;
  featuredImage: string;
  authorId: string;
  status: 'draft' | 'published';
  publishedAt?: string;
  categoryIds: string[];
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
  readTime: number; // estimated read time in minutes
}

export interface AffiliateClick {
  id: string;
  productId: string;
  affiliateLink: string;
  userId?: string | null; // null if anonymous user clicked
  ipAddress: string;
  userAgent: string;
  referrer: string;
  timestamp: string;
}

export interface SiteSettings {
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  contactEmail: string;
  amazonAffiliateTag: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  logoURL?: string;
  faviconURL?: string;
  themeColor?: string;
  updatedAt: string;
}
