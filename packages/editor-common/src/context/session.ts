import React from 'react'

import {Ref, Tag, Session, MetarializedRecord} from '@karma.run/sdk'

import {EditorContext} from '../api/editorContext'
import {ModelGroup} from '../api/modelGroup'
import {createContextHOC} from './helper'
import {ReadonlyRefMap, RefMap} from '../util/ref'
import {ViewContext} from '../api/viewContext'
import {Sort, Condition} from '../interface/filter'

export interface ModelRecord<T = any> {
  id: Ref
  model: Ref
  created: Date
  updated: Date
  value: T
}

export interface EditorData {
  models: MetarializedRecord[]
  modelMap: ReadonlyRefMap<any>
  tags: Tag[]
  tagMap: ReadonlyMap<string, Ref>
  reverseTagMap: ReadonlyRefMap<string>
  editorContexts: EditorContext[]
  editorContextMap: ReadonlyMap<string, EditorContext>
  modelGroups: ModelGroup[]
  modelGroupMap: ReadonlyMap<string, ModelGroup>
  viewContexts: ViewContext[]
  viewContextMap: ReadonlyRefMap<ViewContext>
  viewContextSlugMap: ReadonlyMap<string, ViewContext>
}

export const initialEditorData: EditorData = {
  models: [],
  modelMap: new RefMap(),
  tags: [],
  tagMap: new Map(),
  reverseTagMap: new RefMap(),
  editorContexts: [],
  editorContextMap: new RefMap(),
  modelGroups: [],
  modelGroupMap: new RefMap(),
  viewContexts: [],
  viewContextMap: new RefMap(),
  viewContextSlugMap: new Map()
}

export interface SessionContext extends EditorData {
  session?: Session
  canRestoreSessionFromStorage: boolean
  restoreSessionFromLocalStorage(): Promise<Session>
  restoreSession(session: Session): Promise<Session>
  authenticate(username: string, password: string): Promise<Session>
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
