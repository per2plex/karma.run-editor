import {firstKey} from '@karma.run/editor-common'
import {MediaType} from '@karma.run/editor-media-client'

import * as m from '../../karma/model'
import {ViewContext, Field, FieldType, ErrorField, Modifier, ModifierType} from './model'
import {Entry} from '../../karma'

export const ViewContextTagV1 = '_frontend_view_context_v1'
export const ViewContextTagV2 = '_frontend_view_context_v2'

export const ModifierModel = m.Union({
  optional: m.Struct({}),
  list: m.Struct({
    minLength: m.Optional(m.Int()),
    maxLength: m.Optional(m.Int())
  }),
  map: m.Struct({
    restrictedToKeys: m.Optional(m.List(m.String())),
    minLength: m.Optional(m.Int()),
    maxLength: m.Optional(m.Int())
  })
})

export const CheckboxFieldModel = m.Struct({
  defaultValue: m.Optional(m.Bool())
})

export const DateTimeFieldModel = m.Struct({
  defaultValue: m.Optional(m.DateTime()),
  format: m.Optional(m.Enum(['rfc3339', 'timestamp']))
})

export const EnumFieldModel = m.Struct({
  values: m.List(
    m.Struct({
      key: m.String(),
      label: m.String()
    })
  )
})

export const FieldsetFieldModel = m.Struct({
  layout: m.Optional(m.Enum(['linear', 'tab']))
})

export const FloatFieldModel = m.Struct({
  minValue: m.Optional(m.Float()),
  maxValue: m.Optional(m.Float())
})

export const IntFieldModel = m.Struct({
  defaultValue: m.Optional(m.Int()),
  minValue: m.Optional(m.Int()),
  maxValue: m.Optional(m.Int()),
  multipleOf: m.Optional(m.Int())
})

export const KarmaMediaFieldModel = m.Struct({
  name: m.String(),
  apiKey: m.String(),
  folder: m.Optional(m.String()),
  thumbnailTransformName: m.Optional(m.String()),
  format: m.Optional(m.Enum(['v1', 'legacy']))
})

export const MediaFieldModel = m.Struct({
  allowedMediaTypes: m.Optional(
    m.Set(
      m.Enum([
        MediaType.Image,
        MediaType.Video,
        MediaType.Audio,
        MediaType.Document,
        MediaType.Other
      ])
    )
  )
})

export const RefFieldModel = m.Struct({
  model: m.Optional(m.String()),
  disableEditing: m.Optional(m.Bool())
})

export const RichTextFieldModel = m.Struct({
  controls: m.Optional(
    m.Set(m.Enum(['bold', 'italic', 'underline', 'strikethrough', 'orderedList', 'unorderedList']))
  ),
  links: m.Optional(
    m.List(
      m.Struct({
        type: m.Optional(m.String()), // TODO: Remove when migrated
        dataKey: m.String(),
        label: m.Optional(m.String())
      })
    )
  ),
  styleGroups: m.Optional(
    m.List(
      m.Struct({
        label: m.Optional(m.String()),
        name: m.String(),
        styles: m.List(
          m.Struct({
            type: m.String(),
            style: m.Optional(m.Map(m.String())),
            label: m.Optional(m.String())
          })
        )
      })
    )
  ),
  blocks: m.Optional(
    m.List(
      m.Struct({
        type: m.String(),
        dataKey: m.Optional(m.String()),
        style: m.Optional(m.Map(m.String())),
        label: m.Optional(m.String())
      })
    )
  ),
  elements: m.Optional(
    m.List(
      m.Struct({
        type: m.String(),
        dataKey: m.Optional(m.String()),
        style: m.Optional(m.Map(m.String())),
        content: m.Optional(m.String()),
        label: m.Optional(m.String()),
        icon: m.Optional(m.String())
      })
    )
  ),
  linkEntityType: m.Optional(m.String()),
  minLength: m.Optional(m.Int()),
  maxLength: m.Optional(m.Int())
})

export const SelectFieldModel = m.Struct({
  defaultValue: m.Optional(m.String())
})

export const TextFieldModel = m.Struct({
  defaultValue: m.Optional(m.String()),
  minLength: m.Optional(m.Int()),
  maxLength: m.Optional(m.Int()),
  multiline: m.Optional(m.Bool())
})

export const PasswordFieldModel = m.Struct({
  costFactor: m.Optional(m.Int())
})

export const TupleFieldModel = m.Struct({
  layout: m.Optional(m.Enum(['linear', 'tab']))
})

export const FieldModel = m.Struct({
  keyPath: m.List(m.Or([m.String(), m.Int()])),
  label: m.Optional(m.String()),
  description: m.Optional(m.String()),
  icon: m.Optional(m.String()),
  modifiers: m.Optional(m.List(m.Optional(ModifierModel))),
  type: m.Optional(
    m.Union({
      text: TextFieldModel,
      select: SelectFieldModel,
      richText: RichTextFieldModel,
      ref: RefFieldModel,
      int: IntFieldModel,
      float: FloatFieldModel,
      fieldset: FieldsetFieldModel,
      dateTime: DateTimeFieldModel,
      checkbox: CheckboxFieldModel,
      karmaMedia: KarmaMediaFieldModel,
      media: MediaFieldModel,
      tuple: TupleFieldModel,
      enum: EnumFieldModel,
      password: PasswordFieldModel
    })
  )
})

export function createViewContextModel(metaModelID: string) {
  return m.Struct({
    key: m.Optional(m.String()), // TEMP: Remove when not needed anymore
    name: m.Optional(m.String()),
    description: m.Optional(m.String()),
    slug: m.Optional(m.String()),
    icon: m.Optional(m.String()),
    model: m.Ref(metaModelID),
    descriptionKeyPaths: m.Optional(m.List(m.List(m.String()))),
    fields: m.Optional(m.List(FieldModel))
  })
}

export function unserializeViewContext(rawViewContext: any): ViewContext {
  const rawFields: any[] | undefined = rawViewContext.fields
  return {
    ...rawViewContext,
    fields: rawFields && rawFields.map(rawField => unserializeField(rawField))
  }
}

export function unserializeField(rawField: any): Field {
  const rawModifiers = rawField.modifiers
  const type = rawField.type && (firstKey(rawField.type) as FieldType)
  const fieldValue = type ? rawField.type[type] : {}

  // TODO: Validation
  const modifiers =
    rawModifiers && rawModifiers.map((rawModifier: any) => unserializeModifier(rawModifier))

  switch (type) {
    case undefined:
    case 'checkbox':
    case 'enum':
    case 'fieldset':
    case 'float':
    case 'int':
    case 'media':
    case 'karmaMedia':
    case 'password':
    case 'ref':
    case 'richText':
    case 'select':
    case 'text':
    case 'tuple':
      return {...rawField, ...fieldValue, type, modifiers}

    case 'dateTime':
      return {
        ...rawField,
        ...fieldValue,
        type,
        modifiers,
        defaultValue: fieldValue.defaultValue ? new Date(fieldValue.defaultValue) : undefined
      }
    default:
      return ErrorField({
        ...rawField,
        message: 'Unknown field type!'
      })
  }
}

export function unserializeModifier(rawModifier: any): Modifier {
  const type = firstKey(rawModifier) as ModifierType
  const value = rawModifier[type]

  switch (type) {
    case 'map':
    case 'list':
    case 'optional':
      return {...value, type}
    default:
      return undefined
  }
}

export function entryToViewContext(entry: Entry) {
  return unserializeViewContext(entry.value)
}
