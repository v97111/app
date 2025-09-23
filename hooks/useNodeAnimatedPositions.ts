import { useRef } from 'react';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { Node } from '@/types';

interface NodeWithSharedValues extends Node {
  sharedX: any;
  sharedY: any;
  width: number;
  height: number;
}

export function useNodeAnimatedPositions(nodes: Node[]) {
  // Store shared values in a ref to avoid creating them in render
  const sharedValuesRef = useRef<Map<string, { x: any; y: any }>>(new Map());

  // Create nodes with shared values
  const nodesWithSharedValues: NodeWithSharedValues[] = nodes.map(node => {
    let sharedValues = sharedValuesRef.current.get(node.id);
    
    if (!sharedValues) {
      // Create new shared values for new nodes
      sharedValues = {
        x: useSharedValue(node.position.x),
        y: useSharedValue(node.position.y),
      };
      sharedValuesRef.current.set(node.id, sharedValues);
    } else {
      // Update existing shared values with spring animation
      sharedValues.x.value = withSpring(node.position.x);
      sharedValues.y.value = withSpring(node.position.y);
    }
    
    return {
      ...node,
      sharedX: sharedValues.x,
      sharedY: sharedValues.y,
      width: 220,
      height: 140,
    };
  });

  // Clean up shared values for removed nodes
  const currentNodeIds = new Set(nodes.map(n => n.id));
  for (const [nodeId] of sharedValuesRef.current) {
    if (!currentNodeIds.has(nodeId)) {
      sharedValuesRef.current.delete(nodeId);
    }
  }

  return nodesWithSharedValues;
}