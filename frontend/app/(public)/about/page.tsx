'use client'

import { motion } from 'framer-motion'
import { Target, Eye, Award, Users, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const whyChooseUs = [
  {
    title: 'Enterprise Security',
    description: 'Bank-grade encryption and compliance with industry standards including SOC 2 and GDPR.',
  },
  {
    title: 'Scalable Architecture',
    description: 'Built to grow with your organization, handling millions of documents effortlessly.',
  },
  {
    title: 'Expert Support',
    description: '24/7 dedicated support team with average response time under 15 minutes.',
  },
  {
    title: 'Seamless Integration',
    description: 'Connect with your existing tools through our robust API and pre-built integrations.',
  },
]

const teamImages = [
  { id: 1, title: 'Engineering Team', description: 'Building the future of document management' },
  { id: 2, title: 'Design Studio', description: 'Creating intuitive user experiences' },
  { id: 3, title: 'Customer Success', description: 'Dedicated to your success' },
]

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              About Us
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
              Transforming How Organizations Manage Documents
            </h1>
            <p className="text-lg text-muted-foreground">
              Tensae DMS was founded with a simple mission: to help organizations 
              eliminate paper chaos and embrace digital efficiency. Today, we serve 
              hundreds of enterprise clients worldwide.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 lg:py-32 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="p-8 lg:p-10 rounded-2xl glass-card"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                To create a world where every organization, regardless of size, has access 
                to enterprise-grade document management solutions. We envision paperless 
                workplaces where information flows freely, securely, and efficiently.
              </p>
            </motion.div>

            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="p-8 lg:p-10 rounded-2xl glass-card"
            >
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To empower businesses with intuitive, secure, and scalable document 
                management solutions that streamline operations, ensure compliance, 
                and drive productivity across teams and departments.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              Why Choose Tensae
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Built for Enterprise Excellence
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We combine cutting-edge technology with deep industry expertise to deliver 
              solutions that exceed expectations.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex gap-4 p-6 rounded-xl border border-border hover:border-primary/30 bg-card/50 hover:bg-card transition-all duration-300"
              >
                <CheckCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Carousel */}
      <section className="py-20 lg:py-32 bg-card/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Our Team
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Meet the People Behind Tensae
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A diverse team of engineers, designers, and industry experts working 
              together to revolutionize document management.
            </p>
          </motion.div>
        </div>

        {/* Image Carousel */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="flex justify-center gap-6 px-4"
          >
            {teamImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="group relative w-full max-w-sm shrink-0"
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary">
                  {/* Placeholder for team image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Users className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{image.title}</h3>
                      <p className="text-sm text-muted-foreground">{image.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Ready to Transform Your Document Management?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join hundreds of organizations that trust Tensae DMS for their document 
              management needs.
            </p>
            <Button size="lg" className="glow-primary" asChild>
              <Link href="/contact">
                Get in Touch
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
