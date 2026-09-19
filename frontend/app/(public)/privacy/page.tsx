import Link from 'next/link'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COMPANY_CONTACT } from '@/lib/company-contact'

export const metadata = {
  title: 'Privacy Policy | Tensae DMS',
  description: 'Privacy Policy for Tensae Document Management System',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground font-semibold">
            <Shield className="w-5 h-5 text-primary" />
            Tensae DMS
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: September 2, 2026</p>

        <p>
          {COMPANY_CONTACT.companyName} (&quot;we&quot;, &quot;us&quot;) operates Tensae DMS. This
          Privacy Policy explains how we collect, use, and protect information when you use our
          document management platform.
        </p>

        <h2>1. Information we collect</h2>
        <p>
          We collect account information you provide (name, email, company), documents you upload,
          workspace activity logs, and technical data such as IP address and browser type for
          security and audit purposes.
        </p>

        <h2>2. How we use information</h2>
        <p>
          We use your information to provide the Service, authenticate users, enforce access
          controls, send transactional emails (invites, password resets), and maintain audit trails
          required for document governance.
        </p>

        <h2>3. Document storage and security</h2>
        <p>
          Files are stored in isolated tenant workspaces with role-based access. We use encryption
          in transit, signed download URLs, and audit logging. You control who can access documents
          within your workspace.
        </p>

        <h2>4. Sharing and disclosure</h2>
        <p>
          We do not sell your personal data. We may disclose information when required by law or to
          protect the security and integrity of the Service.
        </p>

        <h2>5. Data retention</h2>
        <p>
          Account and document data is retained while your workspace is active. Workspace owners may
          configure retention policies. You may request deletion of your account by contacting us.
        </p>

        <h2>6. Your rights</h2>
        <p>
          You may access, correct, or delete your profile information through dashboard settings.
          Contact us for other privacy requests.
        </p>

        <h2>7. Contact</h2>
        <p>
          Questions about this policy? Email{' '}
          <a href={COMPANY_CONTACT.emailHref} className="text-primary">
            {COMPANY_CONTACT.email}
          </a>{' '}
          or visit our{' '}
          <Link href="/contact" className="text-primary">
            contact page
          </Link>
          .
        </p>
      </main>
    </div>
  )
}
