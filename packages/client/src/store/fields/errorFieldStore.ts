import { FieldStore, FieldStoreOptions } from './fieldStore'
import { observable, computed } from 'mobx'
import { hashString } from '../../util/string'

export interface ErrorFieldStoreOptions extends FieldStoreOptions {
  message?: string
  value?: any
}

export class ErrorFieldStore implements FieldStore {
  @observable.ref public value: any

  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string
  public readonly message?: string

  public readonly valid = true

  constructor(opts: ErrorFieldStoreOptions) {
    this.value = opts.value
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
    this.message = opts.message
  }

  @computed public get hash() {
    return hashString(`error`)
  }

  public validate() {
    return this.valid
  }

  public async asJS() {
    return this.value
  }

  public fits() {
    return true
  }

  public fill(value: any) {
    this.value = value
  }

  public clone(opts?: FieldStoreOptions) {
    return new ErrorFieldStore(Object.assign({}, this, opts))
  }
}
