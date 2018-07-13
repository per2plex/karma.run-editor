/**
 * @module @karma.run/editor-media-client
 * @license MIT
 *
 * Copyright (c) 2018, karma.run AG.
 */
import {ClientPlugin} from '@karma.run/editor-common'
// import {name, version} from '../../package.json'

export * from './api'
export * from './component'
export * from '../common'

export default class MediaPlugin implements ClientPlugin {
  public name: string = '@karma.run/editor-plugin-media'
  public version: string = '0.13.0'

  public initialize() {}
}
