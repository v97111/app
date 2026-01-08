import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, View, Text, Platform, UIManager, findNodeHandle } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import type { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useGraphRegistry } from './GraphRegistry';
import { StatusChip } from '@/components/ui/StatusChip';
import { Circle, Paperclip } from 'lucide-react-native';
import type { NodeMeta } from '@/types';

interface GraphNodeProps {
  id: string;
  title: string;
  initialX?: number;
  initialY?: number;
  status?: 'todo' | 'in-progress' | 'blocked' | 'done';
  attachments?: any[];
  color?: string;
  meta?: NodeMeta | null;
  onCommit?: (id: string, x: number, y: number) => void;
  onPress?: () => void;
  onLongPress?: () => void;
  canvasPanRef?: React.RefObject<any>;
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
  onLongPress,
  color,
  meta,
  canvasPanRef,
}: GraphNodeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const accentColor = color ?? colors.primary;
  const nodeType = meta?.nodeType === 'task' ? 'Task' : 'Process';

  const x = useSharedValue(initialX);
  const y = useSharedValue(initialY);
  const w = useSharedValue(200);
  const h = useSharedValue(120);
  const scale = useSharedValue(1);
  const pulse = useSharedValue(0.6);
  const viewRef = useRef<Animated.View>(null);
  const panRef = useRef<PanGestureHandler>(null);
  const measureRaf = useRef<number | null>(null);

  const { register, unregister } = useGraphRegistry();

  useEffect(() => {
    register(id, { x, y, w, h, panRef });
    return () => unregister(id);
  }, [id, register, unregister, x, y, w, h]);

  useEffect(() => {
    x.value = initialX;
    y.value = initialY;
  }, [initialX, initialY, x, y]);

  useEffect(() => {
    if (status === 'in-progress') {
      pulse.value = withRepeat(
        withTiming(1, { duration: 900 }),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [pulse, status]);

  const scheduleMeasure = useCallback(() => {
    if (measureRaf.current !== null) {
      cancelAnimationFrame(measureRaf.current);
    }

    measureRaf.current = requestAnimationFrame(() => {
      const handle = findNodeHandle(viewRef.current);
      if (!handle) {
        return;
      }

      UIManager.measureInWindow(handle, (_x, _y, width, height) => {
        if (!width || !height) {
          return;
        }

        if (Math.abs(w.value - width) > 0.5) {
          w.value = width;
        }

        if (Math.abs(h.value - height) > 0.5) {
          h.value = height;
        }
      });
    });
  }, [w, h]);

  useEffect(() => () => {
    if (measureRaf.current !== null) {
      cancelAnimationFrame(measureRaf.current);
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.9 + pulse.value * 0.2 }],
  }));

  const onLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;

    if (Math.abs(w.value - width) > 0.5) {
      w.value = width;
    }

    if (Math.abs(h.value - height) > 0.5) {
      h.value = height;
    }

    scheduleMeasure();
  }, [scheduleMeasure, w, h]);

  const panGesture = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = x.value;
      ctx.startY = y.value;
      scale.value = withSpring(1.05);
    },
    onActive: (event, ctx) => {
      x.value = ctx.startX + event.translationX;
      y.value = ctx.startY + event.translationY;
    },
    onEnd: () => {
      scale.value = withSpring(1);
      if (onCommit) {
        runOnJS(onCommit)(id, x.value, y.value);
      }
      runOnJS(scheduleMeasure)();
    },
    onFinish: () => {
      scale.value = withSpring(1);
    },
  });

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    }
  }, [onPress]);

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      onLongPress();
    }
  }, [onLongPress]);

  const simultaneousPanHandlers = useMemo(() => {
    const refs: React.RefObject<any>[] = [];
    if (canvasPanRef) refs.push(canvasPanRef);
    return refs;
  }, [canvasPanRef]);

  return (
    <PanGestureHandler
      ref={panRef}
      activeOffsetX={[-8, 8]}
      activeOffsetY={[-8, 8]}
      minPointers={1}
      avgTouches
      simultaneousHandlers={simultaneousPanHandlers}
      shouldCancelWhenOutside={false}
      onGestureEvent={panGesture}
      onHandlerStateChange={panGesture}
    >
      <Animated.View
        ref={viewRef}
        collapsable={false}
        onLayout={onLayout}
        renderToHardwareTextureAndroid
        style={[
          {
            position: 'absolute',
            zIndex: 10,
            ...Platform.select({
              default: {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 6,
              },
              web: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'grab',
                touchAction: 'none',
              },
            }),
          },
          animatedStyle,
        ]}
      >
        <Pressable
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={500}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => [
            {
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.card,
              borderWidth: 2,
              borderColor: accentColor,
              minWidth: 180,
              maxWidth: 220,
              overflow: 'hidden',
              opacity: pressed ? 0.95 : 1,
            },
          ]}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: accentColor,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <Circle size={12} color="#FFFFFF" />
            </View>
            {status && <StatusChip status={status} size="small" />}
            <View
              style={{
                marginLeft: 8,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: `${accentColor}22`,
              }}
            >
              <Text style={{ fontSize: 10, color: accentColor, fontWeight: '600' }}>
                {nodeType}
              </Text>
            </View>
          </View>

          {status === 'in-progress' && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: accentColor,
                  shadowColor: accentColor,
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                },
                pulseStyle,
              ]}
            />
          )}

          {/* Title */}
          <Text
            style={{
              fontWeight: '600',
              fontSize: 14,
              color: colors.text,
              marginBottom: 4,
              lineHeight: 18,
            }}
          >
            {title}
          </Text>

          {/* Footer */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
            }}
          >
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
        </Pressable>
      </Animated.View>
    </PanGestureHandler>
  );
}
