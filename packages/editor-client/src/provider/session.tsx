import React from 'react'
import axios from 'axios'

import {
  Sort,
  ValuePathSegmentType,
  ValuePathSegment,
  Condition,
  ValuePath,
  StructPathSegment,
  ConditionType,
  Config,
  withConfig,
  EditorContext,
  RefMap,
  ViewContext,
  defaultFieldRegistry,
  escapeRegExp,
  WorkerContext,
  withWorker,
  SessionContext,
  initialEditorData,
  EditorData,
  ModelRecord,
  EditorSession,
  SerializedViewContext
} from '@karma.run/editor-common'

import {
  Ref,
  authenticate,
  refreshSession,
  query,
  buildFunction,
  buildExpression,
  Expression,
  expression as e,
  MetarializedRecord,
  SignatureHeader
} from '@karma.run/sdk'

import * as storage from '../util/storage'

export const defaultModelGroupID: string = 'default'
export const defaultEditorContextID: string = 'default'

export const sessionStorageKey = 'session'
export const sessionRenewalInterval = 5 * (60 * 1000) // 5min

export interface SessionProviderProps {
  config: Config
  workerContext: WorkerContext
}

export interface UserContext {
  // TODO: Rename to EditorContext and find a better name for current 'EditorContext'
  editorContexts: EditorContext[]
  viewContexts: SerializedViewContext[]
}

export class SessionProvider extends React.Component<SessionProviderProps, SessionContext> {
  private refreshSessionIntervalID?: any

  constructor(props: SessionProviderProps) {
    super(props)

    this.state = {
      ...initialEditorData,
      canRestoreSessionFromStorage: storage.get(sessionStorageKey) != undefined,
      restoreSessionFromLocalStorage: this.restoreSessionFromLocalStorage,
      restoreSession: this.restoreSession,
      authenticate: this.authenticate,
      invalidate: this.invalidate,
      getRecord: this.getRecord,
      getRecordList: this.getRecordList,
      getReferrers: this.getReferrers,
      saveRecord: this.saveRecord
    }
  }

  public restoreSessionFromLocalStorage = async () => {
    const session = storage.get(sessionStorageKey)

    if (!session) {
      throw new Error('No session to restore!')
    }

    return this.restoreSession(session)
  }

  public restoreSession = async (session: EditorSession) => {
    try {
      const newSignature = await refreshSession(this.props.config.karmaDataURL, session.signature)
      const newSession: EditorSession = {username: session.username, signature: newSignature}
      const editorData = await this.getEditorData(newSession)

      this.storeSession(newSession)
      this.setState({...editorData, session: newSession})

      return newSession
    } catch (err) {
      this.invalidate()
      throw err
    }
  }

  public authenticate = async (username: string, password: string) => {
    const signature = await authenticate(this.props.config.karmaDataURL, username, password)
    const session: EditorSession = {username, signature}
    const editorData = await this.getEditorData(session)

    this.storeSession(session)
    this.setState({...editorData, session})

    return session
  }

  public invalidate = async () => {
    this.setState({...initialEditorData, session: undefined, canRestoreSessionFromStorage: false})
    storage.remove(sessionStorageKey)
  }

  private transformMetarializedRecord(
    record: MetarializedRecord,
    viewContext: ViewContext
  ): ModelRecord {
    return {
      id: record.id,
      model: record.model,
      created: new Date(record.created),
      updated: new Date(record.updated),
      value: viewContext.field.transformRawValue(record.value)
    }
  }

  public getRecord = async (model: Ref, id: Ref): Promise<ModelRecord> => {
    if (!this.state.session) throw new Error('No session!')

    const viewContext = this.state.viewContextMap.get(model)
    if (!viewContext) throw new Error(`Coulnd't find ViewContext for model: ${model}`)

    const record: MetarializedRecord = await query(
      this.props.config.karmaDataURL,
      this.state.session.signature,
      buildFunction(e => () => e.metarialize(e.get(e.data(d => d.ref(id)))))
    )

    return this.transformMetarializedRecord(record, viewContext)
  }

