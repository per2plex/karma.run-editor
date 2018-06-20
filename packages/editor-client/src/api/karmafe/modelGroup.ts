import {Ref} from '@karma.run/sdk'
import * as models from '../../api/karma/model'

export type ModelID = string
export type ModelGroupID = symbol | Ref
export const ModelGroupTag = '_frontend_model_group_v1'

export interface ModelGroup {
  id: ModelGroupID
  name: string
  models: Ref[]
}

export function createModelGroupModel(metaModelID: ModelID) {
  return models.Struct({
    name: models.String(),
    models: models.List(models.Ref(metaModelID))
  })
}

export function unserializeModelGroup(id: string, rawModelGroup: any): ModelGroup {
  return {id, ...rawModelGroup}
}

export function serializeModelGroup(modelGroup: ModelGroup) {
  const {id, ...data} = modelGroup
  return data
}
