import {ModelGroupID, ModelID} from '../../api/karmafe/modelGroup'
import * as models from '../../api/karma/model'

export type Privilege = string
export type EditorContextID = string

export const EditorContextTagV1 = '_frontend_editor_context_v1'
export const EditorContextTagV2 = '_frontend_editor_context_v2'

export interface EditorContext {
  id: string
  name: string
  privileges?: Privilege[]
  modelGroups: ModelGroupID[]
}

export function createEditorContextModel(modelGroupModelID: ModelID) {
  return models.Struct({
    name: models.String(),
    privileges: models.Optional(models.List(models.String())),
    modelGroups: models.List(models.Ref(modelGroupModelID))
  })
}

export function unserializeEditorContext(id: string, rawEditorSettings: any): EditorContext {
  return {id, ...rawEditorSettings}
}

export function serializeEditorContext(editorSettings: EditorContext) {
  const {id, ...data} = editorSettings
  return data
}
