import {ServerPlugin} from '@karma.run/editor-common'
import {name, version} from '../common/version'
import {DraftJSField} from '../common/field'

export class DraftJSPlugin implements ServerPlugin {
  public name: string = name
  public version: string = version
  public clientModule = '@karma.run/editor-plugin-draft-js/client'

  public registerFields() {
    return [DraftJSField]
  }
}
