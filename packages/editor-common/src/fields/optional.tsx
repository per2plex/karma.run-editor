import React from 'react'
import {expression as e} from '@karma.run/sdk'

import {Model, KeyPath} from '../api/model'
import {ErrorField} from './error'

import {
  SerializedField,
  EditRenderProps,
  Field,
  CreateFieldFunction,
  EditComponentRenderProps,
  UnserializeFieldFunction,
  FieldOptions,
  TypedFieldOptions
} from './interface'

import {FieldComponent, FieldLabel, FieldWrapper, FieldInset} from '../ui/field'
import {CardSection} from '../ui/card'
import {SortConfiguration, FilterConfiguration} from '../interface/filter'
import {CheckboxInput} from '../ui'
import {WorkerContext} from '../context/worker'

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
            label={this.props.label}
            description={this.props.description}
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
              depth: this.props.depth + 1,
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
  readonly field?: TypedFieldOptions
}

export interface OptionalFieldConstructorOptions {
  readonly label?: string
  readonly description?: string
  readonly field: Field
}

export type SerializedOptionalField = SerializedField &
  OptionalFieldOptions & {readonly field: SerializedField}

export class OptionalField implements Field<OptionalFieldValue> {
  public label?: string
  public description?: string

  public defaultValue: OptionalFieldValue = {
    isPresent: false,
    value: undefined
  }

  public sortConfigurations: SortConfiguration[] = []
  public filterConfigurations: FilterConfiguration[] = []

  public field: Field

  public constructor(options: OptionalFieldConstructorOptions) {
    this.label = options.label
    this.description = options.description
    this.field = options.field
  }

  public initialize(recursions: ReadonlyMap<string, Field>) {
    this.field.initialize(recursions)
    return this
  }

  public renderListComponent(value: OptionalFieldValue) {
    return <CardSection>{value}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<OptionalFieldValue>) {
    return (
      <OptionalFieldEditComponent
        label={this.label}
        description={this.description}
        field={this}
        {...props}
      />
    )
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

  public serialize(): SerializedOptionalField {
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

  public async onSave(
    value: OptionalFieldValue,
    worker: WorkerContext
  ): Promise<OptionalFieldValue> {
    if (this.field.onSave && value.isPresent) {
      return {isPresent: value.isPresent, value: await this.field.onSave(value.value, worker)}
    }

    return value
  }

  public async onDelete(
    value: OptionalFieldValue,
    worker: WorkerContext
  ): Promise<OptionalFieldValue> {
    if (this.field.onDelete && value.isPresent) {
      return {isPresent: value.isPresent, value: await this.field.onDelete(value.value, worker)}
    }

    return value
  }

  public static type = 'optional'

  static canInferFromModel(model: Model) {
    return model.type === 'optional'
  }

  static create(
    model: Model,
    opts: OptionalFieldOptions | undefined,
    createField: CreateFieldFunction
  ) {
    if (model.type !== 'optional') {
      return new ErrorField({
        label: opts && opts.label,
        description: opts && opts.description,
        message: `Expected model type "optional" received: "${model.type}"`
      })
    }

    return new this({
      ...opts,
      field: createField(model.model, opts && opts.field)
    })
  }

  static unserialize(
    rawField: SerializedOptionalField,
    unserializeField: UnserializeFieldFunction
  ) {
    return new this({
      label: rawField.label,
      description: rawField.description,
      field: unserializeField(rawField.field)
    })
  }
}
