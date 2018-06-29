import React from 'react'
import {createContextHOC} from './helper'
import {Field} from '../api/karmafe/viewContext/field'

export interface Config {
  karmaURL: string
  basePath: string
  title: string
  fieldMap?: ReadonlyMap<string, Field>
}

export const defaultConfig: Config = Object.freeze({
  karmaURL: '',
  basePath: '',
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

export const withConfig = createContextHOC(ConfigContext, 'config', 'withConfig')
