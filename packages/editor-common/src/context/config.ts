import React from 'react'
import {createContextHOC} from './helper'
import {PluginTuple} from '../interface/plugin'

export interface Config {
  karmaDataURL: string
  basePath: string
  mediaBasePath: string
  title: string
  plugins: PluginTuple[]
}

export const defaultConfig: Config = Object.freeze({
  karmaDataURL: '',
  basePath: '',
  mediaBasePath: '',
  title: 'karma.run',
  plugins: []
})

export const ConfigContext = React.createContext<Config>(defaultConfig)
export const withConfig = createContextHOC(ConfigContext, 'config', 'withConfig')
