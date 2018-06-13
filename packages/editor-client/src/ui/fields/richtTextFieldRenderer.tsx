import * as React from 'react'

import {observer} from 'mobx-react'
import {RichTextInput} from '../../ui/common'
import {RichtTextFieldStore, RichtTextFieldValue} from '../../store/fields/richTextFieldStore'
import {DataCallbackFn, RenderOpts} from '../../ui/fields/renderFieldStore'
import {Field, FieldLabel, FieldErrors} from '../../ui/fields/field'

export namespace RichTextFieldRenderer {
  export interface Props extends RenderOpts {
    store: RichtTextFieldStore
  }
}

@observer
export class RichTextFieldRenderer extends React.Component<RichTextFieldRenderer.Props> {
  private handleChange = (value: RichtTextFieldValue) => {
    this.props.store.change(value)
  }

  private handleOpenBlockEditor = (key: string, data: any, done: DataCallbackFn) => {
    const store = this.props.store.blockStores[key]
    if (!store) return done({})

    const newStore = store.clone()
    if (data) newStore.fill(data)

    this.props.onOpenEditor(newStore, done)
  }

  private handleOpenLinkEditor = (data: any, done: (data: any) => void) => {
    const store = this.props.store.linkStore.clone()

    if (data) store.fill(data)
    this.props.onOpenEditor(store, data => done(data))
  }

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
        <RichTextInput
          value={this.props.store.value}
          onOpenBlockEditor={this.handleOpenBlockEditor}
          onOpenLinkEditor={this.handleOpenLinkEditor}
          onChange={this.handleChange}
          controls={this.props.store.controls}
          links={this.props.store.links}
          styleGroups={this.props.store.styleGroups}
          blocks={this.props.store.blocks}
          elements={this.props.store.elements}
          linkEntityType={this.props.store.linkEntityType}
          maxLength={this.props.store.maxLength}
        />
        {this.props.store.errors.length > 0 && <FieldErrors errors={this.props.store.errors} />}
      </Field>
    )
  }
}
