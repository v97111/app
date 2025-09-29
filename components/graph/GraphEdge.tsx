import React from 'react';
import Animated, { useAnimatedProps, useDerivedValue } from 'react-native-reanimated';
import { Path } from 'react-native-svg';
import { useGraphSnapshot } from './GraphRegistry';
import {
  arrowHeadPath,
  edgePathForRects,
} from '@/utils/graphUtils';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface GraphEdgeProps {
  from: string;
  to: string;
  strokeWidth?: number;
  color?: string;
  kind?: 'parent' | 'sequential';
}

const DEFAULT_COLOR = '#0E7AFE';
const EDGE_RADIUS = 14;
const EDGE_PADDING = 20;
const EPSILON = 0.5;

export function GraphEdge({ from, to, strokeWidth = 2.5, color = DEFAULT_COLOR, kind }: GraphEdgeProps) {
  const graph = useGraphSnapshot();
  const parent = graph.get(from);
  const child = graph.get(to);

  const geometry = useDerivedValue(() => {
    'worklet';

    if (!parent || !child) {
      return { path: '', arrow: '' };
    }

    const parentRect = {
      x: parent.x.value,
      y: parent.y.value,
      w: parent.w.value,
      h: parent.h.value,
    };

    const childRect = {
      x: child.x.value,
      y: child.y.value,
      w: child.w.value,
      h: child.h.value,
    };

    if (parentRect.w <= EPSILON || parentRect.h <= EPSILON || childRect.w <= EPSILON || childRect.h <= EPSILON) {
      return { path: '', arrow: '' };
    }

    const pathResult = edgePathForRects(parentRect, childRect, EDGE_RADIUS, EDGE_PADDING);

    if (!pathResult.d || pathResult.points.length < 2) {
      return { path: '', arrow: '' };
    }

    const points = pathResult.points;
    const tip = points[points.length - 1];
    const tail = points[points.length - 2];

    if (!tip || !tail || (Math.abs(tail.x - tip.x) < EPSILON && Math.abs(tail.y - tip.y) < EPSILON)) {
      return { path: pathResult.d, arrow: '' };
    }

    const arrow = arrowHeadPath(tail, tip, EDGE_RADIUS + 4, EDGE_RADIUS);
    return { path: pathResult.d, arrow };
  }, [parent, child]);

  const animatedEdgeProps = useAnimatedProps(() => ({ d: geometry.value.path || '' }));
  const animatedArrowProps = useAnimatedProps(() => ({ d: geometry.value.arrow || '' }));

  const edgeOpacity = kind === 'sequential' ? 0.65 : 0.9;

  return (
    <>
      <AnimatedPath
        animatedProps={animatedEdgeProps}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={edgeOpacity}
        pointerEvents="none"
      />
      <AnimatedPath
        animatedProps={animatedArrowProps}
        fill={color}
        opacity={edgeOpacity}
        pointerEvents="none"
      />
    </>
  );
}
