import {
  observable,
  action,
  reaction,
  runInAction,
  IObservableArray,
  ObservableMap,
  IReactionDisposer,
  computed
} from 'mobx'

import * as debug from '../util/debug'
import * as storage from '../util/storage'
import Fuse from 'fuse.js'

export {ObservableMap}

//import { createIntervalTimer } from 'util/timer'

import {
  ViewContextTagV1,
  ViewContextTagV2,
  ViewContext,
  createViewContextModel,
  inferViewContextFromModel,
  entryToViewContext,
  mergeViewContext
} from '../api/karmafe/viewContext'

import {
  Session,
  authenticate,
  renewSession,
  Entry,
  TagTag,
  ModelTag,
  getAllEntriesForTag,
  getAllEntriesForModel,
  getEntryForID,
  createEntry,
  updateEntry,
  deleteEntry,
  APIError,
  serializeModel,
  unserializeModel,
  Model,
  UserTag,
  RoleTag
} from '../api/karma'

import {
  createEditorContextModel,
  unserializeEditorContext,
  EditorContextTagV2,
  EditorContextTagV1
} from '../api/karmafe/editorContext'

import {
  createModelGroupModel,
  ModelGroupTag,
  unserializeModelGroup
} from '../api/karmafe/modelGroup'

import {createDefaultViewContextMap} from '../api/karmafe/viewContext/default'
import {ObjectMap} from '@karma.run/editor-common'

interface ModelGroup {
  id: string
  name: string
  models: string[]
}

interface EditorContext {
  id: string
  name: string
  privileges?: string[]
  modelGroups: string[]
}

const DeveloperStorageKey = 'developer'
const ActiveEditorContextStorageKey = 'activeEditorContext_v1'

export const SessionStorageKey = 'session_v1'
export const SessionRenewalInterval = 5 * (60 * 1000) // 5min

const DevelopmentEditorContextID = '_dev'
const DevelopmentModelGroupID = '_dev'

export function parseEntriesAsTagMap(entries: Entry[]) {
  return entries.reduce(
    (prev, entry) => {
      prev[entry.value.tag] = entry.value.model
      return prev
    },
    {} as ObjectMap<string | undefined>
  )
}

export function parseEntriesAsModelMap(entries: Entry[]) {
  return entries.reduce(
    (prev, entry) => {
      prev[entry.id] = unserializeModel(entry.value)
      return prev
    },
    {} as ObjectMap<Model>
  )
}

export async function createViewContextModelEntry(
  metaModelID: string,
  tagModelID: string,
  session: Session
) {
  const viewContextModel = serializeModel(createViewContextModel(metaModelID))
  const viewContextID = await createEntry(metaModelID, viewContextModel, session)

  const viewContextTag = {model: viewContextID, tag: ViewContextTagV2}
  const tagID = await createEntry(tagModelID, viewContextTag, session)

  const currentDateString = new Date().toISOString()

  return {
    modelEntry: {
      id: viewContextID,
      model: metaModelID,
      created: currentDateString,
      updated: currentDateString,
      value: viewContextModel
    } as Entry,
    tagEntry: {
      id: tagID,
      model: tagModelID,
      created: currentDateString,
      updated: currentDateString,
      value: viewContextTag
    } as Entry
  }
}

export async function createModelGroupModelEntry(
  metaModelID: string,
  tagModelID: string,
  session: Session
) {
  const modelGroupModel = serializeModel(createModelGroupModel(metaModelID))
  const modelGroupID = await createEntry(metaModelID, modelGroupModel, session)

  const modelGroupTag = {model: modelGroupID, tag: ModelGroupTag}
  const tagID = await createEntry(tagModelID, modelGroupTag, session)

  const currentDateString = new Date().toISOString()

  return {
    modelEntry: {
      id: modelGroupID,
      model: metaModelID,
      created: currentDateString,
      updated: currentDateString,
      value: modelGroupModel
    } as Entry,
    tagEntry: {
      id: tagID,
      model: tagModelID,
      created: currentDateString,
      updated: currentDateString,
      value: modelGroupTag
    } as Entry
  }
}

export async function createEditorContextModelEntry(
  metaModelID: string,
  tagModelID: string,
  modelGroupID: string,
  session: Session
) {
  const editorContextModel = serializeModel(createEditorContextModel(modelGroupID))
  const editorContextID = await createEntry(metaModelID, editorContextModel, session)

  const editorContextTag = {model: editorContextID, tag: EditorContextTagV2}
  const tagID = await createEntry(tagModelID, editorContextTag, session)

  const currentDateString = new Date().toISOString()

  return {
    modelEntry: {
      id: editorContextID,
      model: metaModelID,
      created: currentDateString,
      updated: currentDateString,
      value: editorContextModel
    } as Entry,
    tagEntry: {
      id: tagID,
      model: tagModelID,
      created: currentDateString,
      updated: currentDateString,
      value: editorContextTag
    } as Entry
  }
}

