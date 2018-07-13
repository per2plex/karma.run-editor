import axios from 'axios'
import {DatabaseHeader, SignatureHeader, Session} from '@karma.run/editor-common'
import {UploadResponse, CommitResponse, CopyResponse, DeleteResponse} from '../common'

const httpClient = axios.create()

export type ProgressCallbackFn = (progress: number) => void

function headersForSession(session?: Session) {
  if (!session) return {}

  return {
    [DatabaseHeader]: session.database,
    [SignatureHeader]: session.signature
  }
}

export async function uploadMedia(
  baseURL: string,
  file: File,
  onProgress?: ProgressCallbackFn,
  session?: Session
): Promise<UploadResponse> {
  const data = new FormData()
  data.append('file', file)

  const response = await httpClient.post(`${baseURL}/upload`, data, {
    headers: headersForSession(session),
    onUploadProgress: (e: ProgressEvent) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded / e.total)
      }
    }
  })

  return response.data
}

export async function commitMedia(
  baseURL: string,
  id: string,
  overrideID?: string,
  session?: Session
): Promise<CommitResponse> {
  encodeURIComponent
  const response = await httpClient.post(
    `${baseURL}/commit`,
    {id, overrideID},
    {headers: headersForSession(session)}
  )
  return response.data
}

export async function copyMedia(
  baseURL: string,
  id: string,
  session?: Session
): Promise<CopyResponse> {
  const response = await httpClient.post(
    `${baseURL}/copy`,
    {id},
    {headers: headersForSession(session)}
  )
  return response.data
}

export async function deleteMedia(
  baseURL: string,
  id: string,
  session?: Session
): Promise<DeleteResponse> {
  const response = await httpClient.delete(`${baseURL}/${id}`, {
    headers: headersForSession(session)
  })
  return response.data
}

export function thumbnailURL(baseURL: string, id: string) {
  return `${baseURL}/thumbnail/${id}`
}

export interface ClientOptions {
  baseURL: string
}

export class MediaClient {
  private baseURL: string

  public constructor(opts: ClientOptions) {
    this.baseURL = opts.baseURL || ''
  }

  public upload(file: File, onProgress?: ProgressCallbackFn) {
    return uploadMedia(this.baseURL, file, onProgress)
  }

  public commit(id: string, overrideID?: string) {
    return commitMedia(this.baseURL, id, overrideID)
  }

  public copy(id: string) {
    return copyMedia(this.baseURL, id)
  }

  public delete(id: string) {
    return deleteMedia(this.baseURL, id)
  }
}
