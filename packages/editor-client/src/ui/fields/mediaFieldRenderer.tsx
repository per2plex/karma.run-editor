import * as React from 'react'

import {observer} from 'mobx-react'

import {
  Card,
  CardImage,
  CardSection,
  CardLabel,
  DropAreaFileInput,
  CardDocument,
  FlexList,
  FlexFiller
} from '../../ui/common'

import {Icon, IconName} from '../../ui/common/icon'
import {Field, FieldLabel} from '../../ui/fields/field'
import {RenderOpts} from '../../ui/fields/renderFieldStore'
import {MediaFieldStore} from '../../store/fields/mediaFieldStore'

export namespace MediaFieldRenderer {
  export interface Props extends RenderOpts {
    store: MediaFieldStore
  }
}

@observer
export class MediaFieldRenderer extends React.Component<MediaFieldRenderer.Props> {
  constructor(props: MediaFieldRenderer.Props) {
    super(props)
  }

  private handleDrop = async (file: File) => {
    this.props.store.uploadFile(file)
  }

  private handlePreviewClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation()
  }

  public render() {
    let content: React.ReactNode

    if (this.props.store.uploadProgress != undefined) {
      content = `${this.props.store.uploadProgress * 100}%`
    } else if (this.props.store.value || this.props.store.uploadResponse) {
      let name: string

      if (this.props.store.uploadResponse) {
        name = `${this.props.store.uploadResponse.filename}`
      } else {
        name = `${this.props.store.value!.filename}`
      }

      let url: string

      if (this.props.store.uploadResponse) {
        url = this.props.store.uploadResponse.url
      } else {
        url = this.props.store.value!.url
      }

      const labelElement = (
        <CardSection>
          <FlexList>
            {name && <CardLabel text={name} />}
            <FlexFiller />
            {url && (
              <a href={url} target="_blank" onClick={this.handlePreviewClick}>
                <Icon name={IconName.Preview} />
              </a>
            )}
          </FlexList>
        </CardSection>
      )

      if (this.props.store.thumbnailURL) {
        content = (
          <Card>
            <CardImage src={this.props.store.thumbnailURL!} />
            {labelElement}
          </Card>
        )
      } else {
        content = (
          <Card>
            <CardDocument extension={this.props.store.extension || '?'} />
            {labelElement}
          </Card>
        )
      }
    }

    return (
      <Field depth={this.props.depth} index={this.props.index}>
        {!this.props.isWrapped && (
          <FieldLabel
            label={this.props.store.label}
            description={this.props.store.description}
            depth={this.props.depth}
            index={this.props.index || 0}
          />
        )}
        <DropAreaFileInput text="Drop File Here" onFileDrop={this.handleDrop}>
          {content}
        </DropAreaFileInput>
      </Field>
    )
  }
}
