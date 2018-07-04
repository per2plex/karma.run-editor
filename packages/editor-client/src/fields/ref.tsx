import React from 'react'
import * as shortid from 'shortid'
import {expression as e, data as d, Ref} from '@karma.run/sdk'

import {Model} from '../api/model'
import {ErrorField} from './error'
import {SerializedField, EditComponentRenderProps, EditRenderProps, Field} from './interface'
import {Field as FieldComponent, FieldLabel} from '../ui/fields/field'
import {TextAreaInput, TextInput, TextInputType} from '../ui/common/input'
import {CardSection} from '../ui/common/card'
import {SortConfigration} from '../filter/configuration'
import {SortType} from '@karma.run/editor-common'
import {withSession, SessionContext} from '../context/session'

export interface RefFieldEditComponentProps extends EditComponentRenderProps<RefField> {
  sessionContext: SessionContext
}

export class RefFieldEditComponent extends React.PureComponent<RefFieldEditComponentProps> {
  private handleChange = (value: any) => {
    this.props.onChange(value, this.props.changeKey)
  }

  public render() {
    return <div>test</div>
  }
}

export const RefFieldEditComponentContainer = withSession(RefFieldEditComponent)

export interface RefFieldOptions {
  readonly label?: string
  readonly description?: string
}

export type RefFieldValue = Ref | undefined

export class RefField implements Field<RefFieldValue> {
  public readonly label?: string
  public readonly description?: string

  public constructor(opts: RefFieldOptions) {
    this.label = opts.label
    this.description = opts.description
  }

  public renderListComponent(value: Ref) {
    return <CardSection>{value}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<RefFieldValue>) {
    return <RefFieldEditComponent {...props} field={this} />
  }

  public defaultValue() {
    return undefined
  }

  public transformRawValue(value: any) {
    return value
  }

  public transformValueToExpression(value: RefFieldValue) {
    if (!value) return e.null()
    return e.data(d.ref(value[0], value[1]))
  }

  public isValidValue(value: RefFieldValue) {
    return value == undefined ? ['emptyRefError'] : null
  }

  public serialize() {
    return {
      type: RefField.type,
      label: this.label,
      description: this.description
    }
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }

  public sortConfigurations(): SortConfigration[] {
    return [{key: shortid.generate(), type: SortType.String, label: this.label || '', path: []}]
  }

  public static type = 'ref'

  static inferFromModel(model: Model, label: string | undefined) {
    if (model.type !== 'ref') return null
    return new RefField({label})
  }

  static unserialize(rawField: SerializedField, model: Model) {
    if (model.type !== 'ref') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new RefField({
      label: rawField.label,
      description: rawField.description
    })
  }
}
