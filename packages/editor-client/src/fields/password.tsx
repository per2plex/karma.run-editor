import React from 'react'
import {expression as e, Expression} from '@karma.run/sdk'

import {Model} from '../api/model'
import {ErrorField} from './error'
import {
  SerializedField,
  EditComponentRenderProps,
  EditRenderProps,
  Field,
  ListRenderProps
} from './interface'

import {Field as FieldComponent, FieldLabel} from '../ui/common/field'
import {TextInput} from '../ui/common/input'
import {CardSection} from '../ui/common/card'
import {SortConfiguration, FilterConfiguration} from '../filter/configuration'
import {convertKeyToLabel} from '../util/string'
import {generateHash} from '../util/bcrypt'
import {FlexList} from '../ui/common'

export class PasswordFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<PasswordField, PasswordFieldValue>
> {
  private handlePasswordChange = (value: string) => {
    this.props.onValueChange(
      {
        ...this.props.value,
        password: value
      },
      this.props.changeKey
    )
  }

  private handlePasswordConfirmChange = (value: string) => {
    this.props.onValueChange(
      {
        ...this.props.value,
        passwordConfirm: value
      },
      this.props.changeKey
    )
  }

  public render() {
    return (
      <FieldComponent depth={this.props.depth} index={this.props.index}>
        {!this.props.isWrapped && (
          <FieldLabel
            label={this.props.field.label}
            description={this.props.field.description}
            depth={this.props.depth}
            index={this.props.index || 0}
          />
        )}
        <FlexList>
          <TextInput
            isPassword={true}
            placeholder="New Password (Leave empty for no change)"
            onChange={this.handlePasswordChange}
            value={this.props.value.password}
            disabled={this.props.disabled}
          />
          <TextInput
            isPassword={true}
            placeholder="Confirm"
            onChange={this.handlePasswordConfirmChange}
            value={this.props.value.passwordConfirm}
            disabled={this.props.disabled}
          />
        </FlexList>
      </FieldComponent>
    )
  }
}

export interface PasswordFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly costFactor?: number
}

export interface PasswordFieldValue {
  hash?: string
  password: string
  passwordConfirm: string
}

export class PasswordField implements Field<PasswordFieldValue> {
  public readonly label?: string
  public readonly description?: string
  public readonly costFactor?: number

  public readonly defaultValue: PasswordFieldValue = {
    password: '',
    passwordConfirm: ''
  }

  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts: PasswordFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.costFactor = opts.costFactor
  }

  public renderListComponent(props: ListRenderProps<PasswordFieldValue>) {
    return <CardSection>{props.value}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<PasswordFieldValue>) {
    return <PasswordFieldEditComponent {...props} field={this} />
  }

  public transformRawValue(value: any): PasswordFieldValue {
    return {
      hash: value,
      password: '',
      passwordConfirm: ''
    }
  }

  public transformValueToExpression(value: PasswordFieldValue): Expression {
    if (!value.hash) return e.null()
    return e.string(value.hash)
  }

  public async onSave(value: PasswordFieldValue): Promise<PasswordFieldValue> {
    if (value.password && value.passwordConfirm && value.password === value.passwordConfirm) {
      return {
        hash: await generateHash(value.password, this.costFactor),
        password: '',
        passwordConfirm: ''
      }
    }

    return value
  }

  public isValidValue(value: PasswordFieldValue) {
    if (!value.hash) return ['noPasswordSet']
    return null
  }

  public serialize() {
    return {
      type: PasswordField.type,
      label: this.label,
      description: this.description,
      costFactor: this.costFactor
    }
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }

  public static type = 'password'

  static inferFromModel(model: Model, key: string | undefined) {
    if (key !== 'password') return null
    if (model.type !== 'string') return null

    return new PasswordField({label: convertKeyToLabel(key)})
  }

  static unserialize(rawField: SerializedField, model: Model) {
    if (model.type !== 'string') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new PasswordField({
      label: rawField.label,
      description: rawField.description,
      costFactor: rawField.costFactor
    })
  }
}
