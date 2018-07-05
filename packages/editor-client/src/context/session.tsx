import React from 'react'
import {Sort, Condition} from '@karma.run/editor-common'

import {Ref, Tag, Session, MetarializedRecord} from '@karma.run/sdk'

import {EditorContext} from '../api/karmafe/editorContext'
import {ModelGroup} from '../api/karmafe/modelGroup'
import {createContextHOC} from './helper'
import {ReadonlyRefMap, RefMap} from '../util/ref'
import {ViewContext} from '../api/newViewContext'

export interface EditorData {
  models: MetarializedRecord[]
  modelMap: ReadonlyRefMap<any>
  tags: Tag[]
  tagMap: ReadonlyMap<string, Ref>
  reverseTagMap: ReadonlyRefMap<string>
  editorContexts: EditorContext[]
  editorContextMap: ReadonlyRefMap<EditorContext>
  modelGroups: ModelGroup[]
  modelGroupMap: ReadonlyRefMap<ModelGroup>
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
  getRecord(model: Ref, id: Ref): Promise<MetarializedRecord>
  getRecordList(
    model: Ref,
    limit: number,
    offset: number,
    sort: Sort,
    filter: Condition[]
  ): Promise<MetarializedRecord[]>
  saveRecord(model: Ref, id: Ref | undefined, value: any): Promise<MetarializedRecord>
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

  async saveRecord() {
    throw new Error('No SessionProvider found!')
  }
})

export const withSession = createContextHOC(SessionContext, 'sessionContext', 'withSession')
