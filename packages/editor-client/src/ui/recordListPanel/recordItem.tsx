import * as React from 'react'
import {style} from 'typestyle'

import {ViewContext} from '../../api/viewContext'
import {Spacing} from '../../ui/style'
import {DescriptionView, Card, CardFooter} from '../../ui/common'
import {LocaleContext} from '../../context/locale'
import {ReadonlyRefMap} from '../../util/ref'
import {ModelRecord} from '../../context/session'

export interface RecordItemProps {
  record: ModelRecord
  viewContext: ViewContext
  reverseTagMap: ReadonlyRefMap<string>
  localeContext: LocaleContext
}

export class RecordItem extends React.Component<RecordItemProps> {
  public render() {
    const _ = this.props.localeContext.get

    const updatedDateString = this.props.record.updated.toLocaleDateString(
      this.props.localeContext.locale,
      {hour: 'numeric', minute: 'numeric'}
    )

    const createdDateString = this.props.record.created.toLocaleDateString(
      this.props.localeContext.locale,
      {hour: 'numeric', minute: 'numeric'}
    )

    return (
      <div className={RecordItemPropsStyle}>
        <Card>
          <DescriptionView viewContext={this.props.viewContext} record={this.props.record} />
          <CardFooter
            contentLeft={
              <>
                <div>
                  {_('recordUpdated')}: {updatedDateString}
                </div>
                <div>
                  {_('recordCreated')}: {createdDateString}
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
