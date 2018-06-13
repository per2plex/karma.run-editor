import {observable, action, computed} from 'mobx'
import {mapObject, firstKey, firstKeyOptional} from '@karma.run/editor-common'
import {FieldStoreMap, FieldStore, FieldStoreOptions} from './fieldStore'
import {hashString} from '../../util/string'

export interface SelectFieldStoreOptions extends FieldStoreOptions {
  selectedKey?: string
}

export class SelectFieldStore implements FieldStore {
  @observable.ref public selectedKey: string | undefined

  public readonly fields: FieldStoreMap

  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  constructor(fields: FieldStoreMap, opts: SelectFieldStoreOptions) {
    this.fields = fields
    this.selectedKey = opts.selectedKey
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
  }

  public async asJS() {
    if (this.selectedKey) {
      return {[this.selectedKey]: await this.fields[this.selectedKey].asJS()}
    }

    return undefined
  }

  @computed
  public get hash() {
    return hashString(`select:${this.selectedField ? this.selectedField.hash : ''}`)
  }

  @action
  public change(key: string | undefined) {
    this.selectedKey = key
  }

  public fits(data: any) {
    if (data == undefined || typeof data !== 'object') {
      return false
    }

    const key = firstKeyOptional(data)
    if (key == undefined) return false

    const store = this.fields[key]
    if (store == undefined) return false

    return store.fits(data[key])
  }

  @action
  public fill(data: any) {
    const selectedKey = firstKey(data)
    const store = this.fields[selectedKey]

    store.fill(data[selectedKey])
    this.selectedKey = selectedKey
  }

  @computed
  public get selectedField() {
    if (this.selectedKey == undefined) return
    return this.fields[this.selectedKey]
  }

  @computed
  public get valid() {
    if (!this.selectedKey) return false
    return this.fields[this.selectedKey].valid
  }

  @action
  public validate() {
    if (!this.selectedKey) return false
    return this.fields[this.selectedKey].validate()
  }

  public async onSave(isNew: boolean) {
    if (this.selectedField && this.selectedField.onSave) await this.selectedField.onSave(isNew)
  }

  public async onDelete() {
    if (this.selectedField && this.selectedField.onDelete) await this.selectedField.onDelete()
  }

  public clone(opts?: FieldStoreOptions) {
    return new SelectFieldStore(
      mapObject(this.fields, store => store.clone()),
      Object.assign({}, this, opts, {
        selectedKey: this.selectedKey
      })
    )
  }
}
