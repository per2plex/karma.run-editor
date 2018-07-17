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

import {FieldComponent, FieldLabel} from '../ui/field'
import {NumberInput} from '../ui/input'
import {CardSection} from '../ui/card'
import {SortConfiguration, FilterConfiguration} from '../interface/filter'

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
}

export interface NumberFieldConstructorOptions extends NumberFieldOptions {
  readonly storageType: StorageType
}

export type SerializedNumberField = SerializedField & NumberFieldConstructorOptions

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

const validModelTypes: ModelType[] = [
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

  public constructor(opts: NumberFieldConstructorOptions) {
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

  public serialize(): SerializedNumberField {
    return {
      type: NumberField.type,
      storageType: this.storageType,
      label: this.label,
      description: this.description,
      minValue: this.minValue,
      maxValue: this.maxValue,
      step: this.step
    }
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }

  public static type = 'number'

  static canInferFromModel(model: Model) {
    return validModelTypes.includes(model.type)
  }

  static create(model: Model, opts?: NumberFieldConstructorOptions) {
    if (model.type !== 'null') {
      return new ErrorField({
        label: opts && opts.label,
        description: opts && opts.description,
        message: `Expected model type "${validModelTypes.join(', ')}" received: "${model.type}"`
      })
    }

    return new this({...opts, storageType: model.type as StorageType})
  }

  static unserialize(rawField: SerializedNumberField) {
    return new this(rawField)
  }
}
