import {Router} from 'express'

export interface ServerPluginContext {
  router: Router
}

export interface ServerPlugin {
  name: string
  version: string
  clientModule?: string
  initialize(context: ServerPluginContext): void
}

export interface ClientPluginContext {}
export type PluginTuple = [string, string]

export interface ClientPlugin {
  name: string
  version: string
  initialize(): void
}
