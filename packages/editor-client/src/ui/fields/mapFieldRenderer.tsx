import * as React from 'react'

import {observer} from 'mobx-react'
import {EditableTabList} from '../../ui/common/tabList'
import {MapFieldStore} from '../../store/fields/mapFieldStore'
import {RenderOpts, renderValueStore} from './renderFieldStore'
import {style} from 'typestyle'
import {FieldWrapper, Field, FieldLabel, FieldInset} from '../../ui/fields/field'

export namespace MapFieldRenderer {
  export interface Props extends RenderOpts {
    store: MapFieldStore
  }

  export interface State {
    activeTabIndex: number
  }
}

@observer
export class MapFieldRenderer extends React.Component<
  MapFieldRenderer.Props,
  MapFieldRenderer.State
> {
  tabListElement?: EditableTabList | null
  focusTabAtIndex?: number

  constructor(props: MapFieldRenderer.Props) {
    super(props)
    this.state = {activeTabIndex: 0}
  }

  private handleInsertFieldAt = (index: number, value: string) => {
    this.props.store.insertValueAt(index, value)
    this.focusTabAtIndex = index

    this.setState({
      activeTabIndex: index
    })
  }

  private handleRemoveFieldAt = (index: number) => {
    this.props.store.removeValueAt(index)
  }

  private handleKeyChangeAt = (index: number, key: string) => {
    this.props.store.changeKeyAt(index, key)
  }

  private handleTabChange = (index: number) => {
    this.setState({
      activeTabIndex: index
    })
  }

  public componentDidUpdate() {
    if (this.focusTabAtIndex != null) {
      this.tabListElement!.focusIndex(this.focusTabAtIndex)
      this.focusTabAtIndex = undefined
    }
  }

  public render() {
    const {children, store, ...options} = this.props
    const filteredValues = store.values

    const tabValues: EditableTabList.Value[] = filteredValues.map(value => {
      return {key: value.id, value: value.key}
    })

    let content: React.ReactNode

    if (this.state.activeTabIndex < filteredValues.length) {
      const activeValue = filteredValues[this.state.activeTabIndex]

      content = (
        <FieldInset>
          {renderValueStore(activeValue.store, {
            ...options,
            isWrapped: true,
            depth: this.props.depth + 1
          })}
        </FieldInset>
      )
    }

    let tabList = (
      <EditableTabList
        ref={tabListElement => (this.tabListElement = tabListElement)}
        values={tabValues}
        activeTab={this.state.activeTabIndex}
        onChangeActiveTab={this.handleTabChange}
        onChangeAt={this.handleKeyChangeAt}
        onInsertAt={this.handleInsertFieldAt}
        onRemoveAt={this.handleRemoveFieldAt}
        options={store.restrictedToKeys}
      />
    )

    return (
      <FieldWrapper depth={this.props.depth} index={this.props.index}>
        <Field className={MapFieldRenderer.Style} depth={this.props.depth} index={this.props.index}>
          {!this.props.isWrapped && (
            <FieldLabel
              label={this.props.store.label}
              description={this.props.store.description}
              depth={this.props.depth}
              index={this.props.index}
            />
          )}
          {tabList}
        </Field>
        {content}
      </FieldWrapper>
    )
  }
}

export namespace MapFieldRenderer {
  export const Style = style({
    paddingBottom: 0
  })
}
