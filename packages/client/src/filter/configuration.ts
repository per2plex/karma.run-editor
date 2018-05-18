import * as shortid from 'shortid'

import { MetaField } from '../api/karma'

import {
  ConditionType, ValuePathSegmentType, SortType,
  ValuePath, StructPathSegment, UnionPathSegment,
  OptionalPathSegment, MapPathSegment, ListPathSegment
} from '@karma.run/editor-common'

import {
  ViewContext, Field, findRootKeyPath,
  findChildrenOfKeyPath, findKeyPath, findAncestorsOfKeyPath
} from '../api/karmafe/viewContext'

import { lastItem } from '@karma.run/editor-common'
import { Select } from '../ui/common'

export interface BaseConditionConfiguration {
  id: string
  type: ConditionType
  path: ValuePath
}

export interface SimpleConditionConfiguration extends BaseConditionConfiguration {
  type: ConditionType.StringEqual
    | ConditionType.StringStartsWith
    | ConditionType.StringEndsWith
    | ConditionType.StringIncludes
    | ConditionType.StringRegExp
    | ConditionType.ListLengthEqual
    | ConditionType.ListLengthMin
    | ConditionType.ListLengthMax
    | ConditionType.DateEqual
    | ConditionType.DateMin
    | ConditionType.DateMax
    | ConditionType.NumberEqual
    | ConditionType.NumberMin
    | ConditionType.NumberMax
    | ConditionType.OptionalIsPresent
}

export interface RefConditionConfiguration extends BaseConditionConfiguration {
  type: ConditionType.RefEqual
  model: string
}

export interface EnumConditionConfiguration extends BaseConditionConfiguration {
  type: ConditionType.EnumEqual
  options: Select.Option[]
}

export interface UnionConditionConfiguration extends BaseConditionConfiguration {
  type: ConditionType.UnionKeyEqual
  options: Select.Option[]
}

export interface ConditionGroup {
  id: string
  label: string
  conditions: ConditionConfiguration[]
}

export type ConditionConfiguration =
  SimpleConditionConfiguration
  | RefConditionConfiguration
  | EnumConditionConfiguration
  | UnionConditionConfiguration

export interface FilterFieldGroup {
  id: string
  label: string
  fields: FilterField[]
}

export interface FilterField {
  id: string
  label: string
  depth: number
  conditionGroups: ConditionGroup[]
}

export interface SortConfigration {
  path: ValuePath
  type: SortType
  label: string
}

export function labelForMetaField(metaField: MetaField) {
  switch (metaField) {
    case 'updated': return 'Update Date'
    case 'created': return 'Create Date'
    case 'id': return 'ID'
  }
}

export function labelForCondition(condition: ConditionType): string {
  switch (condition) {
    case ConditionType.RefEqual:
    case ConditionType.StringEqual:
    case ConditionType.DateEqual:
    case ConditionType.ListLengthEqual:
    case ConditionType.EnumEqual:
    case ConditionType.NumberEqual:
    case ConditionType.UnionKeyEqual:
      return 'Equal'

    case ConditionType.StringStartsWith:
      return 'Starts with'

    case ConditionType.StringEndsWith:
      return 'Ends with'

    case ConditionType.StringIncludes:
      return 'Includes'

    case ConditionType.StringRegExp:
      return 'Matches RegExp'

    case ConditionType.DateMin:
    case ConditionType.NumberMin:
    case ConditionType.ListLengthMin:
      return 'Min'

    case ConditionType.DateMax:
    case ConditionType.NumberMax:
    case ConditionType.ListLengthMax:
      return 'Max'

    case ConditionType.OptionalIsPresent:
      return 'Present'
  }

  return condition
}

function hierarchyLabelForField(field: Field, fields: Field[]) {
  const ancestors = findAncestorsOfKeyPath(field.keyPath, fields)
  const labelHierarchy = ancestors.reduceRight((prev, field) => {
    if (field.label) {
      return prev ? `${prev} > ${field.label}` : field.label
    } else {
      return prev
    }
  }, '')

  let label = field.label || 'Undefined'

  if (labelHierarchy !== '') {
    label = `${labelHierarchy} > ${label}`
  }

  return label
}

export function objectPathForField(field: Field, fields: Field[]) {
  const fieldHierarchy = [...findAncestorsOfKeyPath(field.keyPath, fields), field]

  return fieldHierarchy.reduce((path, field, index) => {
    const nextField = fieldHierarchy[index + 1]

    if (field.modifiers) {
      for (const modifier of field.modifiers) {
        if (modifier) {
          switch (modifier.type) {
            case 'list': {
              path.push({type: ValuePathSegmentType.List})
              break
            }

            case 'map': {
              path.push({type: ValuePathSegmentType.Map})
              break
            }
          }
        }
      }
    }

    if (!nextField) return path

    switch (field.type) {
      case 'fieldset': {
        path.push({type: ValuePathSegmentType.Struct, key: lastItem(nextField.keyPath)!.toString()})
        break
      }
    }

    return path
  }, [] as ValuePath)
}

