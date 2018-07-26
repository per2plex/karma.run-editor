import {ObjectMap} from '@karma.run/editor-common'
import {ClientPlugin} from '@karma.run/editor-client'

import {name, version} from './version'
import {SlateFieldConstructor, Control, SchemaDefaultValueTuple} from './field'

export * from './field'

export interface SlatePluginOptions {
  readonly controls?: ObjectMap<Control>
  readonly schemas?: ObjectMap<SchemaDefaultValueTuple>
}

export class SlatePlugin implements ClientPlugin {
  public readonly name = name
  public readonly version = version

  private readonly controlMap: ReadonlyMap<string, Control>
  private readonly schemaMap: ReadonlyMap<string, SchemaDefaultValueTuple>

  public constructor(opts: SlatePluginOptions = {}) {
    this.controlMap = new Map(Object.entries(opts.controls ? opts.controls : {}))
    this.schemaMap = new Map(Object.entries(opts.schemas ? opts.schemas : {}))
  }

  public registerFields() {
    return [SlateFieldConstructor(this.controlMap, this.schemaMap)]
  }
}
