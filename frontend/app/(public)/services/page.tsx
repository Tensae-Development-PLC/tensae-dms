'use client'

import { motion } from 'framer-motion'
import { Globe, ShoppingCart, Building2, FileText, Palette, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const services = [
  {
    icon: Globe,
    title: 'Web Development',
    description: 'Custom web applications built with modern technologies for optimal performance, scalability, and user experience.',
    useCase: 'A healthcare provider needed a patient portal that could handle 100K+ daily users with real-time appointment scheduling.',
    features: ['React & Next.js', 'API Development', 'Cloud Infrastructure', 'Performance Optimization'],
    color: 'primary',
  },
  {
    icon: ShoppingCart,
    title: 'E-commerce Solutions',
    description: 'End-to-end digital commerce platforms with secure payments, inventory management, and analytics dashboards.',
    useCase: 'An international retailer transformed their online presence, achieving 300% increase in conversion rates.',
    features: ['Custom Storefronts', 'Payment Integration', 'Inventory Systems', 'Analytics & Reporting'],
    color: 'accent',
  },
  {
    icon: Building2,
    title: 'ERP Systems',
    description: 'Enterprise resource planning solutions that integrate all aspects of your business operations into a unified system.',
    useCase: 'A manufacturing company streamlined operations across 15 facilities, reducing overhead by 40%.',
    features: ['Financial Management', 'HR & Payroll', 'Supply Chain', 'Business Intelligence'],
    color: 'chart-3',
  },
  {
    icon: FileText,
    title: 'DMS Solutions',
    description: 'Comprehensive document management systems for secure storage, smart search, workflow automation, and compliance.',
    useCase: 'A legal firm digitized 2 million documents, reducing retrieval time from hours to seconds.',
    features: ['Secure Storage', 'Smart Search', 'Workflow Automation', 'Compliance Tools'],
    color: 'chart-4',
  },
  {
    icon: Palette,
    title: 'UI/UX Design',
    description: 'User-centered design services that create intuitive, accessible, and visually stunning digital experiences.',
    useCase: 'A fintech startup redesigned their app, resulting in 50% increase in user engagement and retention.',
    features: ['User Research', 'Wireframing', 'Visual Design', 'Usability Testing'],
    color: 'primary',
  },
]

export default function ServicesPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Our Services
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
              Digital Solutions for Modern Enterprises
            </h1>
            <p className="text-lg text-muted-foreground">
              From web development to document management, we deliver end-to-end 
              solutions that drive digital transformation and business growth.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services List */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: "-100px" }}
                className="group"
              >
                <div className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Content */}
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className={`w-14 h-14 rounded-xl bg-${service.color}/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <service.icon className={`w-7 h-7 text-${service.color}`} />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                      {service.title}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      {service.description}
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      {service.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" className="group/btn" asChild>
                      <Link href="/contact">
                        Learn More
                        <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>

                  {/* Use Case Card */}
                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                    <div className="relative p-6 lg:p-8 rounded-2xl glass-card">
                      <div className="absolute top-0 right-0 px-4 py-2 rounded-bl-xl rounded-tr-xl bg-accent/10 text-accent text-xs font-medium">
                        Real-World Impact
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-4 mt-4">
                        Use Case
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {service.useCase}
                      </p>
                      
                      {/* Decorative Element */}
                      <div className={`absolute -bottom-4 -right-4 w-32 h-32 bg-${service.color}/10 rounded-full blur-2xl`} />
                    </div>
                  </div>
                </div>

                {/* Separator */}
                {index < services.length - 1 && (
                  <div className="mt-16 border-t border-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-card/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center p-8 lg:p-16 rounded-3xl glass-card relative overflow-hidden"
          >
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Ready to Start Your Project?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Let&apos;s discuss how we can help transform your business with our 
                comprehensive digital solutions.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="glow-primary" asChild>
                  <Link href="/contact">
                    Start a Project
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/dashboard">View Demo</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