export function sortConfigurationForField(field: Field, fields: Field[]): SortConfigration | undefined {
  switch (field.type) {
    case 'text': return {
      type: SortType.String,
      path: [{type: ValuePathSegmentType.Struct, key: 'value'}, ...objectPathForField(field, fields)],
      label: hierarchyLabelForField(field, fields)
    }

    default: return undefined
  }
}

export function sortConfigurationsForViewContext(viewContext: ViewContext): SortConfigration[] {
  const defaultConfigurations: SortConfigration[] = [
    {
      label: labelForMetaField('updated'),
      type: SortType.Date,
      path: [{type: ValuePathSegmentType.Struct, key: 'updated'}]
    },
    {
      label: labelForMetaField('created'),
      type: SortType.Date,
      path: [{type: ValuePathSegmentType.Struct, key: 'created'}]
    }
  ]

  const fields = viewContext.fields || []

  const descriptionFields = (viewContext.descriptionKeyPaths || [])
    .map(keyPath => findKeyPath(keyPath, fields))

  const configurations = descriptionFields
    .map(field => field && sortConfigurationForField(field, fields))
    .filter(config => config != undefined) as SortConfigration[]

  return [
    ...defaultConfigurations,
    ...configurations
  ]
}

export function filterConfigurationsForField(
  field: Field, fields: Field[], path: ValuePath = [], depth: number = 0
): FilterField[] {
  const label = field.label || (depth === 0 ? 'Root' : 'Undefined')
  const conditionGroups: ConditionGroup[] = []
  const childFields: FilterField[] = []

  if (field.modifiers) {
    for (const modifier of field.modifiers) {
      if (modifier) {
        switch (modifier.type) {
          case 'list': {
            conditionGroups.push({id: shortid.generate(), label: 'List Length', conditions: [
              {id: shortid.generate(), type: ConditionType.ListLengthEqual, path},
              {id: shortid.generate(), type: ConditionType.ListLengthMin, path},
              {id: shortid.generate(), type: ConditionType.ListLengthMax, path}
            ]})

            path = [...path, ListPathSegment()]
            break
          }

          case 'map': {
            path = [...path, MapPathSegment()]
            break
          }

          case 'optional': {
            conditionGroups.push({id: shortid.generate(), label: 'Optional', conditions: [
              {id: shortid.generate(), type: ConditionType.OptionalIsPresent, path}
            ]})

            path = [...path, OptionalPathSegment()]
            break
          }
        }
      }
    }
  }

  switch (field.type) {
    case 'select':
    case 'fieldset': {
      const children = findChildrenOfKeyPath(field.keyPath, fields)

      childFields.push(...children.reduce((prev, childField) => {
        const key = lastItem(childField.keyPath)!.toString()
        const pathSegment = field.type === 'fieldset'
          ? StructPathSegment(key)
          : UnionPathSegment(key)

        return [
          ...prev,
          ...filterConfigurationsForField(
            childField, fields,
            [...path, pathSegment],
            depth + 1
          )
        ]
      }, [] as FilterField[]))

      if (field.type === 'select') {
        const options: Select.Option[] = children.map(childField => {
          const key = lastItem(childField.keyPath)!.toString()
          return {key, label: childField.label || key}
        })

        conditionGroups.push({id: shortid.generate(), label: 'Union Key', conditions: [
          {id: shortid.generate(), type: ConditionType.UnionKeyEqual, path, options}
        ]})
      }

      break
    }

    case 'enum': {
      conditionGroups.push({id: shortid.generate(), label: 'Enum', conditions: [
        {id: shortid.generate(), type: ConditionType.EnumEqual, path, options: field.values || []}
      ]})

      break
    }

    case 'dateTime': {
      conditionGroups.push({id: shortid.generate(), label: 'Date', conditions: [
        {id: shortid.generate(), type: ConditionType.DateEqual, path},
        {id: shortid.generate(), type: ConditionType.DateMin, path},
        {id: shortid.generate(), type: ConditionType.DateMax, path}
      ]})

      break
    }

    case 'text': {
      conditionGroups.push({id: shortid.generate(), label: 'Text', conditions: [
        {id: shortid.generate(), type: ConditionType.StringEqual, path},
        {id: shortid.generate(), type: ConditionType.StringIncludes, path},
        {id: shortid.generate(), type: ConditionType.StringStartsWith, path},
        {id: shortid.generate(), type: ConditionType.StringEndsWith, path},
        {id: shortid.generate(), type: ConditionType.StringRegExp, path}
      ]})

      break
    }

    case 'float':
    case 'int': {
      conditionGroups.push({id: shortid.generate(), label: 'Number', conditions: [
        {id: shortid.generate(), type: ConditionType.NumberEqual, path},
        {id: shortid.generate(), type: ConditionType.NumberMax, path},
        {id: shortid.generate(), type: ConditionType.NumberMin, path},
      ]})

      break
    }

    case 'ref': {
      if (field.model) {
        conditionGroups.push({id: shortid.generate(), label: 'Reference', conditions: [
          {id: shortid.generate(), type: ConditionType.RefEqual, path, model: field.model}
        ]})
      }

      break
    }

    case 'karmaMedia': {
      const widthPath = [...path, StructPathSegment('width')]
      conditionGroups.push({id: shortid.generate(), label: 'Width', conditions: [
        {id: shortid.generate(), type: ConditionType.NumberEqual, path: widthPath},
        {id: shortid.generate(), type: ConditionType.NumberMax, path: widthPath},
        {id: shortid.generate(), type: ConditionType.NumberMin, path: widthPath}
      ]})

      const heightPath = [...path, StructPathSegment('height')]
      conditionGroups.push({id: shortid.generate(), label: 'Height', conditions: [
        {id: shortid.generate(), type: ConditionType.NumberEqual, path: heightPath},
        {id: shortid.generate(), type: ConditionType.NumberMax, path: heightPath},
        {id: shortid.generate(), type: ConditionType.NumberMin, path: heightPath}
      ]})

      const bytesPath = [...path, StructPathSegment('bytes')]
      conditionGroups.push({id: shortid.generate(), label: 'File Size (Bytes)', conditions: [
        {id: shortid.generate(), type: ConditionType.NumberEqual, path: bytesPath},
        {id: shortid.generate(), type: ConditionType.NumberMax, path: bytesPath},
        {id: shortid.generate(), type: ConditionType.NumberMin, path: bytesPath}
      ]})

      const typePath = [...path, StructPathSegment('type')]
      conditionGroups.push({id: shortid.generate(), label: 'Type', conditions: [
        {id: shortid.generate(), type: ConditionType.EnumEqual, path: typePath, options: [
          {key: 'image', label: 'Image'},
          {key: 'video', label: 'Video'},
          {key: 'raw', label: 'Raw'}
        ]}
      ]})

      const formatPath = [...path, StructPathSegment('format')]
      conditionGroups.push({id: shortid.generate(), label: 'Format', conditions: [
        {id: shortid.generate(), type: ConditionType.StringEqual, path: formatPath}
      ]})
      break
    }
  }

  return [{
    id: shortid.generate(),
    label, depth,
    conditionGroups
  }, ...childFields]
}

