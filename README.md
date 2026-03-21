<div align="center">

# ✦ Atharva Sherlekar Art ✦

### *A full-stack commission platform for a professional graphite portrait artist.*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.io/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?style=for-the-badge&logo=vercel)](https://vercel.com/)

**[🌐 Live Site](https://atharvasherlekar.art)** · **[📸 Instagram](https://www.instagram.com/atharva_sherlekar_art/)**

</div>

---

## 🎨 Overview

This is not just a portfolio — it's a **complete, production-grade commission management platform** built from the ground up for a professional graphite portrait artist. It handles everything from the first website visit (with a smooth custom cursor and lenis scroll) to the final Razorpay payment, artist-to-client communication, and referral payouts.

The site is designed to feel as premium as the artwork itself: a dark-first design with glassmorphism effects, micro-animations via Framer Motion, GSAP-powered hero text, and a fully custom interactive Art Visualizer.

---

## ✨ Key Features

### 🖼️ Art Studio Visualizer
An interactive pre-commission tool where visitors can upload their own reference photo, instantly preview it with a graphite-shading filter, and configure a custom frame with matting thickness, width, orientation, and frame style. The finalized design snapshot is automatically embedded in the commission order.

### 🤖 AI Art Assistant
A floating, context-aware chatbot powered by **Google Gemini** (via the AI SDK) that can answer questions about pricing, sizing, the commission process, and estimated delivery times. Built with a daily message limit (25/day per visitor) and a 15-second cooldown to prevent abuse.

### 💸 Referral Program with Payout System
A full end-to-end referral engine:
- Users sign in and generate a unique referral link (protected by Cloudflare Turnstile).
- The link tracks the referrer across sessions via URL params and `sessionStorage`.
- Self-referral is blocked via browser fingerprinting (`FingerprintJS`) and a localStorage lock.
- Referrers earn **20% commission** on confirmed artwork prices.
- Each referral link expires after **3 successful commissions**.
- Referrers can request payouts via their personal dashboard, and the admin can approve and mark them as paid.

### 🛒 Commission Form with Razorpay Integration
A multi-step commission form that:
- Dynamically calculates the estimated price based on size, number of people, add-ons (detailed background, timelapse, framing), and group discounts.
- Charges a **25% reservation fee** upfront via Razorpay before the order is confirmed.
- Accepts image reference attachments (uploaded to Supabase Storage).
- Supports promo/offer codes with configurable discounts.
- Integrates the Cloudflare Turnstile CAPTCHA widget for bot protection.

### 🛡️ Admin Dashboard
A full-featured, password-protected management interface for the artist:
- View all commission orders with full client details and payment status.
- Manage commission status (`pending` → `accepted` → `completed`).
- Send payment links (final 75%) directly to clients via Razorpay.
- Process refunds on cancelled orders.
- Approve/reject referral payout requests.
- Manage the live commission availability toggle (open, waitlist, closed), including slot counts and closure reasons.
- View and manage Promo/Offer codes.
- Export commission reports as PDF.

### 👤 Client Dashboard
A personal dashboard that appears after a user completes a commission, showing a live status tracker with real-time commission stages (`pending` → `accepted` → `completed`). Clients can also view their commission history and request refunds if applicable.

### 🔒 Security & Bot Protection
- **Cloudflare Turnstile** (CAPTCHA) for all public-facing form submissions (commissions, referral generation).
- **Supabase Row Level Security (RLS)** policies on all tables — no sensitive data is publicly readable.
- **Server-side token validation** via the Turnstile secret key API.
- **Browser Fingerprinting** to detect and block self-referral abuse.
- All admin routes are protected by a custom admin authentication middleware.
- All API routes validate inputs using **Zod** schemas.

### 🎭 Premium UI & Animations
- **Custom Pencil/Eraser Cursor**: Animated cursor that automatically hides on interactive form elements.
- **Lenis Smooth Scroll**: Buttery-smooth scrolling throughout the entire site.
- **Framer Motion**: Page transitions, scroll-reveal animations, and micro-interactions on every interactive element.
- **GSAP**: Hero section text animations with `SplitText`.
- **Film Grain Overlay**: CSS-based noise texture for a premium aesthetic feel.
- **Dark / Light Mode**: Full system-aware theming via `next-themes`.
- **Geist & Cinzel Fonts**: Premium Google Fonts loaded with `next/font` for zero layout shift.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, Server & Client Components) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3, CSS Variables (Dark/Light theme tokens) |
| **Database** | Supabase (PostgreSQL with RLS) |
| **Authentication** | NextAuth.js v4 (Google OAuth + Magic Link Email) |
| **Payments** | Razorpay (Orders, Webhooks, Refunds, Payment Links) |
| **AI** | Google Gemini via AI SDK (`@ai-sdk/google`) |
| **Animation** | Framer Motion, GSAP (`@gsap/react`) |
| **3D / Graphics** | Three.js (for advanced visual effects) |
| **Bot Protection** | Cloudflare Turnstile |
| **Fingerprinting** | FingerprintJS |
| **Email** | Nodemailer (Gmail transport) |
| **Notifications** | Discord Webhook |
| **Analytics** | Vercel Analytics, Vercel Speed Insights, Google Analytics |
| **Deployment** | Vercel |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # All server-side API routes
│   │   ├── admin/        # Admin CRUD, payment links, refunds, payout approval
│   │   ├── auth/         # NextAuth handler
│   │   ├── commissions/  # Commission form submission
│   │   ├── offers/       # Promo code validation
│   │   ├── razorpay/     # Order creation & payment webhook
│   │   └── referrals/    # Referral link creation & validation
│   ├── admin/            # Admin dashboard pages
│   ├── client/           # Client dashboard pages
│   ├── commission-process/ # Detailed commission guide page
│   ├── layout.tsx        # Root layout with all providers
│   └── page.tsx          # Homepage
│
├── components/
│   ├── admin/            # Admin UI components (tables, modals)
│   ├── auth/             # Auth forms and provider wrapper
│   ├── features/         # Major interactive features
│   │   ├── ArtVisualizer.tsx    # Interactive frame & art preview tool
│   │   ├── ChatWidget.tsx       # AI chatbot floating widget
│   │   ├── CustomCursor.tsx     # Animated pencil/eraser cursor
│   │   ├── GrainOverlay.tsx     # Film grain aesthetic overlay
│   │   ├── ReferralGenerator.tsx # Referral link + QR code generator
│   │   └── ReferralTracker.tsx  # Referral session tracker
│   ├── forms/
│   │   └── CommissionForm.tsx   # Full commission + payment form
│   ├── layout/           # Navbar, Footer, SmoothScroll
│   ├── sections/         # Homepage sections (Hero, Portfolio, Pricing, etc.)
│   ├── shared/           # Reusable: SafeTurnstile, ThemeProvider, CTA
│   └── ui/               # Primitives: ColorPicker, ConfirmationModal
│
├── lib/
│   ├── api/              # Server-side helpers (Discord, Email)
│   ├── auth/             # NextAuth config and adapter
│   ├── db/               # Supabase database query functions
│   ├── supabase/         # Client, server, and admin Supabase instances
│   └── utils/            # Pricing calculator, general utilities
│
└── supabase/
    ├── schema.sql         # Initial database schema & RLS policies
    └── migration.sql      # Subsequent schema migrations
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/atharva8900/art-portfolio.git
cd art-portfolio
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXTAUTH_URL` | Your site URL (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | A random 32+ char secret string |
| `GOOGLE_CLIENT_ID` | Google OAuth App Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth App Client Secret |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API Key Secret |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile Site Key |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile Secret Key |
| `DISCORD_WEBHOOK_URL` | Discord webhook for order notifications |
| `GMAIL_USER` | Gmail address for transactional emails |
| `GMAIL_PASS` | Gmail App-Specific Password |

### 3. Set up Supabase

Run the SQL scripts in your Supabase SQL editor in the following order:

1. `supabase/schema.sql` — Creates all tables and RLS policies.
2. `supabase/migration.sql` — Applies subsequent schema updates.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📜 License

This project and its source code are proprietary to **Atharva Sherlekar Art**. All rights reserved.
