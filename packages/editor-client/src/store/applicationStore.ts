import {NotificationStore} from '../store/notificationStore'
import {EditorStore} from '../store/editorStore'
import {ModelTag} from '../api/karma'

import * as debug from '../util/debug'
import {expose} from '../util/dev'

export interface ApplicationStore {
  readonly editorStore: EditorStore
  readonly locationStore: any
  readonly notificationStore: any
}

const editorStore = new EditorStore()

// editorStore.restoreSessionFromLocalStorage()
// locationStore.syncLocationFromURL()

expose('editorToggleDevelopmentMode', () => {
  editorStore.toggleDeveloperMode()
})

expose('editorSetDefaultLogin', () => {
  debug.warn(
    'This function is deprecated, use ' +
      'Env.override({DEFAULT_DATABASE: "", DEFAULT_USERNAME: "", DEFAULT_PASSWORD: ""}) instead'
  )
})

expose('editorUnsetDefaultLogin', () => {
  debug.warn('This function is deprecated, use Env.override() instead')
})

expose('editorCreateModel', async (value: any) => {
  const metaModelID = editorStore.tags.get(ModelTag)
  if (metaModelID) return await editorStore.createEntry(metaModelID, value)
  return undefined
})

expose('editorCreateEntry', async (model: string, value: any) => {
  return await editorStore.createEntry(model, value)
})

expose('editorLoadEntry', async (model: string, id: string) => {
  return await editorStore.loadEntryForID(model, id)
})

export const applicationStore: ApplicationStore = {
  editorStore,
  locationStore: {},
  notificationStore: {}
}
