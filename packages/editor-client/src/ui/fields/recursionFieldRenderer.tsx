import * as React from 'react'

import {observer} from 'mobx-react'
import {RecursionFieldStore} from '../../store/fields/recursionFieldStore'
import {renderValueStore, RenderOpts} from '../../ui/fields/renderFieldStore'

export namespace RecursionFieldRenderer {
  export interface Props extends RenderOpts {
    store: RecursionFieldStore
  }
}

@observer
export class RecursionFieldRenderer extends React.Component<RecursionFieldRenderer.Props> {
  public render() {
    this.props.store.createStore()

    if (this.props.store.store) {
      const {children, store, ...options} = this.props
      return renderValueStore(this.props.store.store, {...options})
    }

    return <div>RecursionLabel "{this.props.store.recursionLabel}" not found!</div>
  }
}
