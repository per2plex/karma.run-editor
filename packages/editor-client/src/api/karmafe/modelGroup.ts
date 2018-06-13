import * as models from '../../api/karma/model'

export type ModelID = string
export type ModelGroupID = string
export const ModelGroupTag = '_frontend_model_group_v1'

export interface ModelGroup {
  id: string
  icon?: string
  name: string
  models: ModelID[]
}

export function createModelGroupModel(metaModelID: ModelID) {
  return models.Struct({
    name: models.String(),
    icon: models.Optional(models.String()),
    models: models.List(models.Ref(metaModelID))
  })
}

export function unserializeModelGroup(id: string, rawModelGroup: any): ModelGroup {
  if (
    typeof rawModelGroup !== 'object' ||
    (rawModelGroup.icon != undefined && typeof rawModelGroup.icon !== 'string') ||
    typeof rawModelGroup.name !== 'string' ||
    !Array.isArray(rawModelGroup.models) ||
    !rawModelGroup.models.every((modelID: string) => typeof modelID === 'string')
  ) {
    throw new Error('Invalid ModelGroup!')
  }

  return {id, ...rawModelGroup}
}

export function serializeModelGroup(modelGroup: ModelGroup) {
  const {id, ...data} = modelGroup
  return data
}
