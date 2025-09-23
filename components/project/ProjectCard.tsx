import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Project } from '@/types';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { Folder, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
  onMenuPress: () => void;
}

export function ProjectCard({ project, onPress, onMenuPress }: ProjectCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.card, { borderLeftColor: project.color }]}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: project.color }]}>
            <Folder size={18} color="#FFFFFF" />
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {project.name}
            </Text>
            <Text style={[styles.nodeCount, { color: colors.textSecondary }]}>
              {project.nodeCount} nodes
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

        <View style={styles.content}>
          <StatusChip status={project.status} size="small" />
          
          {project.description && (
            <Text
              style={[styles.description, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {project.description}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.updatedAt, { color: colors.textSecondary }]}>
            Updated {new Date(project.updatedAt).toLocaleDateString()}
          </Text>
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  nodeCount: {
    fontSize: 12,
  },
  menuButton: {
    padding: 4,
  },
  content: {
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updatedAt: {
    fontSize: 12,
  },
});