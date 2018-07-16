import React from 'react'
import shortid from 'shortid'
import {style} from 'typestyle'
import {expression as e, data as d} from '@karma.run/sdk'

import {
  EditComponentRenderProps,
  Field,
  EditRenderProps,
  SerializedField,
  UnserializeFieldFunction,
  InferFieldFunction
} from './interface'

import {reduceToMap} from '../util/array'
import {KeyPath, Model} from '../api/model'
import {ErrorField} from './error'
import {FieldWrapper, FieldComponent, FieldLabel, FieldInset} from '../ui/field'
import {EditableTabList} from '../ui/tabList'

import {
  SortConfiguration,
  FilterConfiguration,
  ValuePath,
  ValuePathSegmentType
} from '../interface/filter'

import {WorkerContext} from '../context/worker'

export interface MapFieldEditComponentState {
  activeTabIndex: number
}

export class MapFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<MapField, MapFieldValue>,
  MapFieldEditComponentState
> {
  public state: MapFieldEditComponentState = {activeTabIndex: 0}

  private tabListRef = React.createRef<EditableTabList>()
  private focusTabAtIndex?: number

  private handleValueChange = (value: any, index: number) => {
    if (index == undefined) {
      throw new Error('Child field did not call onValueChange with changeKey!')
    }

    this.props.onValueChange(
      Object.assign([...this.props.value], {[index]: {...this.props.value[index], value}}),
      this.props.changeKey
    )
  }

  public changeKeyAt(index: number, key: string) {
    if (index < 0 || index > this.props.value.length) throw new Error('Invalid Index!')

    this.props.onValueChange(
      Object.assign([...this.props.value], {[index]: {...this.props.value[index], key}}),
      this.props.changeKey
    )
  }

  public insertValueAt(index: number, key: string) {
    if (index < 0 || index > this.props.value.length) throw new Error('Invalid Index!')

    const newValue = [...this.props.value]

    newValue.splice(index, 0, {
      id: shortid.generate(),
      key: key,
      value: this.props.field.field.defaultValue
    })

    this.focusTabAtIndex = index
    this.setState({activeTabIndex: index})
    this.props.onValueChange(newValue, this.props.changeKey)
  }

  public removeValueAt(index: number) {
    if (index < 0 || index >= this.props.value.length) throw new Error('Invalid Index!')
    const newValue = [...this.props.value]
    newValue.splice(index, 1)

    this.props.onValueChange(newValue, this.props.changeKey)
  }

  public componentDidUpdate() {
    if (this.focusTabAtIndex != undefined) {
      this.tabListRef.current!.focusIndex(this.focusTabAtIndex)
      this.focusTabAtIndex = undefined
    }
  }

  private handleChangeActiveTab = (index: number) => {
    this.setState({activeTabIndex: index})
  }

  private handleKeyChangeAt = (index: number, key: string) => {
    this.changeKeyAt(index, key)
  }

  private handleInsertFieldAt = (index: number, key: string) => {
    this.insertValueAt(index, key)
  }

  private handleRemoveFieldAt = (index: number) => {
    this.removeValueAt(index)
  }

  public render() {
    const value = this.props.value

    return (
      <FieldWrapper depth={this.props.depth} index={this.props.index}>
        <FieldComponent
          className={MapFieldRendererStyle}
          depth={this.props.depth}
          index={this.props.index}>
          {!this.props.isWrapped && (
            <FieldLabel
              label={this.props.label}
              description={this.props.description}
              depth={this.props.depth}
              index={this.props.index}
            />
          )}
          <EditableTabList
            ref={this.tabListRef}
            values={value}
            activeTab={this.state.activeTabIndex}
            onChangeActiveTab={this.handleChangeActiveTab}
            onChangeAt={this.handleKeyChangeAt}
            onInsertAt={this.handleInsertFieldAt}
            onRemoveAt={this.handleRemoveFieldAt}
            options={this.props.field.restrictedToKeys}
          />
        </FieldComponent>
        {this.state.activeTabIndex < value.length && (
          <FieldInset>
            {this.props.field.field.renderEditComponent({
              index: 0,
              depth: this.props.depth + 1,
              isWrapped: true,
              disabled: this.props.disabled,
              value: value[this.state.activeTabIndex].value,
              onValueChange: this.handleValueChange,
              onEditRecord: this.props.onEditRecord,
              onSelectRecord: this.props.onSelectRecord,
              changeKey: this.state.activeTabIndex
            })}
          </FieldInset>
        )}
      </FieldWrapper>
    )
  }
}

export const MapFieldRendererStyle = style({
  paddingBottom: 0
})

export interface MapFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly field: Field
  readonly restrictedToKeys?: string[]
}

export type MapFieldValue = {id: string; key: string; value: any}[]

export class MapField implements Field<MapFieldValue> {
  public readonly label?: string
  public readonly description?: string
  public readonly restrictedToKeys?: string[]

  public readonly defaultValue: MapFieldValue = []
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public readonly field: Field

  public constructor(opts: MapFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.restrictedToKeys = opts.restrictedToKeys
    this.field = opts.field
  }

  public initialize(recursions: ReadonlyMap<string, Field>) {
    this.field.initialize(recursions)
    return this
  }

  public renderListComponent() {
    return ''
  }

  public renderEditComponent(props: EditRenderProps) {
    return (
      <MapFieldEditComponent
        label={this.label}
        description={this.description}
        field={this}
        {...props}
      />
    )
  }

  public transformRawValue(value: any): MapFieldValue {
    return Object.entries(value).map(([key, value]) => ({
      id: shortid.generate(),
      key,
      value: this.field.transformRawValue(value)
    }))
  }

  public transformValueToExpression(value: MapFieldValue) {
    return e.data(
      d.map(
        reduceToMap(value, ({key, value}) => [
          key,
          d.expr(this.field.transformValueToExpression(value))
        ])
      )
    )
  }

  public isValidValue() {
    return null
  }

  public serialize() {
    return {
      type: MapField.type,
      label: this.label || null,
      description: this.description || null,
      field: this.field.serialize()
    }
  }

  public traverse(keyPath: KeyPath) {
    if (keyPath.length === 0) return this
    return undefined
  }

  public valuePathForKeyPath(keyPath: KeyPath): ValuePath {
    return [{type: ValuePathSegmentType.Map}, ...this.field.valuePathForKeyPath(keyPath.slice(1))]
  }

  public async onSave(value: MapFieldValue, worker: WorkerContext): Promise<MapFieldValue> {
    if (!this.field.onSave) return value
    let newValue = []

    for (const {id, key, value: mapValue} of value) {
      newValue.push({id, key, value: await this.field.onSave(mapValue, worker)})
    }

    return newValue
  }

  public async onDelete(value: MapFieldValue, worker: WorkerContext): Promise<MapFieldValue> {
    if (!this.field.onDelete) return value
    let newValue = []

    for (const {id, key, value: mapValue} of value) {
      newValue.push({id, key: key, value: await this.field.onDelete(mapValue, worker)})
    }

    return newValue
  }

  public static type = 'map'

  static unserialize(
    rawField: SerializedField,
    model: Model,
    unserializeField: UnserializeFieldFunction
  ) {
    if (model.type !== 'map') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new this({
      label: rawField.label,
      description: rawField.description,
      field: unserializeField(rawField.field, model.model)
    })
  }

  static inferFromModel(model: Model, label: string | undefined, inferField: InferFieldFunction) {
    if (model.type !== 'map') return null
    return new this({label, field: inferField(model.model)})
  }
}
