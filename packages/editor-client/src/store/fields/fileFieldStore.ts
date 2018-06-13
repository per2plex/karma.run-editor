import {computed, observable, action, runInAction} from 'mobx'
import {FieldStore, FieldStoreOptions} from './fieldStore'
import {firstKey} from '@karma.run/editor-common'

import {
  uploadMedia,
  getThumbnailURL,
  commitMedia,
  KarmaMediaCommitResponse,
  copyMedia,
  deleteMedia
} from '../../api/karmaMedia'

import {hashString} from '../../util/string'

export interface ImageFrame {
  start: number
  end: number
}

export interface CommonFileValue {
  id: string
  version: number
  bytes: number
  format: string
  originalFilename: string
  url: string
}

export interface ImageFileValue extends CommonFileValue {
  type: 'image'
  width: number
  height: number
}

export interface RawFileValue extends CommonFileValue {
  type: 'raw'
}

export interface VideoFileValue extends CommonFileValue {
  type: 'video'
  width: number
  height: number
}

export type FileValue = RawFileValue | ImageFileValue | VideoFileValue
export interface TempFileValue {
  tempID: string
  type: 'image' | 'video' | 'raw'
  url: string
  originalFilename: string
}

export interface KarmaMediaFileHost {
  type: 'karmaMedia'
  name: string
  apiKey: string
  folder?: string
  thumbnailTransformName?: string
}

export interface JSFileValue extends CommonFileValue {
  type: {
    image?: {
      width: number
      height: number
    }
    video?: {
      width: number
      height: number
    }
    raw?: {}
  }
}

export interface LegacyJSFileValue {
  url: string
  secureUrl: string
  publicId: string
  version: number
  width: number
  height: number
  format: string
  createdAt: string
  resourceType: string
  bytes: number
  type: string
  etag: string
  signature: string
  originalFilename: string
}

export type FileHost = KarmaMediaFileHost
export type FileFormat = 'v1' | 'legacy'

export interface FileFieldStoreOptions extends FieldStoreOptions {
  fileHost: FileHost
  format?: FileFormat
  value?: FileValue
}

function isLegacyJSFileValue(value: any): value is LegacyJSFileValue {
  if (value && typeof value.secureUrl === 'string') return true
  return false
}

function isJSFileValue(value: any): value is JSFileValue {
  if (value && typeof value.type === 'object') return true
  return false
}

export class FileFieldStore implements FieldStore {
  @observable.ref public value: FileValue | undefined
  @observable.ref public tempValue: TempFileValue | undefined

  @observable.ref public errors: string[] = []

  @observable.ref public isUploading: boolean = false
  @observable.ref public uploadProgress: number = 0

  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string

  public readonly fileHost: FileHost
  public readonly format: FileFormat

  constructor(opts: FileFieldStoreOptions) {
    this.value = opts.value
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon
    this.fileHost = opts.fileHost
    this.format = opts.format || 'v1'
  }

  @computed
  public get hash() {
    const valueID = this.value ? this.value.id : ''
    const tempValueID = this.tempValue ? this.tempValue.tempID : ''

    return hashString(`file:${valueID}:${tempValueID}`)
  }

  @action
  private handleUploadProgress = (e: ProgressEvent) => {
    this.uploadProgress = Math.round(e.loaded / e.total)
  }

  @action
  public changeValue(value: FileValue | undefined) {
    this.value = value
    this.validate()
  }

  @action
  public changeTempValue(value: TempFileValue | undefined) {
    this.tempValue = value
    this.validate()
  }

  public fits(data: any) {
    // TODO: Check structure
    switch (this.format) {
      case 'legacy':
        return isLegacyJSFileValue(data)
      case 'v1':
        return isJSFileValue(data)
    }
  }

  @action
  public fill(value: any) {
    if (isJSFileValue(value)) {
      const typeKey = firstKey(value.type) as 'image' | 'video' | 'raw'
      const typeOpts = value.type[typeKey]!
      this.value = {...value, type: typeKey, ...typeOpts} as FileValue
    } else if (isLegacyJSFileValue(value)) {
      const typeKey = value.resourceType as 'image' | 'video' | 'raw'
      let typeOpts: {width?: number; height?: number} = {}

      if (typeKey === 'image' || typeKey === 'video') {
        typeOpts = {
          width: value.width,
          height: value.height
        }
      }

      this.value = {
        url: value.secureUrl,
        bytes: value.bytes,
        format: value.format,
        id: value.publicId,
        originalFilename: value.originalFilename,
        type: typeKey,
        ...typeOpts
      } as FileValue
    } else {
      throw new Error('Invalid value!')
    }
  }

