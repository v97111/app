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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { StorageService } from '@/utils/storage';
import { Reminder, Node, Project } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { X, Calendar, Clock, Folder } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateReminderScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [allNodes, allProjects] = await Promise.all([
          StorageService.getNodes(),
          StorageService.getProjects(),
        ]);
        setNodes(allNodes);
        setProjects(allProjects);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      nodeId: selectedNode?.id || '',
      projectId: selectedProject?.id || selectedNode?.projectId || '',
      title: title.trim(),
      dueDate: dueDate.toISOString(),
      assigneeIds: selectedNode?.assigneeIds || [],
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await StorageService.addReminder(newReminder);
      router.push('/(tabs)/calendar');
    } catch (error) {
      console.error('Error creating reminder:', error);
      Alert.alert('Error', 'Failed to create reminder');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleNodeSelect = (node: Node) => {
    setSelectedNode(node);
    const project = projects.find(p => p.id === node.projectId);
    setSelectedProject(project || null);
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setSelectedNode(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleDateTimePress = () => {
    setShowTimePicker(false); // Close time picker if open
    setShowDatePicker(true);
  };

  const handleTimePress = () => {
    setShowDatePicker(false); // Close date picker if open
    setShowTimePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(dueDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDueDate(newDate);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
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
          New Reminder
        </Text>
        <Button
          title="Save"
          onPress={handleSave}
          size="small"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Title</Text>
          <TextInput
            style={[styles.titleInput, { color: colors.text, borderColor: colors.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter reminder title..."
            placeholderTextColor={colors.textSecondary}
            autoFocus
          />
        </Card>

        {/* Due Date & Time */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Due Date & Time</Text>
          
          <TouchableOpacity
            style={[styles.dateTimeButton, { borderColor: colors.border }]}
            onPress={handleDateTimePress}
          >
            <Calendar size={20} color={colors.primary} />
            <Text style={[styles.dateTimeText, { color: colors.text }]}>
              {formatDate(dueDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateTimeButton, { borderColor: colors.border }]}
            onPress={handleTimePress}
          >
            <Clock size={20} color={colors.primary} />
            <Text style={[styles.dateTimeText, { color: colors.text }]}>
              {formatTime(dueDate)}
            </Text>
          </TouchableOpacity>

          <View style={styles.dateTimePreview}>
            <Text style={[styles.previewText, { color: colors.textSecondary }]}>
              Scheduled for: {formatDate(dueDate)} at {formatTime(dueDate)}
            </Text>
          </View>
        </Card>

        {/* Link to Node (Optional) */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Link to Node (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.nodesList}>
              <TouchableOpacity
                style={[
                  styles.nodeOption,
                  {
                    backgroundColor: !selectedNode ? colors.primary : colors.surface,
                    borderColor: !selectedNode ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedNode(null)}
              >
                <Text style={[
                  styles.nodeOptionText,
                  { color: !selectedNode ? '#FFFFFF' : colors.text }
                ]}>
                  No Link
                </Text>
              </TouchableOpacity>
              {nodes.map((node) => (
                <TouchableOpacity
                  key={node.id}
                  style={[
                    styles.nodeOption,
                    {
                      backgroundColor: selectedNode?.id === node.id ? colors.primary : colors.surface,
                      borderColor: selectedNode?.id === node.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleNodeSelect(node)}
                >
                  <Text style={[
                    styles.nodeOptionText,
                    { color: selectedNode?.id === node.id ? '#FFFFFF' : colors.text }
                  ]}>
                    {node.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Card>

        {/* Link to Project (Optional) */}
        {!selectedNode && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Link to Project (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.projectsList}>
                <TouchableOpacity
                  style={[
                    styles.projectOption,
                    {
                      backgroundColor: !selectedProject ? colors.primary : colors.surface,
                      borderColor: !selectedProject ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedProject(null)}
                >
                  <Text style={[
                    styles.projectOptionText,
                    { color: !selectedProject ? '#FFFFFF' : colors.text }
                  ]}>
                    No Link
                  </Text>
                </TouchableOpacity>
                {projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.projectOption,
                      {
                        backgroundColor: selectedProject?.id === project.id ? colors.primary : colors.surface,
                        borderColor: selectedProject?.id === project.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleProjectSelect(project)}
                  >
                    <View style={styles.projectOptionContent}>
                      <Folder size={16} color={selectedProject?.id === project.id ? '#FFFFFF' : project.color} />
                      <Text style={[
                        styles.projectOptionText,
                        { color: selectedProject?.id === project.id ? '#FFFFFF' : colors.text }
                      ]}>
                        {project.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Card>
        )}

        {/* Selected Context Info */}
        {(selectedNode || selectedProject) && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Linked To</Text>
            {selectedNode && (
              <View style={styles.contextInfo}>
                <Text style={[styles.contextTitle, { color: colors.text }]}>
                  Node: {selectedNode.title}
                </Text>
                <Text style={[styles.contextSubtitle, { color: colors.textSecondary }]}>
                  Project: {projects.find(p => p.id === selectedNode.projectId)?.name || 'Unknown'}
                </Text>
              </View>
            )}
            {selectedProject && !selectedNode && (
              <View style={styles.contextInfo}>
                <Text style={[styles.contextTitle, { color: colors.text }]}>
                  Project: {selectedProject.name}
                </Text>
              </View>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Date/Time Pickers */}
      {showDatePicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
      
      {showTimePicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={dueDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
      
      {/* Web fallback for date/time picker */}
      {showDatePicker && Platform.OS === 'web' && (
        <View style={[styles.webDatePicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.webPickerTitle, { color: colors.text }]}>Select Date</Text>
          <input
            type="date"
            value={dueDate.toISOString().split('T')[0]}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              newDate.setHours(dueDate.getHours());
              newDate.setMinutes(dueDate.getMinutes());
              setDueDate(newDate);
              setShowDatePicker(false);
            }}
            style={{
              padding: 12,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              color: colors.text,
              fontSize: 16,
            }}
          />
          <Button
            title="Cancel"
            onPress={() => setShowDatePicker(false)}
            variant="ghost"
            size="small"
          />
        </View>
      )}
      
      {showTimePicker && Platform.OS === 'web' && (
        <View style={[styles.webDatePicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.webPickerTitle, { color: colors.text }]}>Select Time</Text>
          <input
            type="time"
            value={`${dueDate.getHours().toString().padStart(2, '0')}:${dueDate.getMinutes().toString().padStart(2, '0')}`}
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(':').map(Number);
              const newDate = new Date(dueDate);
              newDate.setHours(hours);
              newDate.setMinutes(minutes);
              setDueDate(newDate);
              setShowTimePicker(false);
            }}
            style={{
              padding: 12,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              color: colors.text,
              fontSize: 16,
            }}
          />
          <Button
            title="Cancel"
            onPress={() => setShowTimePicker(false)}
            variant="ghost"
            size="small"
          />
        </View>
      )}
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
  titleInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  dateTimeText: {
    fontSize: 16,
    flex: 1,
  },
  dateTimePreview: {
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    marginTop: 8,
  },
  previewText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  nodesList: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  nodeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  nodeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  projectsList: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  projectOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  projectOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contextInfo: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  contextSubtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  webDatePicker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    alignItems: 'center',
    gap: 16,
  },
  webPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});