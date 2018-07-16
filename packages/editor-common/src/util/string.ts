import {hsl} from 'csx'

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function convertSnakeCaseToCamelCase(str: string) {
  return str.replace(/^_/, '').replace(/(.+?)(?:(?:-|_)+|$)/g, (_, match) => {
    return capitalize(match)
  })
}

export function splitCamelCase(str: string) {
  return str.split(/(?=[A-Z])/)
}

export function convertKeyToLabel(key: string) {
  return splitCamelCase(convertSnakeCaseToCamelCase(key))
    .map(capitalize)
    .join(' ')
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-/g, '')
    .replace(/-$/g, '')
}

export function hashString(str: string) {
  let hash = 0
  let char: number

  if (str.length === 0) return hash

  for (let i = 0; i < str.length; i++) {
    char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }

  return hash
}

export function stringToColor(str: string, saturation: number = 0.5, lightness: number = 0.8) {
  const hue = ((Math.abs(hashString(str)) % 0xffffff) / 0xffffff) * 360
  return hsl(hue, saturation, lightness).toHexString()
}

const escapeRegExpRegExp = /[-\/\\^$*+?.()|[\]{}]/g

export function escapeRegExp(str: string) {
  return str.replace(escapeRegExpRegExp, '\\$&')
}
