import {Expression, Ref} from '@karma.run/sdk'
import {ValuePath} from '@karma.run/editor-common'

import {KeyPath, Model} from '../api/model'
import {SortConfigration, FilterField} from '../filter/configuration'

export type InferFieldFunction = (model: Model, label?: string) => Field
export type UnserializeFieldFunction = (rawField: any, model: Model) => Field

export interface SerializedField {
  type: string
  [key: string]: any
}

export interface EditRenderProps<V = any> {
  disabled: boolean
  isWrapped: boolean
  depth: number
  index: number
  value: V
  changeKey?: string
  onValueChange: (value: V, key?: string) => void
  onEditRecord: (model: Ref, id?: Ref) => Promise<Ref | undefined>
}

export interface EditComponentRenderProps<F extends Field = Field, V = any>
  extends EditRenderProps<V> {
  field: F
}

export interface Field<V = any> {
  renderListComponent(value: V): React.ReactNode
  renderEditComponent(props: EditRenderProps<V>): React.ReactNode

  serialize(): SerializedField
  defaultValue(): V

  transformRawValue(value: any): V
  transformValueToExpression(value: V): Expression

  isValidValue(value: V): string[] | null

  traverse(keyPath: KeyPath): Field | undefined
  valuePathForKeyPath(keyPath: KeyPath): ValuePath

  sortConfigurations?(): SortConfigration[]
  filterConfigurations?(): FilterField[]

  onSave?(value: V): Promise<V>
  onDelete?(value: V): Promise<V>
}

export interface FieldClass<V = any> {
  readonly type: string

  unserialize(
    rawField: SerializedField,
    model: Model,
    unserializeField: UnserializeFieldFunction
  ): Field<V>

  inferFromModel?(
    model: Model,
    key: string | undefined,
    inferField: InferFieldFunction
  ): Field<V> | null
}
