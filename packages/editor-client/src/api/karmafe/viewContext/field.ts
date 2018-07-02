import {Omit, ObjectMap, lastItem} from '@karma.run/editor-common'
import {
  Expression,
  DataExpression,
  expression as e,
  data as d,
  model as m,
  DefaultTags,
  Ref
} from '@karma.run/sdk'

import {Model, KeyPath} from '../../karma/model'
import {stringToColor, convertKeyToLabel, slugify} from '../../../util/string'
import {refToString} from '../../../util/ref'

export type InferFieldFunction = (
  model: Model,
  keyPath: KeyPath,
  modifiers: InferredViewContextFieldModifier[]
) => Field

export interface CommonFieldOptions {
  label: string
  description: string
}

export interface Field<V = any, O = {}> {
  readonly options: O

  readonly listComponent: React.ComponentType<{field: Field<V, CommonFieldOptions & O>; value: V}>
  readonly editComponent: React.ComponentType<{field: Field<V, CommonFieldOptions & O>; value: V}>

  transformRawValue?(value: any): V
  transformValueToExpression?(value: V): Expression

  isValidValue(value: V): string[] | null
  clone(): Field<V>
}

export const enum FieldType {
  Modifier = 'modifier',
  Field = 'field'
}

export interface OptionsModel {
  type: FieldType
  model: DataExpression
}

export interface FieldClass<F extends Field = Field, O = {}> {
  readonly type: string
  readonly fieldType: FieldType

  optionsModel(): DataExpression
  unserializeOptions(opts: any): O
  defaultOptionsForModel(model: Model): O

  shouldInferFromModel?(model: Model): boolean
  isValidModel?(model: Model): string[] | null

  createField(
    model: Model,
    options: CommonFieldOptions & O,
    keyPath: KeyPath,
    inferFn: InferFieldFunction
  ): F
}

export const TestComponent = (value: any) => value

export interface ErrorFieldOptions extends CommonFieldOptions {
  message: string
}

export class ErrorField implements Field<null> {
  public readonly options: ErrorFieldOptions

  public readonly listComponent = TestComponent
  public readonly editComponent = TestComponent

  public constructor(opts: ErrorFieldOptions) {
    this.options = opts
  }

  public transformRawValue(value: any) {
    return value
  }

  public transformValueToExpression(value: any) {
    return e.string(value)
  }

  public isValidValue() {
    return [this.options.message]
  }

  public clone() {
    return new ErrorField(this.options)
  }
}

export class StringField implements Field<string> {
  public readonly options: CommonFieldOptions

  public readonly listComponent = TestComponent
  public readonly editComponent = TestComponent

  public constructor(opts: CommonFieldOptions) {
    this.options = opts
  }

  public transformRawValue() {
    return ''
  }

  public transformValueToExpression(value: string) {
    return e.string(value)
  }

  public isValidValue() {
    return null
  }

  public clone() {
    return new StringField(this.options)
  }

  public static type = 'string'
  public static fieldType = FieldType.Field

  static optionsModel() {
    return m.struct()
  }

  static unserializeOptions() {
    return {}
  }

  static shouldInferFromModel(model: Model) {
    return model.type !== 'string'
  }

  static defaultOptionsForModel() {
    return {}
  }

  static createField(model: Model, options: CommonFieldOptions) {
    if (model.type !== 'string') return new ErrorField({...options, message: 'Invalid model'})
    return new StringField(options)
  }
}

export class StructField implements Field<string> {
  public readonly options: CommonFieldOptions

  public readonly listComponent = TestComponent
  public readonly editComponent = TestComponent

  public constructor(opts: CommonFieldOptions) {
    this.options = opts
  }

  public transformRawValue() {
    return ''
  }

  public transformValueToExpression(value: string) {
    return e.string(value)
  }

  public isValidValue() {
    return null
  }

  public clone() {
    return new StringField(this.options)
  }

  public static type = 'struct'
  public static fieldType = FieldType.Field

  public static createField(options: CommonFieldOptions, model: Model) {
    if (model.type !== 'struct') return new ErrorField({...options, message: 'Invalid model'})
    return new StringField(options)
  }

  static shouldInferFromModel(model: Model) {
    return model.type !== 'struct'
  }

  public static optionsModel() {
    return m.struct()
  }

  public static unserializeOptions() {
    return {}
  }

  static defaultOptionsForModel() {
    return {}
  }
}

export class ListField implements Field<string> {
  public readonly options: CommonFieldOptions

  public readonly listComponent = TestComponent
  public readonly editComponent = TestComponent

  public constructor(opts: CommonFieldOptions) {
    this.options = opts
  }

  public transformRawValue() {
    return ''
  }

  public transformValueToExpression(value: string) {
    return e.string(value)
  }

  public isValidValue() {
    return null
  }

  public clone() {
    return new StringField(this.options)
  }

  public static type = 'list'
  public static fieldType = FieldType.Modifier

