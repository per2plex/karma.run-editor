import { ObjectMap } from '@karma.run/editor-common'

export interface FieldStore {
  readonly label?: string
  readonly description?: string
  readonly icon?: string
  readonly hash: number

  fits(data: any): any
  fill(data: any): void

  onSave?(isNew: boolean): Promise<void>
  onDelete?(): Promise<void>

  asJS(): Promise<any>
  valid: boolean
  validate(): boolean
  clone(opts?: FieldStoreOptions): FieldStore

  errors?: string[] // TODO: Remove validate() in favor of this
}

export interface FieldStoreOptions {
  label?: string
  description?: string
  icon?: string
}

export type FieldStoreMap = ObjectMap<FieldStore>
