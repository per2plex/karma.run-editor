import { action, computed } from 'mobx'
import { mapObject, mapObjectAsync } from '@karma.run/editor-common'
import { FieldStoreMap, FieldStore, FieldStoreOptions } from './fieldStore'
import { hashString } from '../../util/string'

export type Layout = 'linear' | 'tab'

export interface FieldsetValueStoreOptions extends FieldStoreOptions {
  layout?: Layout
}

export class FieldsetStore implements FieldStore {
  public readonly fields: FieldStoreMap
  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string
  public readonly layout: Layout

  constructor(fields: FieldStoreMap, opts: FieldsetValueStoreOptions) {
    this.fields = fields
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
    this.layout = opts.layout || 'linear'
  }

  @computed public get hash() {
    const fieldHashStr = Object.entries(this.fields).map(([key, field]) => {
      return `:${key}:${field.hash}`
    })

    return hashString(`fieldset${fieldHashStr}`)
  }

  public async asJS() {
    return mapObjectAsync(this.fields, async (store) => {
      return await store.asJS()
    })
  }

  public fits(data: any) {
    if (data == undefined || typeof data !== 'object') {
      return false
    }

    return Object.entries(this.fields).every(([key, field]) => {
      const fieldData = data[key]
      return field.fits(fieldData)
    }) && Object.keys(data).every(key => {
      return this.fields[key] != undefined
    })
  }

  @action public fill(data: any) {
    Object.entries(this.fields).forEach(([key, store]) => store.fill((data as any)[key]))
  }

  @computed public get valid() {
    return Object.values(this.fields).reduce((prev, store) => {
      return prev && store.valid
    }, true)
  }

  @action public validate() {
    return Object.values(this.fields).reduce((prev, store) => {
      return prev && store.validate()
    }, true)
  }

  public async onSave(isNew: boolean) {
    const stores = Object.values(this.fields)

    for (const store of stores) {
      if (store.onSave) await store.onSave(isNew)
    }
  }

  public async onDelete() {
    const stores = Object.values(this.fields)

    for (const store of stores) {
      if (store.onDelete) await store.onDelete()
    }
  }

  public clone(opts?: FieldStoreOptions) {
    return new FieldsetStore(
      mapObject(this.fields, store => store.clone()),
      Object.assign({}, this, opts)
    )
  }
}
