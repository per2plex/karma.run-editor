import {Expression, Ref} from '@karma.run/sdk'
import {ValuePath} from '@karma.run/editor-common'

import {KeyPath, Model} from '../api/model'
import {ModelRecord} from '../context/session'
import {SortConfiguration, FilterConfiguration} from '../filter/configuration'

export type InferFieldFunction = (model: Model, key?: string) => Field
export type UnserializeFieldFunction = (rawField: any, model: Model) => Field

export interface SerializedField {
  type: string
  [key: string]: any
}

export interface ListRenderProps<V = any> {
  value: V
}

export interface EditRenderProps<V = any> {
  disabled: boolean
  isWrapped: boolean
  depth: number
  index: number
  value: V
  changeKey?: any
  onValueChange: (value: V, key: any) => void
  onEditRecord: (model: Ref, id?: Ref) => Promise<ModelRecord | undefined>
  onSelectRecord: (model: Ref) => Promise<ModelRecord | undefined>
}

export interface ListComponentRenderProps<F extends Field = Field, V = any>
  extends ListRenderProps<V> {
  field: F
}

export interface EditComponentRenderProps<F extends Field = Field, V = any>
  extends EditRenderProps<V> {
  field: F
}

export interface Field<V = any> {
  parent?: Field

  renderListComponent(props: ListRenderProps<V>): React.ReactNode
  renderEditComponent(props: EditRenderProps<V>): React.ReactNode

  serialize(): SerializedField

  transformRawValue(value: any): V
  transformValueToExpression(value: V): Expression

  isValidValue(value: V): string[] | null

  traverse(keyPath: KeyPath): Field | undefined
  valuePathForKeyPath(keyPath: KeyPath): ValuePath

  onSave?(value: V): Promise<V>
  onDelete?(value: V): Promise<V>

  readonly defaultValue: V
  readonly sortConfigurations: SortConfiguration[]
  readonly filterConfigurations: FilterConfiguration[]
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
