import * as React from 'react'
import {style} from 'typestyle'
import {observer} from 'mobx-react'

import {Spacing} from '../../ui/style'

import {
  InputStyle,
  Select,
  TextInput,
  NumberInput,
  Button,
  DateTimeInput,
  CheckboxInput,
  ButtonType
} from '../../ui/common'

import {
  FilterStore,
  FilterValueStore,
  DateFilterValueStore,
  StringFilterValueStore,
  NumberFilterValueStore,
  RefFilterValueStore,
  OptionsFilterValueStore,
  BooleanFilterValueStore
} from '../stores/filterStore'

import {marginLeftExceptFirst} from '../../util/style'
import {IconName} from '../../ui/common/icon'

export const enum RenderType {
  String = 'string',
  Number = 'number',
  DateRange = 'dateRange',
  Ref = 'ref'
}

export const FilterRowStyle = style({
  display: 'flex',
  alignItems: 'center',

  width: '100%',

  $nest: {
    '> .types': {
      width: '25%',
      marginRight: Spacing.medium
    },

    '> .condition': {
      width: '25%',
      marginRight: Spacing.medium
    },

    '> .value': {
      flexGrow: 1,
      marginRight: Spacing.medium
    },

    '> .actions': {
      display: 'flex',

      $nest: {
        [`> .${Button.Style}`]: marginLeftExceptFirst(Spacing.medium)
      }
    },

    [`> .${InputStyle}`]: {
      width: 'auto'
    }
  }
})

export namespace FilterRow {
  export interface Props {
    index: number
    store: FilterStore
    onAdd?: (index: number) => void
    onRemove?: (index: number) => void
    onEntryChoose: (model: string) => Promise<string | undefined>
  }
}

@observer
export class FilterRow extends React.Component<FilterRow.Props> {
  private handleFieldChange = (id: string | undefined) => {
    this.props.store.setFieldID(id)
  }

  private handleConditionChange = (id: string | undefined) => {
    this.props.store.setConditionID(id)
  }

  private handleAddClick = () => {
    this.props.onAdd!(this.props.index)
  }

  private handleRemoveClick = () => {
    this.props.onRemove!(this.props.index)
  }

  public render() {
    return (
      <div className={FilterRowStyle}>
        <div className="types">
          <Select
            options={this.props.store.availableFields}
            onChange={this.handleFieldChange}
            value={this.props.store.selectedFieldID}
            disableUnselectedOption
          />
        </div>
        <div className="condition">
          {this.props.store.selectedFieldID && (
            <Select
              options={this.props.store.availableConditions}
              onChange={this.handleConditionChange}
              value={this.props.store.selectedConditionID}
              disableUnselectedOption
            />
          )}
        </div>
        <div className="value">
          {this.props.store.selectedCondition && (
            <ConditionField
              store={this.props.store.valueStore!}
              onEntryChoose={this.props.onEntryChoose}
            />
          )}
        </div>
        <div className="actions">
          {this.props.onRemove && (
            <Button
              type={ButtonType.Icon}
              onTrigger={this.handleRemoveClick}
              icon={IconName.Remove}
            />
          )}
          {this.props.onAdd && (
            <Button type={ButtonType.Icon} onTrigger={this.handleAddClick} icon={IconName.Add} />
          )}
        </div>
      </div>
    )
  }
}

export namespace ConditionField {
  export interface Props {
    store: FilterValueStore
    onEntryChoose: (model: string) => Promise<string | undefined>
  }
}

@observer
export class ConditionField extends React.Component<ConditionField.Props> {
  public render() {
    if (this.props.store instanceof StringFilterValueStore) {
      return <StringConditionField store={this.props.store} />
    } else if (this.props.store instanceof NumberFilterValueStore) {
      return <NumberConditionField store={this.props.store} />
    } else if (this.props.store instanceof DateFilterValueStore) {
      return <DateConditionField store={this.props.store} />
    } else if (this.props.store instanceof RefFilterValueStore) {
      return <RefConditionField store={this.props.store} onEntryChoose={this.props.onEntryChoose} />
    } else if (this.props.store instanceof OptionsFilterValueStore) {
      return <OptionsConditionField store={this.props.store} />
    } else if (this.props.store instanceof BooleanFilterValueStore) {
      return <BooleanConditionField store={this.props.store} />
    }

    return null
  }
}

export namespace DateConditionField {
  export interface Props {
    store: DateFilterValueStore
  }
}

@observer
export class DateConditionField extends React.Component<DateConditionField.Props> {
  private handleChange = (value: Date | string) => {
    this.props.store.setRawValue(value)
  }

  public render() {
    return <DateTimeInput value={this.props.store.rawValue} onChange={this.handleChange} />
  }
}

export namespace StringConditionField {
  export interface Props {
    store: StringFilterValueStore
  }
}

@observer
export class StringConditionField extends React.Component<StringConditionField.Props> {
  private handleChange = (value: string) => {
    this.props.store.setValue(value)
  }

  public render() {
    return <TextInput value={this.props.store.value} onChange={this.handleChange} />
  }
}

export namespace NumberConditionField {
  export interface Props {
    store: NumberFilterValueStore
  }
}

@observer
export class NumberConditionField extends React.Component<NumberConditionField.Props> {
  private handleChange = (value: number) => {
    this.props.store.setValue(value)
  }

  public render() {
    return <NumberInput value={this.props.store.value} onChange={this.handleChange} />
  }
}

export const RefConditionFieldStyle = style({
  display: 'flex',

  $nest: {
    '> .content': {
      flexGrow: 1
    }
  }
})

export namespace RefConditionField {
  export interface Props {
    store: RefFilterValueStore
    onEntryChoose: (model: string) => Promise<string | undefined>
  }
}

@observer
export class RefConditionField extends React.Component<RefConditionField.Props> {
  private handleTrigger = async () => {
    this.props.store.setValue(await this.props.onEntryChoose(this.props.store.model))
  }

  public render() {
    return (
      <div className={RefConditionFieldStyle}>
        <div className="content">{this.props.store.value || 'No reference selected'}</div>
        <Button onTrigger={this.handleTrigger} label="Choose" />
      </div>
    )
  }
}

export namespace OptionsConditionField {
  export interface Props {
    store: OptionsFilterValueStore
  }
}

@observer
export class OptionsConditionField extends React.Component<OptionsConditionField.Props> {
  private handleChange = (value: string | undefined) => {
    this.props.store.setValue(value)
  }

  public render() {
    return (
      <Select
        value={this.props.store.value}
        onChange={this.handleChange}
        options={this.props.store.options}
      />
    )
  }
}

export namespace BooleanConditionField {
  export interface Props {
    store: BooleanFilterValueStore
  }
}

@observer
export class BooleanConditionField extends React.Component<BooleanConditionField.Props> {
  private handleChange = (value: boolean) => {
    this.props.store.setValue(value)
  }

  public render() {
    return <CheckboxInput value={this.props.store.value} onChange={this.handleChange} />
  }
}
