'use client'

import { motion } from 'framer-motion'
import { Shield, Search, Workflow, FileCheck, Users, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const services = [
  {
    icon: Shield,
    title: 'Secure Document Storage',
    description:
      'Store files in isolated tenant workspaces with role-based access, signed downloads, virus scanning on upload, and full audit trails.',
    useCase:
      'A finance team replaced shared drives with Tensae DMS, giving each department its own workspace while keeping sensitive files access-controlled.',
    features: ['Tenant isolation', 'Role-based access', 'Signed downloads', 'Upload virus scan'],
    iconClass: 'text-primary',
    iconBgClass: 'bg-primary/10',
    glowClass: 'bg-primary/10',
  },
  {
    icon: Search,
    title: 'Search & Organization',
    description:
      'Organize documents in folders, search by name, mark favorites, and archive files you no longer need in day-to-day work.',
    useCase:
      'An operations team cut document lookup time from minutes to seconds by using folders, search, and favorites across thousands of files.',
    features: ['Folder structure', 'Filename search', 'Favorites', 'Archive & restore'],
    iconClass: 'text-accent',
    iconBgClass: 'bg-accent/10',
    glowClass: 'bg-accent/10',
  },
  {
    icon: Workflow,
    title: 'Workflow Automation',
    description:
      'Define document workflows, track activity, and keep teams aligned on reviews, approvals, and recurring document processes.',
    useCase:
      'A compliance team set up approval workflows so every policy document is reviewed and logged before publication.',
    features: ['Custom workflows', 'Activity tracking', 'Notifications', 'Team visibility'],
    iconClass: 'text-primary',
    iconBgClass: 'bg-primary/10',
    glowClass: 'bg-primary/10',
  },
  {
    icon: FileCheck,
    title: 'Compliance & Audit',
    description:
      'Meet retention and governance needs with audit logs, IP access rules, storage quotas, and configurable workspace security settings.',
    useCase:
      'An HR department used audit logs and retention settings to demonstrate who accessed personnel files and when.',
    features: ['Audit logging', 'IP rules', 'Storage quotas', 'Security settings'],
    iconClass: 'text-accent',
    iconBgClass: 'bg-accent/10',
    glowClass: 'bg-accent/10',
  },
  {
    icon: Users,
    title: 'Sharing & Collaboration',
    description:
      'Invite teammates, assign roles, share links with optional expiry, and control whether recipients can preview or download files.',
    useCase:
      'A project team shared contract drafts via expiring links, allowing external partners to preview without downloading copies.',
    features: ['Email invites', 'Share links', 'Preview vs download', 'Role permissions'],
    iconClass: 'text-primary',
    iconBgClass: 'bg-primary/10',
    glowClass: 'bg-primary/10',
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
              DMS Capabilities
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
              Document Management Built for Your Team
            </h1>
            <p className="text-lg text-muted-foreground">
              Tensae DMS brings secure storage, smart organization, workflows, compliance tools,
              and collaboration into one platform — so your documents stay protected and easy to find.
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
                viewport={{ once: true, margin: '-100px' }}
                className="group"
              >
                <div
                  className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                >
                  {/* Content */}
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div
                      className={`w-14 h-14 rounded-xl ${service.iconBgClass} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <service.icon className={`w-7 h-7 ${service.iconClass}`} />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">{service.title}</h2>
                    <p className="text-muted-foreground mb-6">{service.description}</p>

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
                      <Link href="/register">
                        Get Started
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
                      <h3 className="text-lg font-semibold text-foreground mb-4 mt-4">Use Case</h3>
                      <p className="text-muted-foreground leading-relaxed">{service.useCase}</p>

                      <div className={`absolute -bottom-4 -right-4 w-32 h-32 ${service.glowClass} rounded-full blur-2xl`} />
                    </div>
                  </div>
                </div>

                {index < services.length - 1 && <div className="mt-16 border-t border-border" />}
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
                Ready to Manage Documents Better?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Create a workspace, invite your team, and start uploading documents securely in minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="glow-primary" asChild>
                  <Link href="/register">
                    Start Free
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
