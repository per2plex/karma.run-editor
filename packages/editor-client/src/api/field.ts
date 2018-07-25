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
  onEditField(field: Field, value?: any): Promise<{value: any} | undefined>
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
  readonly description?: string

  readonly defaultValue: V
  readonly sortConfigurations: SortConfiguration[]
  readonly filterConfigurations: FilterConfiguration[]

  initialize(recursions: ReadonlyMap<string, Field>): Field
  fieldOptions(): TypedFieldOptions

  renderListComponent(props: ListRenderProps<V>): React.ReactNode
  renderEditComponent(props: EditRenderProps<V>): React.ReactNode

  transformRawValue(value: unknown): V
  transformValueToExpression(value: V): DataExpression

  isValidValue(value: V): string[] | null

  traverse(keyPath: KeyPath): Field | undefined
  valuePathForKeyPath(keyPath: KeyPath): ValuePath

  onSave?(value: V, context: SaveContext): Promise<V>
  onDelete?(value: V, context: DeleteContext): Promise<V>
}

export interface FieldConstructor<V = any, O extends FieldOptions = FieldOptions> {
  readonly type: string

  canInferFromModel?(model: Model): boolean
  create(model: Model, options: O | undefined, createField: CreateFieldFunction): Readonly<Field<V>>
}

export type FieldRegistry = ReadonlyMap<string, FieldConstructor>

export function createFieldRegistry(...fieldClasses: FieldConstructor[]): FieldRegistry {
  return new Map(fieldClasses.map(field => [field.type, field] as [string, FieldConstructor]))
}

export function mergeFieldRegistries(...registries: FieldRegistry[]): FieldRegistry {
  const values = registries.reduce(
    (acc, registry) => {
      return acc.concat(Array.from(registry.values()))
    },
    [] as FieldConstructor[]
  )

  return createFieldRegistry(...values)
}
