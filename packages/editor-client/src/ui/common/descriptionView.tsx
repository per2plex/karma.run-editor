import * as React from 'react'
import {keyPathToString} from '../../api/karma'
import {ViewContext, findKeyPath, Field} from '../../api/karmafe/viewContext'
import {CardSection, CardImage, CardDocument} from '../common'
import {getValueForKeyPath} from '../../util/values'
import {ObjectMap} from '@karma.run/editor-common'
import {MediaType, unserializeMedia, thumbnailURL} from '@karma.run/editor-media-client'
import {Env} from '../../util/env'
import {MetarializedRecord} from '@karma.run/sdk'
import {ReadonlyRefMap} from '../../util/ref'

export namespace DescriptionView {
  export interface Props {
    reverseTags?: ObjectMap<string>
    reverseTagMap: ReadonlyRefMap<string>
    viewContext: ViewContext
    record: MetarializedRecord
  }
}

export function contentForViewContext(
  record: MetarializedRecord,
  viewContext: ViewContext
): React.ReactNode[] {
  if (!viewContext.descriptionKeyPaths) return []

  return viewContext.descriptionKeyPaths.map(keyPath => {
    const field = findKeyPath(keyPath, viewContext.fields!)
    const value = getValueForKeyPath(record.value, keyPath)
    const key = keyPathToString(keyPath)

    if (field) {
      return <React.Fragment key={key}>{contentForField(value, field)}</React.Fragment>
    } else {
      return <React.Fragment key={key}>Invalid keyPath: {key}</React.Fragment>
    }
  })
}

export function contentForField(value: any, field: Field) {
  switch (field.type) {
    case 'media': {
      const media = unserializeMedia(value)

      if (media.mediaType === MediaType.Image || media.mediaType === MediaType.Video) {
        return <CardImage src={thumbnailURL(Env.mediaAPIBasePath, media.id)} />
      } else {
        return <CardDocument extension={value.extension} />
      }
    }

    default:
      return <CardSection>{value}</CardSection>
  }
}

export class DescriptionView extends React.Component<DescriptionView.Props> {
  public render() {
    const content: React.ReactNode[] = contentForViewContext(
      this.props.record,
      this.props.viewContext
    )

    if (content.length > 0) {
      return <>{content}</>
    }

    return (
      <>
        <CardSection>
          {this.props.reverseTagMap.get(this.props.record.id) || this.props.record.id}
        </CardSection>
      </>
    )
  }
}
