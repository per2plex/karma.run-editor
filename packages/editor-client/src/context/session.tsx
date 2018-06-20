import React from 'react'
import {Session, authenticate, refreshSession} from '@karma.run/sdk'
import {Omit} from '@karma.run/editor-common'
import * as storage from '../util/storage'
import {SessionStorageKey} from '../store/editorStore'
import {Config, withConfig} from './config'
import {EditorContext} from '../api/karmafe/editorContext'
import {ModelGroup} from '../api/karmafe/modelGroup'

export interface SessionContext {
  session?: Session
  editorContexts?: EditorContext[]
  modelGroups?: ModelGroup[]
  canRestoreSessionFromStorage: boolean
  restoreSessionFromLocalStorage(): Promise<Session>
  restoreSession(session: Session): Promise<Session>
  authenticate(username: string, password: string): Promise<Session>
  invalidate(): Promise<void>
  getEditorContexts(): Promise<EditorContext[]>
  getModelGroups(): Promise<EditorContext[]>
}

export const SessionContext = React.createContext<SessionContext>({
  canRestoreSessionFromStorage: false,

  async restoreSessionFromLocalStorage() {
    throw new Error('No SessionProvider found!')
  },

  async restoreSession() {
    throw new Error('No SessionProvider found!')
  },

  async authenticate() {
    throw new Error('No SessionProvider found!')
  },

  async invalidate() {
    throw new Error('No SessionProvider found!')
  },

  async getEditorContexts() {
    throw new Error('No SessionProvider found!')
  },

  async getModelGroups() {
    throw new Error('No SessionProvider found!')
  }
})

export interface SessionProviderProps {
  config: Config
}

export class SessionProvider extends React.Component<SessionProviderProps, SessionContext> {
  constructor(props: SessionProviderProps) {
    super(props)

    this.state = {
      canRestoreSessionFromStorage: storage.get(SessionStorageKey) != undefined,
      restoreSessionFromLocalStorage: this.restoreSessionFromLocalStorage,
      restoreSession: this.restoreSession,
      authenticate: this.authenticate,
      invalidate: this.invalidate
    }
  }

  public restoreSessionFromLocalStorage = async () => {
    const session = storage.get(SessionStorageKey)

    if (!session) {
      throw new Error('No session to restore!')
    }

    return this.restoreSession(session)
  }

  public restoreSession = async (session: Session) => {
    try {
      const newSession = await refreshSession(this.props.config.karmaURL, session)

      this.setState({session: newSession})
      this.storeSession()

      return newSession
    } catch (err) {
      this.invalidate()
      throw err
    }
  }

  public authenticate = async (username: string, password: string) => {
    const session = await authenticate(this.props.config.karmaURL, username, password)

    this.setState({session})
    this.storeSession()

    return session
  }

  public invalidate = async () => {
    this.setState({session: undefined})
    storage.remove(SessionStorageKey)
  }

  private storeSession() {
    storage.set(SessionStorageKey, this.state.session)
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

export const SessionProviderContainer = withConfig(SessionProvider)
