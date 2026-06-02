import { MetadataRoute } from 'next';
import { ProductService } from '@/services/product.service';
import { CategoryService } from '@/services/category.service';
import { BlogService } from '@/services/blog.service';

export const revalidate = 3600; // Cache sitemap XML statically for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = 'https://easykart.example.com';

  let products: any[] = [];
  let categories: any[] = [];
  let blogs: any[] = [];

  try {
    const [fetchedProducts, fetchedCategories, fetchedBlogs] = await Promise.all([
      ProductService.getAllProducts(),
      CategoryService.getAllCategories(),
      BlogService.getAllBlogs()
    ]);
    products = fetchedProducts;
    categories = fetchedCategories;
    blogs = fetchedBlogs;
  } catch (e) {
    console.error('Failed fetching dynamic collections for sitemap generation:', e);
  }

  // Core Static Pages
  const routes = [
    '',
    '/products',
    '/blog'
  ].map(route => ({
    url: `${host}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8
  }));

  // Dynamic Active Product review guides
  const productEntries = products
    .filter(p => p.status === 'active')
    .map(p => ({
      url: `${host}/product/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7
    }));

  // Dynamic Category filter catalogue routes
  const categoryEntries = categories.map(c => ({
    url: `${host}/products?category=${c.slug}`,
    lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6
  }));

  // Dynamic Published Blog articles
  const blogEntries = blogs
    .filter(b => b.status === 'published')
    .map(b => ({
      url: `${host}/blog/${b.slug}`,
      lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6
    }));

  return [...routes, ...productEntries, ...categoryEntries, ...blogEntries];
}
