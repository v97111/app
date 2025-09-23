import React from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { Path } from 'react-native-svg';
import { useGraphSnapshot } from './GraphRegistry';
import { pickPorts, anchorFromSide, sideVec, orthogonalWaypoints, toRoundedSvgPath } from '@/utils/graphUtils';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface GraphEdgeProps {
  from: string;
  to: string;
  strokeWidth?: number;
  color?: string;
}

export function GraphEdge({ from, to, strokeWidth = 2, color = '#0E7AFE' }: GraphEdgeProps) {
  const { get } = useGraphSnapshot(); // re-renders when nodes register/unregister

  const animatedProps = useAnimatedProps(() => {
    const parent = get(from);
    const child = get(to);
    
    if (!parent || !child) {
      return { d: '' } as any; // Return empty path if nodes not ready
    }
    
    const pRect = { 
      x: parent.x.value, 
      y: parent.y.value, 
      w: parent.w.value, 
      h: parent.h.value 
    };
    const cRect = { 
      x: child.x.value,  
      y: child.y.value,  
      w: child.w.value,  
      h: child.h.value  
    };
    
    const { parent: pSide, child: cSide } = pickPorts(pRect, cRect, 24);

    const pAnchor = anchorFromSide(pRect, pSide);
    const cAnchor = anchorFromSide(cRect, cSide);

    const pad = 16;
    const pOut = { 
      x: pAnchor.x + sideVec(pSide).x * pad, 
      y: pAnchor.y + sideVec(pSide).y * pad 
    };
    const cIn = { 
      x: cAnchor.x + sideVec(cSide).x * pad, 
      y: cAnchor.y + sideVec(cSide).y * pad 
    };

    const midPoints = orthogonalWaypoints(pOut, cIn, pSide, cSide);
    const pts = [pAnchor, pOut, ...midPoints, cIn, cAnchor];
    const d = toRoundedSvgPath(pts, 12);
    return { d } as any;
  });

  return (
    <AnimatedPath 
      animatedProps={animatedProps} 
      fill="none" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      markerEnd="url(#arrowhead)"
    />
  );
}