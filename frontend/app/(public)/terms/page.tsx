import Link from 'next/link'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Terms of Service | Tensae DMS',
  description: 'Terms of Service for Tensae Document Management System',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground font-semibold">
            <FileText className="w-5 h-5 text-primary" />
            Tensae DMS
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground">
        <h1>Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: July 27, 2026</p>

        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of Tensae DMS
          (&quot;Service&quot;), a multi-tenant document management platform operated by Tensae DMS.
          By creating an account or using the Service, you agree to these Terms.
        </p>

        <h2>1. Accounts and workspaces</h2>
        <p>
          You must provide accurate registration information and keep your credentials secure. Each
          workspace (tenant) is managed by an account owner who is responsible for users invited to
          that workspace and for activity under their account.
        </p>

        <h2>2. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Upload malware, illegal content, or material you do not have rights to store</li>
          <li>Attempt to access another tenant&apos;s data or bypass security controls</li>
          <li>Reverse engineer, overload, or disrupt the Service</li>
          <li>Use the Service in violation of applicable law</li>
        </ul>

        <h2>3. Your content</h2>
        <p>
          You retain ownership of documents and data you upload. You grant Tensae DMS a limited
          license to host, process, and transmit your content solely to provide the Service (storage,
          sharing links, previews, backups as configured).
        </p>

        <h2>4. Sharing and access</h2>
        <p>
          Share links you create may allow recipients to view or download files depending on settings
          you choose. You are responsible for distributing links only to intended recipients and
          setting appropriate expiry and download permissions.
        </p>

        <h2>5. Roles and permissions</h2>
        <p>
          Workspace administrators assign roles (e.g. Admin, Manager, Staff, Viewer). View-only roles
          may preview documents but cannot download files. Role assignments and invite acceptance are
          your responsibility.
        </p>

        <h2>6. Storage and retention</h2>
        <p>
          Storage limits and retention policies may apply per workspace plan or settings. Archived or
          deleted documents may be permanently removed after retention periods. You are responsible
          for maintaining your own backups of critical data.
        </p>

        <h2>7. Availability and changes</h2>
        <p>
          We strive for reliable service but do not guarantee uninterrupted availability. We may
          update features, limits, or these Terms with reasonable notice where practicable.
          Continued use after changes constitutes acceptance.
        </p>

        <h2>8. Disclaimer</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF MERCHANTABILITY, FITNESS FOR
          A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. We are not liable for indirect, incidental, or
          consequential damages arising from use of the Service to the maximum extent permitted by
          law.
        </p>

        <h2>9. Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or terminate access for breach
          of these Terms or to protect the platform. Upon termination, access to your workspace data
          may be revoked subject to applicable law and backup procedures.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions about these Terms:{' '}
          <a href="mailto:legal@tensaedms.com" className="text-primary">
            legal@tensaedms.com
          </a>{' '}
          or via our{' '}
          <Link href="/contact" className="text-primary">
            contact page
          </Link>
          .
        </p>
      </main>
    </div>
  )
}
