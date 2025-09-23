import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useColorScheme } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Colors } from '@/constants/Colors';
import { RotateCcw, Undo } from 'lucide-react-native';

interface InkPadProps {
  width?: number;
  height?: number;
  onChange?: (strokes: number[][][]) => void;
  initialStrokes?: number[][][];
}

export function InkPad({ width = 200, height = 120, onChange, initialStrokes = [] }: InkPadProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [strokes, setStrokes] = useState<number[][][]>(initialStrokes);
  const [activeStroke, setActiveStroke] = useState<number[][] | null>(null);

  const handleGestureEvent = (event: any) => {
    const { x, y } = event.nativeEvent;
    if (activeStroke) {
      const newStroke = [...activeStroke, [x, y]];
      setActiveStroke(newStroke);
    }
  };

  const handleGestureBegan = (event: any) => {
    const { x, y } = event.nativeEvent;
    setActiveStroke([[x, y]]);
  };

  const handleGestureEnded = () => {
    if (activeStroke && activeStroke.length > 1) {
      const newStrokes = [...strokes, activeStroke];
      setStrokes(newStrokes);
      onChange?.(newStrokes);
    }
    setActiveStroke(null);
  };

  const clearAll = () => {
    setStrokes([]);
    setActiveStroke(null);
    onChange?.([]);
  };

  const undo = () => {
    if (strokes.length > 0) {
      const newStrokes = strokes.slice(0, -1);
      setStrokes(newStrokes);
      onChange?.(newStrokes);
    }
  };

  const strokeToPath = (points: number[][]) => {
    if (points.length < 2) return '';
    return `M ${points.map(p => p.join(',')).join(' L ')}`;
  };

  return (
    <View style={{ 
      width, 
      height, 
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    }}>
      {/* Controls */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 8,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <Text style={{ fontSize: 12, color: colors.text, fontWeight: '500' }}>
          Draw here
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={undo} disabled={strokes.length === 0}>
            <Undo size={16} color={strokes.length > 0 ? colors.text : colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAll} disabled={strokes.length === 0}>
            <RotateCcw size={16} color={strokes.length > 0 ? colors.error : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Drawing area */}
      <PanGestureHandler
        onBegan={handleGestureBegan}
        onGestureEvent={handleGestureEvent}
        onEnded={handleGestureEnded}
      >
        <View style={{ flex: 1 }}>
          <Svg width={width} height={height - 40} style={{ position: 'absolute' }}>
            {/* Existing strokes */}
            {strokes.map((stroke, i) => (
              <Path 
                key={i} 
                d={strokeToPath(stroke)} 
                strokeWidth={2} 
                stroke={colors.text} 
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {/* Active stroke */}
            {activeStroke && activeStroke.length > 1 && (
              <Path 
                d={strokeToPath(activeStroke)} 
                strokeWidth={2} 
                stroke={colors.primary} 
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>
        </View>
      </PanGestureHandler>
    </View>
  );
}