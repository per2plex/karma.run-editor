import React from 'react'
import {withLocation, LocationContext, AppLocation, LocationType} from '../context/location'
import {ListPanelContext, NotFoundContext, PanelContext, PanelType} from './panelManager'
import {withSession, SessionContext} from '../context/session'
import {StackView} from './common/stackView'
import {EntryListPanel} from './entryListPanel'

export interface MainPanelProps {
  sessionContext: SessionContext
  locationContext: LocationContext
}

export interface MainPanelState {
  panelContexts: PanelContext[]
}

export class MainPanel extends React.Component<MainPanelProps, MainPanelState> {
  public state: MainPanelState = {
    panelContexts: []
  }

  private getPanelContextForLocation(location: AppLocation) {
    const sessionContext = this.props.sessionContext
    switch (location.type) {
      case LocationType.EntryList:
        return ListPanelContext(sessionContext.viewContextSlugMap.get(location.slug)!)

      default:
      case LocationType.NotFound:
        return NotFoundContext()
    }
  }

  private handleNewRecord = () => {}

  private getPanelForContext(context: PanelContext, disabled: boolean) {
    switch (context.type) {
      case PanelType.List:
        return (
          <EntryListPanel
            viewContext={context.viewContext}
            onNewEntry={this.handleNewRecord}
            disabled={disabled}
          />
        )

      default:
      case PanelType.NotFound:
        return <div>404</div>
    }
  }

  public render() {
    const panelContexts = [this.getPanelContextForLocation(this.props.locationContext.location!)]

    return (
      <StackView>
        {panelContexts.map(panelContext => (
          <React.Fragment key={panelContext.contextID}>
            {this.getPanelForContext(panelContext)}
          </React.Fragment>
        ))}
      </StackView>
    )
  }
}

export const MainPanelContainer = withLocation(withSession(MainPanel))
