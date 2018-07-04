import React from 'react'
import {expression as e} from '@karma.run/sdk'
import {
  CommonFieldOptions,
  Field,
  SerializedField,
  EditComponentRenderProps,
  EditRenderProps
} from './interface'
import {FieldErrors, Field as FieldComponent} from '../ui/fields/field'

export class ErrorEditComponent extends React.PureComponent<EditComponentRenderProps<ErrorField>> {
  public render() {
    return (
      <FieldComponent depth={this.props.depth} index={this.props.index}>
        <FieldErrors errors={[this.props.field.message]} />
      </FieldComponent>
    )
  }
}

export interface ErrorFieldOptions extends CommonFieldOptions {
  message: string
}

export class ErrorField implements Field<null> {
  public readonly label?: string
  public readonly message: string

  public constructor(opts: ErrorFieldOptions) {
    this.label = opts.label
    this.message = opts.message
  }

  public renderListComponent() {
    return this.message
  }

  public renderEditComponent(props: EditRenderProps<null>) {
    return <ErrorEditComponent {...props} field={this} />
  }

  public defaultValue() {
    return null
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
