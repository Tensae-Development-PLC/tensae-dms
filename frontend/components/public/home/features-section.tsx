'use client'

import { motion } from 'framer-motion'
import { Shield, Search, Workflow, Smartphone } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Secure Document Storage',
    description: 'Multi-tenant isolation, signed downloads, role-based access, and audit trails protect your workspace files.',
    features: ['Tenant isolation', 'Role-based access', 'Audit trails'],
  },
  {
    icon: Search,
    title: 'Document Search',
    description: 'Find files quickly by name across your workspace folders.',
    features: ['Filename search', 'Folder browse', 'Favorites'],
  },
  {
    icon: Workflow,
    title: 'Team Collaboration',
    description: 'Invite teammates, assign roles, and share links with optional expiry.',
    features: ['Email invites', 'Share links', 'Activity log'],
  },
  {
    icon: Smartphone,
    title: 'Access Anywhere',
    description: 'Use Tensae DMS from any modern browser on desktop or mobile.',
    features: ['Responsive UI', 'Secure login', 'API keys'],
  },
]

export function FeaturesSection() {
  return (
    <section className="relative py-20 lg:py-32 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            DMS Features
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Everything You Need for Document Excellence
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive document management system provides all the tools 
            you need to organize, secure, and collaborate on documents.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="relative p-6 lg:p-8 rounded-2xl glass-card hover:border-primary/30 transition-all duration-300 h-full">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {feature.description}
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-2">
                  {feature.features.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), oklch(0.75 0.18 195 / 0.1), transparent 40%)',
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  )
}
