import React from 'react'
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

import {CheckboxInput} from '../ui/input'
import {CardSection} from '../ui/card'
import {SortConfiguration, FilterConfiguration} from '../interface/filter'
import {FieldComponent, FieldLabel} from '../ui/field'

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

export class BoolField implements Field<boolean> {
  public readonly label?: string
  public readonly description?: string

  public readonly defaultValue: boolean = false
  public readonly sortConfigurations: SortConfiguration[]
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts: BoolFieldOptions) {
    this.label = opts.label
    this.description = opts.description
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

  public serialize() {
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

  static inferFromModel(model: Model, label: string | undefined) {
    if (model.type !== 'bool') return null
    return new this({label})
  }

  static unserialize(rawField: SerializedField, model: Model) {
    if (model.type !== 'bool') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new this({
      label: rawField.label,
      description: rawField.description
    })
  }
}
