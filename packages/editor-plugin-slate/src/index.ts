import {ClientPlugin} from '@karma.run/editor-client'
import {name, version} from './version'
import {SlateField} from './field'

export * from './field'

export class SlatePlugin implements ClientPlugin {
  public readonly name = name
  public readonly version = version

  public registerFields() {
    return [SlateField]
  }
}
