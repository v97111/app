import React, { useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { StatusChip } from '@/components/ui/StatusChip';
import { Node, Project } from '@/types';
import { ViewModeToggle } from '@/components/ui/ViewModeToggle';
import { useResponsive } from '@/hooks/useResponsive';
import { Plus } from 'lucide-react-native';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import type { UINode } from '@/types/graph';

interface ProjectCanvasProps {
  project: Project;
  nodes: Node[];
  onNodePress: (node: Node) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onCreateNode: (parentId?: string, position?: { x: number; y: number }, nodeData?: any) => void;
  onUpdateNode: (nodeId: string, updates: Partial<Node>) => void;
  onCanvasPress: (position: { x: number; y: number }) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CANVAS_SIZE = { width: screenWidth * 2, height: screenHeight * 2 };

export function ProjectCanvas({
  project,
  nodes,
  onNodePress,
  onNodeMove,
  onCreateNode,
  onUpdateNode,
  onCanvasPress,
}: ProjectCanvasProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isTablet } = useResponsive();
  const [viewMode, setViewMode] = useState<'graph' | 'cards'>('graph');

  // Convert nodes to UINode format
  const uiNodes: UINode[] = nodes.map(node => ({
    id: node.id,
    title: node.title,
    x: node.position.x,
    y: node.position.y,
    status: node.status,
    attachments: node.attachments,
  }));

  // Convert edges
  const uiEdges = nodes
    .filter(node => node.parentId)
    .map(node => ({
      id: `edge-${node.parentId}-${node.id}`,
      from: node.parentId!,
      to: node.id,
    }));

  const handleCommitPosition = (id: string, x: number, y: number) => {
    onNodeMove(id, { x, y });
  };

  const handleCanvasPress = (position: { x: number; y: number }) => {
    onCanvasPress(position);
  };

  // Cards View
  const CardsView = () => (
    <ScrollView style={styles.cardsContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.cardsContent}>
        {uiNodes.map(node => (
          <TouchableOpacity
            key={node.id}
            onPress={() => {
              const originalNode = nodes.find(n => n.id === node.id);
              if (originalNode) onNodePress(originalNode);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.cardItem,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  shadowColor: colors.shadow,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>{node.title}</Text>
              {!!node.status && <StatusChip status={node.status} size="small" />}
            </View>
          </TouchableOpacity>
        ))}

        {uiNodes.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No nodes yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Create your first node to get started
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => onCreateNode()}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create Node</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // Graph View
  const GraphView = () => {
    const handleNodePress = (nodeId: string) => {
      const originalNode = nodes.find(n => n.id === nodeId);
      if (originalNode) onNodePress(originalNode);
    };

    const handleNodeLongPress = (nodeId: string) => {
      onCreateNode(nodeId);
    };

    return (
      <GraphCanvas
        nodes={uiNodes}
        edges={uiEdges}
        onCommit={handleCommitPosition}
        onNodePress={handleNodePress}
        onNodeLongPress={handleNodeLongPress}
        onCanvasPress={handleCanvasPress}
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        Platform.OS === 'web' && { touchAction: 'none' } as any,
      ]}
    >
      {/* Header with View Toggle */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />
        <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
          {viewMode === 'graph' ? 'Two-finger tap to create nodes' : 'Tap cards to edit'}
        </Text>
      </View>

      {/* Content */}
      {viewMode === 'cards' ? <CardsView /> : <GraphView />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  cardsContainer: { flex: 1 },
  cardsContent: { padding: 16 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    ...Platform.select({
      default: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      web: {
        // @ts-ignore – pass-through style for web
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
});