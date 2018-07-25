import React from 'react'
import {expression as e} from '@karma.run/sdk'

import {
  Model,
  SortConfiguration,
  FilterConfiguration,
  TypedFieldOptions
} from '@karma.run/editor-common'

import {EditComponentRenderProps, EditRenderProps, Field, ListRenderProps} from '../api/field'

import {FieldComponent, FieldLabel} from '../ui/field'
import {DateTimeInput} from '../ui/input'
import {CardSection} from '../ui/card'
import {ErrorField} from './error'

export class DateTimeFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<DateTimeField, string>
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
        <DateTimeInput
          onChange={this.handleChange}
          value={this.props.value}
          disabled={this.props.disabled}
        />
      </FieldComponent>
    )
  }
}

export interface DateTimeFieldOptions {
  readonly label?: string
  readonly description?: string
}

export type DateTimeValue = string | Date | undefined

export class DateTimeField implements Field<DateTimeValue> {
  public readonly label?: string
  public readonly description?: string

  public readonly defaultValue: DateTimeValue = undefined
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts?: DateTimeFieldOptions) {
    this.label = opts && opts.label
    this.description = opts && opts.description
  }

  public initialize() {
    return this
  }

  public renderListComponent(props: ListRenderProps<string>) {
    return <CardSection>{props.value}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<string>) {
    return (
      <DateTimeFieldEditComponent
        label={this.label}
        description={this.description}
        field={this}
        {...props}
      />
    )
  }

  public transformRawValue(value: any) {
    return new Date(value)
  }

  public transformValueToExpression(value: DateTimeValue) {
    if (!value) return e.null()
    return e.dateTime(value)
  }

  public isValidValue() {
    return []
  }

  public fieldOptions(): DateTimeFieldOptions & TypedFieldOptions {
    return {
      type: DateTimeField.type,
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

  public static type = 'dateTime'

  static canInferFromModel(model: Model) {
    return model.type === 'dateTime'
  }

  static create(model: Model, opts?: DateTimeFieldOptions) {
    if (model.type !== 'dateTime') {
      return new ErrorField({
        label: opts && opts.label,
        description: opts && opts.description,
        message: `Expected model type "dateTime" received: "${model.type}"`
      })
    }

    return new this(opts)
  }
}
