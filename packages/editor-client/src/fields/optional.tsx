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

import {Field as FieldComponent, FieldLabel, FieldWrapper, FieldInset} from '../ui/common/field'
import {CardSection} from '../ui/common/card'
import {SortConfiguration, FilterConfiguration} from '../filter/configuration'
import {convertKeyToLabel} from '../util/string'
import {CheckboxInput} from '../ui/common'

export class OptionalFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<OptionalField, OptionalFieldValue>
> {
  private handleIsPresentChange = (value: boolean) => {
    this.props.onValueChange(
      {
        isPresent: value,
        value: this.props.value.value || this.props.field.field.defaultValue
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
        {this.props.value.isPresent && (
          <FieldInset>
            {this.props.field.field.renderEditComponent({
              index: 0,
              depth: this.props.isWrapped ? this.props.depth : this.props.depth + 1,
              isWrapped: true,
              disabled: this.props.disabled,
              value: this.props.value.value,
              onValueChange: this.handleValueChange,
              onEditRecord: this.props.onEditRecord,
              onSelectRecord: this.props.onSelectRecord
            })}
          </FieldInset>
        )}
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

  public parent?: Field

  public readonly defaultValue: OptionalFieldValue = {
    isPresent: false,
    value: undefined
  }

  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(options: OptionalFieldOptions) {
    this.label = options.label
    this.description = options.description
    this.field = options.field
    this.field.parent = this
  }

  public renderListComponent(value: OptionalFieldValue) {
    return <CardSection>{value}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<OptionalFieldValue>) {
    return <OptionalFieldEditComponent {...props} field={this} />
  }

  public transformRawValue(value: any) {
    if (value == undefined) {
      return {
        isPresent: false,
        value: undefined
      }
    } else {
      return {
        isPresent: true,
        value: this.field.transformRawValue(value)
      }
    }
  }

  public transformValueToExpression(value: OptionalFieldValue) {
    return value.isPresent ? this.field.transformValueToExpression(value.value) : e.null()
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

  public async onSave(value: OptionalFieldValue): Promise<OptionalFieldValue> {
    if (this.field.onSave && value.isPresent) {
      return {isPresent: value.isPresent, value: await this.field.onSave(value.value)}
    }

    return value
  }

  public async onDelete(value: OptionalFieldValue): Promise<OptionalFieldValue> {
    if (this.field.onDelete && value.isPresent) {
      return {isPresent: value.isPresent, value: await this.field.onDelete(value.value)}
    }

    return value
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
