import React from 'react'
import {Ref} from '@karma.run/sdk'
import {Filter, Sort, ConditionType, Condition, Omit} from '@karma.run/editor-common'

import {Panel} from '../common/panel'
import {ViewContextPanelHeader} from '../common/panel/viewContextHeader'
import {SessionContext, withSession, ModelRecord} from '../../context/session'
import {PanelToolbar} from '../common/panel/toolbar'
import {ViewContext} from '../../api/viewContext'
import {CenteredLoadingIndicator} from '../common/loader'
import {Button, ButtonType, FlexList} from '../common'
import {refToString} from '../../util/ref'
import {IconName} from '../common/icon'
import {PanelContent} from '../common/panel/content'
import {ToolbarFilter} from './filterToolbar'
import {withLocale, LocaleContext} from '../../context/locale'
import {RecordItem} from './recordItem'
import {SortConfiguration} from '../../filter/configuration'

export interface ToolbarAction {
  key: string
  icon: IconName
  label: string
  onTrigger: (id: Ref) => void
}

export interface RecordAction {
  key: string
  icon: IconName
  label: string
  onTrigger: (record: ModelRecord) => void
}

export interface RecordListProps {
  viewContext: ViewContext
  sessionContext: SessionContext
  localeContext: LocaleContext
  records?: ModelRecord[]
  actions: RecordAction[]
}

export class RecordList extends React.Component<RecordListProps> {
  public render() {
    if (!this.props.records) return <CenteredLoadingIndicator />

    // TODO: Empty view
    if (this.props.records.length === 0) return <>No results</>

    return (
      <>
        {this.props.records.map(record => (
          <RecordItem
            key={refToString(record.id)}
            record={record}
            viewContext={this.props.viewContext}
            reverseTagMap={this.props.sessionContext.reverseTagMap}
            localeContext={this.props.localeContext}>
            {this.props.actions.map(action => (
              <Button
                key={action.key}
                type={ButtonType.Icon}
                data={record}
                onTrigger={action.onTrigger}
                icon={action.icon}
                label={action.label}
              />
            ))}
          </RecordItem>
        ))}
      </>
    )
  }
}

export interface RecordListPanelProps {
  model: Ref
  sessionContext: SessionContext
  localeContext: LocaleContext
  disabled: boolean
  headerPrefix: string
  toolbarActions: ToolbarAction[]
  recordActions: RecordAction[]
}

export interface RecordListPanelState {
  records?: ModelRecord[]
  limit: number
  offset: number
  hasMore: boolean
  filter?: Filter
  sort?: Sort
  sortValue?: SortConfiguration
  sortDescending: boolean
  quickSearchValue: string
}

export class RecordListPanel extends React.PureComponent<
  RecordListPanelProps,
  RecordListPanelState
