import {action, computed} from 'mobx'
import {FieldStore, FieldStoreOptions} from './fieldStore'
import {hashString} from '../../util/string'

export interface FieldsetValueStoreOptions extends FieldStoreOptions {}

export class TupleFieldStore implements FieldStore {
  public readonly fields: FieldStore[]
  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  constructor(fields: FieldStore[], opts: FieldsetValueStoreOptions) {
    this.fields = fields
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
  }

  public async asJS() {
    const values = []

    for (const store of this.fields) {
      values.push(await store.asJS())
    }

    return values
  }

  public fits(data: any) {
    if (data == undefined || !Array.isArray(data)) {
      return false
    }

    return data.every((data, index) => {
      if (index >= this.fields.length) return false
      return this.fields[index].fits(data)
    })
  }

  @computed
  public get hash() {
    const fieldHashStr = this.fields.map(store => {
      return `:${store.hash}`
    })

    return hashString(`tuple${fieldHashStr}`)
  }

  @action
  public fill(value: any) {
    this.fields.forEach((store, index) => store.fill(value[index]))
  }

  @computed
  public get valid() {
    return Object.values(this.fields).reduce((prev, store) => {
      return prev && store.valid
    }, true)
  }

  @action
  public validate() {
    return Object.values(this.fields).reduce((prev, store) => {
      return prev && store.validate()
    }, true)
  }

  public async onSave(isNew: boolean) {
    for (const store of this.fields) {
      if (store.onSave) await store.onSave(isNew)
    }
  }

  public async onDelete() {
    for (const store of this.fields) {
      if (store.onDelete) await store.onDelete()
    }
  }

  public clone(opts?: FieldStoreOptions) {
    return new TupleFieldStore(
      this.fields.map(store => store.clone()),
      Object.assign({}, this, opts)
    )
  }
}
