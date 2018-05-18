import * as shortid from 'shortid'

import { Filter, ConditionType, isTypeValueCompatible, ValueFilter } from '@karma.run/editor-common'
import { observable, computed, action } from 'mobx'
import { Select } from '../../ui/common'
import { labelForCondition, FilterFieldGroup, ConditionConfiguration, FilterField } from '../../filter/configuration'

export type FilterValueStore = StringFilterValueStore
  | NumberFilterValueStore
  | DateFilterValueStore
  | RefFilterValueStore
  | OptionsFilterValueStore
  | BooleanFilterValueStore

export class StringFilterValueStore {
  @observable.ref
  public value: string

  constructor() {
    this.value = ''
  }

  @action
  public setValue(value: string) {
    this.value = value
  }
}

export class NumberFilterValueStore {
  @observable.ref
  public value: number

  constructor() {
    this.value = 0
  }

  @action
  public setValue(value: number) {
    this.value = value
  }
}

export class DateFilterValueStore {
  @observable.ref
  public rawValue: Date | string

  constructor() {
    this.rawValue = ''
  }

  @computed
  public get value() {
    return this.rawValue instanceof Date ? this.rawValue : undefined
  }

  @action
  public setRawValue(rawValue: Date | string) {
    this.rawValue = rawValue
  }
}

export class RefFilterValueStore {
  @observable.ref
  public value: string | undefined
  public model: string

  constructor(model: string) {
    this.model = model
    this.value = undefined
  }

  @action
  public setValue(value: string | undefined) {
    this.value = value
  }
}

export class OptionsFilterValueStore {
  @observable.ref
  public value: string | undefined
  public options: Select.Option[]

  constructor(options: Select.Option[]) {
    this.options = options
    this.value = undefined
  }

  @action
  public setValue(value: string | undefined) {
    this.value = value
  }
}

export class BooleanFilterValueStore {
  @observable.ref
  public value: boolean = false

  @action
  public setValue(value: boolean) {
    this.value = value
  }
}

function createValueStoreForCondition(condition: ConditionConfiguration) {
  switch (condition.type) {
    case ConditionType.StringEqual:
    case ConditionType.StringIncludes:
    case ConditionType.StringRegExp:
    case ConditionType.StringStartsWith:
    case ConditionType.StringEndsWith:
      return new StringFilterValueStore()

    case ConditionType.DateEqual:
    case ConditionType.DateMin:
    case ConditionType.DateMax:
      return new DateFilterValueStore()

    case ConditionType.NumberEqual:
    case ConditionType.NumberMin:
    case ConditionType.NumberMax:
    case ConditionType.ListLengthEqual:
    case ConditionType.ListLengthMin:
    case ConditionType.ListLengthMax:
      return new NumberFilterValueStore()

    case ConditionType.RefEqual:
      return new RefFilterValueStore(condition.model)

    case ConditionType.UnionKeyEqual:
    case ConditionType.EnumEqual:
      return new OptionsFilterValueStore(condition.options)

    case ConditionType.OptionalIsPresent:
      return new BooleanFilterValueStore()
  }

  return undefined
}

export class FilterStore {
  @observable.ref
  public selectedFieldID: string | undefined

  @observable.ref
  public selectedConditionID: string | undefined

  @observable.ref
  public valueStore: FilterValueStore | undefined

  public id: string
  private filterConfigurations: FilterFieldGroup[]

  constructor(filterConfigurations: FilterFieldGroup[]) {
    this.id = shortid.generate()
    this.filterConfigurations = filterConfigurations
  }

  @computed
  public get availableFields(): Select.Option[] {
    return this.filterConfigurations.map(group => ({
      key: group.id,
      label: group.label,
      options: group.fields.map(field => ({
        key: field.id,
        label: field.label,
        depth: field.depth,
        disabled: field.conditionGroups.length === 0
      }))
    }))
  }

  public fieldForID(id: string): FilterField | undefined {
    for (const group of this.filterConfigurations) {
      const field = group.fields.find(field => field.id === id)
      if (field) return field
    }

    return undefined
  }

  public conditionForID(id: string): ConditionConfiguration | undefined {
    if (!this.selectedField) return undefined

    for (const group of this.selectedField.conditionGroups) {
      const condition = group.conditions.find(condition => condition.id === id)
      if (condition) return condition
    }

    return undefined
  }

  @computed
  public get selectedField() {
    if (!this.selectedFieldID) return undefined
    return this.fieldForID(this.selectedFieldID)
  }

  @computed
  public get selectedCondition(): ConditionConfiguration | undefined {
    if (!this.selectedConditionID) return undefined
    return this.conditionForID(this.selectedConditionID)
  }

  @computed
  public get availableConditions(): Select.Option[] {
    if (this.selectedField) {
      return this.selectedField.conditionGroups.map((conditionGroup) => {
        return {
          key: conditionGroup.id,
          label: conditionGroup.label,
          options: conditionGroup.conditions.map(condition => ({
            key: condition.id,
            label: labelForCondition(condition.type)
          }))
        }
      })
    }

    return []
  }

  @computed
  public get filter(): Filter | undefined {
    // TODO: Move to FilterValueStores
    if (this.selectedField && this.selectedCondition && this.valueStore!.value != undefined) {
      return ValueFilter({
        type: this.selectedCondition.type as any,
        path: this.selectedCondition.path,
        value: this.valueStore!.value as any
      })
    }

    return undefined
  }

  @action
  public setFieldID(id: string | undefined) {
    this.selectedFieldID = id
    this.selectedConditionID = undefined
  }

  @action
  public setConditionID(id: string | undefined) {
    const oldCondition = this.selectedCondition

    this.selectedConditionID = id

    if (this.selectedCondition) {
      if (oldCondition == undefined || !isTypeValueCompatible(oldCondition.type, this.selectedCondition.type)) {
        this.valueStore = createValueStoreForCondition(this.selectedCondition)
      }
    } else {
      this.valueStore = undefined
    }
  }
}
