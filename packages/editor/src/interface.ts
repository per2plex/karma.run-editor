import {ServerPlugin} from '@karma.run/editor-common'

export interface Configuration {
  port?: number
  karmaDataURL?: string
  plugins?: (ServerPlugin | string)[]
}
