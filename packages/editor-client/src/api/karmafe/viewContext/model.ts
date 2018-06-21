import {KeyPath, Model, isKeyPathEqual, keyPathToString} from '../../karma'

import {lastItem} from '@karma.run/editor-common'
import {deleteNullValues} from '@karma.run/editor-common'
import {convertKeyToLabel, slugify, stringToColor} from '../../../util/string'
import {DateFormat} from '../../../store/fields/dateTimeFieldStore'
import {Layout} from '../../../store/fields/fieldsetStore'
import {Select, Control, LinkType, StyleGroup, BlockType, CustomElement} from '../../../ui/common'
import {getValueForKeyPath} from '../../../util/values'
import {MediaType} from '@karma.run/editor-media-client'

// ViewContext
// ===========

export interface ViewContext {
  id?: string
  model: string
  name?: string
  slug?: string
  icon?: string
  color?: string
  description?: string
  descriptionKeyPaths?: KeyPath[]
  fields?: Field[]
}

// Modifiers
// =========

// Helpers
export type BaseModifier<T extends string, O = {}> = {type: T} & O
function BaseModifierConstructor<T extends string, O = {}>(type: T) {
  return (opts: O) => Object.assign({type}, opts)
}

// OptionalModifier
export interface OptionalModifierOptions {}
export interface OptionalModifier extends BaseModifier<'optional', OptionalModifierOptions> {}
export const OptionalModifier = BaseModifierConstructor<'optional', OptionalModifierOptions>(
  'optional'
)

// ListModifier
export interface ListModifierOptions {
  minLength?: number
  maxLength?: number
}
export interface ListModifier extends BaseModifier<'list', ListModifierOptions> {}
export const ListModifier = BaseModifierConstructor<'list', ListModifierOptions>('list')

// MapModifier
export interface MapModifierOptions {
  restrictedToKeys?: string[]
  minLength?: number
  maxLength?: number
}

export interface MapModifier extends BaseModifier<'map', MapModifierOptions> {}
export const MapModifier = BaseModifierConstructor<'map', MapModifierOptions>('map')

export interface RecursionModifierOptions {}

export interface RecursionModifier extends BaseModifier<'recursion', RecursionModifierOptions> {}
export const RecursionModifier = BaseModifierConstructor<'recursion', RecursionModifierOptions>(
  'recursion'
)

// Modifier
export type Modifier = OptionalModifier | ListModifier | MapModifier | undefined
export type ModifierType = (OptionalModifier | ListModifier | MapModifier)['type']

// Fields
// ======

// Functions
export function findFieldsOfType(items: Field[], type: FieldType): Field[] {
  return items.filter(item => item.type === type)
}

export function findRootKeyPath(items: Field[]): Field | undefined {
  return items.find(item => item.keyPath.length === 0)
}

export function findChildrenOfKeyPath(keyPath: KeyPath, items: Field[]): Field[] {
  return items.filter(item => {
    if (item.keyPath.length !== keyPath.length + 1) return false
    return keyPath.every((key, index) => {
      return item.keyPath[index] === key
    })
  })
}

export function findKeyPath(keyPath: KeyPath, items: Field[]): Field | undefined {
  return items.find(item => {
    return keyPath.length === item.keyPath.length && isKeyPathEqual(keyPath, item.keyPath)
  })
}

export function isRootKeyPath(keyPath: KeyPath): boolean {
  return keyPath.length === 0
}

export function findParentOfKeyPath(keyPath: KeyPath, items: Field[]): Field | undefined {
  if (keyPath.length === 0) return undefined
  const parentKeyPath = keyPath.slice(0, keyPath.length - 1)
  return findKeyPath(parentKeyPath, items)
}

export function findAncestorsOfKeyPath(keyPath: KeyPath, items: Field[]): Field[] {
  let parent: Field | undefined
  let ancestors: Field[] = []

  while ((parent = findParentOfKeyPath(keyPath, items))) {
    ancestors.push(parent)
    keyPath = parent.keyPath
  }

  return ancestors
}

export function isContainerField(field?: Field) {
  return field && (field.type === 'fieldset' || field.type === 'select')
}

export function labelForKeyPath(keyPath: KeyPath, items: Field[]): string {
  const item = findKeyPath(keyPath, items)
  return item && item.label ? item.label : keyPathToString(keyPath)
}

// Helpers
export interface BaseFieldOptions {
  keyPath: KeyPath
  modifiers?: Modifier[]
  label?: string
  description?: string
  icon?: string
}

