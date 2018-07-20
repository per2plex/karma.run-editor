import React from 'react'
import {data as d} from '@karma.run/sdk'

import {
  KeyPath,
  Model,
  ValuePath,
  TuplePathSegment,
  SortConfiguration,
  FilterConfiguration,
  FieldOptions,
  TypedFieldOptions
} from '@karma.run/editor-common'

import {
  EditComponentRenderProps,
  Field,
  EditRenderProps,
  SerializedField,
  UnserializeFieldFunction,
  CreateFieldFunction,
  SaveContext,
  DeleteContext
} from '../api/field'

import {FieldWrapper, FieldComponent, FieldLabel, FieldInset} from '../ui/field'
import {ErrorField} from './error'

export type TupleFieldChildTuple = [number, Field]
export type TupleFieldOptionsTuple = [number, TypedFieldOptions]
export type TupleFieldSerializedTuple = [number, SerializedField]

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

export interface TupleFieldOptions extends FieldOptions {
  readonly description?: string
  readonly fields: TupleFieldOptionsTuple[]
}

export interface TupleFieldConstructorOptions {
  readonly label?: string
  readonly description?: string
  readonly fields: TupleFieldChildTuple[]
}

export type SerializedTupleField = SerializedField & {
  readonly label?: string
  readonly description?: string
  readonly fields: TupleFieldSerializedTuple[]
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

  public constructor(opts: TupleFieldConstructorOptions) {
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

    return d.tuple(...tupleValues)
  }

  public isValidValue() {
    return null
  }

  public serialize(): SerializedTupleField {
    return {
      type: TupleField.type,
      label: this.label,
      description: this.description,
      fields: this.fields.map(
        ([key, field]) => [key, field.serialize()] as TupleFieldSerializedTuple
      )
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

  public async onSave(value: TupleFieldValue, context: SaveContext) {
    const newValues: any[] = []

    for (const [index, tupleValue] of value.entries()) {
      const field = this.fieldMap.get(index)

      if (!field) throw new Error(`Couln't find field for index: ${index}`)
      if (!field.onSave) return value

      newValues.push(await field.onSave(tupleValue, context))
    }

    return newValues
  }

  public async onDelete(value: TupleFieldValue, context: DeleteContext) {
    const newValues: any[] = []

    for (const [index, tupleValue] of value.entries()) {
      const field = this.fieldMap.get(index)

      if (!field) throw new Error(`Couln't find field for index: ${index}`)
      if (!field.onDelete) return value

      newValues.push(await field.onDelete(tupleValue, context))
    }

    return newValues
  }

  public static type = 'tuple'

  static canInferFromModel(model: Model) {
    return model.type === 'tuple'
  }

  static create(
    model: Model,
    opts: TupleFieldOptions | undefined,
    createField: CreateFieldFunction
  ) {
    if (model.type !== 'tuple') {
      return new ErrorField({
        label: opts && opts.label,
        description: opts && opts.description,
        message: `Expected model type "tuple" received: "${model.type}"`
      })
    }

    const sortArray = opts && opts.fields && opts.fields.map(tuple => tuple[0])
    const fieldOptionsMap = new Map(opts && opts.fields)

    const fields = model.fields.map((model, index) => {
      const options = fieldOptionsMap.get(index)
      return [index, createField(model, {label: `Index ${index}`, ...options})]
    }) as TupleFieldChildTuple[]

    if (sortArray) {
      fields.sort(([indexA], [indexB]) => sortArray.indexOf(indexA) - sortArray.indexOf(indexB))
    }

    return new this({...opts, fields})
  }

  static unserialize(rawField: SerializedTupleField, unserializeField: UnserializeFieldFunction) {
    return new this({
      label: rawField.label,
      description: rawField.description,
      fields: rawField.fields.map(
        ([key, field]) => [key, unserializeField(field)] as TupleFieldChildTuple
      )
    })
  }
}