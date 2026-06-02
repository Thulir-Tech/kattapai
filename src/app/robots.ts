import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const host = 'https://easykart.example.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/AdminPanel', 
        '/AdminPanel/*', 
        '/api/*', 
        '/_next/*'
      ]
    },
    sitemap: `${host}/sitemap.xml`
  };
}
