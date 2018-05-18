import * as React from 'react'

import { observer } from 'mobx-react'
import { NumberInput } from '../../ui/common'
import { IntFieldStore } from '../../store/fields/intFieldStore'
import { FloatFieldStore } from '../../store/fields/floatFieldStore'
import { Field, FieldLabel } from '../../ui/fields/field'
import { RenderOpts } from '../../ui/fields/renderFieldStore'

export namespace NumberFieldRenderer {
  export interface Props extends RenderOpts {
    store: IntFieldStore | FloatFieldStore
  }
}

@observer
export class NumberFieldRenderer extends React.Component<NumberFieldRenderer.Props> {
  private handleChange = (value: number) => {
    this.props.store.change(value || 0)
  }

  public render() {
    const step = this.props.store instanceof IntFieldStore ? 1 : undefined

    return (
      <Field depth={this.props.depth} index={this.props.index}>
        {!this.props.isWrapped && (
          <FieldLabel
            label={this.props.store.label}
            description={this.props.store.description}
            depth={this.props.depth}
            index={this.props.index} />
        )}
        <NumberInput
          onChange={this.handleChange}
          value={this.props.store.value}
          disabled={this.props.disabled}
          step={step} />
      </Field>
    )
  }
}
