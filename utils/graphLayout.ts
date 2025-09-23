import dagre from 'dagre';
import type { GraphNode, GraphEdge } from '@/types/graph';

export function layoutGraph(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: 'TB', // Top to bottom
    ranksep: 80,   // Vertical spacing between ranks
    nodesep: 60,   // Horizontal spacing between nodes
    edgesep: 20,   // Edge separation
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to graph
  nodes.forEach(n => {
    g.setNode(n.id, { 
      width: n.width ?? 200, 
      height: n.height ?? 120 
    });
  });

  // Add edges
  edges.forEach(e => {
    g.setEdge(e.from, e.to);
  });

  // Run layout
  dagre.layout(g);

  // Apply layout positions
  return nodes.map(n => {
    const pos = g.node(n.id);
    if (pos) {
      return {
        ...n,
        x: pos.x - (pos.width / 2),
        y: pos.y - (pos.height / 2),
      };
    }
    return n;
  });
}