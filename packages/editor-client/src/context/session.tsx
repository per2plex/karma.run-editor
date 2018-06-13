import React from 'react'
import {Session, authenticate} from '@karma.run/sdk'

export interface EditorSession extends Session {
  karmaURL: string
}

export interface SessionContext {
  session?: EditorSession
  authenticate(karmaURL: string, username: string, password: string): Promise<EditorSession>
  invalidate(): Promise<void>
}

export const SessionContext = React.createContext<SessionContext>({
  async authenticate() {
    console.warn('No SessionProvider found!')
    return {karmaURL: '', username: '', signature: ''}
  },
  async invalidate() {
    console.warn('No SessionProvider found!')
  }
})

export class SessionProvider extends React.Component<{}, SessionContext> {
  constructor(props: {}) {
    super(props)

    this.state = {
      session: undefined,
      authenticate: this.authenticate,
      invalidate: this.invalidate
    }
  }

  private async authenticate(karmaURL: string, username: string, password: string) {
    const session = await authenticate(karmaURL, username, password)
    const editorSession = {...session, karmaURL}

    this.setState({session: editorSession})

    return editorSession
  }

  private async invalidate() {
    this.setState({session: undefined})
  }

  public render() {
    return (
      <SessionContext.Provider value={this.state}>{this.props.children}</SessionContext.Provider>
    )
  }
}
