import {action, computed} from 'mobx'
import {FieldStore, FieldStoreOptions, FieldStoreMap} from './fieldStore'

export interface RecursionFieldStoreOptions extends FieldStoreOptions {
  recursionLabel: string
  store?: FieldStore
}

export class RecursionFieldStore implements FieldStore {
  public store?: FieldStore

  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  public readonly recursions: FieldStoreMap[]
  public readonly recursionLabel: string

  constructor(recursions: FieldStoreMap[], opts: RecursionFieldStoreOptions) {
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon

    this.recursions = recursions
    this.recursionLabel = opts.recursionLabel
    this.store = opts.store
  }

  public get recursionStore(): FieldStore | undefined {
    const recursionMap = this.recursions.reduce(
      (prev, recursionMap) => {
        return {...prev, ...recursionMap}
      },
      {} as FieldStoreMap
    )

    return recursionMap[this.recursionLabel]
  }

  @computed
  public get hash() {
    this.createStore()
    return this.store ? this.store.hash : 0
  }

  public createStore() {
    if (this.store || !this.recursionStore) return

    this.store = this.recursionStore.clone({
      label: this.label,
      description: this.description,
      icon: this.icon
    })
  }

  public fits(data: any) {
    return this.recursionStore ? this.recursionStore.fits(data) : false
  }

  @action
  public fill(value: any) {
    this.createStore()
    if (this.store) this.store.fill(value)
  }

  public get valid() {
    return this.store ? this.store.valid : false
  }

  public validate() {
    return this.store ? this.store.validate() : false
  }

  public async asJS() {
    return this.store && (await this.store.asJS())
  }

  public clone(opts?: FieldStoreOptions) {
    return new RecursionFieldStore(
      this.recursions,
      Object.assign({}, this, {store: this.store && this.store.clone()}, opts)
    )
  }
}
