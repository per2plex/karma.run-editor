import React from 'react'
import {createContextHOC} from './helper'

export type MessageMap = typeof import('../locale/en-US.json')
export type MessageKey = keyof MessageMap

export type Locale = 'en-US' | 'de-DE'
export const defaultLocale: Locale = 'en-US'

export interface LocaleContext {
  localeMap: Map<string, string>
  locale: Locale
  messageMap?: MessageMap
  get(key: MessageKey): string
  setLocale(locale: string): void
}

export const LocaleContext = React.createContext<LocaleContext>({
  localeMap: new Map(),
  locale: defaultLocale,
  get(key: MessageKey): string {
    return key
  },
  setLocale(): void {}
})

export const withLocale = createContextHOC(LocaleContext, 'localeContext', 'withLocale')
