import {computed, observable, action} from 'mobx'
import {FieldStore, FieldStoreOptions} from './fieldStore'
import {hashString} from '../../util/string'

export type DateFormat = 'timestamp' | 'rfc3339'

export interface DateTimeFieldStoreOptions extends FieldStoreOptions {
  format?: DateFormat
  value?: Date
}

export class DateTimeFieldStore implements FieldStore {
  @observable.ref public value: Date | string
  @observable.ref public errors: string[] = []

  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  public readonly format: DateFormat

  constructor(opts: DateTimeFieldStoreOptions) {
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
    this.format = opts.format || 'rfc3339'
    this.value = opts.value || ''
  }

  @action
  public change(value: Date | string) {
    this.value = value
    this.validate()
  }

  @computed
  public get hash() {
    return hashString(`dateTime:${this.value.toString()}`)
  }

  public fits(data: any) {
    switch (this.format) {
      case 'rfc3339':
        return !isNaN(Date.parse(data))
      case 'timestamp':
        return typeof data === 'number'
    }
  }

  @action
  public fill(data: any) {
    if (typeof data === 'number') {
      this.value = new Date(data * 1000)
    } else {
      this.value = new Date(data as any)
    }
  }

  @computed
  public get valid() {
    return typeof this.value === 'object'
  }

  @action
  public validate() {
    if (this.valid) {
      this.errors = []
      return true
    } else {
      this.errors = ['Invalid date!']
      return false
    }
  }

  public async asJS() {
    if (typeof this.value === 'object') {
      switch (this.format) {
        case 'timestamp':
          return Math.round(this.value.getTime() / 1000)
        case 'rfc3339':
          return this.value.toISOString()
      }
    }

    return null
  }

  public clone(opts?: FieldStoreOptions) {
    return new DateTimeFieldStore(Object.assign({}, this, opts))
  }
}
