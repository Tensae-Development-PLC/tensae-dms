'use client'

import { useMemo } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const requirements = useMemo(() => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password])

  const strength = useMemo(() => {
    const metCount = requirements.filter(r => r.met).length
    if (metCount === 0) return { label: '', color: '', width: '0%' }
    if (metCount <= 2) return { label: 'Weak', color: 'bg-destructive', width: '25%' }
    if (metCount <= 3) return { label: 'Fair', color: 'bg-yellow-500', width: '50%' }
    if (metCount <= 4) return { label: 'Good', color: 'bg-accent', width: '75%' }
    return { label: 'Strong', color: 'bg-primary', width: '100%' }
  }, [requirements])

  if (!password) return null

  return (
    <div className="space-y-3 mt-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Password strength</span>
          <span className={cn(
            "text-xs font-medium",
            strength.label === 'Weak' && 'text-destructive',
            strength.label === 'Fair' && 'text-yellow-500',
            strength.label === 'Good' && 'text-accent',
            strength.label === 'Strong' && 'text-primary',
          )}>
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300", strength.color)}
            style={{ width: strength.width }}
          />
        </div>
      </div>

      {/* Requirements */}
      <ul className="space-y-1">
        {requirements.map((req) => (
          <li key={req.label} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="w-3.5 h-3.5 text-primary" />
            ) : (
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className={cn(
              req.met ? 'text-muted-foreground' : 'text-muted-foreground/60'
            )}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
