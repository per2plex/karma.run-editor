import { NestedCSSProperties } from 'typestyle/lib/types'

export function marginTopExceptFirst(margin: string): NestedCSSProperties {
  return {marginTop: margin, $nest: {'&:first-child': {marginTop: 0}}}
}

export function marginLeftExceptFirst(margin: string): NestedCSSProperties {
  return {marginLeft: margin, $nest: {'&:first-child': {marginLeft: 0}}}
}

export function solidBorderWithColor(color: string): string {
  return `1px solid ${color}`
}
