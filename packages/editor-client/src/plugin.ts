import {FieldConstructor} from './api/field'

export interface ClientPlugin {
  readonly name: string
  readonly version: string

  registerFields?(): FieldConstructor[]
}
