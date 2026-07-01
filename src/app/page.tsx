import Hero from '@/app/components/hero/Hero';
import AtmosphereSection from '@/app/components/AtmosphereSection';
import WorkSection from '@/app/components/WorkSection';
import ServicesSection from './components/ServiceSection';
import ContactSection from './components/ContactSection';

export default function Home() {
  return (
    <>
      <Hero />
      <AtmosphereSection />
      <WorkSection />
      <ServicesSection/>
      <ContactSection />
    </>
  );
}
