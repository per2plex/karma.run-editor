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

import {FileFieldStore} from '../../store/fields/fileFieldStore'
import {getFileExtension} from '../../util/string'
import {Icon, IconName} from '../../ui/common/icon'
import {Field, FieldLabel} from '../../ui/fields/field'
import {RenderOpts} from '../../ui/fields/renderFieldStore'

export namespace FileFieldRenderer {
  export interface Props extends RenderOpts {
    store: FileFieldStore
  }
}

@observer
export class FileFieldRenderer extends React.Component<FileFieldRenderer.Props> {
  constructor(props: FileFieldRenderer.Props) {
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

    if (this.props.store.isUploading) {
      content = `${this.props.store.uploadProgress * 100}%`
    } else if (this.props.store.value || this.props.store.tempValue) {
      let name: string
      let labelElement: React.ReactNode

      if (this.props.store.tempValue) {
        name = `${this.props.store.tempValue.originalFilename}`
      } else {
        name = `${this.props.store.value!.originalFilename}`
      }

      let url: string

      if (this.props.store.tempValue) {
        url = this.props.store.tempValue.url
      } else {
        url = this.props.store.value!.url
      }

      if (name) {
        labelElement = (
          <CardSection>
            <FlexList>
              <CardLabel text={name} />
              <FlexFiller />
              {url && (
                <a href={url} target="_blank" onClick={this.handlePreviewClick}>
                  <Icon name={IconName.Preview} />
                </a>
              )}
            </FlexList>
          </CardSection>
        )
      }

      if (this.props.store.thumbnailURL) {
        content = (
          <Card>
            <CardImage src={this.props.store.thumbnailURL!} />
            {labelElement}
          </Card>
        )
      } else {
        const extension = getFileExtension(url)

        content = (
          <Card>
            <CardDocument extension={extension} />
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
