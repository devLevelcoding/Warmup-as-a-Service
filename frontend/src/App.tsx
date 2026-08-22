import { useState } from 'react'
import Sidebar, { type NavItem } from './components/Sidebar'
import ResourceView from './components/ResourceView'
import CampaignView from './components/CampaignView'
import ComposeModal from './components/ComposeModal'
import SenderIdentityView from './components/SenderIdentityView'
import type { EmailTemplate, Lead } from './types'

const NAV: NavItem[] = [
  { key: 'leads', label: 'Leads' },
  { key: 'templates', label: 'Templates' },
  { key: 'campaign', label: 'Campaign' },
  { key: 'sender', label: 'Sender Identity' },
]

export default function App() {
  const [active, setActive] = useState('leads')
  const [composeLead, setComposeLead] = useState<{ id: number; name: string } | null>(null)

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans text-[13px]">
      <header className="flex items-center gap-3 h-[46px] px-5 border-b border-border bg-surface flex-shrink-0">
        <span className="text-[15px] font-extrabold tracking-tight text-accent">
          warmup<span className="text-txt2 font-normal">service</span>
        </span>
        <div className="flex-1" />
        <span className="text-xs text-txt2">Type 3 &middot; Pure leadMarketing reuse</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={NAV} selected={active} onSelect={setActive} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {active === 'leads' && (
            <ResourceView<Lead>
              resource="leads"
              title="Leads"
              onRowAction={{ label: 'Compose', onClick: row => setComposeLead({ id: row.id, name: row.name }) }}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'city', label: 'City', render: r => [r.city, r.country].filter(Boolean).join(', ') || '—' },
                { key: 'category', label: 'Category' },
                { key: 'email', label: 'Email' },
                { key: 'status', label: 'Status' },
              ]}
              formFields={[
                { key: 'name', label: 'Name', required: true },
                { key: 'category', label: 'Category' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'city', label: 'City' },
                { key: 'country', label: 'Country' },
                { key: 'website', label: 'Website' },
              ]}
            />
          )}

          {active === 'templates' && (
            <ResourceView<EmailTemplate>
              resource="email-templates"
              title="Email Templates"
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'subject', label: 'Subject' },
              ]}
              formFields={[
                { key: 'name', label: 'Name', required: true },
                { key: 'subject', label: 'Subject', required: true, placeholder: 'Quick question about {{name}}' },
                { key: 'body', label: 'Body', required: true, type: 'textarea', placeholder: 'Use {{name}}, {{city}}, {{sender_name}}, {{sender_company}}, {{booking_link}}...' },
              ]}
            />
          )}

          {active === 'campaign' && <CampaignView />}

          {active === 'sender' && <SenderIdentityView />}
        </main>
      </div>

      {composeLead && (
        <ComposeModal leadId={composeLead.id} leadName={composeLead.name} onClose={() => setComposeLead(null)} />
      )}
    </div>
  )
}
