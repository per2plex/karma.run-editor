import {ModelGroup} from './modelGroup'

export interface EditorContext {
  id?: string
  name: string
  modelGroups: ModelGroup[]
}
