import {computed, observable, action, runInAction} from 'mobx'
import {FieldStore, FieldStoreOptions} from './fieldStore'
import {applicationStore} from '../applicationStore'

import {
  uploadMedia,
  commitMedia,
  UploadResponse,
  Media,
  MediaType,
  unserializeMedia,
  serializeMedia,
  thumbnailURL,
  deleteMedia,
  copyMedia
} from '@karma.run/editor-media-client'

import {hashString} from '../../util/string'
import {Env} from '../../util/env'

export interface FileFieldStoreOptions extends FieldStoreOptions {
  allowedMediaTypes?: Set<MediaType>
  value?: Media
}

export class MediaFieldStore implements FieldStore {
  @observable.ref public value?: Media
  @observable.ref public uploadResponse?: UploadResponse

  @observable.ref public errors: string[] = []
  @observable.ref public uploadProgress?: number = undefined

  public readonly label?: string
  public readonly description?: string

  public readonly allowedMediaTypes?: Set<MediaType>

  constructor(opts: FileFieldStoreOptions) {
    this.value = opts.value
    this.label = opts.label
    this.description = opts.description
    this.allowedMediaTypes = opts.allowedMediaTypes
  }

  @computed
  public get hash() {
    const valueID = this.value ? this.value.id : ''
    const tempValueID = this.uploadResponse ? this.uploadResponse.id : ''

    return hashString(`file:${valueID}:${tempValueID}`)
  }

  @action
  private handleUploadProgress = (progress: number) => {
    this.uploadProgress = progress
  }

  @action
  public changeValue(value?: Media) {
    this.value = value
    this.validate()
  }

  @action
  public changeTempValue(value?: UploadResponse) {
    this.uploadResponse = value
    this.validate()
  }

  public fits(data: any) {
    if (!data.mediaType) return false
    return true
  }

  @action
  public fill(value: any) {
    this.value = unserializeMedia(value)
  }

  @action
  public async uploadFile(file: File) {
    this.uploadProgress = 0

    try {
      const result = await uploadMedia(
        Env.mediaAPIBasePath,
        file,
        this.handleUploadProgress,
        applicationStore.editorStore.session
      )

      return runInAction('upload', () => {
        this.uploadProgress = undefined
        this.changeTempValue(result)
      })
    } catch (err) {
      return runInAction('uploadError', () => {
        this.uploadProgress = undefined
        this.errors = ['Error while uploading media.']
      })
    }
  }

  @computed
  public get valid() {
    if (this.uploadResponse && this.allowedMediaTypes) {
      return this.allowedMediaTypes.has(this.uploadResponse.mediaType)
    }

    return (
      this.uploadProgress === undefined &&
      (this.value != undefined || this.uploadResponse != undefined)
    )
  }

  @computed
  public get thumbnailURL() {
    if (this.uploadResponse) {
      if (this.uploadResponse.mediaType !== MediaType.Image) return null
      return this.uploadResponse.url
    }

    if (this.value) {
      if (this.value.mediaType !== MediaType.Image && this.value.mediaType !== MediaType.Video) {
        return null
      }

      return thumbnailURL(Env.mediaAPIBasePath, this.value.id)
    }

    return null
  }

  @computed
  public get extension() {
    if (this.uploadResponse) {
      return this.uploadResponse.extension
    }

    if (this.value) {
      return this.value.extension
    }

    return null
  }

  @action
  public async onSave(isNew: boolean) {
    let media: Media | undefined = this.value

    if (this.uploadResponse) {
      const response = await commitMedia(
        Env.mediaAPIBasePath,
        this.uploadResponse.id,
        !isNew && this.value ? this.value.id : undefined,
        applicationStore.editorStore.session
      )

      media = {
        ...response,
        focusPoint: {x: 0.5, y: 0.5},
        focusScale: 1
      }
    } else if (isNew && this.value) {
      const response = await copyMedia(
        Env.mediaAPIBasePath,
        this.value.id,
        applicationStore.editorStore.session
      )

      media = {
        ...this.value,
        ...response,
        focusPoint: {x: 0.5, y: 0.5},
        focusScale: 1
      }
    }

    runInAction('onSave', () => {
      this.changeTempValue(undefined)
      this.changeValue(media)
    })
  }

  @action
  public async onDelete() {
    if (this.value) {
      await deleteMedia(Env.mediaAPIBasePath, this.value.id, applicationStore.editorStore.session)
    }
  }

  public validate() {
    return this.valid
  }

  public async asJS() {
    if (!this.value) return null
    return serializeMedia(this.value)
  }

  public clone(opts?: FieldStoreOptions) {
    return new MediaFieldStore(Object.assign({}, this, opts))
  }
}
