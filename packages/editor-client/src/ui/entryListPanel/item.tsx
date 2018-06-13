import * as React from 'react'
import {style} from 'typestyle'

import {Entry} from '../../api/karma'
import {ViewContext} from '../../api/karmafe/viewContext'
import {ObjectMap} from '@karma.run/editor-common'
import {Spacing} from '../../ui/style'
import {DescriptionView, Card, CardFooter} from '../../ui/common'

export namespace EntryItem {
  export interface Props {
    entry: Entry
    viewContext: ViewContext
    reverseTags: ObjectMap<string>
  }
}

export class EntryItem extends React.Component<EntryItem.Props> {
  public render() {
    const updatedDateString = new Date(this.props.entry.updated).toLocaleDateString()
    const createdDateString = new Date(this.props.entry.created).toLocaleDateString()

    return (
      <div className={EntryItem.Style}>
        <Card>
          <DescriptionView
            viewContext={this.props.viewContext}
            entry={this.props.entry}
            reverseTags={this.props.reverseTags}
          />
          <CardFooter
            contentLeft={
              <>
                <div>Updated: {updatedDateString}</div>
                <div>Created: {createdDateString}</div>
              </>
            }
            contentRight={this.props.children}
          />
        </Card>
      </div>
    )
  }
}

export namespace EntryItem {
  export const Style = style({
    $debugName: 'EntryItemStyle',
    marginBottom: Spacing.medium
  })
}
