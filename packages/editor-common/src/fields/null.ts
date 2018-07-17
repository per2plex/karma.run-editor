import {expression as e} from '@karma.run/sdk'

import {Model} from '../api/model'
import {ErrorField} from './error'

import {SerializedField, Field, FieldOptions} from './interface'
import {SortConfiguration, FilterConfiguration} from '../interface/filter'

export class NullField implements Field<null> {
  public readonly defaultValue: null = null
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public initialize() {
    return this
  }

  public renderListComponent() {
    return null
  }

  public renderEditComponent() {
    return null
  }

  public transformRawValue() {
    return null
  }

  public transformValueToExpression() {
    return e.null()
  }

  public isValidValue() {
    return null
  }

  public serialize(): SerializedField {
    return {type: NullField.type}
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }

  public static type = 'null'

  static canInferFromModel(model: Model) {
    return model.type === 'null'
  }

  static create(model: Model, opts?: FieldOptions) {
    if (model.type !== 'null') {
      return new ErrorField({
        label: opts && opts.label,
        message: `Expected model type "null" received: "${model.type}"`
      })
    }

    return new this()
  }

  static unserialize() {
    return new this()
  }
}
