import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { WorkspaceCard } from '@/components/workspace/WorkspaceCard';
import { StorageService } from '@/utils/storage';
import { Button } from '@/components/ui/Button';
import { Workspace } from '@/types';
import { Plus, Search } from 'lucide-react-native';
import { Alert } from 'react-native';

export default function WorkspacesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = React.useState(false);
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);

  // Load workspaces on mount and when screen comes into focus
  const loadWorkspaces = React.useCallback(async () => {
    try {
      const storedWorkspaces = await StorageService.getWorkspaces();
      setWorkspaces(storedWorkspaces);
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  }, []);

  React.useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // Handle new workspace from creation screen
  React.useEffect(() => {
    if (params.newWorkspace) {
      try {
        const newWorkspace = JSON.parse(params.newWorkspace as string);
        setWorkspaces(prev => [...prev, newWorkspace]);
        // Clear the param to prevent re-adding
        router.setParams({ newWorkspace: undefined });
      } catch (error) {
        console.error('Error parsing new workspace:', error);
      }
    }
  }, [params.newWorkspace]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadWorkspaces().finally(() => setRefreshing(false));
  }, [loadWorkspaces]);

  const handleWorkspacePress = (workspace: Workspace) => {
    router.push(`/workspaces/${workspace.id}`);
  };

  const handleCreateWorkspace = () => {
    router.push('/workspaces/create');
  };

  const handleEditWorkspace = (workspaceId: string) => {
    Alert.alert(
      'Workspace Options',
      'Choose an action for this workspace',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View', onPress: () => router.push(`/workspaces/${workspaceId}`) },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDeleteWorkspace(workspaceId) },
      ]
    );
  };

  const confirmDeleteWorkspace = (workspaceId: string) => {
    Alert.alert(
      'Delete Workspace',
      'Are you sure you want to delete this workspace? All projects in this workspace will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleDeleteWorkspace(workspaceId)
        }
      ]
    );
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      // Delete all projects in the workspace first
      const projects = await StorageService.getProjectsByWorkspace(workspaceId);
      for (const project of projects) {
        await StorageService.deleteProject(project.id);
      }
      
      // Delete the workspace
      await StorageService.deleteWorkspace(workspaceId);
      setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
    } catch (error) {
      console.error('Error deleting workspace:', error);
      Alert.alert('Error', 'Failed to delete workspace');
    }
  };

  const handleSearch = () => {
    router.push('/workspaces/search');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Workspaces
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {workspaces.length} workspaces
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Button
            title=""
            onPress={handleSearch}
            variant="ghost"
            size="small"
            style={styles.iconButton}
          />
          <Button
            title="New"
            onPress={handleCreateWorkspace}
            size="small"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {workspaces.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            onPress={() => handleWorkspacePress(workspace)}
            onMenuPress={() => handleEditWorkspace(workspace.id)}
          />
        ))}

        {/* Empty state */}
        {workspaces.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No workspaces yet
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Create your first workspace to start organizing your projects
            </Text>
            <Button
              title="Create Workspace"
              onPress={handleCreateWorkspace}
              style={styles.emptyButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    paddingHorizontal: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 32,
  },
});