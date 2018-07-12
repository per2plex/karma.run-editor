import {Router} from 'express'

export interface ServerPluginContext {
  router: Router
}

export interface ServerPlugin {
  name: string
  version: string
  clientModules?: string[]
  initialize(context: ServerPluginContext): void
}

export interface ClientPluginContext {}

export interface ClientPlugin {
  name: string
  version: string
  initialize(context: ServerPluginContext): void
}
