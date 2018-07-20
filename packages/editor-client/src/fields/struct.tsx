import React from 'react'
import {data as d} from '@karma.run/sdk'

import {
  convertKeyToLabel,
  KeyPath,
  Model,
  reduceToMap,
  mapObjectAsync,
  ValuePath,
  StructPathSegment,
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

import {ErrorField} from './error'
import {FieldWrapper, FieldComponent, FieldLabel, FieldInset} from '../ui/field'

export type StructFieldChildTuple = [string, Field]
export type StructFieldOptionsTuple = [string, TypedFieldOptions]
export type StructFieldSerializedTuple = [string, SerializedField]

export class StructFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<StructField>
> {
  private handleValueChange = (value: any, key: string | undefined) => {
    if (key == undefined) {
      throw new Error('Child field did not call onValueChange with changeKey!')
    }

    this.props.onValueChange({...this.props.value, [key]: value}, this.props.changeKey)
  }

  public render() {
    const fields = this.props.field.fields.map(([key, field], index) => (
      <React.Fragment key={key}>
        {field.renderEditComponent({
          index: index,
          depth: this.props.isWrapped ? this.props.depth : this.props.depth + 1,
          isWrapped: false,
          disabled: this.props.disabled,
          value: this.props.value[key],
          onValueChange: this.handleValueChange,
          onEditRecord: this.props.onEditRecord,
          onSelectRecord: this.props.onSelectRecord,
          changeKey: key
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

export interface StructFieldOptions extends FieldOptions {
  readonly description?: string
  readonly fields?: StructFieldOptionsTuple[]
}

export interface StructFieldConstructorOptions {
  readonly label?: string
  readonly description?: string
  readonly fields: StructFieldChildTuple[]
}

export type SerializedStructField = SerializedField & {
  readonly label?: string
  readonly description?: string
  readonly fields: StructFieldSerializedTuple[]
}

export type StructFieldValue = {[key: string]: any}

export class StructField implements Field<StructFieldValue> {
  public label?: string
  public description?: string

  public fields: StructFieldChildTuple[]
  public fieldMap!: ReadonlyMap<string, Field>

  public defaultValue!: StructFieldValue
  public sortConfigurations!: SortConfiguration[]
  public filterConfigurations!: FilterConfiguration[]

  public constructor(opts: StructFieldConstructorOptions) {
    this.label = opts.label
    this.description = opts.description
    this.fields = opts.fields
  }

  public initialize(recursions: ReadonlyMap<string, Field>) {
    this.fields.forEach(([_, field]) => field.initialize(recursions))

    this.fieldMap = new Map(this.fields)
    this.defaultValue = reduceToMap(this.fields, ([key, field]) => [key, field.defaultValue])

    this.sortConfigurations = [
      ...this.fields.reduce(
        (acc, [key, field]) => [
          ...acc,
          ...field.sortConfigurations.map(config => ({
            ...config,
            path: [StructPathSegment(key), ...config.path]
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
      <StructFieldEditComponent
        label={this.label}
        description={this.description}
        field={this}
        {...props}
      />
    )
  }

  public transformRawValue(value: any) {
    return reduceToMap(this.fields, ([key, field]) => [key, field.transformRawValue(value[key])])
  }

  public transformValueToExpression(value: StructFieldValue) {
    return d.struct(
      reduceToMap(this.fields, ([key, field]) => [
        key,
        field.transformValueToExpression(value[key])
      ])
    )
  }

  public isValidValue() {
    return null
  }

  public serialize(): SerializedStructField {
    return {
      type: StructField.type,
      label: this.label,
      description: this.description,
      fields: this.fields.map(
        ([key, field]) => [key, field.serialize()] as StructFieldSerializedTuple
      )
    }
  }

  public traverse(keyPath: KeyPath): Field | undefined {
    if (keyPath.length === 0) return this

    const key = keyPath[0]
    const field = this.fieldMap.get(key.toString())

    if (!field) return undefined

    return field.traverse(keyPath.slice(1))
  }

  public valuePathForKeyPath(keyPath: KeyPath): ValuePath {
    const key = keyPath[0]
    const field = this.fieldMap.get(key.toString())

    if (!field) throw new Error('Invalid KeyPath!')

    return [StructPathSegment(key.toString()), ...field.valuePathForKeyPath(keyPath.slice(1))]
  }

  public async onSave(value: StructFieldValue, context: SaveContext) {
    return mapObjectAsync(value, async (value, key) => {
      const field = this.fieldMap.get(key)

      if (!field) throw new Error(`Couln't find field for key: ${key}`)
      if (!field.onSave) return value
      return await field.onSave(value, context)
    })
  }

  public async onDelete(value: StructFieldValue, context: DeleteContext) {
    return mapObjectAsync(value, async (value, key) => {
      const field = this.fieldMap.get(key)
      if (!field) throw new Error(`Couln't find field for key: ${key}`)
      if (!field.onDelete) return value
      return await field.onDelete(value, context)
    })
  }

  public static type = 'struct'

  static canInferFromModel(model: Model) {
    return model.type === 'struct'
  }

  static create(
    model: Model,
    opts: StructFieldOptions | undefined,
    createField: CreateFieldFunction
  ) {
    if (model.type !== 'struct') {
      return new ErrorField({
        label: opts && opts.label,
        description: opts && opts.description,
        message: `Expected model type "struct" received: "${model.type}"`
      })
    }

    const sortArray = opts && opts.fields && opts.fields.map(tuple => tuple[0])
    const fieldOptionsMap = new Map(opts && opts.fields)

    const fields = Object.entries(model.fields).map(([key, model]) => {
      const options = fieldOptionsMap.get(key)
      return [key, createField(model, {label: convertKeyToLabel(key), ...options})]
    }) as StructFieldChildTuple[]

    if (sortArray) {
      fields.sort(([keyA], [keyB]) => sortArray.indexOf(keyA) - sortArray.indexOf(keyB))
    }

    return new this({...opts, fields})
  }

  static unserialize(rawField: SerializedStructField, unserializeField: UnserializeFieldFunction) {
    return new this({
      label: rawField.label,
      description: rawField.description,
      fields: rawField.fields.map(
        ([key, field]) => [key, unserializeField(field)] as StructFieldChildTuple
      )
    })
  }
}
