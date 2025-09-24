import type { DerivedEdge } from '@/types/graph';

type NodeForEdges = {
  id: string;
  parentId?: string | null;
  projectId?: string;
  createdAt?: string;
  meta?: { standaloneRoot?: boolean } | null;
};

interface IndexedNode {
  node: NodeForEdges;
  index: number;
  timestamp: number;
}

const DEFAULT_PROJECT_KEY = '__default__';

export function deriveGraphEdges(nodes: NodeForEdges[]): DerivedEdge[] {
  const edges: DerivedEdge[] = [];

  nodes.forEach((node) => {
    if (node.parentId) {
      edges.push({
        id: `edge-${node.parentId}-${node.id}`,
        from: node.parentId,
        to: node.id,
        kind: 'parent',
      });
    }
  });

  const grouped = new Map<string, IndexedNode[]>();

  nodes.forEach((node, index) => {
    const projectKey = node.projectId ?? DEFAULT_PROJECT_KEY;
    const timeValue = node.createdAt ? Date.parse(node.createdAt) : Number.NaN;
    const timestamp = Number.isFinite(timeValue) ? timeValue : index;
    const bucket = grouped.get(projectKey);
    const entry: IndexedNode = { node, index, timestamp };
    if (bucket) {
      bucket.push(entry);
    } else {
      grouped.set(projectKey, [entry]);
    }
  });

  grouped.forEach((entries) => {
    const roots = entries
      .filter(({ node }) => !node.parentId && !(node.meta && node.meta.standaloneRoot))
      .sort((a, b) => {
        if (a.timestamp === b.timestamp) {
          return a.index - b.index;
        }
        return a.timestamp - b.timestamp;
      });

    for (let i = 1; i < roots.length; i += 1) {
      const prev = roots[i - 1].node;
      const curr = roots[i].node;
      edges.push({
        id: `edge-seq-${prev.id}-${curr.id}`,
        from: prev.id,
        to: curr.id,
        kind: 'sequential',
      });
    }
  });

  return edges;
}
