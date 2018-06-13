import * as React from 'react'

import {observer} from 'mobx-react'
import {TextInput} from '../../ui/common'
import {PasswordFieldStore} from '../../store/fields/passwordFieldStore'
import {style} from 'typestyle'
import {RenderOpts} from '../../ui/fields/renderFieldStore'
import {FieldLabel, Field} from '../../ui/fields/field'

export namespace PasswordFieldRenderer {
  export interface Props extends RenderOpts {
    store: PasswordFieldStore
  }
}

@observer
export class PasswordFieldRenderer extends React.Component<PasswordFieldRenderer.Props> {
  private handlePasswordChange = (value: string) => {
    this.props.store.changePassword(value)
  }

  private handlePasswordConfirmChange = (value: string) => {
    this.props.store.changePasswordConfirm(value)
  }

  public render() {
    return (
      <Field
        className={PasswordFieldRenderer.Style}
        depth={this.props.depth}
        index={this.props.index}>
        {!this.props.isWrapped && (
          <FieldLabel
            label={this.props.store.label}
            description={this.props.store.description}
            depth={this.props.depth}
            index={this.props.index || 0}
          />
        )}
        <div className="content">
          <TextInput
            isPassword={true}
            placeholder="New Password (Leave empty for no change)"
            onChange={this.handlePasswordChange}
            value={this.props.store.password}
            disabled={this.props.disabled}
          />
          <TextInput
            isPassword={true}
            placeholder="Confirm"
            onChange={this.handlePasswordConfirmChange}
            value={this.props.store.passwordConfirm}
            disabled={this.props.disabled}
          />
        </div>
      </Field>
    )
  }
}

export namespace PasswordFieldRenderer {
  export const Style = style({
    $debugName: 'PasswordFieldRenderer',

    display: 'flex',
    flexDirection: 'column',

    $nest: {
      '> .content': {
        display: 'flex'
      }
    }
  })
}
