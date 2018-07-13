/**
 * @module @karma.run/editor-media-server
 * @license MIT
 *
 * Copyright (c) 2018, karma.run AG.
 */
// import {mediaMiddleware} from './middleware'

// export * from './middleware'
// export * from './backend'
// export * from './action'

// export default mediaMiddleware

// export * from '@karma.run/editor-media-common'

import {ServerPlugin} from '@karma.run/editor-common'
// import {name, version} from '../../package.json'

export default class MediaPlugin implements ServerPlugin {
  public name: string = '@karma.run/editor-plugin-media'
  public version: string = '0.13.0'
  public clientModule = '@karma.run/editor-plugin-media/lib/client'

  public initialize() {}
}
