import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { StorageService } from '@/utils/storage';
import { Project, Node } from '@/types';
import { ProjectCanvas } from '@/components/project/ProjectCanvas';
import { NodeEditor } from '@/components/project/NodeEditor';
import { ArrowLeft, Settings } from 'lucide-react-native';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [project, setProject] = useState<Project | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const projects = await StorageService.getProjects();
        const currentProject = projects.find(p => p.id === id) || null;
        if (!alive) return;

        setProject(currentProject);

        if (currentProject) {
          const projectNodes = await StorageService.getNodesByProject(id);
          if (!alive) return;
          setNodes(projectNodes);
        }
      } catch (error) {
        console.error('Error loading project data:', error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const handleBack = () => router.back();

  const handleNodePress = (node: Node) => {
    setSelectedNode(node);
    setShowNodeEditor(true);
  };

  const handleNodeMove = async (nodeId: string, position: { x: number; y: number }) => {
    try {
      await StorageService.updateNode(nodeId, { position });
      setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, position } : n)));
    } catch (error) {
      console.error('Error updating node position:', error);
    }
  };

  const handleCreateNode = async (
    parentId?: string,
    position?: { x: number; y: number },
    childData?: Partial<Node>
  ) => {
    if (!project) return;

    const standaloneRoot = childData?.meta?.standaloneRoot === true;
    let effectiveParentId = parentId;

    if (!effectiveParentId && !standaloneRoot) {
      const score = (node: Node) => {
        const parsed = Date.parse(node.createdAt ?? '');
        return Number.isFinite(parsed) ? parsed : node.orderIndex ?? 0;
      };

      const previous = nodes.reduce<Node | undefined>((latest, candidate) => {
        if (candidate.projectId !== project.id) return latest;
        if (candidate.parentId) return latest;
        if (candidate.meta?.standaloneRoot) return latest;

        if (!latest) return candidate;
        return score(candidate) >= score(latest) ? candidate : latest;
      }, undefined);

      effectiveParentId = previous?.id;
    }

    let nodePosition = position;
    if (!nodePosition) {
      if (effectiveParentId) {
        const parentNode = nodes.find(n => n.id === effectiveParentId);
        nodePosition = parentNode
          ? { x: parentNode.position.x + 50, y: parentNode.position.y + 180 }
          : { x: 100, y: 100 };
      } else {
        const maxY = nodes.reduce((max, n) => Math.max(max, n.position.y), 0);
        nodePosition = { x: Math.random() * 200 + 100, y: maxY + 200 };
      }
    }

    const finalPosition = nodePosition ?? { x: 100, y: 100 };
    const now = new Date().toISOString();
    const meta = {
      ...(standaloneRoot ? { standaloneRoot: true } : {}),
      ...(childData?.meta ?? {}),
    };
    if (!meta.nodeType) {
      meta.nodeType = 'process';
    }

    const newNode: Node = {
      id: Date.now().toString(),
      title: 'New Node',
      projectId: project.id,
      status: 'todo',
      priority: 'medium',
      assigneeIds: [],
      tags: [],
      color: project.color,
      orderIndex: nodes.length,
      createdAt: now,
      updatedAt: now,
      createdBy: 'current-user',
      ...childData,
      parentId: effectiveParentId,
      position: childData?.position ?? finalPosition,
      meta: Object.keys(meta).length ? meta : undefined,
    };

    try {
      await StorageService.addNode(newNode);
      setNodes(prev => [...prev, newNode]);
      setProject(prev => (prev ? { ...prev, nodeCount: prev.nodeCount + 1 } : prev));
    } catch (error) {
      console.error('Error creating node:', error);
    }
  };

  const handleUpdateNode = async (nodeId: string, updates: Partial<Node>) => {
    try {
      const existing = nodes.find(n => n.id === nodeId);
      if (!existing) return;
      const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };

      await StorageService.updateNode(nodeId, updates);
      setNodes(prev => prev.map(n => (n.id === nodeId ? merged : n)));
    } catch (error) {
      console.error('Error updating node:', error);
    }
  };

  const handleCanvasPress = (
    position: { x: number; y: number },
    options?: { shiftKey?: boolean; source?: 'tap' | 'double-click' | 'button' },
  ) => {
    const nodeType = options?.shiftKey ? 'task' : 'process';
    handleCreateNode(undefined, position, { meta: { nodeType } });
  };

  const handleSaveNode = async (nodeData: Partial<Node>) => {
    if (!selectedNode) return;
    try {
      const updated = { ...selectedNode, ...nodeData };
      await StorageService.updateNode(selectedNode.id, nodeData);
      setNodes(prev => prev.map(n => (n.id === selectedNode.id ? updated : n)));
      setSelectedNode(null);
      setShowNodeEditor(false);
    } catch (error) {
      console.error('Error saving node:', error);
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;
    Alert.alert('Delete Node', 'Are you sure you want to delete this node?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await StorageService.deleteNode(selectedNode.id);
            setNodes(prev => prev.filter(n => n.id !== selectedNode.id));
            setProject(prev => (prev ? { ...prev, nodeCount: Math.max(0, prev.nodeCount - 1) } : prev));
            setSelectedNode(null);
            setShowNodeEditor(false);
          } catch (error) {
            console.error('Error deleting node:', error);
          }
        },
      },
    ]);
  };

  const handleCloseEditor = () => {
    setSelectedNode(null);
    setShowNodeEditor(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.text, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.text, { color: colors.text }]}>Project not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {project.name}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {nodes.length} nodes
          </Text>
        </View>

        <TouchableOpacity style={styles.iconBtn}>
          <Settings size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Canvas */}
      <ProjectCanvas
        project={project}
        nodes={nodes}
        onNodePress={handleNodePress}
        onNodeMove={handleNodeMove}
        onCreateNode={handleCreateNode}
        onUpdateNode={handleUpdateNode}
        onCanvasPress={handleCanvasPress}
      />

      {/* Node Editor Modal */}
      <NodeEditor
        node={selectedNode}
        visible={showNodeEditor}
        onClose={handleCloseEditor}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBtn: { padding: 8 },
  headerContent: { flex: 1, paddingHorizontal: 8 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 2 },
  subtitle: { fontSize: 14 },
});
