import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://atharva-sherlekar-art.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/availability', '/api/pricing-tier', '/api/auth/session'],
      disallow: ['/admin/', '/client/', '/api/auth/', '/api/admin/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
