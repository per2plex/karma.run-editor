import * as React from 'react'

import {CardError} from '../../ui/common'
import {ErrorFieldStore} from '../../store/fields/errorFieldStore'
import {RenderOpts} from '../../ui/fields/renderFieldStore'
import {Field, FieldLabel} from '../../ui/fields/field'

export namespace ErrorFieldRenderer {
  export interface Props extends RenderOpts {
    store: ErrorFieldStore
  }
}

export class ErrorFieldRenderer extends React.Component<ErrorFieldRenderer.Props> {
  public render() {
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
        <CardError>{this.props.store.message}</CardError>
      </Field>
    )
  }
}
