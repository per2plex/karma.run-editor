import {expression as e, data as d} from '@karma.run/sdk'

import {Model} from '../api/model'
import {ErrorField} from './error'

import {Field, SerializedField, FieldOptions} from './interface'
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
    return d.expr(e.currentUser())
  }

  public isValidValue() {
    return null
  }

  public serialize(): SerializedField {
    return {type: CurrentUserField.type}
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }

  public static type = 'currentUser'

  static create(model: Model, opts: FieldOptions) {
    if (model.type !== 'ref') {
      return new ErrorField({
        label: opts.label,
        message: `Expected model type "ref" received: "${model.type}"`
      })
    }

    return new this()
  }

  static unserialize() {
    return new this()
  }
}
