import {ClientPlugin} from '@karma.run/editor-common'

import {name, version} from '../common/version'
import {MediaField} from '../common/field'

export * from './component'

export default class MediaPlugin implements ClientPlugin {
  public name: string = name
  public version: string = version

  public registerFields() {
    return [MediaField]
  }
}