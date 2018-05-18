import * as React from 'react'

import { observer } from 'mobx-react'
import { Select, SelectType } from '../../ui/common'
import { EnumFieldStore } from '../../store/fields/enumFieldStore'
import { RenderOpts } from './renderFieldStore'
import { Field, FieldLabel } from '../../ui/fields/field'

export namespace EnumFieldRenderer {
  export interface Props extends RenderOpts {
    store: EnumFieldStore
  }
}

@observer
export class EnumFieldRenderer extends React.Component<EnumFieldRenderer.Props> {
  private handleChange = (value?: string) => {
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
            index={this.props.index || 0} />
        )}
        <Select value={this.props.store.value}
          type={SelectType.Test}
          options={this.props.store.values}
          onChange={this.handleChange}
          disabled={this.props.disabled}
          disableUnselectedOption />
      </Field>
    )
  }
}
