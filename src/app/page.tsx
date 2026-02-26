import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Portfolio from '@/components/Portfolio';
import Testimonials from '@/components/Testimonials';
import CommissionCTA from '@/components/CommissionCTA';

import Timeline from '@/components/Timeline';
import Categories from '@/components/Categories';
import Pricing from '@/components/Pricing';
import FAQ from '@/components/FAQ';
import CommissionForm from '@/components/CommissionForm';
import Footer from '@/components/Footer';
import ReferralTracker from '@/components/ReferralTracker';
import ReferralGenerator from '@/components/ReferralGenerator';
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
