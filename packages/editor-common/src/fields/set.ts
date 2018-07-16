import {expression as e, data as d} from '@karma.run/sdk'

import {Model} from '../api/model'
import {ErrorField} from './error'
import {ListFieldValue, ListField} from './list'
import {SerializedField, UnserializeFieldFunction, InferFieldFunction} from './interface'

export class SetField extends ListField {
  public transformValueToExpression(value: ListFieldValue) {
    return e.data(
      d.set(...value.map(({value}) => d.expr(this.field.transformValueToExpression(value))))
    )
  }

  public serialize() {
    return {
      type: SetField.type,
      label: this.label || null,
      description: this.description || null,
      field: this.field.serialize()
    }
  }

  public static type = 'set'

  static unserialize(
    rawField: SerializedField,
    model: Model,
    unserializeField: UnserializeFieldFunction
  ) {
    if (model.type !== 'set') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new this({
      label: rawField.label,
      description: rawField.description,
      field: unserializeField(rawField.field, model.model)
    })
  }

  static inferFromModel(model: Model, label: string | undefined, inferField: InferFieldFunction) {
    if (model.type !== 'set') return null
    return new this({label, field: inferField(model.model)})
  }
}
