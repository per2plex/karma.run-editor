import * as shortid from 'shortid'
import {observable, action, computed, IObservableArray} from 'mobx'
import {FieldStore, FieldStoreOptions} from './fieldStore'
import {hashString} from '../../util/string'

export interface MapFieldStoreOptions extends FieldStoreOptions {
  restrictedToKeys?: string[]
  values?: MapFieldValue[]
}

export class MapFieldValue {
  @observable.ref public key: string

  public readonly id: string
  public readonly store: FieldStore

  constructor(key: string, store: FieldStore) {
    this.id = shortid.generate()
    this.key = key
    this.store = store
  }
}

export class MapFieldStore implements FieldStore {
  public values: IObservableArray<MapFieldValue> = observable.shallowArray()

  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  public readonly defaultStore: FieldStore
  public readonly restrictedToKeys?: ReadonlyArray<string>

  constructor(defaultStore: FieldStore, opts: MapFieldStoreOptions) {
    if (opts.values) this.values.push(...opts.values)

    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon

    this.restrictedToKeys = opts.restrictedToKeys
    this.defaultStore = defaultStore
  }

  public createMissingRestrictedKeys() {
    if (this.restrictedToKeys) {
      this.restrictedToKeys.forEach(key => {
        const value = this.values.find(value => value.key === key)
        if (!value) this.values.push(this.createDefaultListValue(key))
      })
    }
  }

  private createListValue(key: string, store: FieldStore) {
    return new MapFieldValue(key, store)
  }

  private createDefaultListValue(key: string = '') {
    return this.createListValue(key, this.defaultStore.clone())
  }

  public fits(data: any) {
    if (data == undefined || typeof data !== 'object') {
      return false
    }

    return Object.values(data).every(data => {
      return this.defaultStore.fits(data)
    })
  }

  public get isRestrictedToKeys() {
    return this.restrictedToKeys != undefined
  }

  public get availableKeys(): string[] {
    if (this.restrictedToKeys) {
      return this.restrictedToKeys.filter(key => {
        return this.values.find(value => value.key === key) == undefined
      })
    }

    return []
  }

  @computed
  public get hash() {
    const fieldHashStr = this.values.map(value => {
      return `:${value.key}:${value.store.hash}`
    })

    return hashString(`map${fieldHashStr}`)
  }

  @action
  public fill(data: any) {
    let values = Object.entries(data).map(([key, value]) => {
      const store = this.defaultStore.clone()
      store.fill(value)
      return this.createListValue(key, store)
    })

    if (this.restrictedToKeys) {
      const filteredValues = values.filter(tabValue => {
        return this.restrictedToKeys!.includes(tabValue.key)
      })

      values = this.restrictedToKeys.reduce(
        (sortedValues, key) => {
          const value = filteredValues.find(value => value.key === key)

          if (value) sortedValues.push(value)

          return sortedValues
        },
        [] as MapFieldValue[]
      )
    }

    this.values.clear()
    this.values.push(...values)
  }

  @action
  public changeKeyAt(index: number, key: string) {
    if (index < 0 || index > this.values.length) throw new Error('Invalid Index!')
    this.values[index].key = key
  }

  @action
  public insertValueAt(index: number, value: string) {
    if (index < 0 || index > this.values.length) throw new Error('Invalid Index!')
    this.values.splice(index, 0, this.createDefaultListValue(value))
  }

  @action
  public removeValueAt(index: number) {
    if (index < 0 || index >= this.values.length) throw new Error('Invalid Index!')
    this.values.splice(index, 1)
  }

  @action
  public moveValueToIndex(index: number, toIndex: number) {
    if (index < 0 || index >= this.values.length) throw new Error('Invalid Index!')
    if (toIndex < 0 || toIndex >= this.values.length) throw new Error('Invalid Index!')

    const value = this.values.splice(index, 1)
    this.values.splice(toIndex, 0, ...value)
  }

  @action
  public validate() {
    return this.valid
  }

  @computed
  public get valid() {
    const keySet = new Set<string>()

    for (const value of this.values) {
      if (keySet.has(value.key)) return false
      keySet.add(value.key)
    }

    return true
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
    const entries = await Promise.all(
      this.values.map(async value => {
        return {key: value.key, value: await value.store.asJS()}
      })
    )

    return entries.reduce(
      (prev, value) => {
        prev[value.key] = value.value
        return prev
      },
      {} as any
    )
  }

  public clone(opts?: FieldStoreOptions) {
    return new MapFieldStore(
      this.defaultStore,
      Object.assign({}, this, opts, {
        restrictedToKeys: this.restrictedToKeys && Array.from(this.restrictedToKeys),
        values: this.values.map(value => this.createListValue(value.key, value.store.clone()))
      })
    )
  }
}
