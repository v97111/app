import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '@/constants/Colors';
import { Workspace } from '@/types';
import { Card } from '@/components/ui/Card';
import { Briefcase } from 'lucide-react-native';

interface WorkspaceStackProps {
  workspace: Workspace;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  index: number;
}

const STACK_OFFSET = 8;
const MAX_STACK_ITEMS = 3;

export function WorkspaceStack({ workspace, onPress, onEdit, onDelete, index: _index }: WorkspaceStackProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(width - 32, 260);
  
  const pressed = useSharedValue(false);
  const scale = useSharedValue(1);
  const [showMenu, setShowMenu] = React.useState(false);

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.value = true;
      scale.value = withSpring(0.95);
    })
    .onFinalize(() => {
      pressed.value = false;
      scale.value = withSpring(1);
      onPress();
    });

  const handleLongPress = () => {
    setShowMenu(true);
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.();
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete?.();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const renderStackLayers = () => {
    const layers = [];
    const stackCount = Math.min(workspace.projectCount, MAX_STACK_ITEMS);

    for (let i = stackCount - 1; i >= 0; i--) {
      const offset = i * STACK_OFFSET;
      const opacity = interpolate(i, [0, stackCount - 1], [1, 0.3]);

      layers.push(
        <View
          key={i}
          style={[
            styles.stackLayer,
            {
              backgroundColor: colors.card,
              shadowColor: colors.shadow,
              transform: [
                { translateX: -offset },
                { translateY: -offset },
              ],
              opacity,
              zIndex: -i,
              width: cardWidth,
            },
          ]}
        />
      );
    }
    
    return layers;
  };

  return (
    <View>
      <GestureDetector gesture={tap}>
        <Animated.View style={[styles.container, animatedStyle]}>
          {renderStackLayers()}
          <TouchableOpacity onLongPress={handleLongPress}>
            <Card style={[styles.card, { borderLeftColor: workspace.color, width: cardWidth }]}>
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: workspace.color }]}>
                  <Briefcase size={20} color="#FFFFFF" />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                    {workspace.name}
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {workspace.projectCount} projects
                  </Text>
                </View>
                {workspace.unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.error }]}>
                    <Text style={styles.badgeText}>
                      {workspace.unreadCount > 99 ? '99+' : workspace.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              
              {workspace.description && (
                <Text
                  style={[styles.description, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {workspace.description}
                </Text>
              )}
            </Card>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
      
      {/* Context Menu */}
      {showMenu && (
        <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
            <Text style={[styles.menuText, { color: colors.text }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
            <Text style={[styles.menuText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
            <Text style={[styles.menuText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
  },
  stackLayer: {
    position: 'absolute',
    height: 100,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    borderLeftWidth: 4,
    minHeight: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  menu: {
    position: 'absolute',
    top: 80,
    right: 16,
    borderRadius: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
});