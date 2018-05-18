import * as React from 'react'

import { observer } from 'mobx-react'

import { Select, SelectType } from '../../ui/common'
import { SelectFieldStore } from '../../store/fields/selectFieldStore'
import { FieldsetStore } from '../../store/fields/fieldsetStore'
import { RenderOpts, renderValueStore } from './renderFieldStore'
import { FieldWrapper, Field, FieldLabel, FieldInset } from '../../ui/fields/field'

export namespace SelectFieldRenderer {
  export interface Props extends RenderOpts {
    store: SelectFieldStore
  }
}

@observer
export class SelectFieldRenderer extends React.Component<SelectFieldRenderer.Props> {
  private handleChange = (value: string | undefined) => {
    this.props.store.change(value)
  }

  public render() {
    let content: JSX.Element | undefined
    const selectedStore = this.props.store.selectedField

    const notEmptyFieldset =
      !(selectedStore instanceof FieldsetStore
      && Object.keys(selectedStore.fields).length === 0)

    if (selectedStore && notEmptyFieldset) {
      const {children, store, ...options} = this.props
      content = renderValueStore(selectedStore, {
        ...options, depth: this.props.depth + 1, isWrapped: true
      })
    }

    const options: Select.Option[] = Object.entries(this.props.store.fields).map(([key, store]) => {
      return {key, label: store.label || key}
    })

    return (
      <FieldWrapper depth={this.props.depth} index={this.props.index}>
        <Field depth={this.props.depth} index={this.props.index}>
          <FieldLabel
            label={this.props.store.label}
            description={this.props.store.description}
            depth={this.props.depth}
            index={this.props.index || 0} />
          <Select value={this.props.store.selectedKey}
            type={SelectType.Transparent}
            options={options}
            onChange={this.handleChange}
            disabled={this.props.disabled} />
        </Field>
        <FieldInset>
          {content}
        </FieldInset>
      </FieldWrapper>
    )
  }
}
