import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://atharva-sherlekar-art.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/client/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
