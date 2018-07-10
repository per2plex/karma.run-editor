import React from 'react'
import {expression as e} from '@karma.run/sdk'

import {Model, ModelType} from '../api/model'
import {ErrorField} from './error'

import {
  SerializedField,
  EditComponentRenderProps,
  EditRenderProps,
  Field,
  ListRenderProps
} from './interface'

import {Field as FieldComponent, FieldLabel} from '../ui/common/field'
import {NumberInput} from '../ui/common/input'
import {CardSection} from '../ui/common/card'
import {SortConfiguration, FilterConfiguration} from '../filter/configuration'

export class NumberFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<NumberField, string>
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
        <NumberInput
          onChange={this.handleChange}
          value={this.props.value}
          disabled={this.props.disabled}
          step={this.props.field.step}
        />
      </FieldComponent>
    )
  }
}

export interface NumberFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly minValue?: number
  readonly maxValue?: number
  readonly step?: number
  readonly storageType: StorageType
}

export const enum StorageType {
  Float = 'float',
  Int8 = 'int8',
  Int16 = 'int16',
  Int32 = 'int32',
  Int64 = 'int64',
  UInt8 = 'uint8',
  UInt16 = 'uint16',
  UInt32 = 'uint32',
  UInt64 = 'uint64'
}

export const validModelTypes: ModelType[] = [
  'float',
  'int8',
  'int16',
  'int32',
  'int64',
  'uint8',
  'uint16',
  'uint32',
  'uint64'
]

export class NumberField implements Field<string> {
  public readonly label?: string
  public readonly description?: string
  public readonly minValue?: number
  public readonly maxValue?: number
  public readonly step?: number
  public readonly storageType: StorageType

  public readonly defaultValue: string = ''
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts: NumberFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.minValue = opts.minValue
    this.maxValue = opts.maxValue
    this.step = opts.step
    this.storageType = opts.storageType
  }

  public initialize() {
    return this
  }

  public renderListComponent(props: ListRenderProps<string>) {
    return <CardSection>{props.value}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<string>) {
    return (
      <NumberFieldEditComponent
        label={this.label}
        description={this.description}
        field={this}
        {...props}
      />
    )
  }

  public transformRawValue(value: any) {
    return value.toString()
  }

  public transformValueToExpression(value: string) {
    const numberValue = Number(value)

    if (Number.isNaN(numberValue)) return e.null()

    switch (this.storageType) {
      case StorageType.Float:
        return e.float(numberValue)

      case StorageType.Int8:
        return e.int8(numberValue)

      case StorageType.Int16:
        return e.int16(numberValue)

      case StorageType.Int32:
        return e.int32(numberValue)

      case StorageType.Int64:
        return e.int64(numberValue)

      case StorageType.UInt8:
        return e.uint8(numberValue)

      case StorageType.UInt16:
        return e.uint16(numberValue)

      case StorageType.UInt32:
        return e.uint32(numberValue)

      case StorageType.UInt64:
        return e.uint64(numberValue)
    }
  }

  public isValidValue(value: string) {
    const errors: string[] = []
    const numberValue = Number(value)

    if (this.maxValue && numberValue > this.maxValue) errors.push('numberToLarge')
    if (this.minValue && numberValue < this.minValue) errors.push('numberToSmall')

    return errors
  }

  public serialize() {
    return {
      type: NumberField.type,
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

  public static type = 'number'

  static inferFromModel(model: Model, label: string | undefined) {
    if (!validModelTypes.includes(model.type)) return null
    return new NumberField({label, storageType: model.type as StorageType})
  }

  static unserialize(rawField: SerializedField, model: Model) {
    if (!validModelTypes.includes(model.type)) {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new NumberField({
      label: rawField.label,
      description: rawField.description,
      storageType: model.type as StorageType
    })
  }
}
