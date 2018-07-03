import React from 'react'
import {reduceToMap, SortType, ValuePathSegmentType, ValuePath} from '@karma.run/editor-common'
import {Expression, DataExpression, expression as e, data as d, Ref} from '@karma.run/sdk'

import {Model, KeyPath, Unique} from './karma/model'
import {stringToColor, convertKeyToLabel, slugify} from '../util/string'
import {refToString} from '../util/ref'
import {SortConfigration, labelForMetaField, FilterField} from '../filter/configuration'
import {CardSection} from '../ui/common/card'

export type InferFieldFunction = (model: Model, label?: string) => Field
export type UnserializeFieldFunction = (rawField: any, model: Model) => Field

export interface CommonFieldOptions {
  label?: string | null
  description?: string | null
}

export interface SerializedField {
  type: string
  [key: string]: any
}

export interface Field<V = any> {
  renderListComponent(value: V): React.ReactNode
  renderEditComponent(value: V, onChange: () => void): React.ReactNode

  serialize(): SerializedField
  defaultValue(): V

  transformRawValue(value: any): V
  transformValueToExpression(value: V): Expression

  isValidValue(value: V): string[] | null

  traverse(keyPath: KeyPath): Field | undefined
  valuePathForKeyPath(keyPath: KeyPath): ValuePath

  sortConfigurations?(): SortConfigration[]
  filterConfigurations?(): FilterField[]

  onSave?(value: V): Promise<void>
  onDelete?(value: V): Promise<void>
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
    inferredLabel: string | undefined,
    inferField: InferFieldFunction
  ): Field<V> | null
}

export interface ErrorFieldOptions extends CommonFieldOptions {
  label?: string
  message: string
}

export class ErrorField implements Field<null> {
  public readonly label?: string
  public readonly message: string

  public constructor(opts: ErrorFieldOptions) {
    this.label = opts.label
    this.message = opts.message
  }

  public renderListComponent() {
    return ''
  }

  public renderEditComponent() {
    return ''
  }

  public defaultValue() {
    return null
  }

  public serialize(): SerializedField {
    throw new Error('Error field should not be serialized!')
  }

  public transformRawValue(value: any) {
    return value
  }

  public transformValueToExpression(value: any) {
    return e.string(value)
  }

  public isValidValue() {
    return [this.message]
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }
}

export class UniqueField implements Field<any> {
  public readonly field: Field

  public constructor(field: Field) {
    this.field = field
  }

  public renderListComponent(value: any) {
    return this.field.renderListComponent(value)
  }

  public renderEditComponent(value: any) {
    return this.field.renderListComponent(value)
  }

  public defaultValue() {
    return ''
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

  public serialize() {
    return {
      type: UniqueField.type,
      field: this.field.serialize()
    }
  }

  public traverse(keyPath: KeyPath) {
    return this.field.traverse(keyPath)
  }

  public valuePathForKeyPath(keyPath: KeyPath) {
    return this.field.valuePathForKeyPath(keyPath)
  }

  public static type = 'unique'

  static inferFromModel(model: Model, label: string | undefined, inferField: InferFieldFunction) {
    if (model.type !== 'unique') return null
    return new UniqueField(inferField(model.model, label))
  }

  static unserialize(
    rawField: SerializedField,
    model: Model,
    unserializeField: UnserializeFieldFunction
  ) {
    if (model.type !== 'unique') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    if (typeof rawField.field !== 'object') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid field!'
      })
    }

    return new UniqueField(unserializeField(rawField.field, model.model))
  }
}

export interface StringFieldOptions {
  readonly label?: string
  readonly description?: string
}

export class StringField implements Field<string> {
  public readonly label?: string
  public readonly description?: string

  public constructor(opts: StringFieldOptions) {
    this.label = opts.label
    this.description = opts.description
  }

  public renderListComponent(value: string) {
    return <CardSection>{value}</CardSection>
  }

  public renderEditComponent() {
    return ''
  }

  public defaultValue() {
    return ''
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

  public serialize() {
    return {
      type: StringField.type,
      label: this.label,
      description: this.description
    }
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }

  public static type = 'string'

  static inferFromModel(model: Model, label: string | undefined) {
    if (model.type !== 'string') return null
    return new StringField({label})
  }

  static unserialize(rawField: SerializedField, model: Model) {
    if (model.type !== 'string') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new StringField({
      label: rawField.label,
      description: rawField.description
    })
  }
}

export type StructFieldChildTuple = [string, Field]

export interface StructFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly fields: StructFieldChildTuple[]
}

export type StructFieldValue = {[key: string]: any}

export class StructField implements Field<StructFieldValue> {
  public readonly label?: string
  public readonly description?: string
  public readonly fields: StructFieldChildTuple[]

