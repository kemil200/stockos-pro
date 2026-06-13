import { type MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stockos-pro.vercel.app';
  const now = new Date();

  const staticRoutes = [
    { path: '', priority: 1, freq: 'weekly' as const },
    { path: '/sign-in', priority: 0.5, freq: 'monthly' as const },
    { path: '/sign-up', priority: 0.8, freq: 'monthly' as const },
    { path: '/forgot-password', priority: 0.3, freq: 'monthly' as const },
  ];

  return staticRoutes.map(({ path, priority, freq }) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: freq,
    priority,
    alternates: {
      languages: { fr: `${baseUrl}${path}` },
    },
  }));
}
