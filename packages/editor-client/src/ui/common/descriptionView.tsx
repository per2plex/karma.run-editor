import * as React from 'react'
import {MetarializedRecord} from '@karma.run/sdk'

import {keyPathToString} from '../../api/karma'
import {ViewContext} from '../../api/newViewContext'
import {CardSection} from '../common'
import {ObjectMap, getValuesForValuePath} from '@karma.run/editor-common'
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
  if (!viewContext.displayKeyPaths) return []

  return viewContext.displayKeyPaths.map(keyPath => {
    const field = viewContext.field.traverse(keyPath)
    const key = keyPathToString(keyPath)

    if (field) {
      const objectPath = viewContext.field.valuePathForKeyPath(keyPath)
      const value = getValuesForValuePath(record.value, objectPath)

      return <React.Fragment key={key}>{field.renderListComponent(value)}</React.Fragment>
    } else {
      return <React.Fragment key={key}>Invalid keyPath: {key}</React.Fragment>
    }
  })
}

// export function contentForField(value: any, field: Field) {
//   switch (field.type) {
//     case 'media': {
//       const media = unserializeMedia(value)

//       if (media.mediaType === MediaType.Image || media.mediaType === MediaType.Video) {
//         return <CardImage src={thumbnailURL(Env.mediaAPIBasePath, media.id)} />
//       } else {
//         return <CardDocument extension={value.extension} />
//       }
//     }

//     default:
//       return <CardSection>{value}</CardSection>
//   }
// }

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
        <CardSection>{this.props.record.id}</CardSection>
      </>
    )
  }
}
