import * as React from 'react'

import {
  ViewContext,
  LocaleContext,
  ReadonlyRefMap,
  ModelRecord,
  Card,
  CardFooter,
  DescriptionView
} from '@karma.run/editor-common'

export interface RecordItemProps {
  record: ModelRecord
  viewContext: ViewContext
  viewContextMap: ReadonlyRefMap<ViewContext>
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
          viewContextMap={this.props.viewContextMap}
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
