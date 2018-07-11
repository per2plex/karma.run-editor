import * as React from 'react'

import {ViewContext} from '../../api/viewContext'
import {LocaleContext} from '../../context/locale'
import {ReadonlyRefMap} from '../../util/ref'
import {ModelRecord} from '../../context/session'

import {Card, CardFooter} from '../../ui/common/card'
import {DescriptionView} from '../../ui/common/descriptionView'

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
    )
  }
}