export class EditorStore {
  // Session Data
  // ------------

  @observable.ref public session: Session | undefined
  @observable.ref public isRestoringSession: Boolean = false

  // Karma Data
  // ----------

  private disposeTagReaction: IReactionDisposer | undefined
  private disposeModelReaction: IReactionDisposer | undefined
  private disposeViewContextReaction: IReactionDisposer | undefined
  private disposeModelGroupReaction: IReactionDisposer | undefined
  private disposeEditorContextReaction: IReactionDisposer | undefined

  public readonly tags = observable.shallowMap<string>()
  public readonly entries = observable.shallowMap<IObservableArray<Entry>>()
  public readonly models = observable.shallowMap<Model>()

  // Editor Data
  // -----------

  @observable.ref public isDeveloper: boolean = false

  public readonly viewContexts = observable.shallowArray<ViewContext>()
  public readonly editorContexts = observable.shallowArray<EditorContext>()
  public readonly modelGroups = observable.shallowArray<ModelGroup>()

  @observable.ref private _activeEditorContext: EditorContext | undefined

  // Misc
  // ----

  @observable.ref public unsavedChangesCount: number = 0

  constructor() {
    this.isDeveloper = Boolean(storage.get(DeveloperStorageKey))

    reaction(
      () => this._activeEditorContext,
      async activeEditorContext => {
        if (activeEditorContext) {
          storage.set(ActiveEditorContextStorageKey, activeEditorContext.id)
        } else {
          storage.remove(ActiveEditorContextStorageKey)
        }
      }
    )

    reaction(
      () => this.isDeveloper,
      async isDeveloper => {
        if (isDeveloper) {
          storage.set(DeveloperStorageKey, isDeveloper)
        } else {
          storage.remove(DeveloperStorageKey)
        }
      }
    )

    // Session reaction
    reaction(
      () => this.session,
      async session => {
        if (session) {
          storage.set(SessionStorageKey, session)
        } else {
          storage.remove(SessionStorageKey)
        }
      }
    )
  }

  // Session Helpers
  // ---------------

  private startSessionRenewal() {
    setInterval(async () => {
      try {
        debug.info('Automatically renewing session...')
        await this.renewSession()
      } catch (err) {
        console.error("Couldn't restore session!")
        return
      }
    }, SessionRenewalInterval)
  }

  // Session Actions
  // ---------------

  @action
  public async restoreSessionFromLocalStorage() {
    const rawSession = storage.get(SessionStorageKey)
    if (!rawSession) return
    return this.restoreSession(rawSession)
  }

  @action
  public async restoreSession(session: Session) {
    this.destroySession()
    this.isRestoringSession = true

    try {
      const newSession = await renewSession(session)
      await this.loadBaseData(newSession)
      runInAction('restoreSession', () => {
        this.session = newSession
      })
      this.startSessionRenewal()
      return newSession
    } catch (err) {
      debug.info(`Couldn't restore session: ${err.message}`)
      storage.remove(SessionStorageKey)
      return
    } finally {
      runInAction('restoreSession', () => {
        this.isRestoringSession = false
      })
    }
  }

  /** @throws {APIError} */
  @action
  public async renewSession() {
    if (this.session) {
      const session = await renewSession(this.session)
      runInAction('renewSession', () => {
        this.session = session
      })
    }
  }

  /** @throws {APIError} */
  @action
  public async login(endpoint: string, username: string, password: string) {
    this.destroySession()

    const session = await authenticate(endpoint, '', username, password)
    await this.loadBaseData(session)
    runInAction('login', () => {
      this.session = session
    })
    this.startSessionRenewal()
    return session
  }

  @action
  public async loginWithSignature(
    endpoint: string,
    database: string,
    username: string,
    signature: string
  ) {
    this.destroySession()

    const session: Session = {endpoint, database, username, signature}
    await this.loadBaseData(session)
    runInAction('login', () => {
      this.session = session
    })
    this.startSessionRenewal()
    return session
  }

