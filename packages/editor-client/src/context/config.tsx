import React from 'react'

export interface ConfigContext {
  karmaURL?: string
  title: string
}

export const defaultConfig: ConfigContext = Object.freeze({
  karmaURL: undefined,
  title: 'karma.run'
})

export const ConfigContext = React.createContext<ConfigContext>(defaultConfig)
export class ConfigProvider extends React.Component<{config: ConfigContext}> {
  public render() {
    return (
      <ConfigContext.Provider value={this.props.config}>
        {this.props.children}
      </ConfigContext.Provider>
    )
  }
}
