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
