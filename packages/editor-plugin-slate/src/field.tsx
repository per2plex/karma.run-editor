import React from 'react'
import Slate from 'slate'
import {style} from 'typestyle'

import {Editor as SlateEditor} from 'slate-react'
import plainTextSerializer from 'slate-plain-serializer'

import {expression as e} from '@karma.run/sdk'

import {Model, SortConfiguration, FilterConfiguration} from '@karma.run/editor-common'

import {
  ErrorField,
  EditComponentRenderProps,
  EditRenderProps,
  Field,
  ListRenderProps,
  FieldComponent,
  FieldLabel,
  CardSection,
  SerializedField,
  DefaultBorderRadiusPx,
  Color
} from '@karma.run/editor-client'

export class SlateFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<SlateField, SlateFieldValue>
> {
  private handleChange = (value: Slate.Change) => {
    this.props.onValueChange(value.value, this.props.changeKey)
  }

  public render() {
    return (
      <FieldComponent depth={this.props.depth} index={this.props.index}>
        {!this.props.isWrapped && (
          <FieldLabel
            label={this.props.label}
            description={this.props.description}
            depth={this.props.depth}
            index={this.props.index}
          />
        )}
        <SlateEditor
          className={StateFieldEditComponentEditorStyle}
          value={this.props.value}
          onChange={this.handleChange}
        />
      </FieldComponent>
    )
  }
}

export const StateFieldEditComponentEditorStyle = style({
  padding: '0.6rem 1rem',

  fontSize: '1em',
  lineHeight: 1.2,
  border: `1px solid ${Color.neutral.light1}`,
  backgroundColor: Color.neutral.white,
  borderRadius: DefaultBorderRadiusPx
})

export interface SlateFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly minLength?: number
  readonly maxLength?: number
}

export type SlateFieldValue = Slate.Value
export type SerializedSlateField = SerializedField & SlateFieldOptions

export class SlateField implements Field<SlateFieldValue> {
  public readonly label?: string
  public readonly description?: string

  public readonly minLength?: number
  public readonly maxLength?: number

  public readonly defaultValue: SlateFieldValue = plainTextSerializer.deserialize('')
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts?: SlateFieldOptions) {
    this.label = opts && opts.label
    this.description = opts && opts.description
    this.minLength = opts && opts.minLength
    this.maxLength = opts && opts.maxLength
  }

  public initialize() {
    return this
  }

  public renderListComponent(props: ListRenderProps<SlateFieldValue>) {
    const plainText = plainTextSerializer.serialize(props.value)
    return <CardSection>{plainText}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<SlateFieldValue>) {
    return (
      <SlateFieldEditComponent
        label={this.label}
        description={this.description}
        field={this}
        {...props}
      />
    )
  }

  public transformRawValue(value: any) {
    return Slate.Value.create({
      document: Slate.Document.fromJSON(value)
    })
  }

  public transformValueToExpression(_value: SlateFieldValue) {
    return e.null()
  }

  public isValidValue(value: SlateFieldValue) {
    const errors: string[] = []
    const plainText = plainTextSerializer.serialize(value)

    if (this.maxLength && plainText.length > this.maxLength) errors.push('stringToLongError')
    if (this.minLength && plainText.length < this.minLength) errors.push('stringToShortError')

    return errors
  }

  public serialize(): SerializedSlateField {
    return {
      type: SlateField.type,
      label: this.label,
      description: this.description,
      minLength: this.minLength,
      maxLength: this.maxLength
    }
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }

  public static type = 'richText'

  static canInferFromModel(model: Model) {
    if (model.type === 'annotation' && model.value === 'field:richText') {
      return true
    }

    return false
  }

  static create(model: Model, opts?: SlateFieldOptions) {
    if (model.type === 'annotation') {
      model = model.model
    }

    if (model.type !== 'struct') {
      return new ErrorField({
        label: opts && opts.label,
        description: opts && opts.description,
        message: `Expected model type "struct" received: "${model.type}"`
      })
    }

    return new this(opts)
  }

  static unserialize(rawField: SerializedSlateField) {
    return new this(rawField)
  }
}
