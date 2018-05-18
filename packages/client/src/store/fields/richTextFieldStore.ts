import { EditorState, convertToRaw, convertFromRaw, RawDraftContentState } from 'draft-js'
import { computed, observable, action } from 'mobx'
import { FieldStore, FieldStoreOptions, FieldStoreMap } from './fieldStore'
import { LinkType, Control } from '../../ui/common/richTextInput'
import { mapObject, ObjectMap } from '@karma.run/editor-common'
import { SelectFieldStore } from '../../store/fields/selectFieldStore'
import { reduceToMap } from '@karma.run/editor-common'
import { ErrorFieldStore } from '../../store/fields/errorFieldStore'
import { StyleGroup, BlockType, CustomElement } from '../../ui/common'
import { hashString } from '../../util/string'

export interface RichtTextFieldStoreOptions extends FieldStoreOptions {
  controls?: Set<Control>
  links?: LinkType[]
  styleGroups?: StyleGroup[]
  blocks?: BlockType[]
  elements?: CustomElement[]
  linkEntityType?: string
  value?: RichtTextFieldValue
  minLength?: number
  maxLength?: number
}

export type RichtTextFieldValue = EditorState

export class RichtTextFieldStore implements FieldStore {
  @observable.ref public value: RichtTextFieldValue

  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  public readonly controls?: Set<Control>
  public readonly links?: LinkType[]
  public readonly styleGroups?: StyleGroup[]
  public readonly blocks?: BlockType[]
  public readonly elements?: CustomElement[]
  public readonly linkEntityType: string

  public readonly linkStore: SelectFieldStore

  public readonly entityStores: FieldStoreMap
  public readonly blockStores: FieldStoreMap

  public readonly minLength?: number
  public readonly maxLength?: number

  constructor(
    entityStores: FieldStoreMap,
    blockStores: FieldStoreMap,
    opts: RichtTextFieldStoreOptions
  ) {
    let storeMap: ObjectMap<FieldStore> = {}

    if (opts.links) {
      storeMap = reduceToMap(opts.links, link => {
        let store = entityStores[link.dataKey]

        if (store) {
          store = store.clone({
            label: link.label
          })
        } else {
          store = new ErrorFieldStore({
            message: `No entity data with key: ${link.dataKey}`
          })
        }

        return [link.dataKey, store]
      })
    }

    this.linkStore = new SelectFieldStore(storeMap, {})

    this.entityStores = entityStores
    this.blockStores = blockStores

    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon

    this.controls = opts.controls
    this.links = opts.links
    this.styleGroups = opts.styleGroups
    this.blocks = opts.blocks
    this.elements = opts.elements
    this.linkEntityType = opts.linkEntityType || 'LINK'

    this.minLength = 5
    this.maxLength = opts.maxLength

    this.value = opts.value || EditorState.createEmpty()
  }

  @computed public get hash() {
    return hashString(`richText:${this.value.getCurrentContent().hashCode()}`)
  }

  @action public change(value: EditorState) {
    this.value = value
    this.validate()
  }

  public async asJS(): Promise<RawDraftContentState> {
    return convertToRaw(this.value.getCurrentContent())
  }

  @computed public get valid() {
    return this.errors.length === 0
  }

  @action public validate() {
    const plainText = this.value.getCurrentContent().getPlainText()

    if (this.maxLength != undefined && plainText.length > this.maxLength) return false
    if (this.minLength != undefined && plainText.length < this.minLength) return false

    return true
  }

  @computed public get errors() {
    const plainText = this.value.getCurrentContent().getPlainText()
    const errors: string[] = []

    if (this.maxLength != undefined && plainText.length > this.maxLength) {
      errors.push(`Text should not be larger than ${this.maxLength} characters.`)
    }

    if (this.minLength != undefined && plainText.length < this.minLength) {
      errors.push(`Text has to be atleast ${this.minLength} characters.`)
    }

    return errors
  }

  public fits(data: any) {
    // TODO: Check structure
    return typeof data === 'object'
  }

  @action public fill(data: any) {
    this.value = EditorState.createWithContent(convertFromRaw(data))
  }

  public clone(opts?: FieldStoreOptions) {
    return new RichtTextFieldStore(
      mapObject(this.entityStores, store => store.clone()),
      mapObject(this.blockStores, store => store.clone()),
      Object.assign({}, this, opts)
    )
  }
}
