import React from 'react'
import {expression as e} from '@karma.run/sdk'
import {Field, SerializedField, EditComponentRenderProps, EditRenderProps} from './interface'
import {FieldErrors, FieldComponent, FieldLabel} from '../ui/field'
import {CardError} from '../ui/card'
import {SortConfiguration, FilterConfiguration} from '../interface/filter'
import {Model} from '../api/model'

export class ErrorEditComponent extends React.PureComponent<EditComponentRenderProps<ErrorField>> {
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
        <FieldErrors errors={[this.props.field.message]} />
      </FieldComponent>
    )
  }
}

export interface ErrorFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly message?: string
}

export type SerializedErrorField = SerializedField & ErrorFieldOptions

export class ErrorField implements Field<null> {
  public readonly label?: string
  public readonly description?: string
  public readonly message: string

  public readonly defaultValue = null
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts?: ErrorFieldOptions) {
    this.label = opts && opts.label
    this.description = opts && opts.description
    this.message = (opts && opts.message) || 'Unknown Error'
  }

  public initialize() {
    return this
  }

  public renderListComponent() {
    return <CardError>{this.message}</CardError>
  }

  public renderEditComponent(props: EditRenderProps<null>) {
    return (
      <ErrorEditComponent
        label={this.label}
        description={this.description}
        field={this}
        {...props}
      />
    )
  }

  public serialize(): SerializedErrorField {
    return {
      type: ErrorField.type,
      label: this.label,
      description: this.description,
      message: this.message
    }
  }

  public transformRawValue() {
    return null
  }

  public transformValueToExpression() {
    return e.null()
  }

  public isValidValue() {
    return [this.message]
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }

  static inferFromModel() {
    return null
  }

  public static type = 'error'

  static create(_model: Model, opts?: ErrorFieldOptions) {
    return new this(opts)
  }

  static unserialize(rawField: SerializedErrorField) {
    return new this(rawField)
  }
}
