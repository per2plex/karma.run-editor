import React from 'react'

import { Ref } from '@karma.run/sdk'

import { EditorContext } from '../api/editorContext'
import { createContextHOC } from './helper'
import { ReadonlyRefMap, RefMap } from '../util/ref'
import { ViewContext } from '../api/viewContext'
import { Sort, Condition } from '../interface/filter'

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
  viewContexts: ViewContext[]
  viewContextMap: ReadonlyRefMap<ViewContext>
  viewContextSlugMap: ReadonlyMap<string, ViewContext>
}

export const initialEditorData: EditorData = {
  editorContexts: [],
  viewContexts: [],
  viewContextMap: new RefMap(),
  viewContextSlugMap: new Map()
}

export interface SessionContext extends EditorData {
  session?: EditorSession
  canRestoreSessionFromStorage: boolean
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

  getReferrers(
    model: Ref,
    id: Ref,
    limit: number,
    offset: number,
    sort: Sort,
    filters: Condition[]
  ): Promise<ModelRecord[]>

  saveRecord(model: Ref, id: Ref | undefined, value: any): Promise<ModelRecord>
}

export const SessionContext = React.createContext<SessionContext>({
  ...initialEditorData,
  canRestoreSessionFromStorage: false,

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
  }
})

export const withSession = createContextHOC(SessionContext, 'sessionContext', 'withSession')
