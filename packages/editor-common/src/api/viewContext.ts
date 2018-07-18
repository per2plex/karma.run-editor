import {Ref} from '@karma.run/sdk'
import {SortType, StructPathSegment, SortConfiguration} from '../interface/filter'

import {Model, KeyPath} from './model'
import {stringToColor, convertKeyToLabel, slugify} from '../util/string'
import {refToString} from '../util/ref'
import {Field, FieldRegistry, ErrorField, SerializedField, TypedFieldOptions} from '../fields'

export interface ViewContextOptions {
  readonly name?: string
  readonly description?: string
  readonly slug?: string
  readonly color?: string
  readonly field?: TypedFieldOptions
  readonly displayKeyPaths?: KeyPath[]
}

export interface ViewContextConstructorOptions {
  readonly model: Ref
  readonly name: string
  readonly description?: string
  readonly slug: string
  readonly color: string
  readonly field: Field
  readonly displayKeyPaths: KeyPath[]
}

export interface SerializedViewContext {
  readonly name?: string
  readonly description?: string
  readonly slug?: string
  readonly color?: string
  readonly field?: SerializedField
  readonly displayKeyPaths?: KeyPath[]
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

  public constructor(opts: ViewContextConstructorOptions) {
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
        label: 'Updated',
        type: SortType.Date,
        path: [StructPathSegment('updated')]
      },
      {
        key: 'createdMeta',
        label: 'Created',
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
    return {
      model: this.model,
      color: this.color,
      name: this.name,
      slug: this.slug,
      field: this.field.serialize(),
      displayKeyPaths: this.displayKeyPaths
    }
  }

  public static unserialize(rawViewContext: any, regisry: FieldRegistry): ViewContext {
    // TODO: Validate
    return new ViewContext({
      model: rawViewContext.model,
      color: rawViewContext.color,
      name: rawViewContext.name,
      slug: rawViewContext.slug,
      field: unserializeViewContextField(rawViewContext.field, regisry),
      displayKeyPaths: rawViewContext.displayKeyPaths
    })
  }

  public static inferFromModel(
    id: Ref,
    model: Model,
    registry: FieldRegistry,
    tag?: string,
    ignoreTypes: string[] = [],
    options: ViewContextOptions = {}
  ): ViewContext {
    return new ViewContext({
      model: id,
      color: options.color || stringToColor(refToString(id)),
      name: options.name || (tag ? convertKeyToLabel(tag) : `Model: ${id[1]}`),
      slug: options.slug || slugify(tag || id[1]),
      field: inferFieldFromModel(model, registry, ignoreTypes, options.field),
      displayKeyPaths: options.displayKeyPaths || inferDisplayKeyPaths(model)
    })
  }
}

// TODO: Add ignoring types for inference option to config
export function inferFieldFromModel(
  model: Model,
  registry: FieldRegistry,
  ignoreTypes: string[],
  options?: TypedFieldOptions
): Field {
  function inferField(model: Model, opts?: TypedFieldOptions): Field {
    // Unwrap unique
    if (model.type === 'unique') {
      model = model.model
    }

    if (opts && opts.type) {
      const fieldClass = registry.get(opts.type)

      if (!fieldClass) {
        return new ErrorField({
          label: opts.label,
          message: `No field registed with type: ${opts.type}`
        })
      }

      return fieldClass.create(model, opts, inferField)
    } else {
      for (const fieldClass of registry.values()) {
        if (ignoreTypes.includes(fieldClass.type)) continue
        if (fieldClass.canInferFromModel && fieldClass.canInferFromModel(model)) {
          return fieldClass.create(model, opts, inferField)
        }
      }

      return new ErrorField({
        label: opts && opts.label,
        message: `Coulnd't infer field from model of type: ${model.type}`
      })
    }
  }

  const field = inferField(model, options)
  return field.initialize(new Map())
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

export function unserializeViewContextField(rawField: any, registry: FieldRegistry): Field {
  function unserialize(rawField: any): Field {
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

    return fieldClass.unserialize(rawField, unserialize)
  }

  const field = unserialize(rawField)
  return field.initialize(new Map())
}