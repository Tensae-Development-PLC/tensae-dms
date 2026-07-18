'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { FileText, Database, LayoutDashboard, Workflow } from 'lucide-react'

const cards = [
  {
    icon: FileText,
    title: 'Document Management',
    description: 'Secure storage and organization',
    color: 'from-primary/20 to-primary/5',
    glowColor: 'oklch(0.75 0.18 195 / 0.3)',
  },
  {
    icon: Database,
    title: 'Business Systems',
    description: 'Integrated enterprise solutions',
    color: 'from-accent/20 to-accent/5',
    glowColor: 'oklch(0.72 0.19 160 / 0.3)',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboards',
    description: 'Real-time analytics and insights',
    color: 'from-chart-3/20 to-chart-3/5',
    glowColor: 'oklch(0.70 0.17 280 / 0.3)',
  },
  {
    icon: Workflow,
    title: 'Workflow Automation',
    description: 'Streamlined business processes',
    color: 'from-chart-4/20 to-chart-4/5',
    glowColor: 'oklch(0.80 0.15 85 / 0.3)',
  },
]

function FloatingCard({ card, index }: { card: typeof cards[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseX = useSpring(x, { stiffness: 500, damping: 50 })
  const mouseY = useSpring(y, { stiffness: 500, damping: 50 })

  const rotateX = useTransform(mouseY, [-100, 100], [10, -10])
  const rotateY = useTransform(mouseX, [-100, 100], [-10, 10])

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set(e.clientX - centerX)
    y.set(e.clientY - centerY)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className="group cursor-pointer"
    >
      <motion.div
        whileHover={{ scale: 1.05, z: 50 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`relative p-6 lg:p-8 rounded-2xl glass-card overflow-hidden`}
        style={{
          boxShadow: `0 0 30px ${card.glowColor}`,
        }}
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
        
        {/* Shimmer Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-xl bg-background/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <card.icon className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{card.title}</h3>
          <p className="text-sm text-muted-foreground">{card.description}</p>
        </div>

        {/* Corner Glow */}
        <div 
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity"
          style={{ background: card.glowColor }}
        />
      </motion.div>
    </motion.div>
  )
}

export function FloatingCards3D() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Section Title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Comprehensive Digital Solutions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From document management to business automation, we provide end-to-end solutions 
            tailored to your enterprise needs.
          </p>
        </motion.div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: '1000px' }}>
          {cards.map((card, index) => (
            <FloatingCard key={card.title} card={card} index={index} />
          ))}
        </div>
      </div>

      {/* Background Decorations */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
    </section>
  )
}
