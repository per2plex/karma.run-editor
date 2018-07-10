import React from 'react'
import {expression as e} from '@karma.run/sdk'
import {Field, SerializedField, EditComponentRenderProps, EditRenderProps} from './interface'
import {FieldErrors, Field as FieldComponent, FieldLabel} from '../ui/common/field'
import {CardError} from '../ui/common/card'
import {SortConfiguration, FilterConfiguration} from '../filter/configuration'

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
  readonly message: string
}

export class ErrorField implements Field<null> {
  public readonly label?: string
  public readonly description?: string
  public readonly message: string

  public readonly defaultValue = null
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts: ErrorFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.message = opts.message
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

  public serialize(): SerializedField {
    throw new Error('Error field should not be serialized!')
  }

  public transformRawValue(value: any) {
    return value
  }

  public transformValueToExpression(value: any) {
    return e.string(value)
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
}
