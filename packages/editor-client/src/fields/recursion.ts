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

import {SortConfigration} from '../filter/configuration'
import {ObjectMap, mapObject} from '@karma.run/editor-common'
import memoizeOne from 'memoize-one'

export interface RecursionContext {
  readonly recursions?: {[key: string]: Field}
}

export interface RecursiveFieldOptions {
  readonly topRecursionLabel: string
  readonly fields: ObjectMap<Field>
}

export class RecursiveField implements Field<any, RecursionContext> {
  private topField: Field
  private topRecursionLabel: string
  private fields: ObjectMap<Field>

  public constructor(options: RecursiveFieldOptions) {
    const topField = options.fields[options.topRecursionLabel]
    if (!topField) throw new Error("Top label doesn't exist in fields.")

    this.topRecursionLabel = options.topRecursionLabel
    this.topField = topField
    this.fields = options.fields
  }

  // TODO: Nested recursions will still recreate context everytime, find better solution
  private mergeRecursionContext = memoizeOne((context?: RecursionContext) => {
    return {
      ...context,
      recursions: {
        ...(context ? context.recursions : []),
        ...this.fields
      }
    }
  })

  public renderListComponent(props: ListRenderProps<any, RecursionContext>) {
    return this.topField.renderListComponent({
      ...props,
      context: this.mergeRecursionContext(props.context)
    })
  }

  public renderEditComponent(props: EditRenderProps<any, RecursionContext>) {
    return this.topField.renderEditComponent({
      ...props,
      context: this.mergeRecursionContext(props.context)
    })
  }

  public defaultValue(context?: RecursionContext) {
    return this.topField.defaultValue(this.mergeRecursionContext(context))
  }

  public transformRawValue(value: any, context?: RecursionContext) {
    return this.topField.transformRawValue(value, this.mergeRecursionContext(context))
  }

  public transformValueToExpression(value: string, context?: RecursionContext) {
    return this.topField.transformValueToExpression(value, this.mergeRecursionContext(context))
  }

  public isValidValue(value: string) {
    return this.topField.isValidValue(value)
  }

  public serialize() {
    return {
      type: RecursionField.type,
      topRecursionLabel: this.topRecursionLabel,
      fields: mapObject(this.fields, value => value.serialize())
    }
  }

  public traverse(keyPath: KeyPath) {
    return this.topField.traverse(keyPath)
  }

  public valuePathForKeyPath(keyPath: KeyPath) {
    return this.topField.valuePathForKeyPath(keyPath)
  }

  public sortConfigurations(): SortConfigration[] {
    return []
  }

  public static type = 'recursive'

  static inferFromModel(model: Model, key: string | undefined, inferField: InferFieldFunction) {
    if (model.type !== 'recursive') return null

    return new RecursiveField({
      topRecursionLabel: model.top,
      fields: mapObject(model.models, model => {
        return inferField(model, key)
      })
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

    return new RecursiveField({
      topRecursionLabel: model.top,
      fields: mapObject(rawField.fields, (field, key) => {
        const recursionModel = model.models[key]

        if (!recursionModel) {
          return new ErrorField({
            label: rawField.label,
            description: rawField.description,
            message: `Model not found for recursion label: ${key}`
          })
        }

        return unserializeField(field, recursionModel)
      })
    })
  }
}

export interface RecursionFieldOptions {
  readonly recursionLabel: string
  readonly field: Field
}

export class RecursionField implements Field<any, RecursionContext> {
  private recursionLabel: string
  private field: Field

  public constructor(options: RecursionFieldOptions) {
    this.recursionLabel = options.recursionLabel
    this.field = options.field
  }

  // TODO: Nested recursions will still recreate context everytime, find better solution
  private mergeRecursionContext = memoizeOne((context?: RecursionContext) => {
    return {
      ...context,
      recursions: {
        ...(context ? context.recursions : []),
        [this.recursionLabel]: this.field
      }
    }
  })

  public renderListComponent(props: ListRenderProps<any, RecursionContext>) {
    return this.field.renderListComponent({
      ...props,
      context: this.mergeRecursionContext(props.context)
    })
  }

  public renderEditComponent(props: EditRenderProps<string>) {
    return this.field.renderEditComponent({
      ...props,
      context: this.mergeRecursionContext(props.context)
    })
  }

  public defaultValue(context?: RecursionContext) {
    return this.field.defaultValue(this.mergeRecursionContext(context))
  }

  public transformRawValue(value: any, context?: RecursionContext) {
    return this.field.transformRawValue(value, this.mergeRecursionContext(context))
  }

  public transformValueToExpression(value: string, context?: RecursionContext) {
    return this.field.transformValueToExpression(value, this.mergeRecursionContext(context))
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

  public sortConfigurations(): SortConfigration[] {
    return []
  }

  public static type = 'recursion'

  static inferFromModel(model: Model, key: string | undefined, inferField: InferFieldFunction) {
    if (model.type !== 'recursion') return null

    return new RecursionField({
      recursionLabel: model.label,
      field: inferField(model.model, key)
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

    // TODO
    return new RecursionField({
      recursionLabel: rawField.recursionLabel,
      field: unserializeField(rawField.field, model.model)
    })
  }
}

export class RecurseField implements Field<any, RecursionContext> {
  public readonly recursionLabel: string

  public constructor(label: string) {
    this.recursionLabel = label
  }

  public renderListComponent(props: ListRenderProps<any, RecursionContext>) {
    return this.getRecursionField(props.context).renderListComponent(props)
  }

  public renderEditComponent(props: EditRenderProps<any, RecursionContext>) {
    return this.getRecursionField(props.context).renderEditComponent(props)
  }

  private getRecursionField(context?: RecursionContext) {
    if (!context || !context.recursions) throw new Error('No RecursionContext found!')

    const field = context.recursions[this.recursionLabel]
    if (!field) throw new Error(`No matching recursion found for label: ${this.recursionLabel}`)

    return field
  }

  public defaultValue(context: RecursionContext) {
    return this.getRecursionField(context).defaultValue(context)
  }

  public transformRawValue(value: any, context: RecursionContext) {
    return this.getRecursionField(context).transformRawValue(value, context)
  }

  public transformValueToExpression(value: string, context: RecursionContext) {
    return this.getRecursionField(context).transformValueToExpression(value, context)
  }

  public isValidValue(_value: string) {
    return null // TODO: Context
    // return this.getRecursionField(context).isValidValue(value)
  }

  public serialize() {
    return {
      type: RecursionField.type,
      recursionLabel: this.recursionLabel
    }
  }

  public traverse(_keyPath: KeyPath) {
    // TODO: Context
    //return this.topField.traverse(keyPath)
    return this
  }

  public valuePathForKeyPath(_keyPath: KeyPath) {
    // TODO: Context
    // return this.topField.valuePathForKeyPath(keyPath)
    return []
  }

  public sortConfigurations(): SortConfigration[] {
    return []
  }

  public static type = 'recurse'

  public static inferFromModel(model: Model) {
    if (model.type !== 'recurse') return null
    return new RecurseField(model.label)
  }

  public static unserialize(rawField: SerializedField, model: Model) {
    if (model.type !== 'recurse') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new RecursionField(rawField.recursionLabel)
  }
}
