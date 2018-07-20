import {ClientPlugin} from '@karma.run/editor-client'
import {name, version} from './version'

export * from './field'
export * from './input'

export class DraftJSPlugin implements ClientPlugin {
  public readonly name = name
  public readonly version = version
}
