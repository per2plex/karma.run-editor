import {Expression, Ref} from '@karma.run/sdk'

import {KeyPath, Model} from '../api/model'
import {SortConfiguration, FilterConfiguration, ValuePath} from '../interface/filter'
import {ModelRecord} from '../context/session'
import {WorkerContext} from '../context/worker'

export type InferFieldFunction = (model: Model, inferredLabel?: string) => Field
export type UnserializeFieldFunction = (rawField: any, model: Model) => Field

export interface SerializedField {
  type: string
  [key: string]: any
}

export interface ListRenderProps<V = any> {
  readonly value: V
}

export interface EditRenderProps<V = any> {
  readonly label?: string
  readonly description?: string

  readonly disabled: boolean
  readonly isWrapped: boolean
  readonly depth: number
  readonly index: number
  readonly value: V
  readonly changeKey?: any

  onValueChange(value: V, key: any): void
  onEditRecord(model: Ref, id?: Ref): Promise<ModelRecord | undefined>
  onSelectRecord(model: Ref): Promise<ModelRecord | undefined>
}

export interface ListComponentRenderProps<F extends Field = Field, V = any>
  extends ListRenderProps<V> {
  readonly field: F
}

export interface EditComponentRenderProps<F extends Field = Field, V = any>
  extends EditRenderProps<V> {
  readonly field: F
}

export interface Field<V = any> {
  readonly defaultValue: V
  readonly sortConfigurations: SortConfiguration[]
  readonly filterConfigurations: FilterConfiguration[]

  initialize(recursions: ReadonlyMap<string, Field>): Field

  renderListComponent(props: ListRenderProps<V>): React.ReactNode
  renderEditComponent(props: EditRenderProps<V>): React.ReactNode

  initialize(recursions: ReadonlyMap<string, Field>): Field
  serialize(): SerializedField

  transformRawValue(value: unknown): V
  transformValueToExpression(value: V): Expression

  isValidValue(value: V): string[] | null

  traverse(keyPath: KeyPath): Field | undefined
  valuePathForKeyPath(keyPath: KeyPath): ValuePath

  onSave?(value: V, worker: WorkerContext): Promise<V>
  onDelete?(value: V, worker: WorkerContext): Promise<V>
}

export interface FieldClass<V = any> {
  readonly type: string

  unserialize(
    rawField: SerializedField,
    model: Model,
    unserializeField: UnserializeFieldFunction
  ): Readonly<Field<V>>

  inferFromModel?(
    model: Model,
    inferredLabel: string | undefined,
    inferField: InferFieldFunction
  ): Readonly<Field<V>> | null
}
