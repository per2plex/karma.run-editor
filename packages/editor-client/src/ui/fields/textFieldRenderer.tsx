import * as React from 'react'

import {observer} from 'mobx-react'
import {TextInput, TextAreaInput, TextInputType} from '../../ui/common'
import {TextFieldStore} from '../../store/fields/textFieldStore'
import {Field, FieldLabel} from '../../ui/fields/field'
import {RenderOpts} from '../../ui/fields/renderFieldStore'

export namespace TextFieldRenderer {
  export interface Props extends RenderOpts {
    store: TextFieldStore
  }
}

@observer
export class TextFieldRenderer extends React.Component<TextFieldRenderer.Props> {
  private handleChange = (value: string) => {
    this.props.store.change(value)
  }

  public render() {
    let input: React.ReactNode

    if (this.props.store.multiline) {
      input = (
        <TextAreaInput
          onChange={this.handleChange}
          value={this.props.store.value}
          disabled={this.props.disabled}
          autoresize
        />
      )
    } else {
      input = (
        <TextInput
          type={TextInputType.Lighter}
          onChange={this.handleChange}
          value={this.props.store.value}
          disabled={this.props.disabled}
          minLength={this.props.store.minLength}
          maxLength={this.props.store.maxLength}
        />
      )
    }

    return (
      <Field depth={this.props.depth} index={this.props.index}>
        {!this.props.isWrapped && (
          <FieldLabel
            label={this.props.store.label}
            description={this.props.store.description}
            depth={this.props.depth}
            index={this.props.index}
          />
        )}
        {input}
      </Field>
    )
  }
}
