'use client'

import { useState } from 'react'
import { Shield, Copy, Check, Smartphone, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface TwoFactorSetupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const backupCodes = [
  'XXXX-XXXX-XXXX',
  'YYYY-YYYY-YYYY',
  'ZZZZ-ZZZZ-ZZZZ',
  'AAAA-AAAA-AAAA',
  'BBBB-BBBB-BBBB',
  'CCCC-CCCC-CCCC',
  'DDDD-DDDD-DDDD',
  'EEEE-EEEE-EEEE',
]

export function TwoFactorSetup({ open, onOpenChange }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleVerify = async () => {
    if (verificationCode.length !== 6) return
    
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setStep('backup')
  }

  const handleComplete = () => {
    onOpenChange(false)
    setStep('setup')
    setVerificationCode('')
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {step === 'setup' && 'Scan the QR code with your authenticator app'}
            {step === 'verify' && 'Enter the 6-digit code from your authenticator app'}
            {step === 'backup' && 'Save your backup codes in a secure location'}
          </DialogDescription>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-6 py-4">
            {/* QR Code Placeholder */}
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center p-4">
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Smartphone className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">QR Code</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {"Can't scan? Enter this code manually:"}
              </p>
              <div className="flex items-center justify-center gap-2">
                <code className="px-3 py-1.5 bg-muted rounded text-sm font-mono">
                  ABCD EFGH IJKL MNOP
                </code>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button className="w-full" onClick={() => setStep('verify')}>
              Continue
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setStep('setup')}
              >
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-6 py-4">
            <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-5 h-5 text-primary" />
                <h4 className="font-medium text-foreground">Backup Codes</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Save these codes in a secure place. Each code can only be used once.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <code 
                    key={index} 
                    className="px-3 py-2 bg-background rounded text-sm font-mono text-center"
                  >
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={copyBackupCodes}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All Codes
                </>
              )}
            </Button>

            <Button className="w-full" onClick={handleComplete}>
              <Check className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
