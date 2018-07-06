import React from 'react'
import {expression as e} from '@karma.run/sdk'

import {Model, KeyPath} from '../api/model'
import {ErrorField} from './error'

import {
  SerializedField,
  EditRenderProps,
  Field,
  InferFieldFunction,
  EditComponentRenderProps,
  UnserializeFieldFunction
} from './interface'

import {Field as FieldComponent, FieldLabel, FieldWrapper, FieldInset} from '../ui/fields/field'
import {CardSection} from '../ui/common/card'
import {SortConfigration} from '../filter/configuration'
import {convertKeyToLabel} from '../util/string'
import {CheckboxInput} from '../ui/common'

export class OptionalFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<OptionalField, OptionalFieldValue>
> {
  private handleIsPresentChange = (value: boolean) => {
    this.props.onValueChange(
      {
        isPresent: value,
        value: this.props.value.value || this.props.field.field.defaultValue(this.props.context)
      },
      this.props.changeKey
    )
  }

  private handleValueChange = (value: any) => {
    this.props.onValueChange(
      {
        isPresent: this.props.value.isPresent,
        value: value
      },
      this.props.changeKey
    )
  }

  public render() {
    return (
      <FieldWrapper depth={this.props.depth} index={this.props.index}>
        <FieldComponent depth={this.props.depth} index={this.props.index}>
          <FieldLabel
            label={this.props.field.label}
            description={this.props.field.description}
            depth={this.props.depth}
            index={this.props.index || 0}
            leftContent={
              <CheckboxInput
                value={this.props.value.isPresent}
                onChange={this.handleIsPresentChange}
                disabled={this.props.disabled}
              />
            }
          />
        </FieldComponent>
        <FieldInset>
          {this.props.value.isPresent &&
            this.props.field.field.renderEditComponent({
              index: 0,
              depth: this.props.isWrapped ? this.props.depth : this.props.depth + 1,
              isWrapped: true,
              disabled: this.props.disabled,
              value: this.props.value.value,
              context: this.props.context,
              onValueChange: this.handleValueChange,
              onEditRecord: this.props.onEditRecord
            })}
        </FieldInset>
      </FieldWrapper>
    )
  }
}

export interface OptionalFieldValue {
  isPresent: boolean
  value: any
}

export interface OptionalFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly field: Field
}

export class OptionalField implements Field<OptionalFieldValue> {
  public readonly label?: string
  public readonly description?: string
  public readonly field: Field

  public constructor(options: OptionalFieldOptions) {
    this.label = options.label
    this.description = options.description
    this.field = options.field
  }

  public renderListComponent(value: OptionalFieldValue) {
    return <CardSection>{value}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<OptionalFieldValue>) {
    return <OptionalFieldEditComponent {...props} field={this} />
  }

  public defaultValue() {
    return {
      isPresent: false,
      value: undefined
    }
  }

  public transformRawValue(value: any, context?: any) {
    if (value == undefined) {
      return {
        isPresent: false,
        value: undefined
      }
    } else {
      return {
        isPresent: true,
        value: this.field.transformRawValue(value, context)
      }
    }
  }

  public transformValueToExpression(value: OptionalFieldValue, context?: any) {
    return value.isPresent ? this.field.transformValueToExpression(value.value, context) : e.null()
  }

  public isValidValue(value: OptionalFieldValue) {
    return value.isPresent ? this.field.isValidValue(value) : null
  }

  public serialize() {
    return {
      type: OptionalField.type,
      label: this.label,
      description: this.description,
      field: this.field.serialize()
    }
  }

  public traverse(keyPath: KeyPath) {
    return this.field.traverse(keyPath)
  }

  public valuePathForKeyPath(keyPath: KeyPath) {
    return this.field.valuePathForKeyPath(keyPath)
  }

  public sortConfigurations(): SortConfigration[] {
    return []
  }

  public static type = 'optional'

  static inferFromModel(model: Model, key: string | undefined, inferField: InferFieldFunction) {
    if (model.type !== 'optional') return null

    return new OptionalField({
      label: key && convertKeyToLabel(key),
      field: inferField(model.model)
    })
  }

  static unserialize(
    rawField: SerializedField,
    model: Model,
    unserializeField: UnserializeFieldFunction
  ) {
    if (model.type !== 'optional') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new OptionalField({
      label: rawField.label,
      description: rawField.description,
      field: unserializeField(rawField.field, model.model)
    })
  }
}
