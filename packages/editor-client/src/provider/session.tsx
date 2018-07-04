import React from 'react'
import {
  Sort,
  ValuePathSegmentType,
  ValuePathSegment,
  Condition,
  ValuePath,
  StructPathSegment
} from '@karma.run/editor-common'

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
  buildExpression,
  Expression,
  expression as e
} from '@karma.run/sdk'

import * as storage from '../util/storage'
import {SessionStorageKey} from '../store/editorStore'
import {Config, withConfig} from '../context/config'
import {EditorContext} from '../api/karmafe/editorContext'
import {ModelGroup} from '../api/karmafe/modelGroup'
import {RefMap} from '../util/ref'
// import {inferViewContextFromModel, ViewContext} from '../api/karmafe/viewContext'
import {unserializeModel} from '../api/model'
import {ViewContext} from '../api/newViewContext'
import {SessionContext, initialEditorData, EditorData} from '../context/session'

export const developmentModelGroupID: Ref = ['_editorModelGroup', 'development']
export const developmentEditorContextID: Ref = ['_editorEditorContext', 'development']

export const sessionRenewalInterval = 5 * (60 * 1000) // 5min

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
      getRecord: this.getRecord,
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
      // TEMP
      // const newSession = {username: 'test', signature: '1234'}
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
    // TEMP
    // const session = {username: 'test', signature: '1234'}
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

  public getRecord = (id: Ref) => {
    // TODO
    return {}
  }

  public getRecordList = (
    model: Ref,
    limit: number,
    offset: number,
    sort: Sort,
    filters: Condition[]
  ): Promise<any[]> => {
    if (!this.state.session) throw new Error('No session!')

    let listExpression = buildExpression(e =>
      e.mapList(e.all(e.data(d => d.ref(model[0], model[1]))), (_, value) => e.metarialize(value))
    )

    if (filters.length > 0) {
      for (const filter of filters) {
        listExpression = buildExpression(e =>
          e.filterList(listExpression, (_, value) =>
            e.matchRegex(
              filter.value,
              filterValueExpression(value, [StructPathSegment('value'), ...filter.path])
            )
          )
        )
      }
    }

    function filterValueExpression(value: Expression, valuePath: ValuePath) {
      for (const segment of valuePath) {
        value = expressionForValuePathSegment(value, segment)
      }

      return value
    }

    function expressionForValuePathSegment(value: Expression, segment: ValuePathSegment) {
      switch (segment.type) {
        case ValuePathSegmentType.Struct:
          return e.field(segment.key, value)

        case ValuePathSegmentType.Union:
          return e.field(segment.key, value)

        default:
          throw new Error('Not implemented!')
      }
    }

    let valueExpression = (value: Expression) => {
      for (const segment of sort.path) {
        value = expressionForValuePathSegment(value, segment)
      }

      return value
    }

    listExpression = buildExpression(e =>
      e.memSort(listExpression, value => valueExpression(value))
    )

    if (sort.descending) {
      listExpression = e.reverseList(listExpression)
    }

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

    // Import dynamicallly to avoid circular dependency
    const {defaultFieldRegistry} = await import('../fields/registry')

    const inferedViewContexts = models.map(model =>
      ViewContext.inferFromModel(
        model.id,
        unserializeModel(model.value),
        defaultFieldRegistry,
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
    // TEMP
    // return {
    //   tags: [{tag: 'test', model: ['test', 'foo']}],
    //   models: [
    //     {
    //       id: ['test', 'foo'],
    //       created: new Date().toISOString(),
    //       updated: new Date().toISOString(),
    //       model: ['model', 'test'],
    //       value: {
    //         struct: {
    //           foo: {string: {}},
    //           bar: {unique: {string: {}}}
    //         }
    //       }
    //     }
    //   ]
    // }

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

export const SessionProviderContainer = withConfig(SessionProvider)
