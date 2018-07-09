import {expression as e} from '@karma.run/sdk'
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
import {reduceToMap} from '@karma.run/editor-common'

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
  public parent?: Field

  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(options: RecursiveFieldOptions) {
    const topField = options.fields.get(options.topRecursionLabel)
    if (!topField) throw new Error("Top label doesn't exist in fields.")

    this.topRecursionLabel = options.topRecursionLabel
    this.topField = topField
    this.fields = options.fields
    this.fields.forEach(field => (field.parent = this))
  }

  public renderListComponent(props: ListRenderProps<any>) {
    return this.topField.renderListComponent(props)
  }

  public renderEditComponent(props: EditRenderProps<any>) {
    return this.topField.renderEditComponent(props)
  }

  public get defaultValue(): any {
    return this.topField.defaultValue
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

  public async onSave(value: any) {
    if (this.topField.onSave) {
      return this.topField.onSave(value)
    }

    return value
  }

  public async onDelete(value: any) {
    if (this.topField.onDelete) {
      return this.topField.onDelete(value)
    }

    return value
  }

  public static type = 'recursive'

  static inferFromModel(model: Model, key: string | undefined, inferField: InferFieldFunction) {
    if (model.type !== 'recursive') return null

    return new RecursiveField({
      topRecursionLabel: model.top,
      fields: new Map(
        Object.entries(model.models).map(
          ([recursionKey, model]) => [recursionKey, inferField(model, key)] as [string, Field]
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

    return new RecursiveField({
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
  public parent?: Field

  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(options: RecursionFieldOptions) {
    this.recursionLabel = options.recursionLabel
    this.field = options.field
    this.field.parent = this
  }

  public renderListComponent(props: ListRenderProps<any>) {
    return this.field.renderListComponent(props)
  }

  public renderEditComponent(props: EditRenderProps<string>) {
    return this.field.renderEditComponent(props)
  }

  public get defaultValue(): any {
    return this.field.defaultValue
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

  public async onSave(value: any) {
    if (this.field.onSave) {
      return this.field.onSave(value)
    }

    return value
  }

  public async onDelete(value: any) {
    if (this.field.onDelete) {
      return this.field.onDelete(value)
    }

    return value
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

    return new RecursionField({
      recursionLabel: rawField.recursionLabel,
      field: unserializeField(rawField.field, model.model)
    })
  }
}

export class RecurseField implements Field<any> {
  public readonly recursionLabel: string
  public parent?: Field

  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(label: string) {
    this.recursionLabel = label
  }

  private _field?: Field
  public get field() {
    if (this._field) return this._field

    let ancestor: Field | undefined = this.parent

    while (ancestor) {
      if (ancestor instanceof RecursionField && ancestor.recursionLabel === this.recursionLabel) {
        this._field = ancestor.field
        break
      }

      if (ancestor instanceof RecursiveField && ancestor.fields.get(this.recursionLabel)) {
        this._field = ancestor.fields.get(this.recursionLabel)!
        break
      }

      ancestor = ancestor.parent
    }

    return this._field
  }

  public renderListComponent(props: ListRenderProps<any>) {
    // TODO: Show error
    if (!this.field) return null
    return this.field.renderListComponent(props)
  }

  public renderEditComponent(props: EditRenderProps<any>) {
    // TODO: Show error
    if (!this.field) return null
    return this.field.renderEditComponent(props)
  }

  public get defaultValue() {
    if (!this.field) return null
    return this.field.defaultValue
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
      recursionLabel: this.recursionLabel
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

  public async onSave(value: any) {
    if (this.field && this.field.onSave) {
      return this.field.onSave(value)
    }

    return value
  }

  public async onDelete(value: any) {
    if (this.field && this.field.onDelete) {
      return this.field.onDelete(value)
    }

    return value
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