  @action
  public destroySession() {
    this.session = undefined

    if (this.disposeTagReaction) this.disposeTagReaction()
    if (this.disposeModelReaction) this.disposeModelReaction()
    if (this.disposeViewContextReaction) this.disposeViewContextReaction()
    if (this.disposeModelGroupReaction) this.disposeModelGroupReaction()
    if (this.disposeEditorContextReaction) this.disposeEditorContextReaction()

    this.tags.clear()
    this.entries.clear()
    this.models.clear()
    this.viewContexts.clear()
    this.editorContexts.clear()
    this.modelGroups.clear()

    this._activeEditorContext = undefined
  }

  // Karma Helpers
  // -------------

  private handleAPIError(err: APIError, _critical?: boolean) {
    debug.warn('API Error:', err.message, err.response ? err.response.data : undefined)
    // if (critical || !err.response || err.response.status === 403 || err.response.status === 404) {
    //   this.destroySession()
    // }

    return err
  }

  // Karma Actions
  // -------------

  @computed
  public get reverseTags() {
    return this.tags.entries().reduce(
      (prev, [key, value]) => {
        prev[value] = key
        return prev
      },
      {} as ObjectMap<string>
    )
  }

  @computed
  public get modelList() {
    return this.models.entries().map(([id, model]) => {
      return {id, model}
    })
  }

  /** @throws {APIError} */
  @action
  private async loadBaseData(session: Session) {
    let tagEntries = await getAllEntriesForTag(TagTag, session)
    const tags = parseEntriesAsTagMap(tagEntries)

    let modelEntries = await getAllEntriesForTag(ModelTag, session)

    const tagModelID = tags[TagTag]
    const metaModelID = tags[ModelTag]
    const userModelID = tags[UserTag]
    const roleModelID = tags[RoleTag]

    if (!tagModelID || !metaModelID || !userModelID || !roleModelID) {
      throw new Error("Couldn't find ID for tags, model, user or role!")
    }

    let viewContextID = tags[ViewContextTagV2] || tags[ViewContextTagV1]
    let viewContextEntries: Entry[] = []

    if (!viewContextID) {
      debug.info('Creating ViewContext model...')
      const result = await createViewContextModelEntry(metaModelID, tagModelID, session)

      viewContextID = result.modelEntry.id

      tagEntries.push(result.tagEntry)
      modelEntries.push(result.modelEntry)
    } else {
      viewContextEntries = await getAllEntriesForModel(viewContextID, session)
    }

    let modelGroupID = tags[ModelGroupTag]
    let modelGroupEntries: Entry[] = []

    if (!modelGroupID) {
      debug.info('Creating ModelGroup model...')
      const result = await createModelGroupModelEntry(metaModelID, tagModelID, session)

      modelGroupID = result.modelEntry.id

      tagEntries.push(result.tagEntry)
      modelEntries.push(result.modelEntry)
    } else {
      modelGroupEntries = await getAllEntriesForModel(modelGroupID, session)
    }

    let editorContextID = tags[EditorContextTagV2] || tags[EditorContextTagV1]
    let editorContextEntries: Entry[] = []

    if (!editorContextID) {
      debug.info('Creating EditorContext model...')
      const result = await createEditorContextModelEntry(
        metaModelID,
        tagModelID,
        modelGroupID,
        session
      )

      editorContextID = result.modelEntry.id

      tagEntries.push(result.tagEntry)
      modelEntries.push(result.modelEntry)
    } else {
      editorContextEntries = await getAllEntriesForModel(editorContextID, session)
    }

    runInAction('loadBaseData', () => {
      this.entries.set(tagModelID, observable.shallowArray(tagEntries))
      this.entries.set(metaModelID, observable.shallowArray(modelEntries))
      this.entries.set(viewContextID!, observable.shallowArray(viewContextEntries))
      this.entries.set(modelGroupID!, observable.shallowArray(modelGroupEntries))
      this.entries.set(editorContextID!, observable.shallowArray(editorContextEntries))
    })

    this.disposeTagReaction = reaction(
      () => this.entries.get(tagModelID),
      tagEntries => {
        if (tagEntries) this.tags.replace(parseEntriesAsTagMap(tagEntries))
      },
      true
    )

    this.disposeModelReaction = reaction(
      () => this.entries.get(metaModelID),
      modelEntries => {
        if (modelEntries) this.models.replace(parseEntriesAsModelMap(modelEntries))
      },
      true
    )

    this.disposeViewContextReaction = reaction(
      () => {
        return {
          modelEntries: this.models.entries(),
          reverseTags: this.reverseTags,
          viewContextEntries: this.entries.get(viewContextID!)
        }
      },
      ({reverseTags, modelEntries, viewContextEntries}) => {
        this.viewContexts.clear()

        let viewContexts: ViewContext[] = []

        if (viewContextEntries) {
          viewContexts = viewContextEntries.map(entry => entryToViewContext(entry))
        }

        const defaultViewContextMap = createDefaultViewContextMap({
          userModelID,
          roleModelID,
          tagModelID,
          editorContextID: editorContextID!,
          modelGroupID: modelGroupID!,
          viewContextID: viewContextID!
        })

        this.viewContexts.push(
          ...modelEntries.map(([id, model]) => {
            const tag = reverseTags[id]
            const deducedViewContext = inferViewContextFromModel([id, id], model, tag)
            const matchingViewContexts = viewContexts.filter(
              viewContext => viewContext.model[1] === id
            )
            const defaultContext = defaultViewContextMap[id]

            if (defaultContext) matchingViewContexts.unshift(defaultContext)

            return matchingViewContexts.reduce((prev, viewContext) => {
              return mergeViewContext(prev, viewContext)
            }, deducedViewContext)
          })
        )
      },
      true
    )

    this.disposeEditorContextReaction = reaction(
      () => {
        const entries = this.entries.get(editorContextID!)

        let editorContexts: EditorContext[] = []

        if (entries) {
          editorContexts = entries.map(entry =>
            unserializeEditorContext(entry.id, entry.value)
          ) as any
        }

        return {editorContexts, isDeveloper: this.isDeveloper}
      },
      ({editorContexts, isDeveloper}) => {
        this.editorContexts.replace(editorContexts)

        if (isDeveloper || this.editorContexts.length === 0) {
          this.editorContexts.push({
            id: DevelopmentEditorContextID,
            name: 'Development',
            privileges: [],
            modelGroups: [DevelopmentModelGroupID]
          })
        }

        if (!this._activeEditorContext) {
          const activeEditorContext = storage.get(ActiveEditorContextStorageKey)
          const editorContext = this.editorContexts.find(
            editorContext => editorContext.id === activeEditorContext
          )

          this._activeEditorContext = editorContext || this.editorContexts[0]
        } else {
          const stillAvailable = this.editorContexts.some(
            context => context.id === this._activeEditorContext!.id
          )

          if (!stillAvailable) {
            this._activeEditorContext = this.editorContexts[0]
          }
        }
      },
      true
    )

    this.disposeModelGroupReaction = reaction(
      () => {
        const entries = this.entries.get(modelGroupID!)
        const modelIDs = this.modelList.map(model => model.id)
        const developmentContextExists = this.editorContexts.some(
          context => context.id === DevelopmentEditorContextID
        )

        let modelGroups: ModelGroup[] = []

        if (entries) {
          modelGroups = entries.map(entry => unserializeModelGroup(entry.id, entry.value)) as any
        }

        return {modelGroups, modelIDs, developmentContextExists}
      },
      ({modelGroups, modelIDs, developmentContextExists}) => {
        this.modelGroups.replace(modelGroups)

        if (developmentContextExists) {
          this.modelGroups.push({
            id: DevelopmentModelGroupID,
            name: 'All',
            models: modelIDs
          })
        }
      },
      true
    )
  }

