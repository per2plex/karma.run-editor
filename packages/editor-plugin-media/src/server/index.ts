import {Router} from 'express'
import {ServerPlugin} from '@karma.run/editor-common'

import {name, version} from '../common/version'
import {mediaMiddleware} from './middleware'
import {MediaType} from '../common/interface'
import {MediaBackend} from '../server/backend'
import {MediaField} from '../common/field'

export * from './middleware'
export * from './backend'
export * from './action'

export interface MediaPluginOptions {
  hostname: string
  backend: MediaBackend
  allowedRoles: string[]
  allowedMediaTypes?: MediaType[]
  tempDirPath?: string
}

export class MediaPlugin implements ServerPlugin {
  public name: string = name
  public version: string = version
  public clientModule = '@karma.run/editor-plugin-media/client'

  private options: MediaPluginOptions

  public constructor(opts: MediaPluginOptions) {
    this.options = opts
  }

  public registerFields() {
    return [MediaField]
  }

  public registerRoutes(karmaDataURL: string, router: Router) {
    router.use(
      mediaMiddleware({
        ...this.options,
        karmaDataURL,
        hostname: `${this.options.hostname}/api/plugin/${name}`
      })
    )
  }
}

export default MediaPlugin
