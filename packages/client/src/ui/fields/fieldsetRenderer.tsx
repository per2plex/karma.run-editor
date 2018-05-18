import * as React from 'react'

import { style } from 'typestyle'
import { observer } from 'mobx-react'
import { firstKey } from '@karma.run/editor-common'

import { TabList } from '../../ui/common/tabList'
import { FieldsetStore } from '../../store/fields/fieldsetStore'
import { RenderOpts, renderValueStore } from './renderFieldStore'
import { Field, FieldLabel, FieldInset, FieldWrapper } from '../../ui/fields/field'

export namespace FieldsetRenderer {
  export interface Props extends RenderOpts {
    store: FieldsetStore
  }
}

@observer
export class FieldsetRenderer extends React.Component<FieldsetRenderer.Props> {
  public render() {
    const {children, ...options} = this.props
    if (this.props.store.layout === 'linear') {
      return <LinearFieldsetRenderer {...options} />
    } else {
      return <TabFieldsetRenderer {...options} />
    }
  }
}

export namespace LinearFieldsetRenderer {
  export type Props = FieldsetRenderer.Props
}

@observer
export class LinearFieldsetRenderer extends React.Component<LinearFieldsetRenderer.Props> {
  public render() {
    const {children, store, ...options} = this.props
    const fields = Object.entries(this.props.store.fields).map(
      ([key, store], index) => (
        renderValueStore(store, {...options,
          key, index, depth: this.props.isWrapped ? this.props.depth : this.props.depth + 1,
          isWrapped: false
        })
      )
    )

    if (this.props.isWrapped) {
      return fields
    } else {
      return (
        <FieldWrapper depth={this.props.depth} index={this.props.index}>
          <Field depth={this.props.depth} index={this.props.index}>
            <FieldLabel
              label={this.props.store.label}
              description={this.props.store.description}
              depth={this.props.depth}
              index={this.props.index || 0} />
          </Field>
          <FieldInset>
            {fields}
          </FieldInset>
        </FieldWrapper>
      )
    }
  }
}


export namespace TabFieldsetRenderer {
  export type Props = FieldsetRenderer.Props
  export interface State {
    selectedKey: string
  }
}

@observer
export class TabFieldsetRenderer extends React.Component<
  TabFieldsetRenderer.Props, TabFieldsetRenderer.State
> {
  constructor(props: TabFieldsetRenderer.Props) {
    super(props)

    this.state = {
      selectedKey: firstKey(props.store.fields)
    }
  }

  private handleTabClick = (index: number) => {
    const entries = Object.entries(this.props.store.fields)

    this.setState({
      selectedKey: entries[index][0]
    })
  }

  public render() {
    let depth = this.props.isWrapped
      ? this.props.depth
      : this.props.depth - 1

    const {children, store, ...options} = this.props
    const field = renderValueStore(store.fields[this.state.selectedKey], {...options,
      depth: depth + 1, isWrapped: true
    })

    const entries = Object.entries(store.fields)
    const tabValues = entries.map(([key, store]) => {
      return {key, value: store.label} as TabList.Value
    })

    const activeTab = entries.findIndex(([key]) => key === this.state.selectedKey)

    return (
      <FieldWrapper depth={this.props.depth} index={this.props.index}>
        <Field className={TabFieldsetRenderer.Style} depth={this.props.depth} index={this.props.index}>
          {!this.props.isWrapped && (
            <FieldLabel
              label={this.props.store.label}
              description={this.props.store.description}
              depth={this.props.depth}
              index={this.props.index} />
          )}
          <TabList values={tabValues}
            activeTab={activeTab}
            onChangeActiveTab={this.handleTabClick} />
        </Field>
        <FieldInset>
          {field}
        </FieldInset>
      </FieldWrapper>
    )
  }
}

export namespace TabFieldsetRenderer {
  export const Style = style({
    paddingBottom: 0,
  })
}

