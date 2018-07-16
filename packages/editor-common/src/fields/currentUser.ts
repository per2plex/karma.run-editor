import {expression as e} from '@karma.run/sdk'

import {Model} from '../api/model'
import {ErrorField} from './error'

import {SerializedField, Field} from './interface'
import {SortConfiguration, FilterConfiguration} from '../interface/filter'

export class CurrentUserField implements Field<null> {
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
    return e.currentUser()
  }

  public isValidValue() {
    return null
  }

  public serialize() {
    return {type: CurrentUserField.type}
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }

  public static type = 'currentUser'

  static inferFromModel() {
    return null
  }

  static unserialize(rawField: SerializedField, model: Model) {
    if (model.type !== 'ref') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new this()
  }
}
