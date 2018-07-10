import * as React from 'react'

import {keyPathToString} from '../../api/model'
import {ViewContext} from '../../api/viewContext'
import {CardSection} from '../common'
import {getValuesForValuePath} from '@karma.run/editor-common'
import {ModelRecord} from '../../context/session'

export interface DescriptionViewProps {
  viewContext: ViewContext
  record: ModelRecord
}

export function contentForViewContext(
  record: ModelRecord,
  viewContext: ViewContext
): React.ReactNode[] {
  if (!viewContext.displayKeyPaths) return []

  return viewContext.displayKeyPaths.map(keyPath => {
    const field = viewContext.field.traverse(keyPath)
    const key = keyPathToString(keyPath)

    if (field) {
      const objectPath = viewContext.field.valuePathForKeyPath(keyPath)
      const value = getValuesForValuePath(record.value, objectPath) // TODO: Add into Field interface

      return <React.Fragment key={key}>{field.renderListComponent({value})}</React.Fragment>
    } else {
      return <React.Fragment key={key}>Invalid keyPath: {key}</React.Fragment>
    }
  })
}

export class DescriptionView extends React.Component<DescriptionViewProps> {
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
