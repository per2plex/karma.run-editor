import React from 'react'

import {ClientPlugin} from '../plugin'
import {Config, defaultConfig, ConfigContext} from '../context/config'
import {FieldClass, mergeFieldRegistries, createFieldRegistry} from '../api/field'
import {defaultFieldRegistry} from '../fields/defaultRegistry'

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
