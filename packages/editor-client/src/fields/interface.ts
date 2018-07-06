import {Expression, Ref} from '@karma.run/sdk'
import {ValuePath} from '@karma.run/editor-common'

import {KeyPath, Model} from '../api/model'
import {SortConfigration, FilterField} from '../filter/configuration'

export type InferFieldFunction = (model: Model, key?: string) => Field
export type UnserializeFieldFunction = (rawField: any, model: Model) => Field

export interface SerializedField {
  type: string
  [key: string]: any
}

export interface ListRenderProps<V = any, C = any> {
  value: V
  context?: C
}

export interface EditRenderProps<V = any, C = any> {
  disabled: boolean
  isWrapped: boolean
  depth: number
  index: number
  value: V
  context?: C
  changeKey?: string
  onValueChange: (value: V, key: string | undefined) => void
  onEditRecord: (model: Ref, id?: Ref) => Promise<Ref | undefined>
}

export interface ListComponentRenderProps<F extends Field = Field, V = any, C = any>
  extends ListRenderProps<V, C> {
  field: F
}

export interface EditComponentRenderProps<F extends Field = Field, V = any, C = any>
  extends EditRenderProps<V, C> {
  field: F
}

export interface Field<V = any, C = any> {
  renderListComponent(props: ListRenderProps<V, C>): React.ReactNode
  renderEditComponent(props: EditRenderProps<V, C>): React.ReactNode

  serialize(): SerializedField
  defaultValue(context?: C): V

  transformRawValue(value: any, context?: C): V
  transformValueToExpression(value: V, context?: C): Expression

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
