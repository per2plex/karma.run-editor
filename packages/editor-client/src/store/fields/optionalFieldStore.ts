import {computed, observable, action} from 'mobx'
import {FieldStore, FieldStoreOptions} from './fieldStore'
import {hashString} from '../../util/string'

export interface OptionalFieldStoreOptions extends FieldStoreOptions {
  isPresent?: boolean
}

export class OptionalFieldStore implements FieldStore {
  @observable.ref public isPresent: boolean

  public readonly store: FieldStore

  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  constructor(store: FieldStore, opts: OptionalFieldStoreOptions) {
    this.store = store
    this.isPresent = opts.isPresent || false
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
  }

  @computed
  public get hash() {
    return hashString(`optional:${this.isPresent ? this.store.hash : ''}`)
  }

  @action
  public change(value: boolean) {
    this.isPresent = value
  }

  public fits(data: any) {
    return data == undefined || this.store.fits(data)
  }

  @action
  public fill(data: any) {
    if (data != undefined) {
      this.isPresent = true
      this.store.fill(data)
    } else {
      this.isPresent = false
    }
  }

  public async asJS() {
    return this.isPresent ? await this.store.asJS() : undefined
  }

  @computed
  public get valid() {
    return this.isPresent ? this.store.valid : true
  }

  @action
  public validate() {
    return this.isPresent ? this.store.validate() : true
  }

  public async onSave(isNew: boolean) {
    if (this.isPresent && this.store.onSave) await this.store.onSave(isNew)
  }

  public async onDelete() {
    if (this.isPresent && this.store.onDelete) await this.store.onDelete()
  }

  public clone(opts?: FieldStoreOptions) {
    return new OptionalFieldStore(this.store.clone(), Object.assign({}, this, opts))
  }
}
