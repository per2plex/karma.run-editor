import * as React from 'react'
import {style} from 'typestyle'

import {ViewContext} from '../../api/newViewContext'
import {Spacing} from '../../ui/style'
import {DescriptionView, Card, CardFooter} from '../../ui/common'
import {LocaleContext} from '../../context/locale'
import {ReadonlyRefMap} from '../../util/ref'
import {MetarializedRecord} from '@karma.run/sdk'

export interface RecordItemProps {
  record: MetarializedRecord
  viewContext: ViewContext
  reverseTagMap: ReadonlyRefMap<string>
  localeContext: LocaleContext
}

export class RecordItem extends React.Component<RecordItemProps> {
  public render() {
    const updatedDateString = new Date(this.props.record.updated).toLocaleDateString(
      this.props.localeContext.locale
    )

    const createdDateString = new Date(this.props.record.created).toLocaleDateString(
      this.props.localeContext.locale
    )

    return (
      <div className={RecordItemPropsStyle}>
        <Card>
          <DescriptionView
            viewContext={this.props.viewContext}
            record={this.props.record}
            reverseTagMap={this.props.reverseTagMap}
          />
          <CardFooter
            contentLeft={
              <>
                <div>
                  {this.props.localeContext.get('recordUpdated')}: {updatedDateString}
                </div>
                <div>
                  {this.props.localeContext.get('recordCreated')}: {createdDateString}
                </div>
              </>
            }
            contentRight={this.props.children}
          />
        </Card>
      </div>
    )
  }
}

export const RecordItemPropsStyle = style({
  $debugName: 'RecordItem',
  marginBottom: Spacing.medium
})