  @action
  public async uploadFile(file: File) {
    this.isUploading = true
    this.uploadProgress = 0

    switch (this.fileHost.type) {
      case 'karmaMedia': {
        const {type, thumbnailTransformName, folder, ...rest} = this.fileHost

        // TODO: Handle upload error
        const result = await uploadMedia(file, {
          ...rest,
          onProgress: this.handleUploadProgress
        })

        runInAction('uploadFile', () => {
          this.isUploading = false
          this.uploadProgress = 0

          this.changeTempValue(result)
        })
        break
      }
    }
  }

  @computed
  public get valid() {
    return !this.isUploading && (this.value != undefined || this.tempValue != undefined)
  }

  @computed
  public get thumbnailURL() {
    if (this.tempValue) {
      if (this.tempValue.type === 'image') {
        return this.tempValue.url
      } else {
        return undefined
      }
    } else if (this.value && this.value.type === 'image') {
      let url: string

      if (this.value.format === 'pdf') {
        url = `${this.value.url}.png`
      } else {
        url = this.value.url
      }

      return getThumbnailURL(url, this.fileHost.thumbnailTransformName)
    } else {
      return undefined
    }
  }

  @action
  public async onSave(isNew: boolean) {
    if (this.fileHost.type === 'karmaMedia') {
      let response: KarmaMediaCommitResponse | undefined

      if (this.tempValue) {
        response = await commitMedia(this.tempValue.tempID, {
          override:
            !isNew && this.value
              ? {
                  id: this.value.id,
                  type: this.value.type
                }
              : undefined,
          name: this.fileHost.name,
          apiKey: this.fileHost.apiKey,
          folder: this.fileHost.folder
        })
      } else if (isNew && this.value) {
        response = await copyMedia(this.value.url, this.value.originalFilename, {
          name: this.fileHost.name,
          apiKey: this.fileHost.apiKey,
          folder: this.fileHost.folder
        })
      }

      runInAction('onSave', () => {
        if (!response) return

        const commonValues = {
          id: response.id,
          version: response.version,
          bytes: response.numBytes,
          originalFilename: response.originalFilename,
          format: response.format || '',
          url: response.url
        }

        this.changeTempValue(undefined)

        if (response.type === 'image') {
          this.changeValue({
            ...commonValues,
            type: 'image',
            width: response.width!,
            height: response.height!
          })
        } else if (response.type === 'video') {
          this.changeValue({
            ...commonValues,
            type: 'video',
            width: response.width!,
            height: response.height!
          })
        } else {
          this.changeValue({
            ...commonValues,
            type: 'raw'
          })
        }
      })
    }
  }

  @action
  public async onDelete() {
    if (this.value && this.fileHost.type === 'karmaMedia') {
      // TODO: Handle error.
      await deleteMedia(this.value.type, this.value.id, {
        name: this.fileHost.name,
        apiKey: this.fileHost.apiKey
      })
    }
  }

  public validate() {
    return this.valid
  }

  public async asJS() {
    const value = this.value

    if (!value) return null

    if (this.format === 'legacy') {
      return {
        url: value.url,
        secureUrl: value.url,
        publicId: value.id,
        version: 0,
        width: value.type === 'image' || value.type === 'video' ? value.width : 0,
        height: value.type === 'image' || value.type === 'video' ? value.height : 0,
        format: value.format,
        createdAt: '',
        resourceType: value.type,
        bytes: value.bytes,
        type: '',
        etag: '',
        signature: '',
        originalFilename: value.originalFilename
      } as LegacyJSFileValue
    } else {
      let typeValue: any

      if (value.type === 'image' || value.type === 'video') {
        typeValue = {
          width: value.width,
          height: value.height
        }
      }

      return {
        id: value.id,
        bytes: value.bytes,
        format: value.format,
        originalFilename: value.originalFilename,
        url: value.url,
        type: {[value.type]: typeValue}
      } as JSFileValue
    }
  }

  public clone(opts?: FieldStoreOptions) {
    return new FileFieldStore(Object.assign({}, this, opts))
  }
}
