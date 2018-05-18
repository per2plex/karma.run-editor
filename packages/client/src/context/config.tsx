import React from 'react'

export interface Config {
  title: string
}

export const defaultConfig = {
  title: 'karma.run'
}

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
