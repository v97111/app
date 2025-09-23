import { create } from 'zustand';
import type { UINode, UIEdge } from '@/types/graph';
import { layoutGraph } from '@/utils/graphLayout';

interface GraphState {
  nodes: UINode[];
  edges: UIEdge[];
  viewMode: 'cards' | 'graph';
  
  // Actions
  addNode: (node: Omit<UINode, 'id'>, parentId?: string) => void;
  updateNode: (id: string, updates: Partial<UINode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: Omit<UIEdge, 'id'>) => void;
  deleteEdge: (id: string) => void;
  setViewMode: (mode: 'cards' | 'graph') => void;
  commitNodePosition: (id: string, x: number, y: number) => void;
  autoLayout: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [
    { id: 'node-1', title: 'Welcome to Graph View', x: 100, y: 100 },
    { id: 'node-2', title: 'Child Node 1', x: 50, y: 250 },
    { id: 'node-3', title: 'Child Node 2', x: 200, y: 250 },
  ],
  edges: [
    { id: 'edge-1', from: 'node-1', to: 'node-2' },
    { id: 'edge-2', from: 'node-1', to: 'node-3' },
  ],
  viewMode: 'graph',

  addNode: (nodeData, parentId) => {
    const id = `node-${Date.now()}`;
    const { nodes, edges } = get();
    
    // Position new node below parent or at default location
    let x = 100, y = 100;
    if (parentId) {
      const parent = nodes.find(n => n.id === parentId);
      if (parent) {
        x = (parent.x ?? 0) + Math.random() * 100 - 50;
        y = (parent.y ?? 0) + 180;
      }
    } else {
      // Find a good position for root nodes
      const maxY = nodes.reduce((max, node) => Math.max(max, node.y ?? 0), 0);
      y = maxY + 200;
      x = Math.random() * 200 + 50;
    }

    const newNode: UINode = { ...nodeData, id, x, y };
    const newNodes = [...nodes, newNode];
    const newEdges = parentId ? [...edges, { id: `edge-${Date.now()}`, from: parentId, to: id }] : edges;

    set({ nodes: newNodes, edges: newEdges });
  },

  updateNode: (id, updates) => {
    set(state => ({
      nodes: state.nodes.map(node => 
        node.id === id ? { ...node, ...updates } : node
      )
    }));
  },

  deleteNode: (id) => {
    set(state => ({
      nodes: state.nodes.filter(node => node.id !== id),
      edges: state.edges.filter(edge => edge.from !== id && edge.to !== id)
    }));
  },

  addEdge: (edgeData) => {
    const id = `edge-${Date.now()}`;
    set(state => ({
      edges: [...state.edges, { ...edgeData, id }]
    }));
  },

  deleteEdge: (id) => {
    set(state => ({
      edges: state.edges.filter(edge => edge.id !== id)
    }));
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  commitNodePosition: (id, x, y) => {
    set(state => ({
      nodes: state.nodes.map(node => 
        node.id === id ? { ...node, x, y } : node
      )
    }));
  },

  autoLayout: () => {
    const { nodes, edges } = get();
    const graphNodes = nodes.map(n => ({ 
      ...n, 
      x: n.x ?? 0, 
      y: n.y ?? 0,
      width: 200,
      height: 120,
      title: n.title,
    }));
    
    const layoutedNodes = layoutGraph(graphNodes, edges);
    
    set({
      nodes: layoutedNodes.map(n => ({ 
        id: n.id, 
        title: n.title, 
        x: n.x, 
        y: n.y 
      }))
    });
  },
}));