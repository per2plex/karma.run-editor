import * as React from 'react'

import { observer } from 'mobx-react'

import { Select } from '../../ui/common'
import { OrFieldStore } from '../../store/fields/orFieldStore'
import { FieldsetStore } from '../../store/fields/fieldsetStore'
import { RenderOpts, renderValueStore } from './renderFieldStore'
import { style } from 'typestyle'
import { FieldWrapper, Field, FieldLabel, FieldInset } from '../../ui/fields/field'

export namespace OrFieldRenderer {
  export interface Props extends RenderOpts {
    store: OrFieldStore
  }
}

@observer
export class OrFieldRenderer extends React.Component<OrFieldRenderer.Props> {
  private handleChange = (value: string | undefined) => {
    this.props.store.change(Number(value))
  }

  public render() {
    let content: JSX.Element | undefined
    const selectedStore = this.props.store.selectedField

    const notEmptyFieldset =
      !(selectedStore instanceof FieldsetStore
      && Object.keys(selectedStore.fields).length === 0)

    if (selectedStore && notEmptyFieldset) {
      const {children, store, ...options} = this.props
      content = renderValueStore(selectedStore, {...options, depth: this.props.depth + 1})
    }

    const options: Select.Option[] = this.props.store.fields.map((store, index) => {
      return {key: String(index), label: store.label || String(index)}
    })

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
          <Select value={String(this.props.store.selectedIndex)}
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

export namespace OrFieldRenderer {
  export const Style = style ({
    $debugName: 'OrFieldRenderer',

  })
}
