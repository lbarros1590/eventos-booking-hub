import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFAB from '@/components/WhatsAppFAB';
import HeroSection from '@/components/landing/HeroSection';
import AmenitiesSection from '@/components/landing/AmenitiesSection';
import PricingSection from '@/components/landing/PricingSection';
import LocationSection from '@/components/landing/LocationSection';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <AmenitiesSection />
        <PricingSection />
        <LocationSection />
      </main>
      <Footer />
      <WhatsAppFAB />
    </div>
  );
};

export default Index;
