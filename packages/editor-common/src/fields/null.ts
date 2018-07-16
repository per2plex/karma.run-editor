import {expression as e} from '@karma.run/sdk'

import {Model} from '../api/model'
import {ErrorField} from './error'

import {SerializedField, Field} from './interface'
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

  public serialize() {
    return {type: NullField.type}
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }

  public static type = 'null'

  static inferFromModel(model: Model) {
    if (model.type !== 'null') return null
    return new this()
  }

  static unserialize(rawField: SerializedField, model: Model) {
    if (model.type !== 'null') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new this()
  }
}
