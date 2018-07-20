import {data as d, DataExpression} from '@karma.run/sdk'

import {Model} from '@karma.run/editor-common'
import {ErrorField} from './error'
import {ListFieldValue, ListField, ListFieldOptions, SerializedListField} from './list'
import {UnserializeFieldFunction, CreateFieldFunction} from '../api/field'

export class SetField extends ListField {
  public transformValueToExpression(value: ListFieldValue): DataExpression {
    return d.set(...value.map(({value}) => this.field.transformValueToExpression(value)))
  }

  public serialize(): SerializedListField {
    return {
      type: SetField.type,
      label: this.label,
      description: this.description,
      field: this.field.serialize()
    }
  }

  public static type = 'set'

  static canInferFromModel(model: Model) {
    return model.type === 'set'
  }

  static create(
    model: Model,
    opts: ListFieldOptions | undefined,
    createField: CreateFieldFunction
  ) {
    if (model.type !== 'set') {
      return new ErrorField({
        label: opts && opts.label,
        description: opts && opts.description,
        message: `Expected model type "set" received: "${model.type}"`
      })
    }

    return new this({...opts, field: createField(model.model, opts && opts.field)})
  }

  static unserialize(rawField: SerializedListField, unserializeField: UnserializeFieldFunction) {
    return new this({
      label: rawField.label,
      description: rawField.description,
      field: unserializeField(rawField.field)
    })
  }
}