  public getRecordList = async (
    model: Ref,
    limit: number,
    offset: number,
    sort: Sort,
    filters: Condition[]
  ): Promise<ModelRecord[]> => {
    if (!this.state.session) throw new Error('No session!')

    const viewContext = this.state.viewContextMap.get(model)
    if (!viewContext) throw new Error(`Coulnd't find ViewContext for model: ${model}`)

    let listExpression = buildExpression(e =>
      e.mapList(e.all(e.data(d => d.ref(model))), (_, value) => e.metarialize(value))
    )

    if (filters.length > 0) {
      for (const filter of filters) {
        if (filter.type === ConditionType.StringIncludes) {
          listExpression = buildExpression(e =>
            e.filterList(listExpression, (_, value) =>
              e.matchRegex(
                escapeRegExp(filter.value),
                filterValueExpression(value, [StructPathSegment('value'), ...filter.path])
              )
            )
          )
        }
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

    const records: MetarializedRecord[] = await query(
      this.props.config.karmaDataURL,
      this.state.session.signature,
      buildFunction(e => () => e.slice(listExpression, offset, limit))
    )

    return records.map(record => this.transformMetarializedRecord(record, viewContext))
  }

  public getReferrers = async (
    model: Ref,
    id: Ref,
    limit: number,
    offset: number,
    sort: Sort,
    filters: Condition[]
  ): Promise<ModelRecord[]> => {
    if (!this.state.session) throw new Error('No session!')

    const viewContext = this.state.viewContextMap.get(model)
    if (!viewContext) throw new Error(`Coulnd't find ViewContext for model: ${model}`)

    let listExpression = buildExpression(e =>
      e.mapList(e.allReferrers(e.data(d => d.ref(id))), (_, value) => e.metarialize(e.get(value)))
    )

    if (filters.length > 0) {
      for (const filter of filters) {
        if (filter.type === ConditionType.StringIncludes) {
          listExpression = buildExpression(e =>
            e.filterList(listExpression, (_, value) =>
              e.matchRegex(
                escapeRegExp(filter.value),
                filterValueExpression(value, [StructPathSegment('value'), ...filter.path])
              )
            )
          )
        }
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

    const records: MetarializedRecord[] = await query(
      this.props.config.karmaDataURL,
      this.state.session.signature,
      buildFunction(e => () => e.slice(listExpression, offset, limit))
    )

    return records.map(record => this.transformMetarializedRecord(record, viewContext))
  }

  public saveRecord = async (model: Ref, id: Ref | undefined, value: any): Promise<ModelRecord> => {
    if (!this.state.session) throw new Error('No session!')

    const viewContext = this.state.viewContextMap.get(model)
    if (!viewContext) throw new Error(`Coulnd't find ViewContext for model: ${model}`)

    if (viewContext.field.onSave) {
      value = await viewContext.field.onSave(value, this.props.workerContext)
    }

    const expressionValue = viewContext.field.transformValueToExpression(value)
    const record = await query(
      this.props.config.karmaDataURL,
      this.state.session.signature,
      buildFunction(e => () => [
        e.define(
          'recordID',
          id
            ? e.update(e.data(d => d.ref(id)), expressionValue)
            : e.create(e.data(d => d.ref(model)), () => expressionValue)
        ),
        e.metarialize(e.get(e.scope('recordID')))
      ])
    )

    return this.transformMetarializedRecord(record, viewContext)
  }

  private storeSession(session: EditorSession) {
    storage.set(sessionStorageKey, session)
  }

  private async getContext(session: EditorSession): Promise<UserContext> {
    const response = await axios.get(`${this.props.config.basePath}/api/context`, {
      headers: {[SignatureHeader]: session.signature}
    })

    return response.data
  }

  private async getEditorData(session: EditorSession): Promise<EditorData> {
    const {editorContexts, viewContexts: rawViewContexts} = await this.getContext(session)
    const viewContexts = rawViewContexts.map(rawViewContext =>
      ViewContext.unserialize(rawViewContext, defaultFieldRegistry)
    )

    const viewContextMap = new RefMap(
      viewContexts.map(viewContext => [viewContext.model, viewContext] as [Ref, ViewContext])
    )

    const viewContextSlugMap = new Map(
      viewContexts.map(viewContext => [viewContext.slug, viewContext] as [string, ViewContext])
    )

    const editorContextMap = new Map(
      editorContexts.map(
        editorContext =>
          [editorContext.id || editorContext.name, editorContext] as [string, EditorContext]
      )
    )

    return {
      editorContexts,
      editorContextMap,
      viewContexts,
      viewContextMap,
      viewContextSlugMap
    }
  }

  private async refreshSession() {
    if (!this.state.session) return

    const newSignature = await refreshSession(
      this.props.config.karmaDataURL,
      this.state.session.signature
    )

    const newSession = {username: this.state.session.username, signature: newSignature}

    this.storeSession(newSession)
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

export const SessionProviderContainer = withWorker(withConfig(SessionProvider))
