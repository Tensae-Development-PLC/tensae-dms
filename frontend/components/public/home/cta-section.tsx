'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const benefits = [
  'Free consultation call',
  'Custom solution design',
  'Dedicated support team',
  '99.9% uptime guarantee',
]

export function CTASection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-accent/20" />
          <div className="absolute inset-0 glass" />
          
          {/* Glow Effects */}
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-accent/30 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative z-10 px-6 py-12 lg:px-16 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Left Side */}
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  viewport={{ once: true }}
                  className="text-3xl lg:text-5xl font-bold text-foreground mb-4 text-balance"
                >
                  Start Digitizing Your Documents Today
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                  className="text-lg text-muted-foreground mb-8"
                >
                  Join hundreds of organizations that have transformed their document 
                  management with Tensae DMS. Get started in minutes.
                </motion.p>

                {/* Benefits */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
                >
                  {benefits.map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                      <span className="text-sm text-foreground">{benefit}</span>
                    </div>
                  ))}
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Button size="lg" className="glow-primary text-base px-8" asChild>
                    <Link href="/contact">
                      Get Started Now
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </motion.div>
              </div>

              {/* Right Side - Stats Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                viewport={{ once: true }}
                className="hidden lg:block"
              >
                <div className="relative p-8 rounded-2xl glass-card">
                  <div className="text-center mb-8">
                    <div className="text-5xl font-bold gradient-text mb-2">10,000+</div>
                    <div className="text-muted-foreground">Documents Managed Daily</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-secondary/50 text-center">
                      <div className="text-2xl font-bold text-foreground">50+</div>
                      <div className="text-xs text-muted-foreground">Enterprise Clients</div>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/50 text-center">
                      <div className="text-2xl font-bold text-foreground">99.9%</div>
                      <div className="text-xs text-muted-foreground">Uptime</div>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/50 text-center">
                      <div className="text-2xl font-bold text-foreground">24/7</div>
                      <div className="text-xs text-muted-foreground">Support</div>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/50 text-center">
                      <div className="text-2xl font-bold text-foreground">100%</div>
                      <div className="text-xs text-muted-foreground">Secure</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
