import {expression as e} from '@karma.run/sdk'
import {reduceToMap} from '@karma.run/editor-common'

import {Model, KeyPath} from '../api/model'
import {ErrorField} from './error'

import {
  SerializedField,
  EditRenderProps,
  Field,
  InferFieldFunction,
  UnserializeFieldFunction,
  ListRenderProps
} from './interface'

import {SortConfiguration, FilterConfiguration} from '../filter/configuration'
import {WorkerContext} from '../context/worker'

export interface RecursionContext {
  readonly recursions?: {[key: string]: Field}
}

export interface RecursiveFieldOptions {
  readonly topRecursionLabel: string
  readonly fields: ReadonlyMap<string, Field>
}

export class RecursiveField implements Field<any> {
  public readonly topField: Field
  public readonly topRecursionLabel: string
  public readonly fields: ReadonlyMap<string, Field>

  public defaultValue: any
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(options: RecursiveFieldOptions) {
    const topField = options.fields.get(options.topRecursionLabel)
    if (!topField) throw new Error("Top label doesn't exist in fields.")

    this.topRecursionLabel = options.topRecursionLabel
    this.topField = topField
    this.fields = options.fields
  }

  public initialize(recursions: ReadonlyMap<string, Field>) {
    this.fields.forEach(field => field.initialize(new Map([...recursions, ...this.fields])))
    this.defaultValue = this.topField.defaultValue

    return this
  }

  public renderListComponent(props: ListRenderProps<any>) {
    return this.topField.renderListComponent(props)
  }

  public renderEditComponent(props: EditRenderProps<any>) {
    return this.topField.renderEditComponent(props)
  }

  public transformRawValue(value: any) {
    return this.topField.transformRawValue(value)
  }

  public transformValueToExpression(value: any) {
    return this.topField.transformValueToExpression(value)
  }

  public isValidValue(value: any) {
    return this.topField.isValidValue(value)
  }

  public serialize() {
    return {
      type: RecursionField.type,
      topRecursionLabel: this.topRecursionLabel,
      fields: reduceToMap(Array.from(this.fields.entries()), ([key, field]) => [
        key,
        field.serialize()
      ])
    }
  }

  public traverse(keyPath: KeyPath) {
    return this.topField.traverse(keyPath)
  }

  public valuePathForKeyPath(keyPath: KeyPath) {
    return this.topField.valuePathForKeyPath(keyPath)
  }

  public async onSave(value: any, worker: WorkerContext) {
    if (this.topField.onSave) {
      return this.topField.onSave(value, worker)
    }

    return value
  }

  public async onDelete(value: any, worker: WorkerContext) {
    if (this.topField.onDelete) {
      return this.topField.onDelete(value, worker)
    }

    return value
  }

  public static type = 'recursive'

  static inferFromModel(model: Model, label: string | undefined, inferField: InferFieldFunction) {
    if (model.type !== 'recursive') return null

    return new this({
      topRecursionLabel: model.top,
      fields: new Map(
        Object.entries(model.models).map(
          ([recursionKey, model]) => [recursionKey, inferField(model, label)] as [string, Field]
        )
      )
    })
  }

  static unserialize(
    rawField: SerializedField,
    model: Model,
    unserializeField: UnserializeFieldFunction
  ) {
    if (model.type !== 'recursive') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new this({
      topRecursionLabel: model.top,
      fields: new Map(
        Object.entries(rawField.fields).map(([key, field]) => {
          const recursionModel = model.models[key]

          if (!recursionModel) {
            return [
              key,
              new ErrorField({
                label: rawField.label,
                description: rawField.description,
                message: `Model not found for recursion label: ${key}`
              })
            ] as [string, Field]
          }

          return [key, unserializeField(field, recursionModel)] as [string, Field]
        })
      )
    })
  }
}

export interface RecursionFieldOptions {
  readonly recursionLabel: string
  readonly field: Field
}

export class RecursionField implements Field<any> {
  public readonly recursionLabel: string
  public readonly field: Field

  public defaultValue: any
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(options: RecursionFieldOptions) {
    this.recursionLabel = options.recursionLabel
    this.field = options.field
  }

  public initialize(recursions: ReadonlyMap<string, Field>) {
    this.field.initialize(new Map([...recursions, [this.recursionLabel, this.field]]))
    this.defaultValue = this.field.defaultValue

    return this
  }

