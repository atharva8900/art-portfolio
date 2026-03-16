import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Portfolio from '@/components/sections/Portfolio';
import Testimonials from '@/components/sections/Testimonials';
import CommissionCTA from '@/components/shared/CommissionCTA';

import Timeline from '@/components/sections/Timeline';
import Categories from '@/components/sections/Categories';
import Pricing from '@/components/sections/Pricing';
import FAQ from '@/components/sections/FAQ';
import CommissionForm from '@/components/forms/CommissionForm';
import Footer from '@/components/layout/Footer';
import ReferralTracker from '@/components/features/ReferralTracker';
import ReferralGenerator from '@/components/features/ReferralGenerator';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commission Custom Hand-Drawn Portraits',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <ReferralTracker />
      <Navbar />
      <Hero />
      <About />
      <Portfolio />
      <Testimonials />
      <CommissionCTA />
      {/* <Process /> - Moved video to About section */}
      <Categories />
      <Timeline />
      <Pricing />
      <ReferralGenerator />
      <CommissionForm />
      <FAQ />
      <Footer />
    </main>
  );
}

