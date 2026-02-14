import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Portfolio from '@/components/Portfolio';
import Pricing from '@/components/Pricing';
import CommissionForm from '@/components/CommissionForm';
import Footer from '@/components/Footer';
import ReferralTracker from '@/components/ReferralTracker';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <ReferralTracker />
      <Navbar />
      <Hero />
      <About />
      <Portfolio />
      <Pricing />
      <CommissionForm />
      <Footer />
    </main>
  );
}
