import React from 'react'
import {Session, authenticate} from '@karma.run/sdk'
import {Omit} from '@karma.run/editor-common'
import * as storage from '../util/storage'
import {SessionStorageKey} from '../store/editorStore'

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
      authenticate: this.authenticate,
      invalidate: this.invalidate
    }
  }

  public componentDidMount() {
    if (!this.state.session) {
      this.restoreSessionFromLocalStorage()
    }
  }

  public restoreSessionFromLocalStorage = async () => {
    const session = storage.get(SessionStorageKey)
    if (!session) return
    return this.restoreSession(session)
  }

  public restoreSession = async (_session: EditorSession) => {
    // TODO: Add refreshSession to SDK
  }

  public authenticate = async (karmaURL: string, username: string, password: string) => {
    const session = await authenticate(karmaURL, username, password)
    const editorSession = {...session, karmaURL}

    this.setState({session: editorSession})
    storage.set(SessionStorageKey, session)

    return editorSession
  }

  public invalidate = async () => {
    this.setState({session: undefined})
    storage.remove(SessionStorageKey)
  }

  public render() {
    return (
      <SessionContext.Provider value={this.state}>{this.props.children}</SessionContext.Provider>
    )
  }
}

export function withSession<T extends {sessionContext: SessionContext}>(
  Component: React.ComponentType<T>
): React.StatelessComponent<Omit<T, 'sessionContext'>> {
  return props => (
    <SessionContext.Consumer>
      {sessionContext => <Component {...props} sessionContext={sessionContext} />}
    </SessionContext.Consumer>
  )
}
