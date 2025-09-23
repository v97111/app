import React, { useState } from 'react';
import { View, Dimensions, TouchableOpacity, Text, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import Svg, { Defs, Marker, Path } from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  runOnJS 
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { GraphProvider } from './GraphRegistry';
import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';
import { Plus, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CANVAS_SIZE = { width: screenWidth * 2, height: screenHeight * 2 };
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;

interface GraphCanvasProps {
  nodes: Array<{ id: string; title: string; x?: number; y?: number; status?: 'todo' | 'in-progress' | 'blocked' | 'done'; attachments?: any[] }>;
  edges: Array<{ id: string; from: string; to: string }>;
  onCommit?: (id: string, x: number, y: number) => void;
  onNodePress?: (id: string) => void;
  onNodeLongPress?: (id: string) => void;
  onCanvasPress?: (position: { x: number; y: number }) => void;
}

export function GraphCanvas({ 
  nodes, 
  edges, 
  onCommit, 
  onNodePress, 
  onNodeLongPress,
  onCanvasPress 
}: GraphCanvasProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Canvas transform values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const lastScale = useSharedValue(1);
  const lastTranslateX = useSharedValue(0);
  const lastTranslateY = useSharedValue(0);

  // Canvas gestures
  const panGesture = Gesture.Pan()
    .minDistance(10)
    .onUpdate((event) => {
      translateX.value = lastTranslateX.value + event.translationX;
      translateY.value = lastTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, lastScale.value * event.scale));
      scale.value = newScale;
    })
    .onEnd(() => {
      lastScale.value = scale.value;
    });

  // Two-finger tap for node creation
  const twoFingerTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(300)
    .onEnd((event) => {
      if (event.numberOfPointers >= 2 && onCanvasPress) {
        const canvasX = (event.x - translateX.value) / scale.value;
        const canvasY = (event.y - translateY.value) / scale.value;
        runOnJS(onCanvasPress)({ x: canvasX, y: canvasY });
      }
    });

  const composedGesture = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    twoFingerTapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Helper functions
  const resetView = () => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    scale.value = withSpring(1);
    lastTranslateX.value = 0;
    lastTranslateY.value = 0;
    lastScale.value = 1;
  };

  const zoomIn = () => {
    const newScale = Math.min(MAX_ZOOM, scale.value * 1.2);
    scale.value = withSpring(newScale);
    lastScale.value = newScale;
  };

  const zoomOut = () => {
    const newScale = Math.max(MIN_ZOOM, scale.value / 1.2);
    scale.value = withSpring(newScale);
    lastScale.value = newScale;
  };

  return (
    <GraphProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Canvas */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[{ flex: 1 }, animatedStyle]}>
            {/* Edges layer */}
            <Svg 
              style={{ 
                position: 'absolute', 
                left: 0, 
                top: 0, 
                width: CANVAS_SIZE.width, 
                height: CANVAS_SIZE.height,
                pointerEvents: 'none',
              }}
            >
              <Defs>
                <Marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                  markerUnits="strokeWidth"
                  viewBox="0 0 10 7"
                >
                  <Path d="M0,0 L0,7 L10,3.5 z" fill={colors.primary} />
                </Marker>
              </Defs>
              {edges.map(e => (
                <GraphEdge 
                  key={e.id} 
                  from={e.from}
                  to={e.to}
                  color={colors.primary}
                />
              ))}
            </Svg>

            {/* Nodes layer */}
            <View 
              style={{ 
                position: 'absolute',
                width: CANVAS_SIZE.width,
                height: CANVAS_SIZE.height,
              }}
              pointerEvents="box-none"
            >
              {nodes.map(n => (
                <GraphNode 
                  key={n.id} 
                  id={n.id}
                  title={n.title}
                  initialX={n.x}
                  initialY={n.y}
                  status={n.status}
                  attachments={n.attachments}
                  onCommit={onCommit}
                  onPress={() => onNodePress?.(n.id)}
                  onLongPress={() => onNodeLongPress?.(n.id)}
                />
              ))}
            </View>
          </Animated.View>
        </GestureDetector>

        {/* Controls */}
        <View style={{
          position: 'absolute',
          top: 60,
          right: 16,
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 8,
          ...Platform.select({
            default: {
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            },
            web: {
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            },
          }),
        }}>
          <TouchableOpacity 
            style={{ padding: 8, alignItems: 'center' }} 
            onPress={zoomOut}
          >
            <ZoomOut size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ padding: 8, alignItems: 'center' }} 
            onPress={zoomIn}
          >
            <ZoomIn size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ padding: 8, alignItems: 'center' }} 
            onPress={resetView}
          >
            <RotateCcw size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Add Node Button */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 100,
            right: 16,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...Platform.select({
              default: {
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              },
              web: {
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              },
            }),
          }}
          onPress={() => onCanvasPress?.({ x: 100, y: 100 })}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Instructions */}
        <View style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          backgroundColor: colors.surface,
          padding: 12,
          borderRadius: 8,
          maxWidth: 200,
          ...Platform.select({
            default: {},
            web: {
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
          }),
        }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            Two-finger tap to create nodes
          </Text>
        </View>
      </View>
    </GraphProvider>
  );
}