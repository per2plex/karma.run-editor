import React from 'react'
import shortid from 'shortid'
import {expression as e} from '@karma.run/sdk'

import {Model} from '../api/model'
import {ErrorField} from './error'
import {
  SerializedField,
  EditComponentRenderProps,
  EditRenderProps,
  Field,
  ListRenderProps
} from './interface'
import {Field as FieldComponent, FieldLabel} from '../ui/common/field'
import {TextAreaInput, TextInput, TextInputType} from '../ui/common/input'
import {CardSection} from '../ui/common/card'
import {SortConfiguration, FilterConfiguration} from '../filter/configuration'
import {SortType} from '@karma.run/editor-common'

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

export class StringField implements Field<string> {
  public readonly label?: string
  public readonly description?: string
  public readonly minLength?: number
  public readonly maxLength?: number
  public readonly multiline?: boolean

  public readonly defaultValue: string = ''
  public readonly sortConfigurations: SortConfiguration[]
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts: StringFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.minLength = opts.minLength
    this.maxLength = opts.maxLength
    this.multiline = opts.multiline

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

  public transformRawValue(value: any) {
    return value
  }

  public transformValueToExpression(value: string) {
    return e.string(value)
  }

  public isValidValue(value: string) {
    const errors: string[] = []

    if (this.maxLength && value.length > this.maxLength) errors.push('stringToLongError')
    if (this.minLength && value.length < this.minLength) errors.push('stringToShortError')

    return errors
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
