'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Upload, Users, Shield, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface OnboardingChecklistProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const steps = [
  {
    id: 'upload',
    title: 'Upload your first document',
    description: 'Get started by uploading a document to your workspace.',
    icon: Upload,
    href: '/dashboard/upload',
  },
  {
    id: 'invite',
    title: 'Invite your team',
    description: 'Collaborate by inviting team members to your workspace.',
    icon: Users,
    href: '/dashboard/settings',
  },
  {
    id: 'roles',
    title: 'Set up roles & permissions',
    description: 'Control access by configuring roles for your team.',
    icon: Shield,
    href: '/dashboard/settings/roles',
  },
]

export function OnboardingChecklist({ open, onOpenChange }: OnboardingChecklistProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    )
  }

  const progress = (completedSteps.length / steps.length) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to Tensae DMS!</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Setup progress</span>
              <span className="font-medium text-foreground">{completedSteps.length}/{steps.length} completed</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id)
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer",
                    isCompleted 
                      ? "bg-primary/5 border-primary/20" 
                      : "bg-card border-border hover:border-primary/50"
                  )}
                  onClick={() => toggleStep(step.id)}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    isCompleted 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "font-medium",
                      isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {step.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Skip for now
            </Button>
            <Button 
              className="flex-1"
              onClick={() => {
                onOpenChange(false)
                window.location.href = '/dashboard/upload'
              }}
            >
              Get started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
