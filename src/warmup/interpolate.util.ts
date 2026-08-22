// Ported from F:\leadMarketing\app\admin\warmup\builders.ts's interpolate()
// — same {{placeholder}} substitution mechanic, extended with sender-side
// placeholders (see SenderIdentity's schema comment for why).
export interface InterpolateLead {
  name: string;
  city?: string | null;
  country?: string | null;
  website?: string | null;
  phone?: string | null;
}

export interface InterpolateSender {
  senderName: string;
  companyName: string;
  email?: string | null;
  phone?: string | null;
  bookingLink?: string | null;
  linkedinUrl?: string | null;
}

export function interpolate(text: string, lead: InterpolateLead, sender: InterpolateSender): string {
  return text
    .replaceAll('{{name}}', lead.name)
    .replaceAll('{{city}}', lead.city ?? '')
    .replaceAll('{{country}}', lead.country ?? '')
    .replaceAll('{{website}}', lead.website ?? '')
    .replaceAll('{{phone}}', lead.phone ?? '')
    .replaceAll('{{sender_name}}', sender.senderName)
    .replaceAll('{{sender_company}}', sender.companyName)
    .replaceAll('{{sender_email}}', sender.email ?? '')
    .replaceAll('{{sender_phone}}', sender.phone ?? '')
    .replaceAll('{{booking_link}}', sender.bookingLink ?? '')
    .replaceAll('{{sender_linkedin}}', sender.linkedinUrl ?? '');
}

export const DEFAULT_TEMPLATE = {
  name: 'Default cold outreach',
  subject: 'Quick question about {{name}}\'s online presence',
  body: `Hi {{name}} team,

My name is {{sender_name}} from {{sender_company}}. We help local businesses in {{city}} attract more customers through a professional website and better Google visibility.

I noticed {{name}} could use a stronger online presence. Would you be open to a quick chat about how we could help?

You can book a time here: {{booking_link}}

Best regards,
{{sender_name}}
{{sender_company}}
{{sender_phone}}`,
};