> {
  public state: RecordListPanelState = {
    limit: 50,
    offset: 0,
    hasMore: true,
    sortDescending: false,
    quickSearchValue: ''
  }

  private handleNextPage = () => {
    this.nextPage()
  }

  private handlePreviousPage = () => {
    this.previousPage()
  }

  private handleSortChange = (value: SortConfiguration, descending: boolean) => {
    this.setState(
      {
        sortValue: value,
        sortDescending: descending
      },
      () => {
        this.loadRecords(this.state.offset)
      }
    )
  }

  private handleQuickSearchChange = (value: string) => {
    this.setState(
      {
        offset: 0,
        quickSearchValue: value
      },
      () => {
        this.loadRecords(this.state.offset)
      }
    )
  }

  private get viewContext(): ViewContext | undefined {
    return this.props.sessionContext.viewContextMap.get(this.props.model)
  }

  private get sortValue(): SortConfiguration {
    return this.state.sortValue || this.viewContext!.sortConfigurations[0]
  }

  private get sort(): Sort {
    return {
      path: this.sortValue.path,
      type: this.sortValue.type,
      descending: this.state.sortDescending
    }
  }

  private async previousPage() {
    this.loadRecords(this.state.offset - this.state.limit)
  }

  private async nextPage() {
    this.loadRecords(this.state.offset + this.state.limit)
  }

  private loadRecords = async (offset: number) => {
    if (!this.viewContext) return

    this.setState({offset, records: undefined})

    const filters: Condition[] = []
    // const fields = this.viewContext.fields
    // const descriptionKeyPaths = this.viewContext.descriptionKeyPaths

    if (this.state.quickSearchValue.trim() !== '') {
      for (const keyPath of this.viewContext.displayKeyPaths) {
        const valuePath = this.viewContext.field.valuePathForKeyPath(keyPath)

        filters.push({
          type: ConditionType.StringIncludes,
          path: valuePath,
          value: this.state.quickSearchValue.trim()
        })
      }
    }

    // Request one more than the limit to check if there's another page
    const records = await this.props.sessionContext.getRecordList(
      this.viewContext.model,
      this.state.limit + 1,
      offset,
      this.sort,
      filters
    )

    const hasMore = records.length > this.state.limit

    if (hasMore) {
      // Remove extranous record
      records.splice(-1, 1)
    }

    this.setState({records, hasMore})
  }

  public componentDidMount() {
    this.loadRecords(this.state.offset)
  }

  public render() {
    const sessionContext = this.props.sessionContext
    const viewContext = this.viewContext
    // const _ = this.props.localeContext.get

    // TODO: Error panel
    if (!viewContext) return <div>Not Found</div>

    return (
      <Panel>
        <ViewContextPanelHeader viewContext={viewContext} prefix={this.props.headerPrefix} />
        <PanelToolbar
          left={
            <FlexList spacing="medium">
              {this.props.toolbarActions.map(action => (
                <Button
                  key={action.key}
                  type={ButtonType.Icon}
                  onTrigger={action.onTrigger}
                  icon={action.icon}
                  label={action.label}
                />
              ))}
              <Button
                type={ButtonType.Icon}
                icon={IconName.ListArrowUp}
                onTrigger={this.handlePreviousPage}
                disabled={this.state.records == undefined || this.state.offset <= 0}
              />
              <Button
                type={ButtonType.Icon}
                icon={IconName.ListArrowDown}
                onTrigger={this.handleNextPage}
                disabled={this.state.records == undefined || !this.state.hasMore}
              />
            </FlexList>
          }
          right={
            <ToolbarFilter
              viewContext={viewContext}
              sortConfigurations={viewContext.sortConfigurations}
              sortValue={this.sortValue}
              sortDescending={this.state.sortDescending}
              onSortChange={this.handleSortChange}
              filterConfigurations={[]}
              quickSearchValue={this.state.quickSearchValue}
              onQuickSearchChange={this.handleQuickSearchChange}
              disableQuickSearch={viewContext.displayKeyPaths.length === 0}
            />
          }
        />
        <PanelContent>
          <RecordList
            viewContext={viewContext}
            sessionContext={sessionContext}
            localeContext={this.props.localeContext}
            records={this.state.records}
            actions={this.props.recordActions}
          />
        </PanelContent>
      </Panel>
    )
  }
}

export type SpecializedRecordListProps = Omit<
  Omit<Omit<RecordListPanelProps, 'toolbarActions'>, 'recordActions'>,
  'headerPrefix'
>

export interface RootRecordListPanelProps extends SpecializedRecordListProps {
  onEditRecord: (model: Ref, id?: Ref) => void
  onDeleteRecord: (model: Ref, id: Ref) => void
}

export class RootRecordListPanel extends React.PureComponent<RootRecordListPanelProps> {
  private handleNewRecord = () => {
    this.props.onEditRecord(this.props.model)
  }

  private handleEditRecord = (record: ModelRecord) => {
    this.props.onEditRecord(this.props.model, record.id)
  }

  private handleDeleteRecord = (record: ModelRecord) => {
    this.props.onDeleteRecord(this.props.model, record.id)
  }

  public render() {
    const _ = this.props.localeContext.get

    return (
      <RecordListPanel
        {...this.props}
        headerPrefix={_('listRecordPrefix')}
        toolbarActions={[
          {
            key: 'new',
            icon: IconName.NewDocument,
            label: _('newRecord'),
            onTrigger: this.handleNewRecord
          }
        ]}
        recordActions={[
          {
            key: 'edit',
            icon: IconName.EditDocument,
            label: _('editRecord'),
            onTrigger: this.handleEditRecord
          },
          {
            key: 'delete',
            icon: IconName.DeleteDocument,
            label: _('deleteRecord'),
            onTrigger: this.handleDeleteRecord
          }
        ]}
      />
    )
  }
}

export interface SelectRecordListPanelProps extends SpecializedRecordListProps {
  onBack: (model: Ref) => void
  onRecordSelected: (model: Ref, record: ModelRecord) => void
}

export class SelectRecordListPanel extends React.PureComponent<SelectRecordListPanelProps> {
  private handleBack = () => {
    this.props.onBack(this.props.model)
  }

  private handleSelectRecord = (record: ModelRecord) => {
    this.props.onRecordSelected(this.props.model, record)
  }

  public render() {
    const _ = this.props.localeContext.get

    return (
      <RecordListPanel
        {...this.props}
        headerPrefix={_('selectRecordPrefix')}
        toolbarActions={[
          {
            key: 'new',
            icon: IconName.Back,
            label: _('back'),
            onTrigger: this.handleBack
          }
        ]}
        recordActions={[
          {
            key: 'select',
            icon: IconName.SelectDocument,
            label: _('selectRecord'),
            onTrigger: this.handleSelectRecord
          }
        ]}
      />
    )
  }
}

export const SelectRecordListPanelContainer = withLocale(withSession(SelectRecordListPanel))
export const RootRecordListPanelContainer = withLocale(withSession(RootRecordListPanel))
