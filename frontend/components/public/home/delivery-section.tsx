'use client'

import { motion } from 'framer-motion'
import { Shield, FolderSearch, Share2, FileCheck } from 'lucide-react'

const deliveryItems = [
  {
    icon: Shield,
    title: 'Secure by Default',
    description:
      'Every workspace is tenant-isolated with role-based permissions, signed downloads, and audit logging built in.',
    stats: { value: '100%', label: 'Tenant isolation' },
  },
  {
    icon: FolderSearch,
    title: 'Find Files Fast',
    description:
      'Folders, search, favorites, and archives help teams locate the right document without digging through email threads.',
    stats: { value: 'Seconds', label: 'To find a file' },
  },
  {
    icon: Share2,
    title: 'Controlled Sharing',
    description:
      'Share links with expiry, preview-only access for viewers, and team invites with custom roles.',
    stats: { value: 'Flexible', label: 'Access controls' },
  },
  {
    icon: FileCheck,
    title: 'Compliance Ready',
    description:
      'Retention settings, IP rules, storage quotas, and activity logs support governance and accountability.',
    stats: { value: 'Full', label: 'Audit trail' },
  },
]

export function DeliverySection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Why Tensae DMS
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Built for Secure Document Operations
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From upload to sharing, every part of the platform is designed around how teams
            actually store, find, and govern documents.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {deliveryItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative h-full p-6 lg:p-8 rounded-2xl border border-border bg-card/50 hover:border-accent/30 hover:bg-card transition-all duration-300">
                <div className="flex items-start gap-5">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                    <item.icon className="w-6 h-6 text-accent" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{item.description}</p>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold gradient-text">{item.stats.value}</span>
                      <span className="text-xs text-muted-foreground">{item.stats.label}</span>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute top-1/3 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2" />
      <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2" />
    </section>
  )
}
