import React from 'react'
import {Ref, MetarializedRecord} from '@karma.run/sdk'
import {Filter, Sort} from '@karma.run/editor-common'

import {Panel} from '../common/panel'
import {ViewContextPanelHeader} from '../common/panel/viewContextHeader'
import {SessionContext, withSession} from '../../context/session'
import {PanelToolbar} from '../common/panel/toolbar'
import {ViewContext} from '../../api/karmafe/viewContext'
import {CenteredLoadingIndicator} from '../common/loader'
import {EntryItem} from '../entryListPanel/item'
import {Button, ButtonType} from '../common'
import {refToString} from '../../util/ref'
import {IconName} from '../common/icon'
import {PanelContent} from '../common/panel/content'

export const recordLimitPerPage = 100

export interface PaginatedRecordListProps {
  sort?: Sort
  filter?: Filter
  viewContext: ViewContext
  sessionContext: SessionContext
}

export interface PaginatedRecordListState {
  records?: MetarializedRecord[]
  hasMore: boolean
  offset: number
}

export class PaginatedRecordList extends React.Component<
  PaginatedRecordListProps,
  PaginatedRecordListState
> {
  public state: PaginatedRecordListState = {offset: 0, hasMore: true}
  private intersectionObserver?: IntersectionObserver

  private async loadMoreRecords() {
    // Request one more than the limit to check if there's another page
    const records = await this.props.sessionContext.getRecordList(
      this.props.viewContext.model,
      recordLimitPerPage + 1,
      this.state.offset,
      this.props.sort,
      this.props.filter
    )

    const hasMore = records.length > recordLimitPerPage

    // Remove extranous record
    records.splice(-1, 1)

    this.setState({
      records: [...(this.state.records || []), ...records],
      offset: this.state.offset + recordLimitPerPage,
      hasMore: hasMore
    })
  }

  private handleIntersectionRef = (element: HTMLDivElement | null) => {
    if (element) {
      this.intersectionObserver = new IntersectionObserver(this.handleIntersection)
      this.intersectionObserver.observe(element)
    } else {
      this.intersectionObserver!.disconnect()
      this.intersectionObserver = undefined
    }
  }

  private handleIntersection = () => {
    if (!this.state.hasMore) return
    this.loadMoreRecords()
  }

  public async componentDidMount() {
    this.loadMoreRecords()
  }

  public render() {
    if (!this.state.records) return <CenteredLoadingIndicator />

    return (
      <div>
        {this.state.records.map(record => (
          <EntryItem
            key={refToString(record.id)}
            entry={record}
            viewContext={this.props.viewContext}
            reverseTags={{}}>
            <Button
              type={ButtonType.Icon}
              data={record.id}
              onTrigger={() => {}}
              icon={IconName.ChooseDocument}
              label="Choose"
            />
          </EntryItem>
        ))}
        <div ref={this.handleIntersectionRef} />
      </div>
    )
  }
}

export interface RootRecordListPanelProps {
  model: Ref
  sessionContext: SessionContext
  disabled: boolean
}

export class RootRecordListPanel extends React.Component<RootRecordListPanelProps> {
  public render() {
    const sessionContext = this.props.sessionContext
    const viewContext = sessionContext.viewContextMap.get(this.props.model)

    // TODO: Error panel
    if (!viewContext) return <div>Not Found</div>

    return (
      <Panel>
        <ViewContextPanelHeader viewContext={viewContext} prefix="List" />
        <PanelToolbar />
        <PanelContent>
          <PaginatedRecordList viewContext={viewContext} sessionContext={sessionContext} />
        </PanelContent>
      </Panel>
    )
  }
}

export const RootRecordListPanelContainer = withSession(RootRecordListPanel)
