import { observable, action, computed } from 'mobx'
import { FieldStore, FieldStoreOptions } from './fieldStore'
import { hashString } from '../../util/string'

export interface FloatFieldStoreOptions extends FieldStoreOptions {
  value?: number
}

export class FloatFieldStore implements FieldStore {
  @observable.ref public value: number

  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  public readonly valid = true

  constructor(opts: FloatFieldStoreOptions) {
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
    this.value = opts.value || 0
  }

  @computed public get hash() {
    return hashString(`float:${this.value}`)
  }

  @action public change(value: number) {
    this.value = value
  }

  public fits(data: any) {
    return typeof data === 'number'
  }

  @action public fill(value: any) {
    this.value = value
  }

  public validate() {
    return this.valid
  }

  public async asJS() {
    return this.value
  }

  public clone(opts?: FieldStoreOptions) {
    return new FloatFieldStore(Object.assign({}, this, opts))
  }
}
