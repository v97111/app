import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors, WorkspaceColors } from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { StorageService } from '@/utils/storage';
import { Button } from '@/components/ui/Button';
import { X, Folder } from 'lucide-react-native';
import { Workspace, Project } from '@/types';

export default function CreateProjectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(WorkspaceColors[0]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if we're creating within a specific workspace
  const workspaceId = params.workspaceId as string;
  const isWithinWorkspace = !!workspaceId;

  React.useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const storedWorkspaces = await StorageService.getWorkspaces();
        setWorkspaces(storedWorkspaces);
        
        if (isWithinWorkspace) {
          setSelectedWorkspace(workspaceId);
        }
      } catch (error) {
        console.error('Error loading workspaces:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    if (!isWithinWorkspace && !selectedWorkspace) {
      Alert.alert('Error', 'Please select a workspace');
      return;
    }

    const finalWorkspaceId = isWithinWorkspace ? workspaceId : selectedWorkspace;
    
    const newProject: Project = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      workspaceId: finalWorkspaceId,
      ownerId: 'current-user',
      status: 'backlog' as const,
      color: selectedColor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodeCount: 0,
    };

    console.log('Creating project:', newProject);
    
    // Save to storage
    await StorageService.addProject(newProject);
    
    // Update workspace project count
    await StorageService.updateWorkspaceProjectCount(finalWorkspaceId);
    
    // Navigate back to appropriate screen
    if (isWithinWorkspace) {
      router.push(`/workspaces/${workspaceId}`);
    } else {
      router.push('/(tabs)/workspaces');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show "create workspace first" message if no workspaces and not within a workspace
  if (!isWithinWorkspace && workspaces.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            New Project
          </Text>
          <View style={{ width: 60 }} />
        </View>
        
        <View style={styles.emptyWorkspacesContainer}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Workspaces Found
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            You need to create a workspace first before you can create projects.
          </Text>
          <Button
            title="Create Workspace"
            onPress={() => router.push('/workspaces/create')}
            style={styles.createWorkspaceButton}
          />
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          New Project
        </Text>
        <Button
          title="Save"
          onPress={handleSave}
          size="small"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Project Name */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Name</Text>
          <TextInput
            style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter project name..."
            placeholderTextColor={colors.textSecondary}
            autoFocus
          />
        </Card>

        {/* Description */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.descriptionInput, { color: colors.text, borderColor: colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add a description (optional)..."
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
          />
        </Card>

        {/* Workspace Selection - only show if not within a workspace */}
        {!isWithinWorkspace && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Workspace</Text>
            <View style={styles.workspaceList}>
              {workspaces.map((workspace) => (
                <TouchableOpacity
                  key={workspace.id}
                  style={[
                    styles.workspaceOption,
                    {
                      backgroundColor: selectedWorkspace === workspace.id ? colors.surface : 'transparent',
                      borderColor: selectedWorkspace === workspace.id ? workspace.color : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedWorkspace(workspace.id)}
                >
                  <View style={[styles.workspaceIcon, { backgroundColor: workspace.color }]}>
                    <Folder size={16} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.workspaceName, { color: colors.text }]}>
                    {workspace.name}
                  </Text>
                  {selectedWorkspace === workspace.id && (
                    <View style={[styles.selectedDot, { backgroundColor: workspace.color }]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Color Selection */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.colorRow}>
              {WorkspaceColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColor,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </ScrollView>
        </Card>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
  },
  workspaceList: {
    gap: 8,
  },
  workspaceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  workspaceIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workspaceName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyWorkspacesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createWorkspaceButton: {
    paddingHorizontal: 20,
  },
});