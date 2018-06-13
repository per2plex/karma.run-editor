// import React from 'react'
// import {Session, authenticate} from '@karma.run/sdk'
// import english from './en.json'

// export type MessageKey = keyof typeof english

// export function getLocalization(_locale: string) {
//   return english
// }

// export function _(key: MessageKey, locale: string) {
//   return getLocalization(locale)[key] || key
// }

// export interface LocaleContext {
//   locale?: string
//   _(key: MessageKey): string
// }

// export const SessionContext = React.createContext<LocaleContext>({})

// export class LocaleProvider extends React.Component<{}, LocaleContext> {
//   constructor(props: {}) {
//     super(props)
//     this.state = {}
//   }

//   private async authenticate(karmaURL: string, username: string, password: string) {
//     const session = await authenticate(karmaURL, username, password)
//     const editorSession = {...session, karmaURL}

//     this.setState({session: editorSession})

//     return editorSession
//   }

//   private async invalidate() {
//     this.setState({session: undefined})
//   }

//   private

//   public render() {
//     return (
//       <SessionContext.Provider value={this.state}>{this.props.children}</SessionContext.Provider>
//     )
//   }
// }
