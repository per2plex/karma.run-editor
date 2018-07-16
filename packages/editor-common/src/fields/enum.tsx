import React from 'react'
import memoizeOne from 'memoize-one'
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

import {FieldComponent, FieldLabel} from '../ui/field'
import {CardSection} from '../ui/card'
import {Select, SelectType} from '../ui/select'

import {SortConfiguration, FilterConfiguration} from '../interface/filter'
import {convertKeyToLabel} from '../util/string'

export class EnumFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<EnumField, EnumFieldValue>
> {
  private handleChange = (value: any) => {
    this.props.onValueChange(value, this.props.changeKey)
  }

  private getFieldOptions = memoizeOne(
    (options: EnumFieldOption[]): Select.Option[] => {
      return options.map(([key, label]) => ({key, label}))
    }
  )

  public render() {
    return (
      <FieldComponent depth={this.props.depth} index={this.props.index}>
        {!this.props.isWrapped && (
          <FieldLabel
            label={this.props.label}
            description={this.props.description}
            depth={this.props.depth}
            index={this.props.index || 0}
          />
        )}
        <Select
          value={this.props.value}
          type={SelectType.Transparent}
          options={this.getFieldOptions(this.props.field.options)}
          onChange={this.handleChange}
          disabled={this.props.disabled}
          disableUnselectedOption
        />
      </FieldComponent>
    )
  }
}

export type EnumFieldValue = string | undefined
export type EnumFieldOption = [string, string]

export interface EnumFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly options: EnumFieldOption[]
}

export class EnumField implements Field<EnumFieldValue> {
  public readonly label?: string
  public readonly description?: string
  public readonly options: EnumFieldOption[]

  public readonly defaultValue: EnumFieldValue = undefined
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts: EnumFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.options = opts.options
  }

  public initialize() {
    return this
  }

  public renderListComponent(props: ListRenderProps<EnumFieldValue>) {
    return <CardSection>{props.value}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<EnumFieldValue>) {
    return (
      <EnumFieldEditComponent
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
    return e.symbol(value)
  }

  public isValidValue(_value: string) {
    return []
  }

  public serialize() {
    return {
      type: EnumField.type,
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

  public static type = 'enum'

  static inferFromModel(model: Model, label: string | undefined) {
    if (model.type !== 'enum') return null
    return new EnumField({
      label,
      options: model.values.map(option => [option, convertKeyToLabel(option)] as [string, string])
    })
  }

  static unserialize(rawField: SerializedField, model: Model) {
    if (model.type !== 'enum') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    const rawOptions: EnumFieldOption[] = rawField.options
    const filteredOptions = rawOptions.filter(([rawOptionKey]) =>
      model.values.includes(rawOptionKey)
    )

    const missingOptions = model.values.filter(
      option => !filteredOptions.some(([key]) => key === option)
    )

    return new this({
      label: rawField.label,
      description: rawField.description,
      options: filteredOptions.concat(
        missingOptions.map(option => [option, convertKeyToLabel(option)] as [string, string])
      )
    })
  }
}
