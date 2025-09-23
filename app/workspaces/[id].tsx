import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { StorageService } from '@/utils/storage';
import { ProjectCard } from '../../components/project/ProjectCard';
import { Button } from '@/components/ui/Button';
import { Project, Workspace } from '../../types';
import { Alert } from 'react-native';

export default function WorkspaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [workspace, setWorkspace] = React.useState<Workspace | null>(null);

  // Load workspace and projects
  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Load workspace details
        const workspaces = await StorageService.getWorkspaces();
        const currentWorkspace = workspaces.find(w => w.id === id);
        setWorkspace(currentWorkspace || null);

        // Load projects for this workspace
        const workspaceProjects = await StorageService.getProjectsByWorkspace(id);
        setProjects(workspaceProjects);
        
        // Update workspace project count if needed
        if (currentWorkspace && currentWorkspace.projectCount !== workspaceProjects.length) {
          await StorageService.updateWorkspaceProjectCount(id);
        }
      } catch (error) {
        console.error('Error loading workspace data:', error);
      }
    };

    loadData();
  }, [id]);

  const handleProjectPress = (project: Project) => {
    router.push(`/projects/${project.id}`);
  };

  const handleBack = () => {
    router.back();
  };

  const handleAddProject = () => {
    router.push(`/projects/create?workspaceId=${id}`);
  };

  const handleMenuPress = (project: Project) => {
    Alert.alert(
      'Project Options',
      'Choose an action for this project',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => handleEditProject(project.id) },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDeleteProject(project.id) },
      ]
    );
  };

  const handleEditProject = (projectId: string) => {
    // For now, navigate to project detail
    router.push(`/projects/${projectId}`);
  };

  const confirmDeleteProject = (projectId: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleDeleteProject(projectId)
        }
      ]
    );
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await StorageService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      // Update workspace project count
      if (workspace) {
        await StorageService.updateWorkspaceProjectCount(workspace.id);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      Alert.alert('Error', 'Failed to delete project');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{workspace?.name || 'Workspace'}</Text>
        <TouchableOpacity onPress={handleAddProject} style={styles.addButton}>
          <Plus size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.projectsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Projects</Text>
          <View style={styles.projectsList}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onPress={() => handleProjectPress(project)}
                onMenuPress={() => handleMenuPress(project)}
              />
            ))}
            
            {projects.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No projects in this workspace</Text>
                <TouchableOpacity onPress={handleAddProject} style={styles.createButton}>
                  <Text style={styles.createButtonText}>Create Project</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  projectsSection: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  projectsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});