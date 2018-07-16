export const EditorContextTagV1 = '_frontend_editor_context_v1'
export const EditorContextTagV2 = '_frontend_editor_context_v2'

export interface EditorContext {
  id: string
  name: string
  modelGroups: string[]
  privileges: string[]
}

export function unserializeEditorContext(id: string, rawEditorSettings: any): EditorContext {
  return {id, ...rawEditorSettings}
}

export function serializeEditorContext(editorSettings: EditorContext) {
  const {id, ...data} = editorSettings
  return data
}
