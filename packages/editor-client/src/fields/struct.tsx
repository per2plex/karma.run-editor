import React from 'react'
import {expression as e, data as d} from '@karma.run/sdk'

import {
  reduceToMap,
  ValuePath,
  ValuePathSegmentType,
  mapObjectAsync,
  StructPathSegment
} from '@karma.run/editor-common'

import {
  EditComponentRenderProps,
  Field,
  EditRenderProps,
  SerializedField,
  UnserializeFieldFunction,
  InferFieldFunction
} from './interface'

import {KeyPath, Model} from '../api/model'
import {ErrorField} from './error'
import {FieldWrapper, Field as FieldComponent, FieldLabel, FieldInset} from '../ui/common/field'
import {convertKeyToLabel} from '../util/string'
import {SortConfiguration, FilterConfiguration} from '../filter/configuration'

export type StructFieldChildTuple = [string, Field]

export class StructFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<StructField>
> {
  private handleValueChange = (value: any, key: string | undefined) => {
    if (!key) throw new Error('Child field did not call onValueChange with changeKey!')
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
              label={this.props.field.label}
              description={this.props.field.description}
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

export interface StructFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly fields: StructFieldChildTuple[]
}

export type StructFieldValue = {[key: string]: any}

export class StructField implements Field<StructFieldValue> {
  public readonly label?: string
  public readonly description?: string
  public readonly fieldMap: ReadonlyMap<string, Field>
  public readonly fields: StructFieldChildTuple[]

  public parent?: Field
  public readonly defaultValue: StructFieldValue
  public readonly sortConfigurations: SortConfiguration[]
  public readonly filterConfigurations: FilterConfiguration[]

  public constructor(opts: StructFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.fields = opts.fields
    this.fieldMap = new Map(this.fields)
    this.fields.forEach(([_, field]) => (field.parent = this))

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
  }

  public renderListComponent() {
    return ''
  }

  public renderEditComponent(props: EditRenderProps) {
    return <StructFieldEditComponent {...props} field={this} />
  }

  public transformRawValue(value: any) {
    return reduceToMap(this.fields, ([key, field]) => [key, field.transformRawValue(value[key])])
  }

  public transformValueToExpression(value: StructFieldValue) {
    return e.data(
      d.struct(
        reduceToMap(this.fields, ([key, field]) => [
          key,
          d.expr(field.transformValueToExpression(value[key]))
        ])
      )
    )
  }

  public isValidValue() {
    return null
  }

  public serialize() {
    return {
      type: StructField.type,
      label: this.label || null,
      description: this.description || null,
      fields: this.fields.map(([key, field]) => [key, field.serialize()])
    }
  }

  public traverse(keyPath: KeyPath): Field | undefined {
    if (keyPath.length === 0) return this

    const key = keyPath[0]
    const field = this.fieldMap.get(key)

    if (!field) return undefined

    return field.traverse(keyPath.slice(1))
  }

  public valuePathForKeyPath(keyPath: KeyPath): ValuePath {
    const key = keyPath[0]
    const field = this.fieldMap.get(key)

    if (!field) throw new Error('Invalid KeyPath!')

    return [
      {type: ValuePathSegmentType.Struct, key: key},
      ...field.valuePathForKeyPath(keyPath.slice(1))
    ]
  }

  public async onSave(value: StructFieldValue) {
    return mapObjectAsync(value, async (value, key) => {
      const field = this.fieldMap.get(key)

      if (!field) throw new Error(`Couln't find field for key: ${key}`)
      if (!field.onSave) return value
      return await field.onSave(value)
    })
  }

  public async onDelete(value: StructFieldValue) {
    return mapObjectAsync(value, async (value, key) => {
      const field = this.fieldMap.get(key)
      if (!field) throw new Error(`Couln't find field for key: ${key}`)
      if (!field.onDelete) return value
      return await field.onDelete(value)
    })
  }

  public static type = 'struct'

  static unserialize(
    rawField: SerializedField,
    model: Model,
    unserializeField: UnserializeFieldFunction
  ) {
    if (model.type !== 'struct') {
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

    return new StructField({
      label: rawField.label,
      description: rawField.description,
      fields: rawField.fields.map(
        ([key, field]) => [key, unserializeField(field, model.fields[key])] as StructFieldChildTuple
      )
    })
  }

  static inferFromModel(model: Model, key: string | undefined, inferField: InferFieldFunction) {
    if (model.type !== 'struct') return null
    return new StructField({
      label: key && convertKeyToLabel(key),
      fields: Object.entries(model.fields).map(
        ([key, model]) => [key, inferField(model, key)] as StructFieldChildTuple
      )
    })
  }
}
