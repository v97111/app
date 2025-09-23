import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Workspace } from '@/types';
import { Card } from '@/components/ui/Card';
import { Briefcase, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';

interface WorkspaceCardProps {
  workspace: Workspace;
  onPress: () => void;
  onMenuPress: () => void;
}

export function WorkspaceCard({ workspace, onPress, onMenuPress }: WorkspaceCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.card, { borderLeftColor: workspace.color }]}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: workspace.color }]}>
            <Briefcase size={20} color="#FFFFFF" />
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {workspace.name}
            </Text>
            <Text style={[styles.projectCount, { color: colors.textSecondary }]}>
              {workspace.projectCount} projects
            </Text>
          </View>
          <TouchableOpacity
            onPress={onMenuPress}
            style={styles.menuButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreHorizontal size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {workspace.description && (
          <Text
            style={[styles.description, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {workspace.description}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={[styles.updatedAt, { color: colors.textSecondary }]}>
            Updated {new Date(workspace.updatedAt).toLocaleDateString()}
          </Text>
          {workspace.unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>
                {workspace.unreadCount > 99 ? '99+' : workspace.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  projectCount: {
    fontSize: 14,
  },
  menuButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updatedAt: {
    fontSize: 12,
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
});