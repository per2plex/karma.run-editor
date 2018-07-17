import React from 'react'
import {expression as e} from '@karma.run/sdk'
import {Model} from '../api/model'

import {
  SerializedField,
  EditComponentRenderProps,
  EditRenderProps,
  Field,
  ListRenderProps
} from './interface'

import {CheckboxInput} from '../ui/input'
import {CardSection} from '../ui/card'
import {SortConfiguration, FilterConfiguration} from '../interface/filter'
import {FieldComponent, FieldLabel} from '../ui/field'
import {ErrorField} from './error'

export class BoolFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<BoolField, boolean>
> {
  private handleChange = (value: boolean) => {
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
        <CheckboxInput
          onChange={this.handleChange}
          value={this.props.value}
          disabled={this.props.disabled}
        />
      </FieldComponent>
    )
  }
}

export interface BoolFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly minLength?: number
  readonly maxLength?: number
  readonly multiline?: boolean
}

export type SerializedBoolField = SerializedField & BoolFieldOptions

export class BoolField implements Field<boolean> {
  public readonly label?: string
  public readonly description?: string

  public readonly defaultValue: boolean = false
  public readonly sortConfigurations: SortConfiguration[]
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts?: BoolFieldOptions) {
    this.label = opts && opts.label
    this.description = opts && opts.description
    this.sortConfigurations = []
  }

  public initialize() {
    return this
  }

  public renderListComponent(props: ListRenderProps<boolean>) {
    return <CardSection>{props.value}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<boolean>) {
    return (
      <BoolFieldEditComponent
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

  public transformValueToExpression(value: boolean) {
    return e.bool(value)
  }

  public isValidValue() {
    return null
  }

  public serialize(): SerializedBoolField {
    return {
      type: BoolField.type,
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

  public static type = 'bool'

  static canInferFromModel(model: Model) {
    return model.type === 'bool'
  }

  static create(model: Model, opts?: BoolFieldOptions) {
    if (model.type !== 'bool') {
      return new ErrorField({
        label: opts && opts.label,
        description: opts && opts.description,
        message: `Expected model type "bool" received: "${model.type}"`
      })
    }

    return new this(opts)
  }

  static unserialize(rawField: SerializedBoolField) {
    return new this({
      label: rawField.label,
      description: rawField.description
    })
  }
}
