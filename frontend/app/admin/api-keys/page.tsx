'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Key } from 'lucide-react'

/** Platform admin no longer owns tenant API keys — redirect users to workspace Settings. */
export default function AdminApiKeysRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    const t = setTimeout(() => router.replace('/dashboard/settings'), 2500)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="max-w-lg mx-auto mt-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys moved
          </CardTitle>
          <CardDescription>
            Tenant API keys are managed in the workspace Settings → API Keys tab (not the platform admin panel).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/settings">Go to Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
