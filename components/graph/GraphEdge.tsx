import React from 'react';
import Animated, { useAnimatedProps, useDerivedValue } from 'react-native-reanimated';
import { Path } from 'react-native-svg';
import { useGraphSnapshot } from './GraphRegistry';
import {
  closestAnchorPair,
  sideVec,
  orthogonalWaypoints,
  toRoundedSvgPath,
  arrowHeadPath,
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

function pruneRedundant(points: { x: number; y: number }[]) {
  'worklet';
  if (points.length <= 2) return points;
  const filtered: { x: number; y: number }[] = [points[0]];

  for (let i = 1; i < points.length; i += 1) {
    const prev = filtered[filtered.length - 1];
    const curr = points[i];
    if (!prev || Math.abs(prev.x - curr.x) > EPSILON || Math.abs(prev.y - curr.y) > EPSILON) {
      filtered.push(curr);
    }
  }

  return filtered;
}

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

    const anchors = closestAnchorPair(parentRect, childRect);
    const parentVec = sideVec(anchors.parent.side);
    const childVec = sideVec(anchors.child.side);

    const parentOut = {
      x: anchors.parent.x + parentVec.x * EDGE_PADDING,
      y: anchors.parent.y + parentVec.y * EDGE_PADDING,
    };

    const childIn = {
      x: anchors.child.x + childVec.x * EDGE_PADDING,
      y: anchors.child.y + childVec.y * EDGE_PADDING,
    };

    const middle = orthogonalWaypoints(parentOut, childIn, anchors.parent.side, anchors.child.side);
    const rawPoints = [
      { x: anchors.parent.x, y: anchors.parent.y },
      parentOut,
      ...middle,
      childIn,
      { x: anchors.child.x, y: anchors.child.y },
    ];

    const points = pruneRedundant(rawPoints);
    const path = toRoundedSvgPath(points, EDGE_RADIUS);

    if (!path || points.length < 2) {
      return { path: '', arrow: '' };
    }

    const tail = points[points.length - 2];
    const tip = points[points.length - 1];

    if (!tail || (Math.abs(tail.x - tip.x) < EPSILON && Math.abs(tail.y - tip.y) < EPSILON)) {
      return { path, arrow: '' };
    }

    const arrow = arrowHeadPath(tail, tip, EDGE_RADIUS + 4, EDGE_RADIUS);
    return { path, arrow };
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
