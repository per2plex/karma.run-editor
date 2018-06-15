import {
  Field,
  ViewContext,
  findRootKeyPath,
  findChildrenOfKeyPath
} from '../../api/karmafe/viewContext'

import {lastItem, reduceToMap} from '@karma.run/editor-common'
import {FieldStore, FieldStoreMap} from './fieldStore'

import {CheckboxFieldStore} from './checkboxFieldStore'
import {RefFieldStore} from './refFieldStore'
import {TextFieldStore} from './textFieldStore'
import {IntFieldStore} from './intFieldStore'
import {FloatFieldStore} from './floatFieldStore'
import {DateTimeFieldStore} from './dateTimeFieldStore'
import {FieldsetStore} from './fieldsetStore'
import {OptionalFieldStore} from './optionalFieldStore'
import {ListFieldStore} from './listFieldStore'
import {MapFieldStore} from './mapFieldStore'
import {SelectFieldStore} from './selectFieldStore'
import {PasswordFieldStore} from './passwordFieldStore'
import {RichtTextFieldStore} from './richTextFieldStore'
import {EnumFieldStore} from './enumFieldStore'
import {ErrorFieldStore} from '../../store/fields/errorFieldStore'
import {TupleFieldStore} from '../../store/fields/tupleFieldStore'
import {OrFieldStore} from '../../store/fields/orFieldStore'

import * as debug from '../../util/debug'

import {RecursionFieldStore} from '../../store/fields/recursionFieldStore'
import {NullFieldStore} from './nullFieldStore'
import {MediaFieldStore} from './mediaFieldStore'

export function createFieldStoreForViewContextAndFill(viewContext: ViewContext, value: any) {
  const store = createFieldStoreForViewContext(viewContext)

  if (process.env.NODE_ENV !== 'production') {
    if (!store.fits(value)) {
      debug.error('Invalid value!', store, value)
      throw new Error('Invalid value!')
    }
  }

  store.fill(value)
  return store
}

export function createFieldStoreForViewContext(viewContext: ViewContext) {
  if (!viewContext.fields) throw new Error('No Fields in ViewContext.')
  const rootField = findRootKeyPath(viewContext.fields)
  if (!rootField) throw new Error("Coulnd't find root field.")
  return createFieldStoreForField(rootField, viewContext.fields, [])
}

function createModifierFieldStores(
  modifierIndex: number,
  field: Field,
  fields: Field[],
  recursions: FieldStoreMap[]
): FieldStore {
  const filteredModifiers = (field.modifiers && field.modifiers.filter(modifier => modifier)) || []

  if (modifierIndex >= filteredModifiers.length) {
    return createBasicFieldStores(field, fields, recursions)
  }

  const modifier = filteredModifiers[modifierIndex]!

  switch (modifier.type) {
    case 'optional': {
      const store = createModifierFieldStores(modifierIndex + 1, field, fields, recursions)

      return new OptionalFieldStore(store, {
        label: field.label,
        description: field.description,
        icon: field.icon
      })
    }

    case 'list': {
      const defaultStore = createModifierFieldStores(modifierIndex + 1, field, fields, recursions)

      return new ListFieldStore(defaultStore, {
        label: field.label,
        description: field.description,
        icon: field.icon
      })
    }

    case 'map': {
      const defaultStore = createModifierFieldStores(modifierIndex + 1, field, fields, recursions)

      return new MapFieldStore(defaultStore, {
        label: field.label,
        description: field.description,
        icon: field.icon,
        restrictedToKeys: modifier.restrictedToKeys
      })
    }

    default:
      return createBasicFieldStores(field, fields, recursions)
  }
}

