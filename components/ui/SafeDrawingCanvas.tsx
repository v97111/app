import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useColorScheme } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

interface DrawingCanvasProps {
  width: number;
  height: number;
  onDrawingChange?: (paths: string[]) => void;
  initialPaths?: string[];
}

export function SafeDrawingCanvas({ 
  width, 
  height, 
  onDrawingChange,
  initialPaths = [] 
}: DrawingCanvasProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [paths, setPaths] = useState<string[]>(initialPaths);
  const [currentPath, setCurrentPath] = useState<string>('');
  const pathRef = useRef<{ x: number; y: number }[]>([]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      pathRef.current = [{ x: locationX, y: locationY }];
      setCurrentPath(`M${locationX.toFixed(2)},${locationY.toFixed(2)}`);
    },

    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      pathRef.current.push({ x: locationX, y: locationY });
      
      const pathString = pathRef.current
        .map((point, index) => 
          index === 0 ? `M${point.x.toFixed(2)},${point.y.toFixed(2)}` : `L${point.x.toFixed(2)},${point.y.toFixed(2)}`
        )
        .join(' ');
      
      setCurrentPath(pathString);
    },

    onPanResponderRelease: () => {
      if (currentPath && pathRef.current.length > 1) {
        const newPaths = [...paths, currentPath];
        setPaths(newPaths);
        onDrawingChange?.(newPaths);
      }
      setCurrentPath('');
      pathRef.current = [];
    },
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <View
        style={[styles.canvas, { width, height }]}
        {...panResponder.panHandlers}
      >
        <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
          {paths.map((path, index) => (
            <Path
              key={index}
              d={path}
              stroke={colors.text}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {currentPath && (
            <Path
              d={currentPath}
              stroke={colors.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  canvas: {
    backgroundColor: 'transparent',
  },
});