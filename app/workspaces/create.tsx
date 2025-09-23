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
import { useColorScheme } from 'react-native';
import { Colors, WorkspaceColors } from '@/constants/Colors';
import { StorageService } from '@/utils/storage';
import { Workspace } from '@/types';
import { WorkspaceIcons } from '@/constants/Icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { X, Briefcase, Folder, Star, Heart, Bookmark, Flag, Target, Zap, TrendingUp, Users, Calendar, Clock, Settings, Layers, Grid2x2 as Grid } from 'lucide-react-native';

const iconMap = {
  briefcase: Briefcase,
  folder: Folder,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  flag: Flag,
  target: Target,
  zap: Zap,
  'trending-up': TrendingUp,
  users: Users,
  calendar: Calendar,
  clock: Clock,
  settings: Settings,
  layers: Layers,
  grid: Grid,
};

const CreateWorkspaceScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(WorkspaceColors[0]);
  const [selectedIcon, setSelectedIcon] = useState('briefcase');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a workspace name');
      return;
    }

    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      ownerId: 'current-user',
      color: selectedColor,
      icon: selectedIcon,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectCount: 0,
      unreadCount: 0,
    };

    console.log('Creating workspace:', newWorkspace);
    
    // Save to storage
    await StorageService.addWorkspace(newWorkspace);
    
    // Navigate back to workspaces with the new workspace data
    router.push({
      pathname: '/(tabs)/workspaces',
      params: { newWorkspace: JSON.stringify(newWorkspace) }
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          New Workspace
        </Text>
        <Button
          title="Save"
          onPress={handleSave}
          size="small"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Workspace Name */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Workspace Name</Text>
          <TextInput
            style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter workspace name..."
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

        {/* Icon Selection */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.iconRow}>
              {WorkspaceIcons.map((iconName) => {
                const IconComponent = iconMap[iconName as keyof typeof iconMap] || Briefcase;
                return (
                  <TouchableOpacity
                    key={iconName}
                    style={[
                      styles.iconOption,
                      { backgroundColor: selectedIcon === iconName ? selectedColor : colors.surface },
                    ]}
                    onPress={() => setSelectedIcon(iconName)}
                  >
                    <IconComponent
                      size={20}
                      color={selectedIcon === iconName ? '#FFFFFF' : colors.text}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </Card>

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
  iconRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default CreateWorkspaceScreen;