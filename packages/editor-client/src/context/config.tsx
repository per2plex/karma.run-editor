import React from 'react'
import {createContextHOC} from './helper'

export interface Config {
  karmaURL: string
  basePath: string
  title: string
}

export const defaultConfig: Config = Object.freeze({
  karmaURL: '',
  basePath: '',
  title: 'karma.run'
})

export const ConfigContext = React.createContext<Config>(defaultConfig)
export const withConfig = createContextHOC(ConfigContext, 'config', 'withConfig')
