/** Strip to digits only. */
export function digitsOnly(contact: string): string {
  return String(contact ?? '').replace(/\D/g, '')
}

/**
 * India E.164 digits (91 + 10-digit mobile) for wa.me and tel:+ links.
 * e.g. 7210789373 → 917210789373
 */
export function toIndiaPhoneDigits(contact: string): string | undefined {
  let d = digitsOnly(contact)
  if (!d) return undefined

  if (d.length === 11 && d.startsWith('0')) {
    d = d.slice(1)
  }

  if (d.length === 12 && d.startsWith('91')) {
    return d
  }

  if (d.length === 10) {
    return `91${d}`
  }

  return undefined
}

export function toIndiaTelHref(contact: string): string | undefined {
  const d = toIndiaPhoneDigits(contact)
  return d ? `tel:+${d}` : undefined
}

export function toWhatsAppHref(contact: string): string | undefined {
  const d = toIndiaPhoneDigits(contact)
  return d ? `https://wa.me/${d}` : undefined
}
