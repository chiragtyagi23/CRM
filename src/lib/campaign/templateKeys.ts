export const TEMPLATE_KEYS = ['default-template', 'luxury-template', 'affordable-template'] as const

export type TemplateKey = (typeof TEMPLATE_KEYS)[number]

export const DEFAULT_TEMPLATE_KEY: TemplateKey = 'default-template'

export function isTemplateKey(value: unknown): value is TemplateKey {
  return typeof value === 'string' && (TEMPLATE_KEYS as readonly string[]).includes(value)
}

export function isDefaultTemplate(templateKey: unknown): boolean {
  return templateKey === 'default-template' || templateKey === 'default'
}
