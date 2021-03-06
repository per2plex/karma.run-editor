/**
 * @module @karma.run/editor-client
 * @license MIT
 *
 * Copyright (c) 2018, karma.run AG.
 */
import 'babel-polyfill'
import 'intersection-observer-polyfill/index.global'

import './ui/global'

export * from './editor'
export * from './version'
export {Theme} from './context/theme'