export type BaseField<T extends string | undefined, O = {}> = {type: T} & BaseFieldOptions & O
export function BaseFieldConstructor<T extends string | undefined, O = {}>(type: T) {
  return (opts: BaseFieldOptions & O) => Object.assign({type}, opts)
}

// UntypedField
export interface UntypedField extends BaseField<undefined, {}> {}
export const UntypedField = BaseFieldConstructor<undefined, {}>(undefined)

// ErrorField
export interface ErrorFieldOptions {
  message?: string
}
export interface ErrorField extends BaseField<'error', ErrorFieldOptions> {}
export const ErrorField = BaseFieldConstructor<'error', ErrorFieldOptions>('error')

// RecursionField
export interface RecursionFieldOptions {
  recursionLabel: string
}

export interface RecursionField extends BaseField<'recursion', RecursionFieldOptions> {}
export const RecursionField = BaseFieldConstructor<'recursion', RecursionFieldOptions>('recursion')

// CheckboxField
export interface CheckboxFieldOptions {
  defaultValue?: boolean
}
export interface CheckboxField extends BaseField<'checkbox', CheckboxFieldOptions> {}
export const CheckboxField = BaseFieldConstructor<'checkbox', CheckboxFieldOptions>('checkbox')

// DateTimeField
export interface DateTimeFieldOptions {
  defaultValue?: Date
  format?: DateFormat
}
export interface DateTimeField extends BaseField<'dateTime', DateTimeFieldOptions> {}
export const DateTimeField = BaseFieldConstructor<'dateTime', DateTimeFieldOptions>('dateTime')

// EnumField
export interface EnumFieldOptions {
  values?: Select.Option[]
}
export interface EnumField extends BaseField<'enum', EnumFieldOptions> {}
export const EnumField = BaseFieldConstructor<'enum', EnumFieldOptions>('enum')

// Fieldset
export interface FieldsetOptions {
  layout?: Layout
}
export interface Fieldset extends BaseField<'fieldset', FieldsetOptions> {}
export const Fieldset = BaseFieldConstructor<'fieldset', FieldsetOptions>('fieldset')

// FloatField
export interface FloatFieldOptions {
  defaultValue?: number
  minValue?: number
  maxValue?: number
}

export interface FloatField extends BaseField<'float', FloatFieldOptions> {}
export const FloatField = BaseFieldConstructor<'float', FloatFieldOptions>('float')

// IntField
export interface IntFieldOptions {
  defaultValue?: number
  minValue?: number
  maxValue?: number
  multipleOf?: number
  storageSize?: 8 | 16 | 32 | 64
  unsigned?: boolean
}

export interface IntField extends BaseField<'int', IntFieldOptions> {}
export const IntField = BaseFieldConstructor<'int', IntFieldOptions>('int')

// MediaField
export interface MediaFieldOptions {
  allowedMediaTypes: MediaType[]
}

export interface MediaField extends BaseField<'media', MediaFieldOptions> {}
export const MediaField = BaseFieldConstructor<'media', MediaFieldOptions>('media')

// PasswordField
export interface PasswordFieldOptions {
  costFactor?: number
}
export interface PasswordField extends BaseField<'password', PasswordFieldOptions> {}
export const PasswordField = BaseFieldConstructor<'password', PasswordFieldOptions>('password')

// RefField
export interface RefFieldOptions {
  model?: string
  disableEditing?: boolean
}
export interface RefField extends BaseField<'ref', RefFieldOptions> {}
export const RefField = BaseFieldConstructor<'ref', RefFieldOptions>('ref')

// RichTextField
export interface RichTextFieldOptions {
  controls?: Control[]
  links?: LinkType[]
  styleGroups?: StyleGroup[]
  blocks?: BlockType[]
  elements?: CustomElement[]
  linkEntityType?: string
  minLength?: number
  maxLength?: number
}

export interface RichTextField extends BaseField<'richText', RichTextFieldOptions> {}
export const RichTextField = BaseFieldConstructor<'richText', RichTextFieldOptions>('richText')

// SelectField
export interface SelectFieldOptions {
  defaultValue?: string
}
export interface SelectField extends BaseField<'select', SelectFieldOptions> {}
export const SelectField = BaseFieldConstructor<'select', SelectFieldOptions>('select')

// TextField
export interface TextFieldOptions {
  defaultValue?: string
  minLength?: number
  maxLength?: number
  multiline?: boolean
}