export function filterConfigurationsForViewContext(viewContext: ViewContext): FilterFieldGroup[] {
  if (!viewContext.fields) return []

  const rootField = findRootKeyPath(viewContext.fields)

  if (!rootField) return []

  return [
    {id: shortid.generate(), label: 'Meta', fields: [
      {id: shortid.generate(), label: labelForMetaField('updated'), depth: 0, conditionGroups: [
        {id: shortid.generate(), label: 'Date', conditions: [
          {
            id: shortid.generate(),
            type: ConditionType.DateEqual,
            path: [{type: ValuePathSegmentType.Struct, key: 'updated'}]
          },
          {
            id: shortid.generate(),
            type: ConditionType.DateMin,
            path: [{type: ValuePathSegmentType.Struct, key: 'updated'}]
          },
          {
            id: shortid.generate(),
            type: ConditionType.DateMax,
            path: [{type: ValuePathSegmentType.Struct, key: 'updated'}]
          }
        ]}
      ]},
      {id: shortid.generate(), label: labelForMetaField('created'), depth: 0, conditionGroups: [
        {id: shortid.generate(), label: 'Date', conditions: [
          {
            id: shortid.generate(),
            type: ConditionType.DateEqual,
            path: [{type: ValuePathSegmentType.Struct, key: 'created'}]
          },
          {
            id: shortid.generate(),
            type: ConditionType.DateMin,
            path: [{type: ValuePathSegmentType.Struct, key: 'created'}]
          },
          {
            id: shortid.generate(),
            type: ConditionType.DateMax,
            path: [{type: ValuePathSegmentType.Struct, key: 'created'}]
          }
        ]}
      ]}
    ]},
    {
      id: shortid.generate(), label: 'Field',
      fields: filterConfigurationsForField(
        rootField, viewContext.fields, [{type: ValuePathSegmentType.Struct, key: 'value'}]
      )
    },
  ]
}
