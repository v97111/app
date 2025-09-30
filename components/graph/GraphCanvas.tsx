import React, { useCallback, useMemo, useRef } from 'react';
import { View, TouchableOpacity, Text, Platform, useWindowDimensions } from 'react-native';
import { useColorScheme } from 'react-native';
import Svg from 'react-native-svg';
import {
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import type {
  PanGestureHandlerGestureEvent,
  PinchGestureHandlerGestureEvent,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import type { UINode, DerivedEdge } from '@/types/graph';
import { deriveGraphEdges } from '@/utils/graphSelectors';
import { GraphProvider, useGraphSnapshot } from './GraphRegistry';
import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';
import { Plus, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react-native';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;

interface GraphCanvasEdge extends DerivedEdge {
  color?: string;
}

interface GraphCanvasProps {
  nodes: UINode[];
  edges?: GraphCanvasEdge[];
  onCommit?: (id: string, x: number, y: number) => void;
  onNodePress?: (id: string) => void;
  onNodeLongPress?: (id: string) => void;
  onCanvasPress?: (position: { x: number; y: number }) => void;
}

function GraphCanvasInner({
  nodes,
  edges,
  onCommit,
  onNodePress,
  onNodeLongPress,
  onCanvasPress,
}: GraphCanvasProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const graph = useGraphSnapshot();

  const canvasSize = useMemo(() => ({
    width: Math.max(windowWidth * 2, windowWidth),
    height: Math.max(windowHeight * 2, windowHeight),
  }), [windowWidth, windowHeight]);

  const edgesToRender = useMemo<GraphCanvasEdge[]>(() => {
    if (edges !== undefined) {
      return edges;
    }

    const computed = deriveGraphEdges(nodes);
    const colorMap = new Map<string, string | undefined>();
    nodes.forEach((node) => {
      if (node.color) {
        colorMap.set(node.id, node.color);
      }
    });

    return computed.map((edge) => ({
      ...edge,
      color: colorMap.get(edge.to) ?? colors.primary,
    }));
  }, [edges, nodes, colors.primary]);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const panRef = useRef<PanGestureHandler>(null);
  const pinchRef = useRef<PinchGestureHandler>(null);
  const tapRef = useRef<TapGestureHandler>(null);

  const registryEntries = graph.getAll();
  const nodePanRefs = registryEntries
    .map(([, entry]) => entry.panRef)
    .filter((ref): ref is NonNullable<typeof ref> => !!ref);

  const clampScale = (value: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));

  const onCanvasTap = useCallback((position: { x: number; y: number }) => {
    onCanvasPress?.(position);
  }, [onCanvasPress]);

  const panGesture = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
  });

  const pinchGesture = useAnimatedGestureHandler<
    PinchGestureHandlerGestureEvent,
    { startScale: number }
  >({
    onStart: (_, ctx) => {
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      scale.value = clampScale(ctx.startScale * event.scale);
    },
  });

  const twoFingerTapGesture = useAnimatedGestureHandler<
    TapGestureHandlerGestureEvent
  >({
    onEnd: (event, _, successful) => {
      if (!successful || event.numberOfPointers < 2 || !onCanvasPress) {
        return;
      }

      const canvasX = (event.x - translateX.value) / scale.value;
      const canvasY = (event.y - translateY.value) / scale.value;
      runOnJS(onCanvasTap)({ x: canvasX, y: canvasY });
    },
  });

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
  };

  const zoomIn = () => {
    const newScale = Math.min(MAX_ZOOM, scale.value * 1.2);
    scale.value = withSpring(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(MIN_ZOOM, scale.value / 1.2);
    scale.value = withSpring(newScale);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <PanGestureHandler
        ref={panRef}
        simultaneousHandlers={[pinchRef, tapRef]}
        waitFor={nodePanRefs.length ? nodePanRefs : undefined}
        avgTouches
        minPointers={1}
        shouldCancelWhenOutside={false}
        onGestureEvent={panGesture}
        onHandlerStateChange={panGesture}
      >
        <Animated.View
          style={[{ flex: 1 }, animatedStyle]}
          collapsable={false}
          renderToHardwareTextureAndroid
        >
          <PinchGestureHandler
            ref={pinchRef}
            simultaneousHandlers={[panRef, tapRef]}
            onGestureEvent={pinchGesture}
            onHandlerStateChange={pinchGesture}
          >
            <Animated.View style={{ flex: 1 }} collapsable={false}>
              <TapGestureHandler
                ref={tapRef}
                enabled={!!onCanvasPress}
                minPointers={2}
                maxDurationMs={250}
                maxDist={24}
                simultaneousHandlers={[panRef, pinchRef]}
                onGestureEvent={twoFingerTapGesture}
                onHandlerStateChange={twoFingerTapGesture}
              >
                <Animated.View style={{ flex: 1 }} collapsable={false}>
                  {/* Edges layer */}
                  <Svg
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: canvasSize.width,
                      height: canvasSize.height,
                    }}
                  >
                    {edgesToRender.map((edge) => (
                      <GraphEdge
                        key={edge.id}
                        from={edge.from}
                        to={edge.to}
                        color={edge.color ?? colors.primary}
                        kind={edge.kind}
                      />
                    ))}
                  </Svg>

                  {/* Nodes layer */}
                  <View
                    style={{
                      position: 'absolute',
                      width: canvasSize.width,
                      height: canvasSize.height,
                    }}
                    pointerEvents="box-none"
                  >
                    {nodes.map((n) => (
                      <GraphNode
                        key={n.id}
                        id={n.id}
                        title={n.title}
                        initialX={n.x}
                        initialY={n.y}
                        status={n.status}
                        attachments={n.attachments}
                        color={n.color}
                        onCommit={onCommit}
                        onPress={() => onNodePress?.(n.id)}
                        onLongPress={() => onNodeLongPress?.(n.id)}
                        canvasPanRef={panRef}
                      />
                    ))}
                  </View>
                </Animated.View>
              </TapGestureHandler>
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>

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
  );
}

export function GraphCanvas(props: GraphCanvasProps) {
  return (
    <GraphProvider>
      <GraphCanvasInner {...props} />
    </GraphProvider>
  );
}