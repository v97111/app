import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { Colors, StatusColors, PriorityColors } from '@/constants/Colors';
import { Node } from '@/types';
import { StatusChip } from '@/components/ui/StatusChip';
import { SafeDrawingCanvas } from '@/components/ui/SafeDrawingCanvas';
import { 
  Circle, 
  Square, 
  Triangle, 
  Diamond, 
  Star, 
  Heart, 
  Flag, 
  Bookmark, 
  Tag, 
  Bell, 
  CircleCheck as CheckCircle, 
  CircleAlert as AlertCircle, 
  Info, 
  CircleHelp as HelpCircle, 
  CirclePlus as PlusCircle, 
  CircleMinus as MinusCircle, 
  Circle as XCircle, 
  Clock, 
  User, 
  Paperclip, 
  Plus, 
  MoveHorizontal as MoreHorizontal,
  Pen,
  X,
  Image as ImageIcon,
  FileText,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface EnhancedNodeCardProps {
  node: Node;
  onPress: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onCreateChild: (childData?: any) => void;
  onUpdate: (updates: Partial<Node>) => void;
  isGraphMode?: boolean;
  width?: number;
  height?: number;
  onLayout?: (layout: { width: number; height: number }) => void;
  sharedX?: Animated.SharedValue<number>;
  sharedY?: Animated.SharedValue<number>;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 140;

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

export function EnhancedNodeCard({ 
  node, 
  onPress, 
  onMove, 
  onCreateChild, 
  onUpdate,
  isGraphMode = false,
  width = NODE_WIDTH,
  height = NODE_HEIGHT,
  onLayout,
  sharedX,
  sharedY,
}: EnhancedNodeCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isPressed, setIsPressed] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  // Animation values for graph mode
  const translateX = sharedX || useSharedValue(node.position.x);
  const translateY = sharedY || useSharedValue(node.position.y);
  const scale = useSharedValue(1);

  // Commit position changes to React state
  const commitPosition = React.useCallback((x: number, y: number) => {
    const snappedX = Math.round(x / 8) * 8;
    const snappedY = Math.round(y / 8) * 8;
    onMove({ x: snappedX, y: snappedY });
  }, [onMove]);

  // Enhanced gesture handling for graph mode
  const panGesture = Gesture.Pan()
    .enabled(isGraphMode)
    .minDistance(5)
    .onBegin((event, context: any) => {
      runOnJS(setIsPressed)(true);
      scale.value = withSpring(1.05);
      context.startX = translateX.value;
      context.startY = translateY.value;
    })
    .onUpdate((event, context: any) => {
      const newX = context.startX + event.translationX;
      const newY = context.startY + event.translationY;
      
      // Keep nodes within canvas bounds
      translateX.value = Math.max(-50, Math.min(1500, newX));
      translateY.value = Math.max(-50, Math.min(1500, newY));
    })
    .onEnd((event, context: any) => {
      runOnJS(setIsPressed)(false);
      scale.value = withSpring(1);
      
      // Commit final position to React state
      runOnJS(commitPosition)(translateX.value, translateY.value);
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
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
    if (!isGraphMode) return {};
    
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

  const handleAddImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newAttachment = {
          id: Date.now().toString(),
          type: 'image' as const,
          uri: result.assets[0].uri,
          name: `Image_${Date.now()}.jpg`,
          size: result.assets[0].fileSize,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'current-user',
        };

        const updatedAttachments = [...(node.attachments || []), newAttachment];
        onUpdate({ attachments: updatedAttachments });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleAddDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const newAttachment = {
          id: Date.now().toString(),
          type: 'document' as const,
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          size: result.assets[0].size,
          mimeType: result.assets[0].mimeType,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'current-user',
        };

        const updatedAttachments = [...(node.attachments || []), newAttachment];
        onUpdate({ attachments: updatedAttachments });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleDrawingChange = (paths: string[]) => {
    onUpdate({ drawingData: JSON.stringify(paths) });
  };

  const CardContent = () => (
    <View
      onLayout={(event) => {
        const { width: measuredWidth, height: measuredHeight } = event.nativeEvent.layout;
        if (onLayout) {
          onLayout({ width: measuredWidth, height: measuredHeight });
        }
      }}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: node.color,
          shadowColor: colors.shadow,
          width,
          height,
          // Web-specific touch handling
          ...(Platform.OS === 'web' && {
            touchAction: 'none',
            userSelect: 'none',
          }),
        },
        isPressed && styles.pressed,
        !isGraphMode && styles.cardMode,
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
        <View style={styles.headerRight}>
          {/* Drawing indicator */}
          {node.drawingData && (
            <TouchableOpacity onPress={() => setShowDrawing(true)}>
              <Pen size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
          {/* Attachments indicator */}
          {(node.attachments && node.attachments.length > 0) && (
            <TouchableOpacity onPress={() => setShowAttachments(true)}>
              <View style={styles.attachmentBadge}>
                <Paperclip size={12} color={colors.primary} />
                <Text style={[styles.attachmentCount, { color: colors.primary }]}>
                  {node.attachments.length}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.menuButton}>
            <MoreHorizontal size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
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

          {/* Action buttons */}
          <TouchableOpacity onPress={() => setShowDrawing(true)} style={styles.actionButton}>
            <Pen size={12} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleAddImage} style={styles.actionButton}>
            <ImageIcon size={12} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleAddDocument} style={styles.actionButton}>
            <FileText size={12} color={colors.primary} />
          </TouchableOpacity>
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
      {isPressed && isGraphMode && (
        <TouchableOpacity
          style={[styles.quickAddButton, { backgroundColor: colors.primary }]}
          onPress={onCreateChild}
        >
          <Plus size={16} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Drawing Modal */}
      <Modal
        visible={showDrawing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDrawing(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowDrawing(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Drawing Pad
            </Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.drawingContainer}>
            <SafeDrawingCanvas
              width={300}
              height={200}
              onDrawingChange={handleDrawingChange}
              initialPaths={node.drawingData ? JSON.parse(node.drawingData) : []}
            />
          </View>
        </View>
      </Modal>

      {/* Attachments Modal */}
      <Modal
        visible={showAttachments}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAttachments(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAttachments(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Attachments
            </Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.attachmentsContainer}>
            {node.attachments?.map((attachment) => (
              <View key={attachment.id} style={[styles.attachmentItem, { backgroundColor: colors.surface }]}>
                <View style={styles.attachmentIcon}>
                  {attachment.type === 'image' ? (
                    <ImageIcon size={20} color={colors.primary} />
                  ) : (
                    <FileText size={20} color={colors.primary} />
                  )}
                </View>
                <View style={styles.attachmentInfo}>
                  <Text style={[styles.attachmentName, { color: colors.text }]}>
                    {attachment.name}
                  </Text>
                  <Text style={[styles.attachmentSize, { color: colors.textSecondary }]}>
                    {attachment.size ? `${Math.round(attachment.size / 1024)}KB` : 'Unknown size'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );

  if (isGraphMode) {
    return (
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            styles.graphContainer,
            {
              // Ensure proper positioning and touch handling
              zIndex: isPressed ? 1000 : 1,
            },
            animatedStyle,
          ]}
        >
          <CardContent />
        </Animated.View>
      </GestureDetector>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <CardContent />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  graphContainer: {
    position: 'absolute',
  },
  container: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    // Ensure proper touch handling
    overflow: 'visible',
  },
  cardMode: {
    marginBottom: 12,
    position: 'relative',
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
  headerRight: {
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
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  attachmentCount: {
    fontSize: 10,
    fontWeight: '600',
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
  actionButton: {
    padding: 4,
    borderRadius: 4,
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  drawingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  attachmentsContainer: {
    padding: 16,
    gap: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 12,
  },
});