  /** @throws {APIError} */
  @action
  public async loadEntriesForModel(id: string) {
    if (!this.session) {
      throw new Error('Called "loadEntriesForModel" without a session!')
    }

    let newEntries: Entry[]

    try {
      newEntries = await getAllEntriesForModel(id, this.session)
    } catch (err) {
      throw this.handleAPIError(err)
    }

    runInAction('loadEntriesForModel', () => {
      let entries = this.entries.get(id)

      if (!entries) {
        entries = observable.shallowArray<Entry>()
        this.entries.set(id, entries)
      }

      entries.clear()
      entries.push(...newEntries)
    })

    return newEntries
  }

  /** @throws {APIError} */
  @action
  public async loadEntryForID(model: string, id: string) {
    if (!this.session) {
      throw new Error('Called "loadEntryForID" without a session!')
    }

    let entry: Entry

    try {
      entry = await getEntryForID(model, id, this.session)
    } catch (err) {
      throw this.handleAPIError(err)
    }

    runInAction('loadEntryForID', () => {
      const modelEntries = this.entries.get(model)
      if (!modelEntries) return

      const index = modelEntries.findIndex(entry => entry.id === id)
      if (index !== -1) modelEntries[index] = entry
    })

    return entry
  }

  /** @throws {APIError} */
  @action
  public async createEntry(model: string, value: any) {
    if (!this.session) {
      throw new Error('Called "createEntry" without a session!')
    }

    let entryID: string

    try {
      entryID = await createEntry(model, value, this.session)
    } catch (err) {
      throw this.handleAPIError(err)
    }

    runInAction('createEntry', () => {
      const modelEntries = this.entries.get(model)
      if (!modelEntries) return

      const currentDateString = new Date().toISOString()

      modelEntries.push({
        model,
        id: entryID,
        created: currentDateString,
        updated: currentDateString,
        value
      })
    })

    return entryID
  }

