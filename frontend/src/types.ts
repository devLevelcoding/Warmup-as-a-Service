export interface Lead {
  id: number
  name: string
  category?: string | null
  city?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  status: string
  createdAt: string
}

export interface EmailTemplate {
  id: number
  name: string
  subject: string
  body: string
}

export interface SenderIdentity {
  id: number
  senderName: string
  companyName: string
  email?: string | null
  phone?: string | null
  bookingLink?: string | null
  linkedinUrl?: string | null
}

export interface BatchLead {
  id: number
  leadId: number
  status: string
  sentAt: string | null
  lead?: Lead
}

export interface Batch {
  id: number
  dayNumber: number
  date: string
  quota: number
  leads: BatchLead[]
  sent: number
  skipped: number
  total: number
  isToday: boolean
  isPast: boolean
}

export interface Plan {
  id: number
  startDate: string
  totalDays: number
  currentDay: number | null
  batches: Batch[]
}

export interface CountryStat {
  country: string
  total: number
  sent: number
  skipped: number
  pending: number
}

export interface FieldDef {
  key: string
  label: string
  type?: 'text' | 'number' | 'date' | 'textarea'
  required?: boolean
  placeholder?: string
}

export interface ColumnDef<T> {
  key: string
  label: string
  render?: (row: T) => string
}