export interface TextField extends BaseField<'text', TextFieldOptions> {}
export const TextField = BaseFieldConstructor<'text', TextFieldOptions>('text')

// TupleField
export interface TupleFieldOptions {}
export interface TupleField extends BaseField<'tuple', TupleFieldOptions> {}
export const TupleField = BaseFieldConstructor<'tuple', TupleFieldOptions>('tuple')

// OrField
export interface OrFieldOptions {}
export interface OrField extends BaseField<'or', OrFieldOptions> {}
export const OrField = BaseFieldConstructor<'or', OrFieldOptions>('or')

// NullField
export interface NullField extends BaseField<'null', FloatFieldOptions> {}
export const NullField = BaseFieldConstructor<'null'>('null')

// Field
export type Field =
  | Fieldset
  | CheckboxField
  | DateTimeField
  | EnumField
  | FloatField
  | TupleField
  | OrField
  | IntField
  | MediaField
  | PasswordField
  | RefField
  | RichTextField
  | SelectField
  | TextField
  | ErrorField
  | RecursionField
  | NullField
  | UntypedField

export type FieldType = Field['type']

export function inferViewContextFromModel(id: string, model: Model, tag?: string): ViewContext {
  return {
    model: id,
    color: stringToColor(id),
    name: tag ? convertKeyToLabel(tag) : id,
    slug: slugify(tag || id),
    descriptionKeyPaths: [],
    fields: inferFieldsFromModel(model)
  }
}

export function inferFieldsFromModel(
  model: Model,
  keyPath: KeyPath = [],
  modifiers: Modifier[] = [],
  typeHint?: FieldType
): Field[] {
  const lastKey = lastItem(keyPath)

  let label: string | undefined

  if (typeof lastKey === 'number') {
    label = convertKeyToLabel(model.type)
  } else {
    label = lastKey ? convertKeyToLabel(lastKey) : undefined
  }

  const defaultOptions = {keyPath, label, modifiers}

  if (typeHint) {
    switch (typeHint) {
      case 'richText': {
        if (model.type === 'struct') {
          const blockData: Model | undefined = getValueForKeyPath(model, [
            'fields',
            'blocks',
            'model',
            'fields',
            'data'
          ])

          const entityData: Model | undefined = getValueForKeyPath(model, [
            'fields',
            'entityMap',
            'model',
            'fields',
            'data'
          ])

          let blockDataFields: Field[] = []
          let entityDataFields: Field[] = []

          if (blockData && blockData.type === 'or') {
            const blockDataUnion = blockData.fields[0]

            if (blockDataUnion && blockDataUnion.type === 'union') {
              blockDataFields = Object.entries(blockDataUnion.fields).reduce(
                (prev, [key, model]) =>
                  prev.concat(inferFieldsFromModel(model, [...keyPath, 'blockData', key])),
                [] as Field[]
              )
            }
          }

          if (entityData && entityData.type === 'or') {
            const entityDataUnion = entityData.fields[0]

            if (entityDataUnion && entityDataUnion.type === 'union') {
              entityDataFields = Object.entries(entityDataUnion.fields).reduce(
                (prev, [key, model]) =>
                  prev.concat(inferFieldsFromModel(model, [...keyPath, 'entityData', key])),
                [] as Field[]
              )
            }
          }

          return [RichTextField(defaultOptions), ...blockDataFields, ...entityDataFields]
        }
        break
      }
    }
  }

  // Modifiers
  switch (model.type) {
    case 'optional':
      return inferFieldsFromModel(model.model, keyPath, [...modifiers, OptionalModifier({})])

    case 'list':
    case 'set':
      return inferFieldsFromModel(model.model, keyPath, [...modifiers, ListModifier({})])

    case 'map':
      return inferFieldsFromModel(model.model, keyPath, [...modifiers, MapModifier({})])

    case 'annotation': {
      const typeHint = model.value.replace('field:', '')
      return inferFieldsFromModel(model.model, keyPath, modifiers, typeHint as FieldType)
    }

    case 'unique':
      return inferFieldsFromModel(model.model, keyPath, modifiers)
  }

  // Fields
  switch (model.type) {
    case 'union':
    case 'struct': {
      const fields = Object.entries(model.fields).reduce(
        (prev, [key, model]) => prev.concat(inferFieldsFromModel(model, [...keyPath, key])),
        [] as Field[]
      )

      return [
        model.type === 'struct' ? Fieldset(defaultOptions) : SelectField(defaultOptions),
        ...fields
      ]
    }

    case 'or':
    case 'tuple': {
      const fields = model.fields.reduce(
        (prev, model, index) => prev.concat(inferFieldsFromModel(model, [...keyPath, index])),
        [] as Field[]
      )

      return [
        model.type === 'tuple' ? TupleField(defaultOptions) : OrField(defaultOptions),
        ...fields
      ]
    }

    case 'null':
      return [NullField(defaultOptions)]
    case 'bool':
      return [CheckboxField(defaultOptions)]
    case 'string':
      return [TextField(defaultOptions)]
    case 'dateTime':
      return [DateTimeField(defaultOptions)]
    case 'ref':
      return [RefField({...defaultOptions, model: model.model})]

    case 'enum':
      return [
        EnumField({
          ...defaultOptions,
          values: model.values.map(value => ({key: value, label: convertKeyToLabel(value)}))
        })
      ]

    case 'float':
      return [FloatField(defaultOptions)]

    case 'int':
      return [IntField(defaultOptions)]
    case 'int8':
      return [IntField({...defaultOptions, storageSize: 8})]
    case 'int16':
      return [IntField({...defaultOptions, storageSize: 16})]
    case 'int32':
      return [IntField({...defaultOptions, storageSize: 32})]
    case 'int64':
      return [IntField({...defaultOptions, storageSize: 64})]

    case 'uint':
      return [IntField({...defaultOptions, unsigned: true})]
    case 'uint8':
      return [IntField({...defaultOptions, storageSize: 8, unsigned: true})]
    case 'uint16':
      return [IntField({...defaultOptions, storageSize: 16, unsigned: true})]
    case 'uint32':
      return [IntField({...defaultOptions, storageSize: 32, unsigned: true})]
    case 'uint64':
      return [IntField({...defaultOptions, storageSize: 64, unsigned: true})]

    case 'recurse':
      return [RecursionField({...defaultOptions, recursionLabel: model.label})]

    case 'recursion': {
      const fields = inferFieldsFromModel(model.model, [...keyPath, model.label])

      return [RecursionField({...defaultOptions, recursionLabel: model.label}), ...fields]
    }

    case 'recursive': {
      const modelEntries = Object.entries(model.models)
      const fields = modelEntries.reduce(
        (prev, [key, model]) => prev.concat(inferFieldsFromModel(model, [...keyPath, key])),
        [] as Field[]
      )

      return [RecursionField({...defaultOptions, recursionLabel: model.top}), ...fields]
    }

    default:
      return [
        ErrorField({
          keyPath,
          label,
          modifiers,
          message: `Couldn't deduce field for type: ${model.type}`
        })
      ]
  }
}

