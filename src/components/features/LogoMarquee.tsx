'use client';
import { motion } from 'framer-motion';

const logos = [
  { name: 'Vercel', src: '/logos/vercel.svg' },
  { name: 'OpenAI', src: '/logos/openai-icon.svg' },
  { name: 'Claude', src: '/logos/claude.svg' },
  { name: 'Gemini', src: '/logos/google-gemini.svg' },
  { name: 'Supabase', src: '/logos/supabase.svg' },
  { name: 'Cloudflare', src: '/logos/cloudflare.svg' },
  { name: 'GitHub', src: '/logos/github-icon.svg' },
  { name: 'Gmail', src: '/logos/google-gmail.svg' },
  {
    name: 'Resend',
    color: '#000000',
    path: 'M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zM8.5 7.5v9h2v-3.5h2l2.5 3.5h2.5l-3-4c1.5-.5 2-1.5 2-2.5 0-1.5-1-2.5-3-2.5h-5zM10.5 9h2c.5 0 1 .5 1 1s-.5 1-1 1h-2V9z',
  },
  { name: 'Razorpay', src: '/logos/razorpay-icon.svg' },
  { name: 'Antigravity', src: '/logos/antigravity-color.svg' },
];

export function LogoMarquee() {
  return (
    <div className="w-full pt-12 pb-16 relative overflow-hidden">
      <p className="text-center text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-10 font-medium">
        Website built on using trusted tools
      </p>

      {/* Marquee track */}
      <div className="relative flex overflow-hidden py-8 bg-neutral-50 dark:bg-neutral-200 border-y border-neutral-200 dark:border-neutral-300">
        <motion.div
          className="flex shrink-0 gap-16 items-center"
          style={{ willChange: 'transform' }}
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
        >
          {[...logos, ...logos].map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex items-center justify-center"
              style={{ minWidth: 'max-content' }}
            >
              {logo.src ? (
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="h-8 w-auto object-contain transition-all duration-500 hover:scale-110"
                  style={{ filter: 'grayscale(1)', opacity: 0.6, display: 'block' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'grayscale(0)';
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'grayscale(1)';
                    e.currentTarget.style.opacity = '0.6';
                  }}
                />
              ) : (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="shrink-0 transition-all duration-500 hover:scale-110 text-neutral-800"
                  style={{ filter: 'grayscale(1)', opacity: 0.6 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'grayscale(0)';
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.color = logo.color || 'currentColor';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'grayscale(1)';
                    e.currentTarget.style.opacity = '0.6';
                    e.currentTarget.style.color = '';
                  }}
                >
                  <path d={logo.path} />
                </svg>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
