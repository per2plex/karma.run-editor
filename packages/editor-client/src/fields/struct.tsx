import React from 'react'
import {expression as e, data as d} from '@karma.run/sdk'
import {reduceToMap, ValuePath, ValuePathSegmentType} from '@karma.run/editor-common'

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
import {FieldWrapper, Field as FieldComponent, FieldLabel, FieldInset} from '../ui/fields/field'

export type StructFieldChildTuple = [string, Field]

export class StructFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<StructField>
> {
  private handleChange = (value: any, key?: string) => {
    this.props.onValueChange({...this.props.value, [key!]: value})
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
          onValueChange: this.handleChange,
          onEditRecord: this.props.onEditRecord,
          changeKey: key
        })}
      </React.Fragment>
    ))

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
  public readonly fields: StructFieldChildTuple[]

  public constructor(opts: StructFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.fields = opts.fields
  }

  public renderListComponent() {
    return ''
  }

  public renderEditComponent(props: EditRenderProps) {
    return <StructFieldEditComponent {...props} field={this} />
  }

  public defaultValue() {
    return reduceToMap(this.fields, ([key, field]) => [key, field.defaultValue()])
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

  public traverse(keyPath: KeyPath) {
    if (keyPath.length === 0) return this

    const key = keyPath[0]
    const fieldTuple = this.fields.find(([fieldKey]) => {
      return fieldKey === key
    })

    if (!fieldTuple) return undefined

    return fieldTuple[1].traverse(keyPath.slice(1))
  }

  public valuePathForKeyPath(keyPath: KeyPath): ValuePath {
    const key = keyPath[0]
    const fieldTuple = this.fields.find(([fieldKey]) => {
      return fieldKey === key
    })

    if (!fieldTuple) throw new Error('Invalid KeyPath!')

    return [
      {type: ValuePathSegmentType.Struct, key: key},
      ...fieldTuple[1].valuePathForKeyPath(keyPath.slice(1))
    ]
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

  static inferFromModel(model: Model, label: string | undefined, inferField: InferFieldFunction) {
    if (model.type !== 'struct') return null
    return new StructField({
      label,
      fields: Object.entries(model.fields).map(
        ([key, model]) => [key, inferField(model, key)] as StructFieldChildTuple
      )
    })
  }
}
