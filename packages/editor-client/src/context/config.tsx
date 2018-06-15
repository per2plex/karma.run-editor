import React from 'react'
import {Omit} from '@karma.run/editor-common'

export interface Config {
  karmaURL: string
  title: string
}

export const defaultConfig: Config = Object.freeze({
  karmaURL: '',
  title: 'karma.run'
})

export const ConfigContext = React.createContext<Config>(defaultConfig)
export class ConfigProvider extends React.Component<{config: Config}> {
  public render() {
    return (
      <ConfigContext.Provider value={this.props.config}>
        {this.props.children}
      </ConfigContext.Provider>
    )
  }
}

export function withConfig<T extends {config: Config}>(
  Component: React.ComponentType<T>
): React.StatelessComponent<Omit<T, 'config'>> {
  return props => (
    <ConfigContext.Consumer>
      {config => <Component {...props} config={config} />}
    </ConfigContext.Consumer>
  )
}
