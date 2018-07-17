import {ServerPlugin} from '@karma.run/editor-common'
import {EditorContextsForRolesFn, ViewContextsForRolesFn} from '@karma.run/editor-server'

export interface Configuration {
  port?: number
  karmaDataURL?: string
  plugins?: (ServerPlugin | string)[]
  editorContexts?: EditorContextsForRolesFn
  viewContexts?: ViewContextsForRolesFn
}
