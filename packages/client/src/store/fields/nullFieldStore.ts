import { computed } from 'mobx'
import { FieldStore, FieldStoreOptions } from './fieldStore'
import { hashString } from '../../util/string'

export interface NullFieldStoreOptions extends FieldStoreOptions {}

export class NullFieldStore implements FieldStore {
  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  public readonly valid = true

  constructor(opts: NullFieldStoreOptions) {
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
  }

  @computed public get hash() {
    return hashString('null')
  }

  public fits(data: any) {
    return data == null
  }

  public fill(_value: any) {}

  public validate() {
    return this.valid
  }

  public async asJS() {
    return null
  }

  public clone(opts?: FieldStoreOptions) {
    return new NullFieldStore(Object.assign({}, this, opts))
  }
}
