import {ObjectMap} from '@karma.run/editor-common'
import {ClientPlugin} from '@karma.run/editor-client'

import {name, version} from './version'
import {SlateFieldConstructor, Control} from './field'

export * from './field'

export class SlatePlugin implements ClientPlugin {
  public readonly name = name
  public readonly version = version

  private readonly controls: ReadonlyMap<string, Control>

  public constructor(controls: ObjectMap<Control> = {}) {
    this.controls = new Map(Object.entries(controls))
  }

  public registerFields() {
    return [SlateFieldConstructor(this.controls)]
  }
}
