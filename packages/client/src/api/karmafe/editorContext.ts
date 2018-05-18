import { ModelGroupID, ModelID } from '../../api/karmafe/modelGroup'
import * as models from '../../api/karma/model'

export type EditorContextID = string
export const EditorContextTag = '_frontend_editor_context_v1'

export interface EditorContext {
  id: string
  name: string
  modelGroups: ModelGroupID[]
}

export function createEditorContextModel(modelGroupModelID: ModelID) {
  return models.Struct({
    name: models.String(),
    modelGroups: models.List(models.Ref(modelGroupModelID))
  })
}

export function unserializeEditorContext(id: string, rawEditorSettings: any): EditorContext {
  if (typeof rawEditorSettings !== 'object'
    || !Array.isArray(rawEditorSettings.modelGroups)
    || !rawEditorSettings.modelGroups.every((modelID: string) => typeof modelID === 'string')) {
    throw new Error('Invalid EditorContext!')
  }

  return {id, ...rawEditorSettings}
}

export function serializeEditorContext(editorSettings: EditorContext) {
  const {id, ...data} = editorSettings
  return data
}
