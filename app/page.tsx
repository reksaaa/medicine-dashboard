import Hero from '@/components/landing/Hero'
import About from '@/components/landing//About'
import Features from '@/components/landing/Features'
import CTA from '@/components/landing/CTA'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <About />
      <Features />
      <CTA />
    </main>
  )
}

