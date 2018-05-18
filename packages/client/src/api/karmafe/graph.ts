import { Entry, rpcRequest, Session } from '../../api/karma'
import { ObjectMap } from '@karma.run/editor-common'

export type GraphMap = ObjectMap<ObjectMap<any>>

export async function graphFlowIncoming(entry: Entry, models: string[], session: Session): Promise<GraphMap> {
  return await rpcRequest(session, {
    graphFlow: {
      start: {
        newRef: {
          model: {model: entry.model},
          id: entry.id
        }
      },
      flow: [{
        from: {model: entry.model},
        backward: models.map(model => ({model}))
      }]
    }
  })
}
