import {observable, action, computed} from 'mobx'
import {FieldStore, FieldStoreOptions} from './fieldStore'
import {hashString} from '../../util/string'

export interface CheckboxFieldStoreOptions extends FieldStoreOptions {
  value?: boolean
}

export class CheckboxFieldStore implements FieldStore {
  @observable.ref public value: boolean

  public readonly defaultValue: boolean = false
  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  public readonly valid = true

  constructor(opts: CheckboxFieldStoreOptions) {
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
    this.value = opts.value || false
  }

  @action
  public change(value: boolean) {
    this.value = value
  }

  @computed
  public get hash() {
    return this.value ? hashString('checkbox:0') : hashString('checkbox:1')
  }

  public validate() {
    return this.valid
  }

  public async asJS() {
    return this.value
  }

  public fits(data: any) {
    return typeof data === 'boolean'
  }

  @action
  public fill(data: any) {
    this.value = data
  }

  public clone(opts?: FieldStoreOptions) {
    return new CheckboxFieldStore(Object.assign({}, this, opts))
  }
}
