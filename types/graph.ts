export type NodeID = string;
export type PortSide = 'left' | 'right' | 'top' | 'bottom';

export interface GraphNode {
  id: NodeID;
  title: string;
  subtitle?: string;
  status?: 'todo' | 'in_progress' | 'done';
  x: number; // canvas coordinate
  y: number; // canvas coordinate
  width?: number; // measured at runtime
  height?: number; // measured at runtime
  attachments?: Attachment[];
  inkStrokes?: Array<{ id: string; points: {x:number;y:number}[] }>;
}

export interface GraphEdge {
  id: string;
  from: NodeID;
  to: NodeID;
}

export interface Attachment { 
  id: string; 
  type: 'image'|'file'; 
  uri: string; 
  name?: string; 
  size?: number; 
}

export interface RectLike { 
  x: number; 
  y: number; 
  w: number; 
  h: number; 
}

export type Side = 'left' | 'right' | 'top' | 'bottom';

export interface UINode {
  id: NodeID;
  title: string;
  x?: number; // initial (optional)
  y?: number; // initial (optional)
}

export interface UIEdge {
  id: string;
  from: NodeID;
  to: NodeID;
}