  public constructor(opts: StructFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.fields = opts.fields
  }

  public renderListComponent() {
    return ''
  }

  public renderEditComponent() {
    return ''
  }

  public defaultValue() {
    return reduceToMap(this.fields, ([key, field]) => [key, field.defaultValue()])
  }

  public transformRawValue(value: any) {
    return reduceToMap(this.fields, ([key, field]) => [key, field.transformRawValue(value[key])])
  }

  public transformValueToExpression(value: StructFieldValue) {
    return e.data(
      d.struct(
        reduceToMap(this.fields, ([key, field]) => [
          key,
          d.expr(field.transformValueToExpression(value[key]))
        ])
      )
    )
  }

  public isValidValue() {
    return null
  }

  public serialize() {
    return {
      type: StructField.type,
      label: this.label || null,
      description: this.description || null,
      fields: this.fields.map(([key, field]) => [key, field.serialize()])
    }
  }

  public traverse(keyPath: KeyPath) {
    if (keyPath.length === 0) return this

    const key = keyPath[0]
    const fieldTuple = this.fields.find(([fieldKey]) => {
      return fieldKey === key
    })

    if (!fieldTuple) return undefined

    return fieldTuple[1].traverse(keyPath.slice(1))
  }

  public valuePathForKeyPath(keyPath: KeyPath): ValuePath {
    const key = keyPath[0]
    const fieldTuple = this.fields.find(([fieldKey]) => {
      return fieldKey === key
    })

    if (!fieldTuple) throw new Error('Invalid KeyPath!')

    return [
      {type: ValuePathSegmentType.Struct, key: key},
      ...fieldTuple[1].valuePathForKeyPath(keyPath.slice(1))
    ]
  }

  public static type = 'struct'

