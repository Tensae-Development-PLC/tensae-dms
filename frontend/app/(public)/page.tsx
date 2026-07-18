'use client'

import { HeroSection } from '@/components/public/home/hero-section'
import { FloatingCards3D } from '@/components/public/home/floating-cards-3d'
import { FeaturesSection } from '@/components/public/home/features-section'
import { DeliverySection } from '@/components/public/home/delivery-section'
import { CTASection } from '@/components/public/home/cta-section'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FloatingCards3D />
      <FeaturesSection />
      <DeliverySection />
      <CTASection />
    </>
  )
}
