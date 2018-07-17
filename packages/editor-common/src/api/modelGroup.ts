import {Ref} from '@karma.run/sdk'

export interface ModelGroup {
  id?: string
  name: string
  models: Ref[]
}
