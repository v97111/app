import React, { useEffect } from 'react';
import { View, Text, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedGestureHandler, 
  useAnimatedStyle, 
  runOnJS,
  useSharedValue,
  withSpring 
} from 'react-native-reanimated';
import { PanGestureHandler, LongPressGestureHandler } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useGraphRegistry } from './GraphRegistry';
import { StatusChip } from '@/components/ui/StatusChip';
import { Circle, Paperclip } from 'lucide-react-native';

interface GraphNodeProps {
  id: string;
  title: string;
  initialX?: number;
  initialY?: number;
  status?: 'todo' | 'in-progress' | 'blocked' | 'done';
  attachments?: any[];
  onCommit?: (id: string, x: number, y: number) => void;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function GraphNode({ 
  id, 
  title, 
  initialX = 0, 
  initialY = 0, 
  status,
  attachments,
  onCommit,
  onPress,
  onLongPress 
}: GraphNodeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // ✅ Hooks at top level (no loops)
  const x = useSharedValue(initialX);
  const y = useSharedValue(initialY);
  const w = useSharedValue(200);
  const h = useSharedValue(120);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const { register, unregister } = useGraphRegistry();

  useEffect(() => {
    register(id, { x, y, w, h });
    return () => unregister(id);
  }, [id, register, unregister, x, y, w, h]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value }, 
      { translateY: y.value },
      { scale: scale.value }
    ],
  }));

  const onLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout;
    // Only update if dimensions actually changed
    if (Math.abs(w.value - width) > 1) w.value = width;
    if (Math.abs(h.value - height) > 1) h.value = height;
  };

  const panHandler = useAnimatedGestureHandler({
    onStart: (evt, ctx: any) => { 
      ctx.sx = x.value; 
      ctx.sy = y.value;
      isDragging.value = true;
      scale.value = withSpring(1.05);
    },
    onActive: (evt, ctx: any) => {
      x.value = ctx.sx + evt.translationX; 
      y.value = ctx.sy + evt.translationY;
    },
    onEnd: () => { 
      isDragging.value = false;
      scale.value = withSpring(1);
      if (onCommit) {
        runOnJS(onCommit)(id, x.value, y.value);
      }
    }
  });

  const longPressHandler = useAnimatedGestureHandler({
    onStart: () => {
      if (onLongPress) {
        runOnJS(onLongPress)();
      }
    }
  });

  const handlePress = () => {
    if (onPress) onPress();
  };

  return (
    <LongPressGestureHandler onGestureEvent={longPressHandler} minDurationMs={500}>
      <Animated.View>
        <PanGestureHandler onGestureEvent={panHandler}>
          <Animated.View 
            onLayout={onLayout} 
            style={[
              {
                position: 'absolute',
                padding: 12,
                borderRadius: 12,
                backgroundColor: colors.card,
                borderWidth: 2,
                borderColor: colors.primary,
                minWidth: 180,
                maxWidth: 220,
                ...Platform.select({
                  default: {
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  },
                  web: {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    cursor: 'grab',
                    touchAction: 'none',
                  },
                }),
              },
              animatedStyle
            ]}
          >
            <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                  <Circle size={12} color="#FFFFFF" />
                </View>
                {status && <StatusChip status={status} size="small" />}
              </View>

              {/* Title */}
              <Text style={{ 
                fontWeight: '600', 
                fontSize: 14,
                color: colors.text,
                marginBottom: 4,
                lineHeight: 18,
              }}>
                {title}
              </Text>

              {/* Footer */}
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: 8 
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {attachments && attachments.length > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Paperclip size={12} color={colors.textSecondary} />
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                        {attachments.length}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </LongPressGestureHandler>
  );
}