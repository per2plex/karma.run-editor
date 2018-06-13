import {computed, observable, action} from 'mobx'
import {FieldStore, FieldStoreOptions} from './fieldStore'
import {hashString} from '../../util/string'

export interface RefFieldStoreOptions extends FieldStoreOptions {
  model: string
  disableEditing?: boolean
  id?: string
}

export class RefFieldStore implements FieldStore {
  @observable.ref public id: string | undefined
  @observable.ref public errors: string[] = []

  public readonly model: string
  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string
  public readonly disableEditing: boolean

  constructor(opts: RefFieldStoreOptions) {
    this.model = opts.model
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
    this.disableEditing = opts.disableEditing || false
    this.id = opts.id
  }

  @computed
  public get hash() {
    return hashString(`ref:${this.id || ''}`)
  }

  @action
  public change(value: string) {
    this.id = value
    this.validate()
  }

  public async asJS() {
    return this.id
  }

  @computed
  public get valid() {
    return this.id != undefined
  }

  @action
  public validate() {
    if (this.valid) {
      this.errors = []
      return true
    } else {
      this.errors = ['No ref selected!']
      return false
    }
  }

  public fits(data: any) {
    return typeof data === 'string'
  }

  @action
  public fill(value: any) {
    this.id = value
  }

  public clone(opts?: FieldStoreOptions) {
    return new RefFieldStore(Object.assign({}, this, opts))
  }
}
