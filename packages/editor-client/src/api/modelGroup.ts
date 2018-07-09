import {Ref} from '@karma.run/sdk'

export const ModelGroupTag = '_frontend_model_group_v1'

export interface ModelGroup {
  id: string
  name: string
  models: Ref[]
}

export function unserializeModelGroup(id: string, rawModelGroup: any): ModelGroup {
  return {id, ...rawModelGroup}
}

export function serializeModelGroup(modelGroup: ModelGroup) {
  const {id, ...data} = modelGroup
  return data
}
