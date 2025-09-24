export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  projectCount: number;
  unreadCount: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  ownerId: string;
  status: 'backlog' | 'in-progress' | 'done';
  color: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
}

export interface NodeMeta {
  standaloneRoot?: boolean;
  [key: string]: any;
}

export interface Node {
  id: string;
  title: string;
  notes?: string;
  projectId: string;
  parentId?: string;
  status: 'todo' | 'in-progress' | 'blocked' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigneeIds: string[];
  tags: string[];
  color: string;
  icon?: string;
  dueDate?: string;
  position: { x: number; y: number };
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  attachments?: Attachment[];
  richNotes?: string;
  drawingData?: string;
  meta?: NodeMeta;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'link' | 'audio' | 'video';
  url?: string;
  size?: number;
  mimeType?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Reminder {
  id: string;
  nodeId: string;
  projectId: string;
  title: string;
  dueDate: string;
  assigneeIds: string[];
  isCompleted: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  nodeId: string;
  userId: string;
  content: string;
  mentions: string[];
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'member';
  permissions: 'view' | 'comment' | 'edit';
  joinedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'owner' | 'member';
  permissions: 'view' | 'comment' | 'edit';
  joinedAt: string;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actorId: string;
  timestamp: string;
  changes: Record<string, any>;
  clientVersion: string;
}