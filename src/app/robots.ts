import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/utils/utils';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/availability', '/api/pricing-tier', '/api/auth/session'],
      disallow: ['/admin/', '/client/', '/api/auth/', '/api/admin/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
