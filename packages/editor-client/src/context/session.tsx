import React from 'react'

import {
  Ref,
  Tag,
  Session,
  authenticate,
  refreshSession,
  query,
  buildFunction,
  getTags,
  getModels,
  MetarializedRecord
} from '@karma.run/sdk'

import * as storage from '../util/storage'
import {SessionStorageKey} from '../store/editorStore'
import {Config, withConfig} from './config'
import {EditorContext} from '../api/karmafe/editorContext'
import {ModelGroup} from '../api/karmafe/modelGroup'
import {createContextHOC} from './helper'
import {ReadonlyRefMap, RefMap} from '../util/ref'
import {inferViewContextFromModel, ViewContext} from '../api/karmafe/viewContext'
import {unserializeModel} from '../api/karma'

export const DevelopmentModelGroupID = Symbol('DevelopmentModelGroup')
export const DevelopmentEditorContextID = Symbol('DevelopmentEditorContext')

export interface EditorData {
  models: MetarializedRecord[]
  modelMap: ReadonlyRefMap<any>
  tags: Tag[]
  tagMap: ReadonlyMap<string, Ref>
  reverseTagMap: ReadonlyRefMap<string>
  editorContexts: EditorContext[]
  modelGroups: ModelGroup[]
  viewContexts: ViewContext[]
  viewContextMap: ReadonlyRefMap<ViewContext>
}

export interface SessionContext extends EditorData {
  session?: Session
  canRestoreSessionFromStorage: boolean
  restoreSessionFromLocalStorage(): Promise<Session>
  restoreSession(session: Session): Promise<Session>
  authenticate(username: string, password: string): Promise<Session>
  invalidate(): Promise<void>
}

export const SessionContext = React.createContext<SessionContext>({
  models: [],
  modelMap: new RefMap(),
  tags: [],
  tagMap: new Map(),
  reverseTagMap: new RefMap(),
  editorContexts: [],
  modelGroups: [],
  viewContexts: [],
  viewContextMap: new RefMap(),
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
  }
})

export interface SessionProviderProps {
  config: Config
}

export class SessionProvider extends React.Component<SessionProviderProps, SessionContext> {
  constructor(props: SessionProviderProps) {
    super(props)

    this.state = {
      models: [],
      modelMap: new RefMap(),
      tags: [],
      tagMap: new Map(),
      reverseTagMap: new RefMap(),
      editorContexts: [],
      modelGroups: [],
      viewContexts: [],
      viewContextMap: new RefMap(),

      canRestoreSessionFromStorage: storage.get(SessionStorageKey) != undefined,
      restoreSessionFromLocalStorage: this.restoreSessionFromLocalStorage,
      restoreSession: this.restoreSession,
      authenticate: this.authenticate,
      invalidate: this.invalidate
    }
  }

  public restoreSessionFromLocalStorage = async () => {
    const session = storage.get(SessionStorageKey)

    if (!session) {
      throw new Error('No session to restore!')
    }

    return this.restoreSession(session)
  }

  public restoreSession = async (session: Session) => {
    try {
      const newSession = await refreshSession(this.props.config.karmaURL, session)
      const editorData = await this.getEditorData(session)

      this.setState({...editorData, session: newSession})
      this.storeSession()

      return newSession
    } catch (err) {
      this.invalidate()
      throw err
    }
  }

  public authenticate = async (username: string, password: string) => {
    const session = await authenticate(this.props.config.karmaURL, username, password)
    const editorData = await this.getEditorData(session)

    this.setState({...editorData, session})
    this.storeSession()

    return session
  }

  public invalidate = async () => {
    this.setState({session: undefined})
    storage.remove(SessionStorageKey)
  }

  private storeSession() {
    storage.set(SessionStorageKey, this.state.session)
  }

  private async getEditorData(session: Session): Promise<EditorData> {
    const tags = await this.getTags(session)
    const tagMap = new Map(tags.map(tag => [tag.tag, tag.model] as [string, Ref]))
    const reverseTagMap = new RefMap(tags.map(tag => [tag.model, tag.tag] as [Ref, string]))

    const models = await this.getModels(session)
    const modelMap = new RefMap(models.map(model => [model.id, model.value] as [Ref, any]))

    const modelGroups: ModelGroup[] = []
    const editorContexts: EditorContext[] = []
    const viewContexts: ViewContext[] = []

    const inferedViewContexts = models.map(model =>
      inferViewContextFromModel(model.id[1], unserializeModel(model.value))
    )

    // TODO: Check development mode
    if (true) {
      const developmentModelGroup: ModelGroup = {
        id: DevelopmentModelGroupID,
        name: 'Models',
        models: models.map(model => model.id)
      }

      const developmentEditorContext: EditorContext = {
        id: DevelopmentEditorContextID,
        name: 'Development',
        modelGroups: [DevelopmentModelGroupID]
      }

      modelGroups.push(developmentModelGroup)
      editorContexts.push(developmentEditorContext)
    }

    viewContexts.push(...inferedViewContexts)

    // TODO
    const viewContextMap = new RefMap<ViewContext>()

    return {
      tags,
      tagMap,
      reverseTagMap,
      models,
      modelMap,
      modelGroups,
      editorContexts,
      viewContexts,
      viewContextMap
    }
  }

  private async getTags(session: Session): Promise<Tag[]> {
    const tags = await query(
      this.props.config.karmaURL,
      session,
      buildFunction(() => () => getTags())
    )

    return tags
  }

  private async getModels(session: Session): Promise<MetarializedRecord[]> {
    const models = await query(
      this.props.config.karmaURL,
      session,
      buildFunction(e => () => e.mapList(getModels(), (_, model) => e.metarialize(model)))
    )

    return models
  }

  public render() {
    return (
      <SessionContext.Provider value={this.state}>{this.props.children}</SessionContext.Provider>
    )
  }
}

export const withSession = createContextHOC(SessionContext, 'sessionContext', 'withSession')
export const SessionProviderContainer = withConfig(SessionProvider)