  public renderListComponent(props: ListRenderProps<any>) {
    return this.field.renderListComponent(props)
  }

  public renderEditComponent(props: EditRenderProps<string>) {
    return this.field.renderEditComponent(props)
  }

  public transformRawValue(value: any) {
    return this.field.transformRawValue(value)
  }

  public transformValueToExpression(value: string) {
    return this.field.transformValueToExpression(value)
  }

  public isValidValue(value: string) {
    return this.field.isValidValue(value)
  }

  public serialize() {
    return {
      type: RecursionField.type,
      recursionLabel: this.recursionLabel,
      field: this.field.serialize()
    }
  }

  public traverse(keyPath: KeyPath) {
    return this.field.traverse(keyPath)
  }

  public valuePathForKeyPath(keyPath: KeyPath) {
    return this.field.valuePathForKeyPath(keyPath)
  }

  public async onSave(value: any, worker: WorkerContext) {
    if (this.field.onSave) {
      return this.field.onSave(value, worker)
    }

    return value
  }

  public async onDelete(value: any, worker: WorkerContext) {
    if (this.field.onDelete) {
      return this.field.onDelete(value, worker)
    }

    return value
  }

  public static type = 'recursion'

  static inferFromModel(model: Model, label: string | undefined, inferField: InferFieldFunction) {
    if (model.type !== 'recursion') return null

    return new this({
      recursionLabel: model.label,
      field: inferField(model.model, label)
    })
  }

  static unserialize(
    rawField: SerializedField,
    model: Model,
    unserializeField: UnserializeFieldFunction
  ) {
    if (model.type !== 'recursion') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new this({
      recursionLabel: rawField.recursionLabel,
      field: unserializeField(rawField.field, model.model)
    })
  }
}

export interface RecurseFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly recursionLabel: string
}

export class RecurseField implements Field<any> {
  public readonly recursionLabel: string

  public readonly label?: string
  public readonly description?: string

  public defaultValue: any
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts: RecurseFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.recursionLabel = opts.recursionLabel
  }

  private field?: Field

  public initialize(recursions: ReadonlyMap<string, Field>) {
    const field = recursions.get(this.recursionLabel)!

    if (!field) {
      return new ErrorField({
        label: this.label,
        description: this.description,
        message: `Couldn't find recursion for label: ${this.recursionLabel}`
      })
    }

    this.field = field
    this.defaultValue = field.defaultValue

    return this
  }

  public renderListComponent(props: ListRenderProps<any>) {
    if (!this.field) return null
    return this.field.renderListComponent(props)
  }

  public renderEditComponent(props: EditRenderProps<any>) {
    if (!this.field) return null

    return this.field.renderEditComponent({
      ...props,
      label: this.label,
      description: this.description
    })
  }

  public transformRawValue(value: any) {
    if (!this.field) return null
    return this.field.transformRawValue(value)
  }

  public transformValueToExpression(value: string) {
    if (!this.field) return e.null()
    return this.field.transformValueToExpression(value)
  }

  public isValidValue(value: string) {
    if (!this.field) return []
    return this.field.isValidValue(value)
  }

  public serialize() {
    return {
      type: RecursionField.type,
      label: this.label,
      description: this.description
    }
  }

  public traverse(keyPath: KeyPath) {
    if (!this.field) return undefined
    return this.field.traverse(keyPath)
  }

  public valuePathForKeyPath(keyPath: KeyPath) {
    if (!this.field) return []
    return this.field.valuePathForKeyPath(keyPath)
  }

  public async onSave(value: any, worker: WorkerContext) {
    if (this.field && this.field.onSave) {
      return this.field.onSave(value, worker)
    }

    return value
  }

  public async onDelete(value: any, worker: WorkerContext) {
    if (this.field && this.field.onDelete) {
      return this.field.onDelete(value, worker)
    }

    return value
  }

  public static type = 'recurse'

  public static inferFromModel(model: Model, label: string | undefined) {
    if (model.type !== 'recurse') return null
    return new this({label, recursionLabel: model.label})
  }

  public static unserialize(rawField: SerializedField, model: Model) {
    if (model.type !== 'recurse') {
      return new ErrorField({
        message: 'Invalid model!'
      })
    }

    return new this({label: rawField.label, recursionLabel: model.label})
  }
}
