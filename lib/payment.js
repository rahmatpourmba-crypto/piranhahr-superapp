import { REF_CODE_PREFIX, REF_CODE_LENGTH } from 'lib/config'

function luhnValid(code) {
  let sum = 0
  let double = false
  for (let i = code.length - 1; i >= 0; i--) {
    let digit = Number(code[i])
    if (double) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    double = !double
  }
  return sum % 10 === 0
}

export function validateRefCode(code) {
  if (typeof code !== 'string') return false
  const clean = code.replace(/[\s-]/g, '')
  if (clean.length !== REF_CODE_LENGTH) return false
  if (!clean.startsWith(REF_CODE_PREFIX)) return false
  if (!/^\d+$/.test(clean)) return false
  return luhnValid(clean)
}