import {Ref, DataExpression} from '@karma.run/sdk'

import {
  Model,
  TypedFieldOptions,
  KeyPath,
  ValuePath,
  FieldOptions,
  SortConfiguration,
  FilterConfiguration
} from '@karma.run/editor-common'

import {SessionContext, ModelRecord} from '../context/session'
import {WorkerContext} from '../context/worker'
import {Config} from '../context/config'

export interface SaveContext {
  model: Ref
  id: Ref | undefined
  config: Config
  workerContext: WorkerContext
  sessionContext: SessionContext
}

export interface DeleteContext {
  model: Ref
  id: Ref | undefined
  config: Config
  workerContext: WorkerContext
  sessionContext: SessionContext
}

export type CreateFieldFunction = (model: Model, fieldOptions?: TypedFieldOptions) => Field
export type UnserializeFieldFunction = (rawField: SerializedField) => Field

export interface SerializedField {
  type: string
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
  readonly label?: string

  readonly defaultValue: V
  readonly sortConfigurations: SortConfiguration[]
  readonly filterConfigurations: FilterConfiguration[]

  initialize(recursions: ReadonlyMap<string, Field>): Field

  renderListComponent(props: ListRenderProps<V>): React.ReactNode
  renderEditComponent(props: EditRenderProps<V>): React.ReactNode

  initialize(recursions: ReadonlyMap<string, Field>): Field
  serialize(): SerializedField

  transformRawValue(value: unknown): V
  transformValueToExpression(value: V): DataExpression

  isValidValue(value: V): string[] | null

  traverse(keyPath: KeyPath): Field | undefined
  valuePathForKeyPath(keyPath: KeyPath): ValuePath

  onSave?(value: V, context: SaveContext): Promise<V>
  onDelete?(value: V, context: DeleteContext): Promise<V>
}

export interface FieldClass<V = any, O extends FieldOptions = FieldOptions> {
  readonly type: string

  canInferFromModel?(model: Model): boolean

  unserialize(
    rawField: SerializedField,
    unserializeField: UnserializeFieldFunction
  ): Readonly<Field<V>>

  create(model: Model, options: O | undefined, createField: CreateFieldFunction): Readonly<Field<V>>
}

export type FieldRegistry = ReadonlyMap<string, FieldClass>

export function createFieldRegistry(...fieldClasses: FieldClass[]): FieldRegistry {
  return new Map(fieldClasses.map(field => [field.type, field] as [string, FieldClass]))
}

export function mergeFieldRegistries(...registries: FieldRegistry[]): FieldRegistry {
  const values = registries.reduce(
    (acc, registry) => {
      return acc.concat(Array.from(registry.values()))
    },
    [] as FieldClass[]
  )

  return createFieldRegistry(...values)
}
