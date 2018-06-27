import React from 'react'
import {createContextHOC} from './helper'
import {CenteredLoadingIndicator} from '../ui/common/loader'

export type MessageMap = typeof import('../locale/en-US.json')
export type MessageKey = keyof MessageMap

export type Locale = 'en-US' | 'de-DE'

export const localeMap = new Map<Locale, string>([['en-US', 'English'], ['de-DE', 'Deutsch']])
export const defaultLocale: Locale = 'en-US'

export async function loadLocaleMessageMap(locale: Locale) {
  switch (locale) {
    case 'en-US':
      return await import('../locale/en-US.json')

    case 'de-DE':
      return await import('../locale/de-DE.json')
  }
}

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

export function getNavigatorLocale(): Locale {
  const languageCodes = window.navigator.languages || [window.navigator.language]

  for (const langCode of languageCodes) {
    // Find exact match
    for (const [locale] of localeMap) {
      const lowerCaseLangCode = langCode.toLowerCase()
      const lowerCaseLocale = locale.toLowerCase()

      if (lowerCaseLangCode === lowerCaseLocale) return locale
    }

    // Find fuzzy match
    for (const [locale] of localeMap) {
      const lowerCaseLangCode = langCode.toLowerCase()
      const lowerCaseLocale = locale.toLowerCase()

      if (lowerCaseLocale.includes(lowerCaseLangCode)) return locale
    }
  }

  return defaultLocale
}

export class LocaleProvider extends React.Component<{}, LocaleContext> {
  constructor(props: {}) {
    super(props)

    this.state = {
      localeMap: localeMap,
      locale: getNavigatorLocale(),
      get: this.get,
      setLocale: this.setLocale
    }
  }

  private setLocale = async (locale: Locale) => {
    if (!this.state.localeMap.has(locale)) throw new Error('Invalid locale!')

    this.setState({
      locale: locale,
      messageMap: await loadLocaleMessageMap(locale)
    })
  }

  private get = (key: MessageKey) => {
    if (!this.state.messageMap) return key
    return this.state.messageMap[key] || key
  }

  public async componentDidMount() {
    if (this.state.messageMap) return

    this.setState({
      messageMap: await loadLocaleMessageMap(this.state.locale)
    })
  }

  public render() {
    if (!this.state.messageMap) return <CenteredLoadingIndicator />
    return <LocaleContext.Provider value={this.state}>{this.props.children}</LocaleContext.Provider>
  }
}

export const withLocale = createContextHOC(LocaleContext, 'localeContext', 'withLocale')
