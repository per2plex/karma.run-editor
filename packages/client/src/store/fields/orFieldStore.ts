import { observable, action, computed } from 'mobx'
import { FieldStore, FieldStoreOptions } from './fieldStore'
import { hashString } from '../../util/string'

export interface OrFieldStoreOptions extends FieldStoreOptions {
  selectedIndex?: number
}

export class OrFieldStore implements FieldStore {
  @observable.ref public selectedIndex: number | undefined

  public readonly fields: FieldStore[]

  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  constructor(fields: FieldStore[], opts: OrFieldStoreOptions) {
    this.fields = fields
    this.selectedIndex = opts.selectedIndex
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
  }

  public async asJS() {
    if (this.selectedIndex != undefined) {
      return await this.fields[this.selectedIndex].asJS()
    }

    return undefined
  }

  public fits(data: any) {
    return this.fields.some(field => field.fits(data))
  }

  @action public fill(data: any) {
    const index = this.fields.findIndex(field => field.fits(data))
    const field = this.fields[index]

    field.fill(data)

    this.selectedIndex = index
  }

  @computed public get hash() {
    return hashString(`optional:${this.selectedIndex || ''}`)
  }

  @action public change(key: number | undefined) {
    this.selectedIndex = key
  }

  @computed public get selectedField() {
    if (this.selectedIndex == undefined) return
    return this.fields[this.selectedIndex]
  }

  @computed public get valid() {
    if (this.selectedIndex == undefined) return false
    return this.fields[this.selectedIndex].valid
  }

  @action public validate() {
    if (this.selectedIndex == undefined) return false
    return this.fields[this.selectedIndex].validate()
  }

  public async onSave(isNew: boolean) {
    if (this.selectedField && this.selectedField.onSave) await this.selectedField.onSave(isNew)
  }

  public async onDelete() {
    if (this.selectedField && this.selectedField.onDelete) await this.selectedField.onDelete()
  }

  public clone(opts?: FieldStoreOptions) {
    return new OrFieldStore(
      this.fields.map(store => store.clone()),
      Object.assign({}, this, opts)
    )
  }
}
