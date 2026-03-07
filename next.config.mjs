/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: '**',
            },
        ],
    },
    // Jio DNS Fix: Proxy Supabase requests through Vercel
    async rewrites() {
        return [
            {
                source: '/_supabase/:path*',
                destination: 'https://appfiheckvfptasvkily.supabase.co/:path*',
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
    // Force CSS/Tailwind to recompile correctly on Windows
    webpack: (config, { dev }) => {
        if (dev) {
            config.cache = false;
        }
        return config;
    },
};

export default nextConfig;
