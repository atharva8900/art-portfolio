// Extract hostname from Supabase URL for remotePatterns
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL 
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname 
    : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // Restricted to specific hostnames to prevent SSRF and hotlinking
        // Note: transparenttextures.com used as CSS background only, no Next.js Image component needed
        remotePatterns: [
            {
                protocol: 'https',
                hostname: supabaseHostname,
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: '*.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '*.ggpht.com',
            },
        ],
    },
    // Jio DNS Fix: Proxy Supabase requests through Vercel
    async rewrites() {
        return [
            {
                source: '/_supabase/:path*',
                destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/:path*`,
            },
        ];
    },
    async redirects() {
        return [
            {
                source: '/commission',
                destination: '/client/dashboard',
                permanent: true,
            },
        ];
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google-analytics.com https://*.googletagmanager.com https://challenges.cloudflare.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.googleusercontent.com https://*.ggpht.com; connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src 'self' https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com; upgrade-insecure-requests;",
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            },
        ];
    },
    // Optimized dev performance on Windows/Tailwind
    webpack: (config, { dev }) => {
        if (dev) {
            config.watchOptions = {
                ...config.watchOptions,
                poll: 1000,
                aggregateTimeout: 300,
            };
        }
        return config;
    },
};

export default nextConfig;
