import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, StatusColors, PriorityColors } from '@/constants/Colors';
import { Node } from '@/types';
import { StatusChip } from '@/components/ui/StatusChip';
import { Circle, Square, Triangle, Diamond, Star, Heart, Flag, Bookmark, Tag, Bell, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Info, CircleHelp as HelpCircle, CirclePlus as PlusCircle, CircleMinus as MinusCircle, Circle as XCircle, Clock, User, MessageCircle, Paperclip, Plus, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import { Pen } from 'lucide-react-native';

interface NodeCardProps {
  node: Node;
  onPress: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onCreateChild: (childData?: any) => void;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 120;

const iconMap = {
  circle: Circle,
  square: Square,
  triangle: Triangle,
  diamond: Diamond,
  star: Star,
  heart: Heart,
  flag: Flag,
  bookmark: Bookmark,
  tag: Tag,
  bell: Bell,
  'check-circle': CheckCircle,
  'alert-circle': AlertCircle,
  info: Info,
  'help-circle': HelpCircle,
  'plus-circle': PlusCircle,
  'minus-circle': MinusCircle,
  'x-circle': XCircle,
};

export function NodeCard({ node, onPress, onMove, onCreateChild }: NodeCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isPressed, setIsPressed] = useState(false);

  // Animation values
  const translateX = useSharedValue(node.position.x);
  const translateY = useSharedValue(node.position.y);
  const scale = useSharedValue(1);

  // Gesture handling
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      runOnJS(setIsPressed)(true);
      scale.value = withSpring(1.05);
    })
    .onUpdate((event) => {
      translateX.value = node.position.x + event.translationX;
      translateY.value = node.position.y + event.translationY;
    })
    .onEnd(() => {
      runOnJS(setIsPressed)(false);
      scale.value = withSpring(1);
      runOnJS(onMove)({
        x: translateX.value,
        y: translateY.value,
      });
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(onPress)();
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onEnd(() => {
      runOnJS(onCreateChild)();
    });

  const composedGesture = Gesture.Simultaneous(
    panGesture,
    Gesture.Exclusive(longPressGesture, tapGesture)
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Get node icon
  const NodeIcon = node.icon ? iconMap[node.icon as keyof typeof iconMap] || Circle : Circle;

  // Format due date
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const isDueSoon = node.dueDate && new Date(node.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000);
  const isOverdue = node.dueDate && new Date(node.dueDate) < new Date();

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderColor: node.color,
            shadowColor: colors.shadow,
          },
          isPressed && styles.pressed,
          animatedStyle,
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: node.color }]}>
              <NodeIcon size={16} color="#FFFFFF" />
            </View>
            <StatusChip status={node.status} size="small" />
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <MoreHorizontal size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={2}
        >
          {node.title}
        </Text>

        {/* Notes preview */}
        {node.notes && (
          <Text
            style={[styles.notes, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {node.notes}
          </Text>
        )}

        {/* Tags */}
        {node.tags.length > 0 && (
          <View style={styles.tags}>
            {node.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                style={[styles.tag, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                  {tag}
                </Text>
              </View>
            ))}
            {node.tags.length > 3 && (
              <Text style={[styles.moreTagsText, { color: colors.textSecondary }]}>
                +{node.tags.length - 3}
              </Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {/* Priority indicator */}
            {node.priority !== 'low' && (
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: PriorityColors[node.priority] }
                ]}
              />
            )}

            {/* Assignees */}
            {node.assigneeIds.length > 0 && (
              <View style={styles.assignees}>
                <User size={12} color={colors.textSecondary} />
                <Text style={[styles.assigneeCount, { color: colors.textSecondary }]}>
                  {node.assigneeIds.length}
                </Text>
              </View>
            )}

            {/* Comments indicator */}

            {/* Attachments indicator */}
            {(node.attachments && node.attachments.length > 0) && (
              <View style={styles.indicator}>
                <Paperclip size={12} color={colors.textSecondary} />
                <Text style={[styles.indicatorCount, { color: colors.textSecondary }]}>
                  {node.attachments.length}
                </Text>
              </View>
            )}
            
            {/* Drawing indicator */}
            {node.drawingData && (
              <View style={styles.indicator}>
                <Pen size={12} color={colors.primary} />
              </View>
            )}
          </View>

          {/* Due date */}
          {node.dueDate && (
            <View
              style={[
                styles.dueDate,
                {
                  backgroundColor: isOverdue
                    ? colors.error
                    : isDueSoon
                    ? colors.warning
                    : colors.surface,
                },
              ]}
            >
              <Clock size={10} color={isOverdue || isDueSoon ? '#FFFFFF' : colors.textSecondary} />
              <Text
                style={[
                  styles.dueDateText,
                  {
                    color: isOverdue || isDueSoon ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {formatDueDate(node.dueDate)}
              </Text>
            </View>
          )}
        </View>

        {/* Quick add child button (appears on hover/press) */}
        {isPressed && (
          <TouchableOpacity
            style={[styles.quickAddButton, { backgroundColor: colors.primary }]}
            onPress={onCreateChild}
          >
            <Plus size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: {
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    padding: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  notes: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 10,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  assignees: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  assigneeCount: {
    fontSize: 10,
    fontWeight: '500',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.6,
  },
  indicatorCount: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  dueDateText: {
    fontSize: 10,
    fontWeight: '500',
  },
  quickAddButton: {
    position: 'absolute',
    bottom: -12,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});