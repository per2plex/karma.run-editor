import {ClientPlugin} from '@karma.run/editor-common'
import {name, version} from '../common/version'
import {DraftJSField} from '../common/field'

export default class DraftJSPlugin implements ClientPlugin {
  public name: string = name
  public version: string = version

  public registerFields() {
    return [DraftJSField]
  }
}
