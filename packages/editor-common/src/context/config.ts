import React from 'react'
import {createContextHOC} from './helper'
import {ClientPlugin} from '../interface/plugin'
import {FieldRegistry, defaultFieldRegistry} from '../fields/registry'

export interface Config {
  karmaDataURL: string
  basePath: string
  title: string
  plugins: ClientPlugin[]
  fieldRegistry: FieldRegistry
}

export const defaultConfig: Config = Object.freeze({
  karmaDataURL: '',
  basePath: '',
  title: 'karma.run',
  plugins: [],
  fieldRegistry: defaultFieldRegistry
})

export const ConfigContext = React.createContext<Config>(defaultConfig)
export const withConfig = createContextHOC(ConfigContext, 'config', 'withConfig')
