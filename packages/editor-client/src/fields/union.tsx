import React from 'react'
import memoizeOne from 'memoize-one'
import {expression as e, data as d, Expression} from '@karma.run/sdk'
import {ValuePath, ValuePathSegmentType, firstKey, ObjectMap} from '@karma.run/editor-common'

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
import {Select, SelectType} from '../ui/common/select'
import {FilterConfiguration, SortConfiguration} from '../filter/configuration'
import {WorkerContext} from '../context/worker'

export type UnionFieldChildTuple = [string, string, Field]

export class UnionFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<UnionField, UnionFieldValue>
> {
  private handleSelectChange = (selectedKey?: string) => {
    const value = this.props.value

    if (!selectedKey) {
      return this.props.onValueChange({selectedKey, values: value.values}, this.props.changeKey)
    }

    let selectedValue = value.values[selectedKey]
    if (!selectedValue) selectedValue = this.props.field.fieldForKey(selectedKey).defaultValue

    this.props.onValueChange(
      {selectedKey, values: {...value.values, [selectedKey]: selectedValue}},
      this.props.changeKey
    )
  }

  private handleValueChange = (value: any, key: string | undefined) => {
    if (key == undefined) {
      throw new Error('Child field did not call onValueChange with changeKey!')
    }

    this.props.onValueChange({...this.props.value, values: {[key]: value}}, this.props.changeKey)
  }

  private selectOptions = memoizeOne((field: UnionField) =>
    field.fields.map(([key, label]) => ({key, label: label || key}))
  )

  public render() {
    const field = this.props.value.selectedKey
      ? this.props.field.fieldMap.get(this.props.value.selectedKey)
      : undefined

    return (
      <FieldWrapper depth={this.props.depth} index={this.props.index}>
        <FieldComponent depth={this.props.depth} index={this.props.index}>
          <FieldLabel
            label={this.props.label}
            description={this.props.description}
            depth={this.props.depth}
            index={this.props.index || 0}
          />
          <Select
            value={this.props.value ? this.props.value.selectedKey : undefined}
            type={SelectType.Transparent}
            options={this.selectOptions(this.props.field)}
            onChange={this.handleSelectChange}
            disabled={this.props.disabled}
          />
        </FieldComponent>
        <FieldInset>
          {field &&
            field.renderEditComponent({
              index: 0,
              depth: this.props.depth + 1,
              isWrapped: true,
              disabled: this.props.disabled,
              value: this.props.value.values[this.props.value.selectedKey!],
              onValueChange: this.handleValueChange,
              onEditRecord: this.props.onEditRecord,
              onSelectRecord: this.props.onSelectRecord,
              changeKey: this.props.value!.selectedKey
            })}
        </FieldInset>
      </FieldWrapper>
    )
  }
}

export interface UnionFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly fields: UnionFieldChildTuple[]
}

export type UnionFieldValue = {selectedKey?: string; values: ObjectMap<any>}

export class UnionField implements Field<UnionFieldValue> {
  public label?: string
  public description?: string
  public fields: UnionFieldChildTuple[]
  public fieldMap!: ReadonlyMap<string, Field>

  public defaultValue: UnionFieldValue = {values: {}}
  public sortConfigurations: SortConfiguration[] = []
  public filterConfigurations: FilterConfiguration[] = []

  public constructor(opts: UnionFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.fields = opts.fields
  }

  public initialize(recursions: ReadonlyMap<string, Field>) {
    this.fields.forEach(([_, __, field]) => field.initialize(recursions))
    this.fieldMap = new Map(this.fields.map(([key, _, field]) => [key, field] as [string, Field]))

    return this
  }

  public renderListComponent() {
    return ''
  }

  public renderEditComponent(props: EditRenderProps) {
    return (
      <UnionFieldEditComponent
        label={this.label}
        description={this.description}
        field={this}
        {...props}
      />
    )
  }

  public fieldForKey(key: string): Field {
    const field = this.fieldMap.get(key)
    if (!field) throw new Error(`Coulnd't find field for key: ${key}`)
    return field
  }

  public transformRawValue(value: any): UnionFieldValue {
    const key = firstKey(value)
    const unionValue = value[key]

    return {selectedKey: key, values: {[key]: this.fieldForKey(key).transformRawValue(unionValue)}}
  }

  public transformValueToExpression(value: UnionFieldValue): Expression {
    if (!value.selectedKey) return e.null()
    return e.data(
      d.union(
        value.selectedKey,
        d.expr(
          this.fieldForKey(value.selectedKey).transformValueToExpression(
            value.values[value.selectedKey]
          )
        )
      )
    )
  }

  public isValidValue() {
    return null
  }

  public serialize() {
    return {
      type: UnionField.type,
      label: this.label || null,
      description: this.description || null,
      fields: this.fields.map(([key, label, field]) => [key, label, field.serialize()])
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

    return [
      {type: ValuePathSegmentType.Union, key: key.toString()},
      ...field.valuePathForKeyPath(keyPath.slice(1))
    ]
  }

  public async onSave(value: UnionFieldValue, worker: WorkerContext): Promise<UnionFieldValue> {
    if (!value.selectedKey) return value
    const field = this.fieldForKey(value.selectedKey)

    if (!field.onSave) return value

    return {
      selectedKey: value.selectedKey,
      values: {[value.selectedKey]: await field.onSave(value.values[value.selectedKey], worker)}
    }
  }

  public async onDelete(value: UnionFieldValue, worker: WorkerContext): Promise<UnionFieldValue> {
    if (!value.selectedKey) return value
    const field = this.fieldForKey(value.selectedKey)

    if (!field.onDelete) return value
    return {
      selectedKey: value.selectedKey,
      values: {[value.selectedKey]: await field.onDelete(value.values[value.selectedKey], worker)}
    }
  }

  public static type = 'union'

  static unserialize(
    rawField: SerializedField,
    model: Model,
    unserializeField: UnserializeFieldFunction
  ) {
    if (model.type !== 'union') {
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
        ([key, label, field]) =>
          [key, label, unserializeField(field, model.fields[key])] as UnionFieldChildTuple
      )
    })
  }

  static inferFromModel(model: Model, label: string | undefined, inferField: InferFieldFunction) {
    if (model.type !== 'union') return null

    return new this({
      label,
      fields: Object.entries(model.fields).map(([key, model]) => {
        const label = convertKeyToLabel(key)
        return [key, label, inferField(model, label)] as UnionFieldChildTuple
      })
    })
  }
}
