import {Router} from 'express'
import {FieldClass} from '../fields/interface'

export interface ServerPlugin {
  readonly name: string
  readonly version: string
  readonly clientModule?: string

  registerFields?(): FieldClass[]
  registerRoutes?(karmaDataURL: string, router: Router): void
}

export interface ClientPlugin {
  readonly name: string
  readonly version: string

  registerFields?(): FieldClass[]
}
