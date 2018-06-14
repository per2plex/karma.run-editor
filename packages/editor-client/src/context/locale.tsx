import React from 'react'
import {Omit} from '@karma.run/editor-common'

export type MessageMap = typeof import('../locale/en.json')
export type MessageKey = keyof MessageMap

export interface LocaleProviderProps {
  initialMessageMap?: MessageMap
}

export interface LocaleContext {
  messageMap?: MessageMap
  get(key: MessageKey): string
}

export const LocaleContext = React.createContext<LocaleContext>({
  get(key: MessageKey): string {
    return key
  }
})

export class LocaleProvider extends React.Component<LocaleProviderProps, LocaleContext> {
  constructor(props: LocaleProviderProps) {
    super(props)

    this.state = {
      messageMap: props.initialMessageMap,
      get: this.get
    }
  }

  private get = (key: MessageKey) => {
    if (!this.state.messageMap) return key
    return this.state.messageMap[key] || key
  }

  public render() {
    return <LocaleContext.Provider value={this.state}>{this.props.children}</LocaleContext.Provider>
  }
}

export function withLocale<T extends {localeContext: LocaleContext}>(
  Component: React.ComponentType<T>
): React.StatelessComponent<Omit<T, 'localeContext'>> {
  return props => (
    <LocaleContext.Consumer>
      {localeContext => <Component {...props} localeContext={localeContext} />}
    </LocaleContext.Consumer>
  )
}
