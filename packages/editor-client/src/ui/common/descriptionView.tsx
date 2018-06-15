import * as React from 'react'
import {Entry, keyPathToString} from '../../api/karma'
import {ViewContext, findKeyPath} from '../../api/karmafe/viewContext'
import {CardSection, CardImage, CardDocument} from '../common'
import {getValueForKeyPath} from '../../util/values'
import {ObjectMap} from '@karma.run/editor-common'
import {MediaType, unserializeMedia, thumbnailURL} from '@karma.run/editor-media-client'
import {Env} from '../../util/env'

export namespace DescriptionView {
  export interface Props {
    reverseTags: ObjectMap<string>
    viewContext: ViewContext
    entry: Entry
  }
}

export class DescriptionView extends React.Component<DescriptionView.Props> {
  public render() {
    let content: React.ReactNode[] = []

    if (this.props.viewContext.descriptionKeyPaths && this.props.viewContext.fields) {
      content = this.props.viewContext.descriptionKeyPaths.map(keyPath => {
        const field = findKeyPath(keyPath, this.props.viewContext.fields!)
        const value = getValueForKeyPath(this.props.entry.value, keyPath)
        const key = keyPathToString(keyPath)

        if (field) {
          switch (field.type) {
            case 'media': {
              const media = unserializeMedia(value)

              if (media.mediaType === MediaType.Image || media.mediaType === MediaType.Video) {
                return <CardImage key={key} src={thumbnailURL(Env.mediaAPIBasePath, media.id)} />
              } else {
                return <CardDocument key={key} extension={value.extension} />
              }
            }

            default:
              return <CardSection key={key}>{value}</CardSection>
          }
        } else {
          return undefined
        }
      })
    }

    if (content.length > 0) {
      return <React.Fragment>{content}</React.Fragment>
    }

    return (
      <React.Fragment>
        <CardSection>
          {this.props.reverseTags[this.props.entry.id] || this.props.entry.id}
        </CardSection>
      </React.Fragment>
    )
  }
}
