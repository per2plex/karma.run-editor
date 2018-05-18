import * as React from 'react'

import { observer } from 'mobx-react'
import { Field, FieldLabel } from '../../ui/fields/field'
import { RenderOpts } from '../../ui/fields/renderFieldStore'
import { NullFieldStore } from '../../store/fields/nullFieldStore'

export namespace NullFieldRenderer {
  export interface Props extends RenderOpts {
    store: NullFieldStore
  }
}

@observer
export class NullFieldRenderer extends React.Component<NullFieldRenderer.Props> {
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
        Null
      </Field>
    )
  }
}
