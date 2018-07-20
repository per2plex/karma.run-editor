import {FieldClass} from './api/field'

export interface ClientPlugin {
  readonly name: string
  readonly version: string

  registerFields?(): FieldClass[]
}