export function mergeViewContext(
  viewContextA: ViewContext,
  viewContextB: ViewContext
): ViewContext {
  viewContextA = deleteNullValues(viewContextA)
  viewContextB = deleteNullValues(viewContextB)

  let fields: Field[] | undefined

  if (viewContextA.fields && viewContextB.fields) {
    fields = mergeFields(viewContextA.fields, viewContextB.fields)
  } else {
    fields = viewContextA.fields || viewContextB.fields
  }

  return Object.assign({}, viewContextA, viewContextB, {fields})
}

export function mergeFields(fieldsA: Field[], fieldsB: Field[]): Field[] {
  const mergedFields = fieldsB.reduce(
    (prev, fieldB) => {
      const fieldA = fieldsA.find(fieldA => isKeyPathEqual(fieldA.keyPath, fieldB.keyPath))
      return [...prev, fieldA ? mergeField(fieldA, fieldB) : fieldB]
    },
    [] as Field[]
  )

  const keepFields = fieldsA.filter(fieldA => {
    return !fieldsB.find(fieldB => isKeyPathEqual(fieldA.keyPath, fieldB.keyPath))
  })

  return [...mergedFields, ...keepFields]
}

export function mergeField(fieldA: Field, fieldB: Field): Field {
  fieldA = deleteNullValues(fieldA)
  fieldB = deleteNullValues(fieldB)

  let modifiers = fieldA.modifiers || fieldB.modifiers

  if (fieldA.modifiers && fieldB.modifiers) {
    modifiers = fieldA.modifiers.map((value, index) => {
      return fieldB.modifiers![index] || value
    })
  }

  if (fieldA.type === fieldB.type || fieldB.type == undefined) {
    return Object.assign({}, fieldA, fieldB, {modifiers})
  } else {
    return Object.assign(
      {
        label: fieldA.label,
        description: fieldA.description,
        modifiers
      },
      fieldB
    )
  }
}
