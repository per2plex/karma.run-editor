import * as React from 'react'

import { observer } from 'mobx-react'
import { CheckboxInput } from '../../ui/common'

import { OptionalFieldStore } from '../../store/fields/optionalFieldStore'
import { RenderOpts, renderValueStore } from './renderFieldStore'
import { Field, FieldLabel, FieldInset, FieldWrapper } from '../../ui/fields/field'

export namespace OptionalFieldRenderer {
  export interface Props extends RenderOpts {
    store: OptionalFieldStore
  }
}

@observer
export class OptionalFieldRenderer extends React.Component<OptionalFieldRenderer.Props> {
  private handleChange = (value: boolean) => {
    this.props.store.change(value)
  }

  public render() {
    let field: JSX.Element | undefined

    if (this.props.store.isPresent) {
      const {children, store, ...options} = this.props

      field = renderValueStore(this.props.store.store, {
        ...options, isWrapped: true, depth: this.props.depth + 1
      })
    }

    return (
      <FieldWrapper depth={this.props.depth} index={this.props.index}>
        <Field depth={this.props.depth} index={this.props.index}>
          <FieldLabel
            label={this.props.store.label}
            description={this.props.store.description}
            depth={this.props.depth}
            index={this.props.index || 0}
            leftContent={(
              <CheckboxInput value={this.props.store.isPresent}
              onChange={this.handleChange}
              disabled={this.props.disabled} />
            )} />
        </Field>
        <FieldInset>
          {field}
        </FieldInset>
      </FieldWrapper>
    )
  }
}
