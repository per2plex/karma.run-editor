import {Ref} from '@karma.run/sdk'
import {SortType, StructPathSegment} from '@karma.run/editor-common'

import {Model, KeyPath} from './model'
import {stringToColor, convertKeyToLabel, slugify} from '../util/string'
import {refToString} from '../util/ref'
import {SortConfiguration, labelForMetaField} from '../filter/configuration'
import {Field, FieldRegistry, ErrorField} from '../fields'

export interface ViewContextOptions {
  readonly model: Ref
  readonly name: string
  readonly description?: string
  readonly slug: string
  readonly color: string
  readonly field: Field
  readonly displayKeyPaths: KeyPath[]
}

export class ViewContext {
  public readonly model: Ref
  public readonly name: string
  public readonly description?: string
  public readonly slug: string
  public readonly color: string
  public readonly field: Field
  public readonly displayKeyPaths: KeyPath[]

  public readonly sortConfigurations: SortConfiguration[]

  public constructor(opts: ViewContextOptions) {
    this.model = opts.model
    this.name = opts.name
    this.description = opts.description
    this.slug = opts.slug
    this.color = opts.color
    this.field = opts.field
    this.displayKeyPaths = opts.displayKeyPaths

    this.sortConfigurations = [
      {
        key: 'updatedMeta',
        label: labelForMetaField('updated'),
        type: SortType.Date,
        path: [StructPathSegment('updated')]
      },
      {
        key: 'createdMeta',
        label: labelForMetaField('created'),
        type: SortType.Date,
        path: [StructPathSegment('created')]
      },
      ...this.field.sortConfigurations.map(config => ({
        ...config,
        path: [StructPathSegment('value'), ...config.path]
      }))
    ]
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

// TODO: Add ignoring types for inference option to config
export function inferFieldFromModel(
  model: Model,
  registry: FieldRegistry,
  ignoreTypes: string[] = []
): Field {
  function inferField(model: Model, key?: string): Field {
    // Unwrap unique
    if (model.type === 'unique') {
      model = model.model
    }

    for (const fieldClass of registry.values()) {
      if (ignoreTypes.includes(fieldClass.type)) continue

      if (fieldClass.inferFromModel) {
        const field = fieldClass.inferFromModel(model, key, inferField)
        if (field) return field
      }
    }

    return new ErrorField({
      label: key && convertKeyToLabel(key),
      message: `Coulnd't infer field from model of type: ${model.type}`
    })
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
