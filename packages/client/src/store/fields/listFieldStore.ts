import * as shortid from 'shortid'

import { observable, action, computed, IObservableArray } from 'mobx'
import { FieldStore, FieldStoreOptions } from './fieldStore'
import { hashString } from '../../util/string'

export interface ListFieldStoreOptions extends FieldStoreOptions {
  values?: ListFieldValue[]
}

export interface ListFieldValue {
  id: string
  store: FieldStore
}

export class ListFieldStore implements FieldStore {
  public values: IObservableArray<ListFieldValue> = observable.shallowArray([])

  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  public readonly valid = true
  public readonly defaultStore: FieldStore

  constructor(defaultStore: FieldStore, opts: ListFieldStoreOptions) {
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
    this.defaultStore = defaultStore

    if (opts.values) this.values.push(...opts.values)
  }

  private createListValue(store: FieldStore): ListFieldValue {
    return {id: shortid.generate(), store}
  }

  private createDefaultListValue() {
    return this.createListValue(this.defaultStore.clone())
  }

  public fits(data: any) {
    if (data == undefined || !Array.isArray(data)) {
      return false
    }

    return data.every(data => {
      return this.defaultStore.fits(data)
    })
  }

  @action public fill(data: any[]) {
    const values = data.map(value => {
      const store = this.defaultStore.clone()
      store.fill(value)

      return this.createListValue(store)
    })

    this.values.clear()
    this.values.push(...values)
  }

  @computed public get hash() {
    const fieldHashStr = this.values.map(value => {
      return `:${value.store.hash}`
    })

    return hashString(`fieldset${fieldHashStr}`)
  }

  @action public insertValueAt(index: number) {
    if (index < 0 || index > this.values.length) throw new Error('Invalid Index!')
    this.values.splice(index, 0, this.createDefaultListValue())
  }

  @action public removeValueAt(index: number) {
    if (index < 0 || index >= this.values.length) throw new Error('Invalid Index!')
    this.values.splice(index, 1)
  }

  @action public moveValueToIndex(index: number, toIndex: number) {
    if (index < 0 || index >= this.values.length) throw new Error('Invalid Index!')
    if (toIndex < 0 || toIndex >= this.values.length) throw new Error('Invalid Index!')

    const value = this.values.splice(index, 1)
    this.values.splice(toIndex, 0, ...value)
  }

  public validate() {
    return this.valid
  }

  public async onSave(isNew: boolean) {
    for (const value of this.values) {
      if (value.store.onSave) await value.store.onSave(isNew)
    }
  }

  public async onDelete() {
    for (const value of this.values) {
      if (value.store.onDelete) await value.store.onDelete()
    }
  }

  public async asJS() {
    return Promise.all(this.values.map(async (value) => await value.store.asJS()))
  }

  public clone(opts?: FieldStoreOptions) {
    return new ListFieldStore(
      this.defaultStore,
      Object.assign({}, this, opts, {
        values: this.values.map(value => this.createListValue(value.store.clone()))
      })
    )
  }
}
