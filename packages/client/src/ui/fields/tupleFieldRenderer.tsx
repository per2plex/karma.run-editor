import * as React from 'react'

import { observer } from 'mobx-react'
import { TupleFieldStore } from '../../store/fields/tupleFieldStore'
import { RenderOpts, renderValueStore } from './renderFieldStore'
import { Field, FieldLabel, FieldWrapper, FieldInset } from '../../ui/fields/field'

export namespace TupleFieldRenderer {
  export interface Props extends RenderOpts {
    store: TupleFieldStore
  }
}

@observer
export class TupleFieldRenderer extends React.Component<TupleFieldRenderer.Props> {
  public render() {
    const {children, store, ...options} = this.props
    const fields = this.props.store.fields.map(
      (store, index) => renderValueStore(store, {...options,
        key: String(index), depth: this.props.isWrapped ? this.props.depth : this.props.depth + 1,
        isWrapped: false
      })
    )

    if (this.props.isWrapped) {
      return fields
    } else {
      return (
        <FieldWrapper depth={this.props.depth} index={this.props.index}>
          <Field depth={this.props.depth} index={this.props.index}>
            {!this.props.isWrapped && (
              <FieldLabel
                label={this.props.store.label}
                description={this.props.store.description}
                depth={this.props.depth}
                index={this.props.index} />
            )}
          </Field>
          <FieldInset>
            {fields}
          </FieldInset>
        </FieldWrapper>
      )
    }
  }
}
