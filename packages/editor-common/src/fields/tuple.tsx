import React from 'react'
import {expression as e, data as d} from '@karma.run/sdk'

import {
  EditComponentRenderProps,
  Field,
  EditRenderProps,
  SerializedField,
  UnserializeFieldFunction,
  InferFieldFunction
} from './interface'

import {ErrorField} from './error'
import {KeyPath, Model} from '../api/model'
import {WorkerContext} from '../context/worker'

import {
  ValuePath,
  TuplePathSegment,
  SortConfiguration,
  FilterConfiguration
} from '../interface/filter'

import {FieldWrapper, FieldComponent, FieldLabel, FieldInset} from '../ui/field'

export type TupleFieldChildTuple = [number, Field]

export class TupleFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<TupleField, TupleFieldValue>
> {
  private handleValueChange = (value: any, key: string | undefined) => {
    if (key == undefined) {
      throw new Error('Child field did not call onValueChange with changeKey!')
    }

    this.props.onValueChange({...this.props.value, [key]: value}, this.props.changeKey)
  }

  public render() {
    const fields = this.props.field.fields.map(([tupleIndex, field], index) => (
      <React.Fragment key={tupleIndex}>
        {field.renderEditComponent({
          index: index,
          depth: this.props.isWrapped ? this.props.depth : this.props.depth + 1,
          isWrapped: false,
          disabled: this.props.disabled,
          value: this.props.value[tupleIndex],
          onValueChange: this.handleValueChange,
          onEditRecord: this.props.onEditRecord,
          onSelectRecord: this.props.onSelectRecord,
          changeKey: tupleIndex
        })}
      </React.Fragment>
    ))

    if (fields.length === 0) return null

    if (this.props.isWrapped) {
      return fields
    } else {
      return (
        <FieldWrapper depth={this.props.depth} index={this.props.index}>
          <FieldComponent depth={this.props.depth} index={this.props.index}>
            <FieldLabel
              label={this.props.label}
              description={this.props.description}
              depth={this.props.depth}
              index={this.props.index}
            />
          </FieldComponent>
          <FieldInset>{fields}</FieldInset>
        </FieldWrapper>
      )
    }
  }
}

export interface TupleFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly fields: TupleFieldChildTuple[]
}

export type TupleFieldValue = any[]

export class TupleField implements Field<TupleFieldValue> {
  public label?: string
  public description?: string

  public fields: TupleFieldChildTuple[]
  public fieldMap!: ReadonlyMap<number, Field>

  public defaultValue!: TupleFieldValue
  public sortConfigurations!: SortConfiguration[]
  public filterConfigurations!: FilterConfiguration[]

  public constructor(opts: TupleFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.fields = opts.fields
  }

  public initialize(recursions: ReadonlyMap<string, Field>) {
    this.fields.forEach(([_, field]) => field.initialize(recursions))
    this.fieldMap = new Map(this.fields)

    this.defaultValue = this.fields.reduce(
      (acc, [index, field]) => {
        acc[index] = field.defaultValue
        return acc
      },
      [] as any[]
    )

    this.sortConfigurations = [
      ...this.fields.reduce(
        (acc, [index, field]) => [
          ...acc,
          ...field.sortConfigurations.map(config => ({
            ...config,
            path: [TuplePathSegment(index), ...config.path]
          }))
        ],
        [] as SortConfiguration[]
      )
    ]

    this.filterConfigurations = []

    return this
  }

  public renderListComponent() {
    return ''
  }

  public renderEditComponent(props: EditRenderProps) {
    return (
      <TupleFieldEditComponent
        label={this.label}
        description={this.description}
        field={this}
        {...props}
      />
    )
  }

  public transformRawValue(value: any[]): TupleFieldValue {
    return value.map((value, index) => this.fieldMap.get(index)!.transformRawValue(value))
  }

  public transformValueToExpression(value: TupleFieldValue) {
    const tupleValues = this.fields.reduce(
      (acc, [key, field]) => {
        acc[key] = field.transformValueToExpression(value[key])
        return acc
      },
      [] as any[]
    )

    return e.data(d.tuple(...tupleValues))
  }

  public isValidValue() {
    return null
  }

  public serialize() {
    return {
      type: TupleField.type,
      label: this.label || null,
      description: this.description || null,
      fields: this.fields.map(([key, field]) => [key, field.serialize()])
    }
  }

  public traverse(keyPath: KeyPath): Field | undefined {
    if (keyPath.length === 0) return this

    const key = keyPath[0]
    const field = this.fieldMap.get(Number(key))

    if (!field) return undefined

    return field.traverse(keyPath.slice(1))
  }

  public valuePathForKeyPath(keyPath: KeyPath): ValuePath {
    const key = keyPath[0]
    const field = this.fieldMap.get(Number(key))

    if (!field) throw new Error('Invalid KeyPath!')

    return [TuplePathSegment(Number(key)), ...field.valuePathForKeyPath(keyPath.slice(1))]
  }

  public async onSave(value: TupleFieldValue, worker: WorkerContext) {
    const newValues: any[] = []

    for (const [index, tupleValue] of value.entries()) {
      const field = this.fieldMap.get(index)

      if (!field) throw new Error(`Couln't find field for index: ${index}`)
      if (!field.onSave) return value

      newValues.push(await field.onSave(tupleValue, worker))
    }

    return newValues
  }

  public async onDelete(value: TupleFieldValue, worker: WorkerContext) {
    const newValues: any[] = []

    for (const [index, tupleValue] of value.entries()) {
      const field = this.fieldMap.get(index)

      if (!field) throw new Error(`Couln't find field for index: ${index}`)
      if (!field.onDelete) return value

      newValues.push(await field.onDelete(tupleValue, worker))
    }

    return newValues
  }

  public static type = 'tuple'

  static unserialize(
    rawField: SerializedField,
    model: Model,
    unserializeField: UnserializeFieldFunction
  ) {
    if (model.type !== 'tuple') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    if (!Array.isArray(rawField.fields)) {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid fields!'
      })
    }

    // TODO: Check all keys in model
    return new this({
      label: rawField.label,
      description: rawField.description,
      fields: rawField.fields.map(
        ([key, field]) => [key, unserializeField(field, model.fields[key])] as TupleFieldChildTuple
      )
    })
  }

  static inferFromModel(model: Model, label: string | undefined, inferField: InferFieldFunction) {
    if (model.type !== 'tuple') return null

    return new this({
      label: label,
      fields: model.fields.map(
        (model, index) => [index, inferField(model, `Index ${index}`)] as TupleFieldChildTuple
      )
    })
  }
}