  static unserialize(
    rawField: SerializedField,
    model: Model,
    unserializeField: UnserializeFieldFunction
  ) {
    if (model.type !== 'struct') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    if (!Array.isArray(rawField.fields)) {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid fields!'
      })
    }

    // TODO: Check all keys in model

    return new StructField({
      label: rawField.label,
      description: rawField.description,
      fields: rawField.fields.map(
        ([key, field]) => [key, unserializeField(field, model.fields[key])] as StructFieldChildTuple
      )
    })
  }

  static inferFromModel(model: Model, label: string | undefined, inferField: InferFieldFunction) {
    if (model.type !== 'struct') return null
    return new StructField({
      label,
      fields: Object.entries(model.fields).map(
        ([key, model]) => [key, inferField(model, convertKeyToLabel(key))] as StructFieldChildTuple
      )
    })
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

export const defaultFieldRegistry = createFieldRegistry(StringField, StructField, UniqueField)

// export function viewContextModelForFieldRegistries(registry: FieldRegistry): DataExpression {
//   const modifierModels: ObjectMap<DataExpression> = {}
//   const fieldModels: ObjectMap<DataExpression> = {}

//   for (const [type, field] of registry.entries()) {
//     const optionsModel = field.optionsModel()

//     switch (field.type) {
//       case FieldType.Modifier:
//         modifierModels[type] = optionsModel
//         break

//       case FieldType.Field:
//         fieldModels[type] = optionsModel
//         break
//     }
//   }

//   return m.struct({
//     key: m.struct(),
//     name: m.optional(m.string()),
//     description: m.optional(m.string()),
//     slug: m.optional(m.string()),
//     model: m.ref(d.expr(e.tag(DefaultTags.Model))),
//     displayKeyPaths: m.optional(m.list(m.list(m.string()))),
//     fields: m.optional(
//       m.list(
//         m.struct({
//           keyPath: m.list(m.string()),
//           label: m.optional(m.string()),
//           description: m.optional(m.string()),
//           modifiers: m.optional(m.list(m.optional(m.union(modifierModels)))),
//           type: m.optional(m.union(fieldModels))
//         })
//       )
//     )
//   })
// }

// export interface ViewContextFieldModifierOverride {
//   type?: string
//   options: any
// }

// export interface ViewContextFieldOverride {
//   type?: string
//   keyPath: KeyPath
//   label: string
//   description: string
//   modifiers?: ViewContextFieldModifierOverride[]
//   options: any
// }

// export interface ViewContextOverride {
//   id: Ref
//   model: Ref
//   name?: string
//   slug?: string
//   color?: string
//   description?: string
//   displayKeyPaths?: KeyPath[]
//   fields?: ViewContextFieldOverride[]
// }

// export interface ViewContext {
//   model: Ref
//   name: string
//   slug: string
//   color: string
//   field: Field
//   displayKeyPaths: KeyPath[]
// }

// export function inferViewContextForModel(
//   id: Ref,
//   model: Model,
//   registry: FieldRegistry,
//   tag?: string
// ): ViewContext {
//   return new ViewContext({
//     model: id,
//     color: stringToColor(refToString(id)),
//     name: tag ? convertKeyToLabel(tag) : id[1],
//     slug: slugify(tag || id[1]),
//     field: inferFieldForModel(model, registry),
//     displayKeyPaths: []
//   })
// }

export interface ViewContextOptions {
  readonly model: Ref
  readonly name: string
  readonly slug: string
  readonly color: string
  readonly field: Field
  readonly displayKeyPaths: KeyPath[]
}

export class ViewContext {
  public readonly model: Ref
  public readonly name: string
  public readonly slug: string
  public readonly color: string
  public readonly field: Field
  public readonly displayKeyPaths: KeyPath[]

  private _sortConfigurations?: SortConfigration[]

  public constructor(opts: ViewContextOptions) {
    this.model = opts.model
    this.name = opts.name
    this.slug = opts.slug
    this.color = opts.color
    this.field = opts.field
    this.displayKeyPaths = opts.displayKeyPaths
  }

  public get sortConfigurations() {
    if (this._sortConfigurations) return this._sortConfigurations

    const sortConfigurations: SortConfigration[] = [
      {
        key: 'updatedMeta',
        label: labelForMetaField('updated'),
        type: SortType.Date,
        path: [{type: ValuePathSegmentType.Struct, key: 'updated'}]
      },
      {
        key: 'createdMeta',
        label: labelForMetaField('created'),
        type: SortType.Date,
        path: [{type: ValuePathSegmentType.Struct, key: 'created'}]
      }
    ]

    this._sortConfigurations = sortConfigurations
    return sortConfigurations
  }

  public serialize() {
    // TODO
  }

  public static unserialize(
    rawViewContext: any,
    model: Model,
    regisry: FieldRegistry
  ): ViewContext {
    // TODO: Validate
    return new ViewContext({
      model: rawViewContext.id,
      color: rawViewContext.color,
      name: rawViewContext.name,
      slug: rawViewContext.slug,
      field: unserializeViewContextField(rawViewContext.field, model, regisry),
      displayKeyPaths: rawViewContext.displayKeyPaths
    })
  }

  public static inferFromModel(
    id: Ref,
    model: Model,
    registry: FieldRegistry,
    tag?: string
  ): ViewContext {
    return new ViewContext({
      model: id,
      color: stringToColor(refToString(id)),
      name: tag ? convertKeyToLabel(tag) : id[1],
      slug: slugify(tag || id[1]),
      field: inferFieldFromModel(model, registry),
      displayKeyPaths: inferDisplayKeyPaths(model)
    })
  }
}

// export function unserializeViewContext(viewContext: any): ViewContext {}

// export function keyPathToString(keyPath: KeyPath) {
//   return ['root', ...keyPath].join('.')
// }

// export function isKeyPathEqual(keyPathA: KeyPath, keyPathB: KeyPath) {
//   if (keyPathA.length !== keyPathB.length) return false
//   return keyPathA.every((key, index) => keyPathB[index] === key)
// }

// export function findKeyPath(
//   keyPath: KeyPath,
//   items: ViewContextFieldOverride[]
// ): ViewContextFieldOverride | undefined {
//   return items.find(item => {
//     return isKeyPathEqual(keyPath, item.keyPath)
//   })
// }

export function inferFieldFromModel(model: Model, registry: FieldRegistry): Field {
  function inferField(model: Model, label?: string): Field {
    for (const fieldClass of registry.values()) {
      if (fieldClass.inferFromModel) {
        const field = fieldClass.inferFromModel(model, label, inferField)
        if (field) return field
      }
    }

    return new ErrorField({message: "Coulnd't infer field from model"})
  }

  return inferField(model)
}

export const preferredFieldKeys = ['tag', 'label', 'title', 'key', 'description', 'name']

export function isPreferredFieldKey(key: string) {
  return preferredFieldKeys.some(preferredKey => key.toLowerCase().includes(preferredKey))
}

export function inferDisplayKeyPaths(model: Model) {
  if (model.type === 'struct') {
    return Object.keys(model.fields)
      .filter(key => isPreferredFieldKey(key))
      .map(key => [key])
  }

  return []
}

export function unserializeViewContextField(
  rawField: any,
  model: Model,
  registry: FieldRegistry
): Field {
  function unserialize(rawField: any, model: Model): Field {
    if (typeof rawField.type !== 'string') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: `Coulnd't unserialize field.`
      })
    }

    const fieldClass = registry.get(rawField.type)

    if (!fieldClass) {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: `No field registed with type: ${rawField.type}`
      })
    }

    return fieldClass.unserialize(rawField, model, unserialize)
  }

  return unserialize(rawField, model)
}
