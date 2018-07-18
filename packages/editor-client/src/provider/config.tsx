import React from 'react'

import {
  ConfigContext,
  Config,
  defaultConfig,
  ClientPlugin,
  FieldClass,
  mergeFieldRegistries,
  createFieldRegistry,
  defaultFieldRegistry
} from '@karma.run/editor-common'

export interface ConfigProviderProps {
  config: {
    karmaDataURL: string
    basePath: string
    title: string
    plugins: ClientPlugin[]
  }
}

export class ConfigProvider extends React.Component<ConfigProviderProps, Config> {
  public state: Config = defaultConfig
  public async componentDidMount() {
    const plugins = this.props.config.plugins
    const fields: FieldClass[] = []

    for (const plugin of plugins) {
      if (plugin.registerFields) {
        fields.push(...plugin.registerFields())
      }
    }

    this.setState({
      ...this.props.config,
      fieldRegistry: mergeFieldRegistries(createFieldRegistry(...fields), defaultFieldRegistry)
    })
  }

  public render() {
    return <ConfigContext.Provider value={this.state}>{this.props.children}</ConfigContext.Provider>
  }
}
