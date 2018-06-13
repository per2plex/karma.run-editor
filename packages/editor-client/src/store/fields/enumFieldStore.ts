import {observable, action, computed} from 'mobx'
import {FieldStore, FieldStoreOptions} from './fieldStore'
import {Select} from '../../ui/common/select'
import {hashString} from '../../util/string'

export interface EnumFieldStoreOptions extends FieldStoreOptions {
  values?: Select.Option[]
  value?: string
}

export class EnumFieldStore implements FieldStore {
  @observable.ref public value?: string

  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  public readonly values: Select.Option[]
  public readonly valid = true

  constructor(opts: EnumFieldStoreOptions) {
    this.value = opts.value || (opts.values && opts.values[0] && opts.values[0].key)
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
    this.values = opts.values || []
  }

  @action
  public change(value: string | undefined) {
    this.value = value
  }

  @computed
  public get hash() {
    return hashString(`enum:${this.value}`)
  }

  public fits(data: any) {
    return typeof data === 'string'
  }

  @action
  public fill(data: any) {
    this.value = data
  }

  public validate() {
    return this.valid
  }

  public async asJS() {
    return this.value
  }

  public clone(opts?: FieldStoreOptions) {
    return new EnumFieldStore(Object.assign({}, this, opts))
  }
}
