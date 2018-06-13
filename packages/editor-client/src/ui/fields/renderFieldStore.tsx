import * as React from 'react'

import {FieldStore} from '../../store/fields/fieldStore'
import {Entry} from '../../api/karma'
import {ViewContext} from '../../api/karmafe/viewContext'
import {ObjectMap} from '@karma.run/editor-common'

import {CheckboxFieldStore} from '../../store/fields/checkboxFieldStore'
import {CheckboxFieldRenderer} from './checkboxFieldRenderer'

import {FieldsetStore} from '../../store/fields/fieldsetStore'
import {FieldsetRenderer} from './fieldsetRenderer'

import {TextFieldStore} from '../../store/fields/textFieldStore'
import {TextFieldRenderer} from './textFieldRenderer'

import {OptionalFieldStore} from '../../store/fields/optionalFieldStore'
import {OptionalFieldRenderer} from './optionalFieldRenderer'

import {RefFieldStore} from '../../store/fields/refFieldStore'
import {RefFieldRenderer} from './refFieldRenderer'

import {IntFieldStore} from '../../store/fields/intFieldStore'
import {FloatFieldStore} from '../../store/fields/floatFieldStore'
import {NumberFieldRenderer} from './numberFieldRenderer'

import {DateTimeFieldStore} from '../../store/fields/dateTimeFieldStore'
import {DateTimeFieldRenderer} from './dateTimeFieldRenderer'

import {FileFieldStore} from '../../store/fields/fileFieldStore'
import {FileFieldRenderer} from './fileFieldRenderer'

import {RichtTextFieldStore} from '../../store/fields/richTextFieldStore'
import {RichTextFieldRenderer} from './richtTextFieldRenderer'

import {ListFieldStore} from '../../store/fields/listFieldStore'
import {ListFieldRenderer} from './listFieldRenderer'

import {MapFieldStore} from '../../store/fields/mapFieldStore'
import {MapFieldRenderer} from './mapFieldRenderer'

import {SelectFieldStore} from '../../store/fields/selectFieldStore'
import {SelectFieldRenderer} from './selectFieldRenderer'

import {PasswordFieldStore} from '../../store/fields/passwordFieldStore'
import {PasswordFieldRenderer} from './passwordFieldRenderer'

import {EnumFieldStore} from '../../store/fields/enumFieldStore'
import {EnumFieldRenderer} from './enumFieldRenderer'

import {TupleFieldStore} from '../../store/fields/tupleFieldStore'
import {TupleFieldRenderer} from '../../ui/fields/tupleFieldRenderer'

import {OrFieldStore} from '../../store/fields/orFieldStore'
import {OrFieldRenderer} from '../../ui/fields/orFieldRenderer'

import {RecursionFieldStore} from '../../store/fields/recursionFieldStore'
import {RecursionFieldRenderer} from '../../ui/fields/recursionFieldRenderer'

import {ErrorFieldStore} from '../../store/fields/errorFieldStore'
import {ErrorFieldRenderer} from '../../ui/fields/errorFieldRenderer'

import {NullFieldStore} from '../../store/fields/nullFieldStore'
import {NullFieldRenderer} from '../../ui/fields/nullFieldRenderer'
import {MediaFieldRenderer} from './mediaFieldRenderer'
import {MediaFieldStore} from '../../store/fields/mediaFieldStore'

export type IDCallbackFn = (id?: string) => void
export type DataCallbackFn = (data: any) => void

export type OnLoadEntryFn = (model: string, id: string) => Promise<Entry>
export type OnEditEntryFn = (model: string, id: string | undefined, done: IDCallbackFn) => void
export type OnChooseEntryFn = (model: string, done: IDCallbackFn) => void
export type OnOpenEditorFn = (fields: FieldStore, done: DataCallbackFn) => void

export type ViewContextMap = {[modelAndEntryID: string]: ViewContext | undefined}

export interface RenderOpts {
  onOpenEditor: OnOpenEditorFn
  onLoadEntry: OnLoadEntryFn
  onEditEntry: OnEditEntryFn
  onChooseEntry: OnChooseEntryFn
  disabled: boolean
  isWrapped: boolean
  key?: string
  depth: number
  index: number
  viewContextMap: ViewContextMap
  reverseTags: ObjectMap<string>
}

export function renderValueStore(store: FieldStore, opts: RenderOpts): JSX.Element {
  if (store instanceof OptionalFieldStore) {
    // Optional
    return <OptionalFieldRenderer {...opts} store={store} />
  } else if (store instanceof FieldsetStore) {
    // Fieldset
    return <FieldsetRenderer {...opts} store={store} />
  } else if (store instanceof TextFieldStore) {
    // Text
    return <TextFieldRenderer {...opts} store={store} />
  } else if (store instanceof RefFieldStore) {
    // Ref
    return <RefFieldRenderer {...opts} store={store} />
  } else if (store instanceof CheckboxFieldStore) {
    // Checkbox
    return <CheckboxFieldRenderer {...opts} store={store} />
  } else if (store instanceof DateTimeFieldStore) {
    // DateTime
    return <DateTimeFieldRenderer {...opts} store={store} />
  } else if (store instanceof IntFieldStore || store instanceof FloatFieldStore) {
    // NumberField
    return <NumberFieldRenderer {...opts} store={store} />
  } else if (store instanceof ListFieldStore) {
    // ListField
    return <ListFieldRenderer {...opts} store={store} />
  } else if (store instanceof SelectFieldStore) {
    // SelectField
    return <SelectFieldRenderer {...opts} store={store} />
  } else if (store instanceof FileFieldStore) {
    // FileField
    return <FileFieldRenderer {...opts} store={store} />
  } else if (store instanceof MediaFieldStore) {
    // MediaField
    return <MediaFieldRenderer {...opts} store={store} />
  } else if (store instanceof RichtTextFieldStore) {
    // RichTextField
    return <RichTextFieldRenderer {...opts} store={store} />
  } else if (store instanceof PasswordFieldStore) {
    // PasswordField
    return <PasswordFieldRenderer {...opts} store={store} />
  } else if (store instanceof MapFieldStore) {
    // MapField
    return <MapFieldRenderer {...opts} store={store} />
  } else if (store instanceof EnumFieldStore) {
    // EnumField
    return <EnumFieldRenderer {...opts} store={store} />
  } else if (store instanceof TupleFieldStore) {
    // TupleField
    return <TupleFieldRenderer {...opts} store={store} />
  } else if (store instanceof OrFieldStore) {
    // OrField
    return <OrFieldRenderer {...opts} store={store} />
  } else if (store instanceof RecursionFieldStore) {
    // RecursionField
    return <RecursionFieldRenderer {...opts} store={store} />
  } else if (store instanceof ErrorFieldStore) {
    // ErrorField
    return <ErrorFieldRenderer {...opts} store={store} />
  } else if (store instanceof NullFieldStore) {
    return <NullFieldRenderer {...opts} store={store} />
  }

  throw new Error('Store not mapped to Renderer.')
}

export function renderRootValueStore(store: FieldStore, opts: RenderOpts): JSX.Element {
  return renderValueStore(store, {...opts})
}
