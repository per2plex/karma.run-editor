import React from 'react'

import {Ref} from '@karma.run/sdk'

import {EditorContext, ReadonlyRefMap, RefMap, Sort, Condition} from '@karma.run/editor-common'

import {createContextHOC} from './helper'
import {ViewContext} from '../api/viewContext'

export interface ModelRecord<T = any> {
  id: Ref
  model: Ref
  created: Date
  updated: Date
  value: T
}

export interface EditorSession {
  username: string
  signature: string
}

export interface EditorData {
  editorContexts: EditorContext[]
  editorContextMap: ReadonlyMap<string, EditorContext>
  viewContexts: ViewContext[]
  viewContextMap: ReadonlyRefMap<ViewContext>
  viewContextSlugMap: ReadonlyMap<string, ViewContext>
}

export const initialEditorData: EditorData = {
  editorContexts: [],
  editorContextMap: new Map(),
  viewContexts: [],
  viewContextMap: new RefMap(),
  viewContextSlugMap: new Map()
}

export interface ReferrersResponse {
  record: ModelRecord
  referrers: ModelRecord[]
}

export interface SessionContext extends EditorData {
  session?: EditorSession
  canRestoreSessionFromStorage: boolean
  unsavedChangesCount: number

  restoreSessionFromLocalStorage(): Promise<EditorSession>
  restoreSession(session: EditorSession): Promise<EditorSession>
  authenticate(username: string, password: string): Promise<EditorSession>
  invalidate(): Promise<void>
  getRecord(model: Ref, id: Ref): Promise<ModelRecord>

  getRecordList(
    model: Ref,
    limit: number,
    offset: number,
    sort: Sort,
    filters: Condition[]
  ): Promise<ModelRecord[]>

  getReferrers(id: Ref, limit: number, offset: number): Promise<ModelRecord[]>
  saveRecord(model: Ref, id: Ref | undefined, value: any): Promise<ModelRecord>
  deleteRecord(model: Ref, id: Ref, value: any): Promise<void>

  increaseUnsavedChangesCount(): void
  decreaseUnsavedChangesCount(): void
}

export const SessionContext = React.createContext<SessionContext>({
  ...initialEditorData,
  canRestoreSessionFromStorage: false,
  unsavedChangesCount: 0,

  async restoreSessionFromLocalStorage() {
    throw new Error('No SessionProvider found!')
  },

  async restoreSession() {
    throw new Error('No SessionProvider found!')
  },

  async authenticate() {
    throw new Error('No SessionProvider found!')
  },

  async invalidate() {
    throw new Error('No SessionProvider found!')
  },

  async getRecord() {
    throw new Error('No SessionProvider found!')
  },

  async getRecordList() {
    throw new Error('No SessionProvider found!')
  },

  async getReferrers() {
    throw new Error('No SessionProvider found!')
  },

  async saveRecord() {
    throw new Error('No SessionProvider found!')
  },

  async deleteRecord() {
    throw new Error('No SessionProvider found!')
  },

  increaseUnsavedChangesCount() {
    throw new Error('No SessionProvider found!')
  },

  decreaseUnsavedChangesCount() {
    throw new Error('No SessionProvider found!')
  }
})

export const withSession = createContextHOC(SessionContext, 'sessionContext', 'withSession')
