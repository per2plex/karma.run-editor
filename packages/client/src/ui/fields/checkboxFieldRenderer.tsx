import * as React from 'react'

import { observer } from 'mobx-react'
import { CheckboxInput } from '../../ui/common'
import { CheckboxFieldStore } from '../../store/fields/checkboxFieldStore'
import { RenderOpts } from '../../ui/fields/renderFieldStore'
import { Field, FieldLabel } from '../../ui/fields/field'

export namespace CheckboxFieldRenderer {
  export interface Props extends RenderOpts{
    store: CheckboxFieldStore
  }
}

@observer
export class CheckboxFieldRenderer extends React.Component<CheckboxFieldRenderer.Props> {
  private handleChange = (value: boolean) => {
    this.props.store.change(value)
  }

  public render() {
    return (
      <Field depth={this.props.depth} index={this.props.index}>
        {!this.props.isWrapped && (
          <FieldLabel
            label={this.props.store.label}
            description={this.props.store.description}
            depth={this.props.depth}
            index={this.props.index} />
        )}
        <CheckboxInput
          onChange={this.handleChange}
          value={this.props.store.value}
          disabled={this.props.disabled} />
      </Field>
    )
  }
}
