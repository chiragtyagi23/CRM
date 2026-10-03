import type { WaTemplate, WaTemplateComponent } from './whatsappApi'

/** Mirrors CRM-backend/src/services/whatsapp/templateParams.js — keep the two in step. */
const VAR_RE = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g

export function extractVariables(text: string | undefined | null): string[] {
  const seen: string[] = []
  for (const m of String(text ?? '').matchAll(VAR_RE)) {
    if (!seen.includes(m[1])) seen.push(m[1])
  }
  return seen
}

export function findComponent(components: WaTemplateComponent[], type: WaTemplateComponent['type']) {
  return components.find((c) => String(c.type).toUpperCase() === type)
}

export type TemplateInputs = {
  headerFormat: string | null
  headerVariables: string[]
  needsHeaderMedia: boolean
  bodyVariables: string[]
  buttonInputs: { index: number; type: string; label: string }[]
}

export function describeInputs(template: Pick<WaTemplate, 'components'>): TemplateInputs {
  const header = findComponent(template.components, 'HEADER')
  const body = findComponent(template.components, 'BODY')
  const buttons = findComponent(template.components, 'BUTTONS')?.buttons ?? []
  const headerFormat = header ? String(header.format ?? 'TEXT').toUpperCase() : null

  const buttonInputs: TemplateInputs['buttonInputs'] = []
  buttons.forEach((b, index) => {
    const type = String(b.type).toUpperCase()
    if (type === 'URL' && extractVariables(b.url).length) buttonInputs.push({ index, type, label: b.text ?? 'URL' })
    if (type === 'COPY_CODE') buttonInputs.push({ index, type, label: b.text || 'Coupon code' })
    if (type === 'OTP') buttonInputs.push({ index, type, label: 'One-time code' })
  })

  return {
    headerFormat,
    headerVariables: headerFormat === 'TEXT' ? extractVariables(header?.text) : [],
    needsHeaderMedia: ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat ?? ''),
    bodyVariables: body ? extractVariables(body.text) : [],
    buttonInputs,
  }
}

export function substitute(text: string | undefined, names: string[], values: (string | undefined)[] | undefined) {
  return String(text ?? '').replace(VAR_RE, (whole, name: string) => {
    const i = names.indexOf(name)
    const v = i >= 0 ? values?.[i] : undefined
    return v != null && v !== '' ? v : whole
  })
}

/** WhatsApp inline formatting: *bold*, _italic_, ~strike~, ```mono```. Returns safe HTML. */
export function formatWhatsAppText(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped
    .replace(/```([\s\S]+?)```/g, '<code>$1</code>')
    .replace(/(^|[\s(])\*(?!\s)([^*\n]+?)\*(?=$|[\s).,!?:;])/g, '$1<strong>$2</strong>')
    .replace(/(^|[\s(])_(?!\s)([^_\n]+?)_(?=$|[\s).,!?:;])/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])~(?!\s)([^~\n]+?)~(?=$|[\s).,!?:;])/g, '$1<s>$2</s>')
    .replace(/\n/g, '<br/>')
}

export const TEMPLATE_LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'en_US', label: 'English (US)' },
  { code: 'en_GB', label: 'English (UK)' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'bn', label: 'Bengali' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'ur', label: 'Urdu' },
  { code: 'ar', label: 'Arabic' },
]

export const LEAD_FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: 'name', label: 'Lead name' },
  { value: 'number', label: 'Phone number' },
  { value: 'email', label: 'Email' },
  { value: 'budget', label: 'Budget' },
  { value: 'bhk', label: 'BHK' },
  { value: 'resiLocation', label: 'Residential location' },
  { value: 'workLocation', label: 'Work location' },
]
