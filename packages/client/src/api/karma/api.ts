import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { ObjectMap } from '@karma.run/editor-common'

export const UserHeader = 'X-Karma-User'
export const SecretHeader = 'X-Karma-Secret'
export const SignatureHeader = 'X-Karma-Signature'
export const DatabaseHeader = 'X-Karma-Database'
export const CodedHeader = 'X-Karma-Codec'

export const ModelTag = '_model'
export const TagTag = '_tag'
export const UserTag = '_user'
export const RoleTag = '_role'

export type MetaField = 'updated' | 'created' | 'id'

export interface Session {
  endpoint: string
  username: string
  database: string
  signature: string
}

export interface APIError extends Error {
  config?: AxiosRequestConfig
  code?: string
  response?: AxiosResponse
}

const sharedRequestClient = axios.create({
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    [CodedHeader]: 'json'
  },
  transformRequest: [data => JSON.stringify(data)]
})

/** @throws {APIError} */
export async function rpcRequest(session: Session, fn: any) {
  const headers: ObjectMap<string> = {
    [DatabaseHeader]: session.database
  }

  headers[SignatureHeader] = session.signature

  const response = await sharedRequestClient.request({
    baseURL: session.endpoint,
    method: 'POST', headers, data: fn
  })

  return response.data
}

export interface Entry {
  id: string,
  model: string,
  created: string,
  updated: string,
  value: any
}

/** @throws {APIError} */
export async function authenticate(
  endpoint: string, database: string, username: string, password: string
): Promise<Session> {
  const response = await sharedRequestClient.request({
    baseURL: endpoint,
    method: 'POST', url: 'auth',
    headers: {[DatabaseHeader]: database},
    data: {username, password}
  })

  return {endpoint, username, database, signature: response.data}
}

/** @throws {APIError} */
export async function renewSession(session: Session): Promise<Session> {
  const response = await sharedRequestClient.request({
    baseURL: session.endpoint,
    method: 'POST', url: 'auth',
    headers: {
      [DatabaseHeader]: session.database,
      [SignatureHeader]: session.signature
    }
  })

  return {
    endpoint: session.endpoint,
    username: session.username,
    database: session.database,
    signature: response.data
  }
}

/** @throws {APIError} */
export async function getAllEntriesForTag(tag: string, session: Session): Promise<Entry[]> {
  return await rpcRequest(session, {
    mapList: {
      value: {all: {tag}},
      expression: {metarialize: {id: {}}}
    }
  })
}

/** @throws {APIError} */
export async function getAllEntriesForModel(id: string, session: Session): Promise<Entry[]> {
  return await rpcRequest(session, {
    mapList: {
      value: {all: {model: id}},
      expression: {metarialize: {id: {}}}
    }
  })
}

/** @throws {APIError} */
export async function getEntryForID(
  model: string, id: string, session: Session
): Promise<Entry> {
  return await rpcRequest(session, {
    metarialize: {get: {newRef: {model: {model}, id}}}
  })
}

/** @throws {APIError} */
export async function createEntry(
  model: string, value: any, session: Session
): Promise<string> {
  return await rpcRequest(session, {
    create: {in: {model}, value: {contextual: value}}
  })
}

/** @throws {APIError} */
export async function updateEntry(
  model: string, id: string, value: any, session: Session
): Promise<string> {
  await rpcRequest(session, {
    update: {ref: {newRef: {model: {model}, id}}, value: {contextual: value}}
  })

  return id
}

/** @throws {APIError} */
export async function deleteEntry(
  model: string, id: string, session: Session
): Promise<string> {
  await rpcRequest(session, {
    delete: {newRef: {model: {model}, id}}
  })

  return id
}