function createBasicFieldStores(
  field: Field,
  fields: Field[],
  recursions: FieldStoreMap[]
): FieldStore {
  const commonOptions = {
    label: field.label,
    description: field.description,
    icon: field.icon
  }

  switch (field.type) {
    case 'checkbox':
      return new CheckboxFieldStore({
        ...commonOptions,
        value: field.defaultValue
      })

    case 'ref': {
      if (!field.model) {
        return new ErrorFieldStore({
          ...commonOptions,
          message: 'Invalid RefField.'
        })
      }

      return new RefFieldStore({
        ...commonOptions,
        model: field.model,
        disableEditing: field.disableEditing
      })
    }

    case 'text':
      return new TextFieldStore({
        ...commonOptions,
        multiline: field.multiline,
        value: field.defaultValue,
        minLength: field.minLength,
        maxLength: field.maxLength
      })

    case 'int':
      return new IntFieldStore({...commonOptions, value: field.defaultValue})
    case 'float':
      return new FloatFieldStore({...commonOptions, value: field.defaultValue})

    case 'dateTime':
      return new DateTimeFieldStore({
        ...commonOptions,
        format: field.format,
        value: field.defaultValue
      })

    case 'password':
      return new PasswordFieldStore({
        ...commonOptions,
        costFactor: field.costFactor
      })

    case 'media': {
      return new MediaFieldStore({
        ...commonOptions,
        allowedMediaTypes: field.allowedMediaTypes ? new Set(field.allowedMediaTypes) : undefined
      })
    }

    case 'richText': {
      const entitiyChildFields = findChildrenOfKeyPath([...field.keyPath, 'entityData'], fields)
      const entitiyFieldStores = reduceToMap(entitiyChildFields, field => {
        const key = lastItem(field.keyPath)!
        return [key, createFieldStoreForField(field, fields, recursions)]
      })

      const blockChildFields = findChildrenOfKeyPath([...field.keyPath, 'blockData'], fields)
      const blockFieldStores = reduceToMap(blockChildFields, field => {
        const key = lastItem(field.keyPath)!
        return [key, createFieldStoreForField(field, fields, recursions)]
      })

      return new RichtTextFieldStore(entitiyFieldStores, blockFieldStores, {
        ...commonOptions,
        controls: field.controls && new Set(field.controls),
        links: field.links,
        styleGroups: field.styleGroups,
        blocks: field.blocks,
        elements: field.elements,
        minLength: field.minLength,
        maxLength: field.maxLength
      })
    }

    case 'or':
    case 'tuple': {
      const childFields = findChildrenOfKeyPath(field.keyPath, fields)
      const fieldStores = childFields.map(field => {
        return createFieldStoreForField(field, fields, recursions)
      })

      if (field.type === 'tuple') {
        return new TupleFieldStore(fieldStores, commonOptions)
      } else {
        return new OrFieldStore(fieldStores, commonOptions)
      }
    }

    case 'select':
    case 'fieldset': {
      const childFields = findChildrenOfKeyPath(field.keyPath, fields)
      const fieldStores = reduceToMap(childFields, field => {
        const key = lastItem(field.keyPath)!
        return [key, createFieldStoreForField(field, fields, recursions)]
      })

      if (field.type === 'fieldset') {
        return new FieldsetStore(fieldStores, {...commonOptions, layout: field.layout})
      } else {
        return new SelectFieldStore(fieldStores, commonOptions)
      }
    }

    case 'enum': {
      return new EnumFieldStore({
        ...commonOptions,
        values: field.values
        // TODO: Add defaultValue to enum
        // value: field.defaultValue
      })
    }

    case 'recursion': {
      const childFields = findChildrenOfKeyPath(field.keyPath, fields)
      const recursionMap = recursions.reduce(
        (prev, recursionMap) => {
          return {...prev, ...recursionMap}
        },
        {} as FieldStoreMap
      )

      const currentRecursions: FieldStoreMap = {}
      const recursionsInScope = [...recursions, currentRecursions]

      for (const field of childFields) {
        const key = lastItem(field.keyPath)!

        if (recursionMap[key])
          return new ErrorFieldStore({
            ...commonOptions,
            message: 'Duplicate recursion key!'
          })

        const store = createFieldStoreForField(field, fields, recursionsInScope)
        currentRecursions[key] = store
      }

      return new RecursionFieldStore(recursionsInScope, {
        ...commonOptions,
        recursionLabel: field.recursionLabel
      })
    }

    case 'null':
      return new NullFieldStore(commonOptions)
    case 'error':
      return new ErrorFieldStore({
        ...commonOptions,
        message: field.message
      })

    default:
      return new ErrorFieldStore({
        ...commonOptions,
        message: `Unknown Field Type: ${field.type}`
      })
  }
}

export function createFieldStoreForField(
  field: Field,
  fields: Field[],
  recursions: FieldStoreMap[]
): FieldStore {
  return createModifierFieldStores(0, field, fields, recursions)
}
