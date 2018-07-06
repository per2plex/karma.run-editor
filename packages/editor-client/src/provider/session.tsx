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
import {defaultFieldRegistry} from '../fields/registry'

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
      getRecordList: this.getRecordList,
      saveRecord: this.saveRecord
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

  public getRecord = async (model: Ref, id: Ref): Promise<MetarializedRecord> => {
    if (!this.state.session) throw new Error('No session!')

    const viewContext = this.state.viewContextMap.get(model)
    if (!viewContext) throw new Error(`Coulnd't find ViewContext for model: ${model}`)

    return {
      id: ['test', 'bar'],
      model: ['test', 'foo'],
      created: 'now',
      updated: 'now',
      value: viewContext.field.transformRawValue({
        test: '1234',
        recurse: {
          test: 'abcd'
        }
      })
    }

    const record: MetarializedRecord = await query(
      this.props.config.karmaURL,
      this.state.session,
      buildFunction(e => () => e.metarialize(e.get(e.data(d => d.ref(id)))))
    )

    record.value = viewContext.field.transformRawValue(record.value)
    return record
  }

  public getRecordList = async (
    model: Ref,
    limit: number,
    offset: number,
    sort: Sort,
    filters: Condition[]
  ): Promise<MetarializedRecord[]> => {
    return [
      {
        id: ['test', 'bar'],
        model: ['test', 'foo'],
        created: 'now',
        updated: 'now',
        value: {}
      }
    ]

    if (!this.state.session) throw new Error('No session!')

    const viewContext = this.state.viewContextMap.get(model)
    if (!viewContext) throw new Error(`Coulnd't find ViewContext for model: ${model}`)

    let listExpression = buildExpression(e =>
      e.mapList(e.all(e.data(d => d.ref(model))), (_, value) => e.metarialize(value))
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

    const records: MetarializedRecord[] = await query(
      this.props.config.karmaURL,
      this.state.session,
      buildFunction(e => () => e.slice(listExpression, offset, limit))
    )

    records.forEach(record => {
      record.value = viewContext.field.transformRawValue(record.value)
    })

    return records
  }

  public saveRecord = async (
    model: Ref,
    id: Ref | undefined,
    value: any
  ): Promise<MetarializedRecord> => {
    if (!this.state.session) throw new Error('No session!')

    const viewContext = this.state.viewContextMap.get(model)
    if (!viewContext) throw new Error(`Coulnd't find ViewContext for model: ${model}`)

    if (viewContext.field.onSave) {
      value = viewContext.field.onSave(value)
    }

    const expressionValue = viewContext.field.transformValueToExpression(value)
    const result = await query(
      this.props.config.karmaURL,
      this.state.session,
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

    return result
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
    return {
      tags: [{model: ['test', 'foo'], tag: 'test'}],
      models: [
        {
          id: ['test', 'foo'],
          model: ['test', 'model'],
          created: 'now',
          updated: 'now',
          value: {
            recursion: {
              label: 'test',
              model: {
                struct: {
                  test: {string: {}},
                  recurse: {
                    recursion: {
                      label: 'test2',
                      model: {
                        struct: {
                          test: {string: {}},
                          test2: {
                            optional: {
                              recurse: 'test2'
                            }
                          },
                          test3: {
                            optional: {
                              recurse: 'test'
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    }

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