  /** @throws {APIError} */
  @action
  public async updateEntry(model: string, id: string, value: any) {
    if (!this.session) {
      throw new Error('Called "updateEntry" without a session!')
    }

    let entryID: string

    try {
      entryID = await updateEntry(model, id, value, this.session)
    } catch (err) {
      throw this.handleAPIError(err)
    }

    runInAction('updateEntry', () => {
      const modelEntries = this.entries.get(model)
      if (!modelEntries) return

      const index = modelEntries.findIndex(entry => entry.id === entryID)

      if (index >= 0) {
        const currentDateString = new Date().toISOString()

        modelEntries.splice(index, 1, {
          model,
          id: entryID,
          created: currentDateString,
          updated: currentDateString,
          value
        })
      }
    })

    return entryID
  }

  /** @throws {APIError} */
  @action
  public async deleteEntry(model: string, id: string) {
    if (!this.session) {
      throw new Error('Called "deleteEntry" without a session!')
    }

    try {
      await deleteEntry(model, id, this.session)
    } catch (err) {
      throw this.handleAPIError(err)
    }

    runInAction('deleteEntry', () => {
      const modelEntries = this.entries.get(model)
      if (modelEntries) {
        const index = modelEntries.findIndex(item => item.id === id)
        if (index !== -1) modelEntries.splice(index, 1)
      }
    })

    return id
  }

  /** @throws {APIError} */
  @action
  public async cloneEntry(model: string, id: string) {
    const entry = await this.loadEntryForID(model, id)
    await this.createEntry(model, entry.value)
  }

  // Editor Actions
  // --------------

  @computed
  public get viewContextMap(): ObjectMap<ViewContext | undefined> {
    return this.viewContexts.reduce((prev: ObjectMap<ViewContext | undefined>, viewContext) => {
      prev[viewContext.model[1]] = viewContext
      return prev
    }, {})
  }

  @computed
  public get activeEditorContext() {
    if (!this._activeEditorContext) throw new Error('No active EditorContext set!')
    return this._activeEditorContext
  }

  public set activeEditorContext(editorContext: EditorContext) {
    this._activeEditorContext = editorContext
  }

  @computed
  public get activeEditorContextID() {
    if (!this._activeEditorContext) throw new Error('No active EditorContext set!')
    return this._activeEditorContext.id
  }

  public set activeEditorContextID(editorContextID: string) {
    const editorContext = this.editorContexts.find(context => context.id === editorContextID)
    if (!editorContext) throw new Error(`No EditorContext found with ID: ${editorContextID}`)
    this.activeEditorContext = editorContext
  }

  @computed
  public get activeModelGroups() {
    return this.activeEditorContext.modelGroups.map(groupID => {
      return this.modelGroups.find(modelGroup => modelGroup.id === groupID)!
    })
  }

  @action
  public toggleDeveloperMode() {
    this.isDeveloper = !this.isDeveloper
  }

  @computed
  private get fuzzyModelSearchInstance() {
    const modelIDs = this.activeModelGroups.reduce(
      (modelIDs, group) => {
        const nonDuplicateIDs = group.models.filter(modelID => !modelIDs.includes(modelID))
        modelIDs.push(...nonDuplicateIDs)
        return modelIDs
      },
      [] as string[]
    )

    const viewContexts = modelIDs
      .map(modelID => this.viewContextMap[modelID]!)
      .filter(viewContext => viewContext != undefined)

    const searchViewContexts = viewContexts.map(viewContext => ({
      name: viewContext.name,
      slug: viewContext.slug,
      model: viewContext.model
    }))

    return new Fuse(searchViewContexts, {
      shouldSort: true,
      tokenize: true,
      matchAllTokens: false,
      location: 0,
      distance: 50,
      threshold: 0.5,
      keys: ['name']
    })
  }

  @action
  public searchModel(term: string) {
    return this.fuzzyModelSearchInstance.search<{
      name: string
      model: string
      slug: string
    }>(term)
  }

  @action
  public increaseUnsavedChangesCount() {
    this.unsavedChangesCount++
  }

  @action
  public decreaseUnsavedChangesCount() {
    this.unsavedChangesCount--
  }

  @computed
  public get hasUnsavedChanges() {
    return this.unsavedChangesCount > 0
  }
}
