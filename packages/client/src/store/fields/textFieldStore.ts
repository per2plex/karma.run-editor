import { computed, observable, action } from 'mobx'
import { FieldStore, FieldStoreOptions } from './fieldStore'
import { hashString } from '../../util/string'

export interface TextFieldStoreOptions extends FieldStoreOptions {
  multiline?: boolean
  minLength?: number
  maxLength?: number
  value?: string
}

export class TextFieldStore implements FieldStore {
  @observable.ref public value: string

  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  public readonly multiline: boolean
  public readonly minLength?: number
  public readonly maxLength?: number

  constructor(opts: TextFieldStoreOptions) {
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
    this.multiline = opts.multiline || false
    this.minLength = opts.minLength
    this.maxLength = opts.maxLength
    this.value = opts.value || ''
  }

  @computed public get hash() {
    return hashString(`text:${this.value}`)
  }

  @action public change(value: string) {
    this.value = value
    this.validate()
  }

  public async asJS() {
    return this.value
  }

  @computed public get valid() {
    return true
  }

  @action public validate() {
    return true
  }

  public fits(data: any) {
    return typeof data === 'string'
  }

  @action public fill(value: any) {
    this.value = value
  }

  public clone(opts?: FieldStoreOptions) {
    return new TextFieldStore(Object.assign({}, this, opts))
  }
}
