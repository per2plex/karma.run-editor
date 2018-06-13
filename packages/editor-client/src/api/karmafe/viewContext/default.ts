import {ViewContext} from './model'

export function createDefaultUserViewContext(userModelID: string): ViewContext {
  return {
    model: userModelID,
    name: 'User',
    descriptionKeyPaths: [['username']],
    fields: [
      {keyPath: ['username'], type: undefined},
      {keyPath: ['password'], type: 'password'},
      {keyPath: ['roles'], type: undefined}
    ]
  }
}

export function createDefaultRoleViewContext(roleModelID: string): ViewContext {
  return {
    model: roleModelID,
    name: 'Role',
    descriptionKeyPaths: [['name']],
    fields: [{keyPath: ['name'], type: undefined}, {keyPath: ['permissions'], type: undefined}]
  }
}

export function createDefaultTagViewContext(tagModelID: string): ViewContext {
  return {
    model: tagModelID,
    name: 'Tag',
    descriptionKeyPaths: [['tag'], ['model']],
    fields: [{keyPath: ['tag'], type: undefined}, {keyPath: ['model'], type: undefined}]
  }
}

export function createDefaultEditorContextViewContext(editorContextID: string): ViewContext {
  return {
    model: editorContextID,
    name: 'Editor Context',
    descriptionKeyPaths: [['name']],
    fields: [{keyPath: ['name'], type: undefined}, {keyPath: ['modelGroups'], type: undefined}]
  }
}

export function createDefaultModelGroupViewContext(modelGroupID: string): ViewContext {
  return {
    model: modelGroupID,
    name: 'Model Group',
    descriptionKeyPaths: [['name']],
    fields: [
      {keyPath: ['name'], type: undefined},
      {keyPath: ['icon'], type: undefined},
      {keyPath: ['models'], type: undefined}
    ]
  }
}

export function createDefaultViewContextViewContext(viewContextID: string): ViewContext {
  return {
    model: viewContextID,
    name: 'View Context',
    descriptionKeyPaths: [['name']],
    fields: [
      {keyPath: ['name'], type: undefined},
      {keyPath: ['description'], type: undefined},
      {keyPath: ['descriptionKeyPaths'], type: undefined},
      {keyPath: ['slug'], type: undefined},
      {keyPath: ['icon'], type: undefined},
      {keyPath: ['key'], type: undefined},
      {keyPath: ['model'], type: undefined},
      {keyPath: ['fields'], type: undefined}
    ]
  }
}

export interface DefaultViewContextIDMap {
  userModelID: string
  roleModelID: string
  tagModelID: string
  editorContextID: string
  modelGroupID: string
  viewContextID: string
}

export function createDefaultViewContextMap(idMap: DefaultViewContextIDMap) {
  return {
    [idMap.userModelID]: createDefaultUserViewContext(idMap.userModelID),
    [idMap.roleModelID]: createDefaultRoleViewContext(idMap.roleModelID),
    [idMap.tagModelID]: createDefaultTagViewContext(idMap.tagModelID),
    [idMap.editorContextID]: createDefaultEditorContextViewContext(idMap.editorContextID),
    [idMap.modelGroupID]: createDefaultModelGroupViewContext(idMap.modelGroupID),
    [idMap.viewContextID]: createDefaultViewContextViewContext(idMap.viewContextID)
  }
}