  public static createField(options: CommonFieldOptions, model: Model) {
    if (model.type !== 'list') return new ErrorField({...options, message: 'Invalid model'})
    return new StringField(options)
  }

  static shouldInferFromModel(model: Model) {
    return model.type !== 'list'
  }

  public static optionsModel() {
    return m.struct()
  }

  public static unserializeOptions() {
    return {}
  }

  static defaultOptionsForModel() {
    return {}
  }
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

export const defaultFieldRegistry = createFieldRegistry(StringField, StructField, ListField)

export function viewContextModelForFieldRegistries(registry: FieldRegistry): DataExpression {
  const modifierModels: ObjectMap<DataExpression> = {}
  const fieldModels: ObjectMap<DataExpression> = {}

  for (const [type, field] of registry.entries()) {
    const optionsModel = field.optionsModel()

    switch (field.type) {
      case FieldType.Modifier:
        modifierModels[type] = optionsModel
        break

      case FieldType.Field:
        fieldModels[type] = optionsModel
        break
    }
  }

  return m.struct({
    key: m.struct(),
    name: m.optional(m.string()),
    description: m.optional(m.string()),
    slug: m.optional(m.string()),
    model: m.ref(d.expr(e.tag(DefaultTags.Model))),
    displayKeyPaths: m.optional(m.list(m.list(m.string()))),
    fields: m.optional(
      m.list(
        m.struct({
          keyPath: m.list(m.string()),
          label: m.optional(m.string()),
          description: m.optional(m.string()),
          modifiers: m.optional(m.list(m.optional(m.union(modifierModels)))),
          type: m.optional(m.union(fieldModels))
        })
      )
    )
  })
}

export interface ViewContextFieldModifierOverride {
  type?: string
  options: any
}

export interface ViewContextFieldOverride {
  type?: string
  keyPath: KeyPath
  label: string
  description: string
  modifiers?: ViewContextFieldModifierOverride[]
  options: any
}

export interface ViewContextOverride {
  id: Ref
  model: Ref
  name?: string
  slug?: string
  color?: string
  description?: string
  displayKeyPaths?: KeyPath[]
  fields?: ViewContextFieldOverride[]
}

export interface ViewContext {
  model: Ref
  name: string
  slug: string
  color: string
  field: Field
  displayKeyPaths: KeyPath[]
}

export function viewContextForModel(
  id: Ref,
  model: Model,
  registry: FieldRegistry,
  tag?: string,
  override?: ViewContextOverride
): ViewContext {
  return {
    model: id,
    color: override && override.color ? override.color : stringToColor(refToString(id)),
    name: override && override.name ? override.name : tag ? convertKeyToLabel(tag) : id[1],
    slug: override && override.slug ? override.slug : slugify(tag || id[1]),
    field: fieldForModel(model, registry, override ? override.fields : undefined),
    displayKeyPaths: override ? override.displayKeyPaths || [] : []
  }
}

// export function unserializeViewContext(viewContext: any): ViewContext {}

export function keyPathToString(keyPath: KeyPath) {
  return ['root', ...keyPath].join('.')
}

export function isKeyPathEqual(keyPathA: KeyPath, keyPathB: KeyPath) {
  if (keyPathA.length !== keyPathB.length) return false
  return keyPathA.every((key, index) => keyPathB[index] === key)
}

export function findKeyPath(
  keyPath: KeyPath,
  items: ViewContextFieldOverride[]
): ViewContextFieldOverride | undefined {
  return items.find(item => {
    return isKeyPathEqual(keyPath, item.keyPath)
  })
}

export function fieldForModel(
  model: Model,
  registry: FieldRegistry,
  fieldOverrides?: ViewContextFieldOverride[]
): Field {
  function inferField(keyPath: KeyPath, modifierIndex: number, model: Model): Field {
    const override = findKeyPath(keyPath, fieldOverrides || [])
    const lastKey = lastItem(keyPath) || ''

    const label = override && override.label ? override.label : convertKeyToLabel(lastKey)
    const description = override && override.description ? override.description : ''

    // Override
    if (override) {
      // const fieldClass = registry.get(override.type)

      // if (!fieldClass) {
      //   return new ErrorField({
      //     label,
      //     description,
      //     message: `No field registed with type: ${override.type}`
      //   })
      // }

      const defaultOptions = fieldClass.defaultOptionsForModel(model)
      const options = {label, description, ...defaultOptions, ...override.options}

      let field: Field

      for (const modifier of override.modifiers) {
      }

      return fieldClass.createField(options, model, keyPath, inferField)
    }

    // Infer
    for (const fieldClass of registry.values()) {
      if (fieldClass.isValidModel && fieldClass.isValidModel(model)) {
        const defaultOptions = fieldClass.defaultOptionsForModel(model)
        const options = {label, description, ...defaultOptions}

        return fieldClass.createField(options, model, keyPath, inferField)
      }
    }

    return new ErrorField({label, description, message: "Coulnd't infer field from model"})
  }

  return inferField([], model)
}
