import axios from 'axios'
import { Env } from '../util/env'
export { AxiosError as APIError } from 'axios'

const sharedRequestClient = axios.create({
  baseURL: Env.KARMA_MEDIA_SERVER_URL || 'https://karma-media-server.herokuapp.com/',
  timeout: 30000
})

export interface CommonOptions {
  name: string
  apiKey: string
}

export interface UploadOptions extends CommonOptions {
  onProgress?: (e: ProgressEvent) => void
}

export interface CommitOptions extends CommonOptions {
  override?: {id: string, type: 'raw' | 'image' | 'video'}
  folder?: string
}

export interface CopyOptions extends CommonOptions {
  folder?: string
}

export interface KarmaMediaUploadResponse {
  tempID: string
  type: 'raw' | 'image' | 'video'
  originalFilename: string
  url: string
}

export interface KarmaMediaCommitResponse {
  format: string
  id: string
  numBytes: number
  originalFilename: string
  overwritten: boolean
  type: string
  url: string
  version: number
  width?: number
  height?: number
}

export async function uploadMedia(
  file: File, opts: UploadOptions
): Promise<KarmaMediaUploadResponse> {
  const path = `/api/${opts.name}/upload`
  const formData = new FormData()

  formData.append('file', file)

  const response = await sharedRequestClient.post(path, formData, {
    headers: {'X-Key': opts.apiKey},
    onUploadProgress: opts.onProgress
  })

  return response.data
}

export async function commitMedia(
  tempID: string, opts: CommitOptions
): Promise<KarmaMediaCommitResponse> {
  const path = `/api/${opts.name}/commit`
  const response = await sharedRequestClient.post(path, {
    tempID,
    overrideID: opts.override && opts.override.id,
    overrideType: opts.override && opts.override.type,
    folder: opts.folder
  }, {
    headers: {'X-Key': opts.apiKey}
  })

  return response.data
}

export async function copyMedia(
  url: string, filename: string, opts: CopyOptions
): Promise<KarmaMediaCommitResponse> {
  const path = `/api/${opts.name}/copy`
  const response = await sharedRequestClient.post(path, {url, filename, folder: opts.folder}, {
    headers: {'X-Key': opts.apiKey}
  })

  return response.data
}

export async function  deleteMedia(
  type: string, id: string, opts: CommonOptions
): Promise<void> {
  const path = `/api/${opts.name}/delete`
  await sharedRequestClient.post(path, {type, id}, {
    headers: {'X-Key': opts.apiKey}
  })
}

export function getThumbnailURL(url: string, transform?: string) {
  return url.replace('image/upload', `image/upload/t_${transform || 'media_lib_thumb'}`)
}
