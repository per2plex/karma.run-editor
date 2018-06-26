import React from 'react'
import {Filter, Sort} from '@karma.run/editor-common'

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
  MetarializedRecord,
  buildExpression
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
import {list} from 'csx/lib'

export const developmentModelGroupID: Ref = ['_editorModelGroup', 'development']
export const developmentEditorContextID: Ref = ['_editorEditorContext', 'development']

export const sessionRenewalInterval = 5 * (60 * 1000) // 5min

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
  getRecordList(
    model: Ref,
    limit: number,
    offset: number,
    sort?: Sort,
    filter?: Filter
  ): Promise<any[]>
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

  async getRecordList() {
    throw new Error('No SessionProvider found!')
  }
})

export interface SessionProviderProps {
  config: Config
}

export class SessionProvider extends React.Component<SessionProviderProps, SessionContext> {
  private refreshSessionIntervalID?: number

  constructor(props: SessionProviderProps) {
    super(props)

    this.state = {
      ...initialEditorData,
      canRestoreSessionFromStorage: storage.get(SessionStorageKey) != undefined,
      restoreSessionFromLocalStorage: this.restoreSessionFromLocalStorage,
      restoreSession: this.restoreSession,
      authenticate: this.authenticate,
      invalidate: this.invalidate,
      getRecordList: this.getRecordList
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
    this.setState({...initialEditorData, session: undefined, canRestoreSessionFromStorage: false})
    storage.remove(SessionStorageKey)
  }

  public getRecordList = (
    model: Ref,
    limit: number,
    offset: number,
    sort?: Sort,
    filter?: Filter
  ): Promise<any[]> => {
    let listExpression = buildExpression(e =>
      e.mapList(e.all(e.data(d => d.ref(model[0], model[1]))), (_, value) => e.metarialize(value))
    )

    // if (filter) {
    //   listExpression = buildExpression(e =>
    //     e.filterList(listExpression, (_, value) => e.bool(true))
    //   )
    // }

    // if (sort) {
    //   listExpression = buildExpression(e =>
    //     e.memSort(listExpression, value => e.field('id', value))
    //   )
    // }

    return query(
      this.props.config.karmaURL,
      this.state.session,
      buildFunction(e => () => e.slice(listExpression, offset, limit))
    )
  }

  private storeSession() {
    storage.set(SessionStorageKey, this.state.session)
  }

  private async getEditorData(session: Session): Promise<EditorData> {
    const {tags, models} = await this.getTagsAndModels(session)
    const tagMap = new Map(tags.map(tag => [tag.tag, tag.model] as [string, Ref]))
    const reverseTagMap = new RefMap(tags.map(tag => [tag.model, tag.tag] as [Ref, string]))
    const modelMap = new RefMap(models.map(model => [model.id, model.value] as [Ref, any]))

    const modelGroups: ModelGroup[] = []
    const editorContexts: EditorContext[] = []
    const viewContexts: ViewContext[] = []

    const inferedViewContexts = models.map(model =>
      inferViewContextFromModel(
        model.id,
        unserializeModel(model.value),
        reverseTagMap.get(model.id)
      )
    )

    // TODO: Check development mode
    if (true) {
      const developmentModelGroup: ModelGroup = {
        id: developmentModelGroupID,
        name: 'Models',
        models: models.map(model => model.id)
      }

      const developmentEditorContext: EditorContext = {
        id: developmentEditorContextID,
        name: 'Development',
        modelGroups: [developmentModelGroupID]
      }

      modelGroups.push(developmentModelGroup)
      editorContexts.push(developmentEditorContext)
    }

    viewContexts.push(...inferedViewContexts)

    const modelGroupMap = new RefMap(
      modelGroups.map(modelGroup => [modelGroup.id, modelGroup] as [Ref, any])
    )

    const editorContextMap = new RefMap(
      editorContexts.map(editorContext => [editorContext.id, editorContext] as [Ref, any])
    )

    const viewContextMap = new RefMap(
      inferedViewContexts.map(viewContext => [viewContext.model, viewContext] as [Ref, ViewContext])
    )

    const viewContextSlugMap = new RefMap(
      inferedViewContexts.map(
        viewContext => [viewContext.slug, viewContext] as [string, ViewContext]
      )
    )

    return {
      tags,
      tagMap,
      reverseTagMap,
      models,
      modelMap,
      modelGroups,
      modelGroupMap,
      editorContexts,
      editorContextMap,
      viewContexts,
      viewContextMap,
      viewContextSlugMap
    }
  }

  private async getTagsAndModels(
    session: Session
  ): Promise<{tags: Tag[]; models: MetarializedRecord[]}> {
    return query(
      this.props.config.karmaURL,
      session,
      buildFunction(e => () =>
        e.data(d =>
          d.struct({
            tags: d.expr(() => getTags()),
            models: d.expr(e => e.mapList(getModels(), (_, model) => e.metarialize(model)))
          })
        )
      )
    )
  }

  private async refreshSession() {
    if (!this.state.session) return

    const newSession = await refreshSession(this.props.config.karmaURL, this.state.session)
    this.setState({session: newSession})
  }

  public componentDidMount() {
    this.refreshSessionIntervalID = setInterval(() => this.refreshSession(), sessionRenewalInterval)
  }

  public componentWillUnmount() {
    clearInterval(this.refreshSessionIntervalID)
  }

  public render() {
    return (
      <SessionContext.Provider value={this.state}>{this.props.children}</SessionContext.Provider>
    )
  }
}

export const withSession = createContextHOC(SessionContext, 'sessionContext', 'withSession')
export const SessionProviderContainer = withConfig(SessionProvider)
