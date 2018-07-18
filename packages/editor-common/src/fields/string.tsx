import React from 'react'
import shortid from 'shortid'
import {data as d} from '@karma.run/sdk'

import {Model} from '../api/model'
import {ErrorField} from './error'

import {
  SerializedField,
  EditComponentRenderProps,
  EditRenderProps,
  Field,
  ListRenderProps
} from './interface'

import {FieldComponent, FieldLabel} from '../ui/field'
import {TextAreaInput, TextInput, TextInputType} from '../ui/input'
import {CardSection} from '../ui/card'
import {SortType, SortConfiguration, FilterConfiguration} from '../interface/filter'

export class StringFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<StringField, string>
> {
  private handleChange = (value: any) => {
    this.props.onValueChange(value, this.props.changeKey)
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
        {this.props.field.multiline ? (
          <TextAreaInput
            onChange={this.handleChange}
            value={this.props.value}
            disabled={this.props.disabled}
            autoresize
          />
        ) : (
          <TextInput
            type={TextInputType.Lighter}
            onChange={this.handleChange}
            value={this.props.value}
            disabled={this.props.disabled}
            minLength={this.props.field.minLength}
            maxLength={this.props.field.maxLength}
          />
        )}
      </FieldComponent>
    )
  }
}

export interface StringFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly minLength?: number
  readonly maxLength?: number
  readonly multiline?: boolean
}

export type SerializedStringField = SerializedField & StringFieldOptions

export class StringField implements Field<string> {
  public readonly label?: string
  public readonly description?: string
  public readonly minLength?: number
  public readonly maxLength?: number
  public readonly multiline?: boolean

  public readonly defaultValue: string = ''
  public readonly sortConfigurations: SortConfiguration[]
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts?: StringFieldOptions) {
    this.label = opts && opts.label
    this.description = opts && opts.description
    this.minLength = opts && opts.minLength
    this.maxLength = opts && opts.maxLength
    this.multiline = opts && opts.multiline

    this.sortConfigurations = [
      {key: shortid.generate(), type: SortType.String, label: this.label || '', path: []}
    ]
  }

  public initialize() {
    return this
  }

  public renderListComponent(props: ListRenderProps<string>) {
    return <CardSection>{props.value}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<string>) {
    return (
      <StringFieldEditComponent
        label={this.label}
        description={this.description}
        field={this}
        {...props}
      />
    )
  }

  public transformRawValue(value: unknown): string {
    if (typeof value !== 'string') throw new Error('StringField received invalid value!')
    return value
  }

  public transformValueToExpression(value: string) {
    return d.string(value)
  }

  public isValidValue(value: string) {
    const errors: string[] = []

    if (this.maxLength && value.length > this.maxLength) errors.push('stringToLongError')
    if (this.minLength && value.length < this.minLength) errors.push('stringToShortError')

    return errors
  }

  public serialize(): SerializedStringField {
    return {
      type: StringField.type,
      label: this.label,
      description: this.description,
      minLength: this.minLength,
      maxLength: this.maxLength,
      multiline: this.multiline
    }
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }

  public static type = 'string'

  static canInferFromModel(model: Model) {
    return model.type === 'string'
  }

  static create(model: Model, opts?: StringFieldOptions) {
    if (model.type !== 'string') {
      return new ErrorField({
        label: opts && opts.label,
        description: opts && opts.description,
        message: `Expected model type "string" received: "${model.type}"`
      })
    }

    return new this(opts)
  }

  static unserialize(rawField: SerializedStringField) {
    return new this(rawField)
  }
}
