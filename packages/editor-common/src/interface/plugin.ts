import {Router} from 'express'
import {FieldRegistry} from '../fields/registry'

export interface ServerPluginContext {
  router: Router
}

export interface ServerPlugin {
  name: string
  version: string
  clientModule?: string
  fieldRegistry: FieldRegistry
  initialize(context: ServerPluginContext): void
}

export interface ClientPluginContext {}
export type PluginTuple = [string, string]

export interface ClientPlugin {
  name: string
  version: string
  fieldRegistry: FieldRegistry
}
