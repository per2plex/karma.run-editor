import React from 'react'
import {createContextHOC} from './helper'

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

export const withLocale = createContextHOC(LocaleContext, 'localeContext', 'withLocale')
