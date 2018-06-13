import * as React from 'react'
import {style} from 'typestyle'
import {DataSet, Network, Node, Edge, EdgeOptions} from 'vis'
import {Entry} from '../../api/karma'
import {graphFlowIncoming, GraphMap} from '../../api/karmafe/graph'
import {ViewContext, findKeyPath} from '../../api/karmafe/viewContext'
import {EditorStore} from '../../store/editorStore'
import {getValuesForValuePath} from '@karma.run/editor-common'
import {objectPathForField} from '../../filter/configuration'
import {ViewContextMap} from '../fields/renderFieldStore'
import {FontFamily} from '../style'
import {color} from 'csx'

export namespace GraphView {
  export interface Props {
    entry: Entry
    viewContext: ViewContext
    editorStore: EditorStore
    onNodeDoubleClick?: (model: string, id: string) => void
  }
}

export class GraphView extends React.Component<GraphView.Props> {
  private element?: HTMLDivElement | null

  private nodes!: DataSet<Node>
  private network!: Network

  constructor(props: GraphView.Props) {
    super(props)
  }

  public async reload() {
    if (this.network) {
      this.network.destroy()
    }

    const graphMap = await graphFlowIncoming(
      this.props.entry,
      this.props.editorStore.modelList.map(model => model.id),
      this.props.editorStore.session!
    )

    this.nodes = new DataSet<Node>(
      nodesForGraphMap(graphMap, this.props.editorStore.viewContextMap)
    )
    const edges = new DataSet<Edge | EdgeOptions>(edgesForGraphMap(this.props.entry.id, graphMap))
    const groups = groupsForViewContexts(this.props.editorStore.viewContexts)

    this.network = new Network(
      this.element!,
      {nodes: this.nodes, edges},
      {
        autoResize: true,
        groups,
        layout: {improvedLayout: true}
      }
    )

    this.network.on('doubleClick', e => {
      if (this.props.onNodeDoubleClick && e.nodes.length > 0) {
        const id = e.nodes[0] as string
        if (id === this.props.entry.id) return

        const node = this.nodes.get(id)!
        this.props.onNodeDoubleClick(node.group!, id)
      }
    })
  }

  public async componentDidMount() {
    this.reload()
  }

  public render() {
    return <div className={GraphView.Style} ref={element => (this.element = element)} />
  }
}

export namespace GraphView {
  export const Style = style({
    display: 'flex',
    width: '100%',
    height: '100%'
  })
}

function nodeForDataAndViewContext(id: string, data: any, viewContext: ViewContext): Node {
  const descriptionKeyPath = viewContext.descriptionKeyPaths![0]
  let title: string = id

  if (descriptionKeyPath) {
    const field = findKeyPath(descriptionKeyPath, viewContext.fields!)
    const objectPath = objectPathForField(field!, viewContext.fields!)
    const values = getValuesForValuePath(data, objectPath)

    title = values[0] || id
  }

  return {id, label: title, shape: 'dot', color: viewContext.color, group: viewContext.model}
}

function edgeFromTo(idA: string, idB: string): Edge | EdgeOptions {
  return {from: idA, to: idB, arrows: 'to'}
}

function nodesForGraphMap(graphMap: GraphMap, viewContextMap: ViewContextMap) {
  return Object.entries(graphMap).reduce((nodes: Node[], [model, entries]) => {
    const viewContext = viewContextMap[model]

    return Object.entries(entries).reduce((nodes: Node[], [id, data]) => {
      nodes.push(nodeForDataAndViewContext(id, data, viewContext!))
      return nodes
    }, nodes)
  }, [])
}

function edgesForGraphMap(startID: string, graphMap: GraphMap) {
  return Object.entries(graphMap).reduce((nodes: Node[], [_, entries]) => {
    return Object.entries(entries).reduce((nodes: Node[], [id]) => {
      if (startID === id) return nodes
      nodes.push(edgeFromTo(id, startID))
      return nodes
    }, nodes)
  }, [])
}

function groupsForViewContexts(viewContexts: ViewContext[]) {
  return viewContexts.reduce(
    (groups, viewContext) => {
      groups[viewContext.model] = {
        color: viewContext.color,
        font: {
          color: color(viewContext.color!)
            .darken(0.1)
            .toHexString(),
          face: FontFamily.primary,
          strokeWidth: 1,
          strokeColor: color(viewContext.color!)
            .darken(0.6)
            .toHexString()
        }
      }

      return groups
    },
    {} as any
  )
}
