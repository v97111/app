import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors, WorkspaceColors, PriorityColors } from '@/constants/Colors';
import { Node, Attachment } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { NodeIcons } from '@/constants/Icons';
import { DrawingCanvas } from '@/components/ui/DrawingCanvas';
import { X, Calendar, Tag, User, Flag, Palette, Type, FileText, Paperclip, MessageCircle, Trash2, Save, Circle, Square, Triangle, Star, Heart, Bookmark, Bell, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Info, CircleHelp as HelpCircle, CirclePlus as PlusCircle, CircleMinus as MinusCircle, Circle as XCircle, Clock, Pen } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Linking from 'expo-linking';

interface NodeEditorProps {
  node: Node | null;
  visible: boolean;
  onClose: () => void;
  onSave: (nodeData: Partial<Node>) => void;
  onDelete: () => void;
}

const iconMap = {
  circle: Circle,
  square: Square,
  triangle: Triangle,
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

export function NodeEditor({ node, visible, onClose, onSave, onDelete }: NodeEditorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [title, setTitle] = useState(node?.title || '');
  const [notes, setNotes] = useState(node?.notes || '');
  const [status, setStatus] = useState(node?.status || 'todo');
  const [priority, setPriority] = useState(node?.priority || 'medium');
  const [selectedColor, setSelectedColor] = useState(node?.color || WorkspaceColors[0]);
  const [selectedIcon, setSelectedIcon] = useState(node?.icon || 'circle');
  const [tags, setTags] = useState(node?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [dueDate, setDueDate] = useState(node?.dueDate ? new Date(node.dueDate) : new Date());
  const [hasDueDate, setHasDueDate] = useState(!!node?.dueDate);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [drawingData, setDrawingData] = useState(node?.drawingData || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(node?.attachments || []);
  const [standaloneRoot, setStandaloneRoot] = useState(node?.meta?.standaloneRoot ?? false);

  // Reset form when node changes
  useEffect(() => {
    if (node) {
      setTitle(node.title || '');
      setNotes(node.notes || '');
      setStatus(node.status || 'todo');
      setPriority(node.priority || 'medium');
      setSelectedColor(node.color || WorkspaceColors[0]);
      setSelectedIcon(node.icon || 'circle');
      setTags(node.tags || []);
      setDueDate(node.dueDate ? new Date(node.dueDate) : new Date());
      setHasDueDate(!!node.dueDate);
      setDrawingData(node.drawingData || '');
      setAttachments(node.attachments || []);
      setStandaloneRoot(node.meta?.standaloneRoot ?? false);
    } else {
      // Reset to defaults for new node
      setTitle('');
      setNotes('');
      setStatus('todo');
      setPriority('medium');
      setSelectedColor(WorkspaceColors[0]);
      setSelectedIcon('circle');
      setTags([]);
      setDueDate(new Date());
      setHasDueDate(false);
      setDrawingData('');
      setAttachments([]);
      setStandaloneRoot(false);
    }
    setNewTag('');
    // Reset picker states when node changes
    setShowDatePicker(false);
    setShowTimePicker(false);
  }, [node, visible]);

  const notesInputRef = useRef<TextInput>(null);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the node');
      return;
    }

    const nodeData: Partial<Node> = {
      title: title.trim(),
      notes: notes.trim(),
      status: status as any,
      priority: priority as any,
      color: selectedColor,
      icon: selectedIcon,
      tags,
      dueDate: hasDueDate ? dueDate.toISOString() : undefined,
      updatedAt: new Date().toISOString(),
      attachments,
      drawingData: drawingData || undefined,
      meta: { ...(node?.meta ?? {}), standaloneRoot },
    };

    onSave(nodeData);
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Node',
      'Are you sure you want to delete this node? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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

  const addAttachment = () => {
    if (!attachmentName.trim() || !attachmentUrl.trim()) {
      Alert.alert('Error', 'Please enter both name and URL/path');
      return;
    }

    const getAttachmentType = (url: string): Attachment['type'] => {
      const lower = url.toLowerCase();
      if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
      if (lower.match(/\.(mp4|mov|avi|mkv|webm)$/)) return 'video';
      if (lower.match(/\.(mp3|wav|aac|flac|ogg)$/)) return 'audio';
      if (lower.match(/\.(pdf|doc|docx|txt|rtf)$/)) return 'document';
      if (lower.startsWith('http')) return 'link';
      return 'document';
    };

    const newAttachment: Attachment = {
      id: Date.now().toString(),
      name: attachmentName.trim(),
      type: getAttachmentType(attachmentUrl),
      url: attachmentUrl.trim(),
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'current-user',
    };

    setAttachments([...attachments, newAttachment]);
    setAttachmentName('');
    setAttachmentUrl('');
    setShowAttachmentDialog(false);
  };

  const removeAttachment = (attachmentId: string) => {
    Alert.alert(
      'Remove Attachment',
      'Are you sure you want to remove this attachment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setAttachments(attachments.filter(a => a.id !== attachmentId))
        }
      ]
    );
  };

  const openAttachment = async (attachment: Attachment) => {
    if (attachment.url) {
      try {
        const supported = await Linking.canOpenURL(attachment.url);
        if (supported) {
          await Linking.openURL(attachment.url);
        } else {
          Alert.alert('Error', 'Cannot open this attachment');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open attachment');
      }
    }
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

  const statusOptions = [
    { value: 'todo', label: 'To Do', color: '#8E8E93' },
    { value: 'in-progress', label: 'In Progress', color: '#007AFF' },
    { value: 'blocked', label: 'Blocked', color: '#FF9500' },
    { value: 'done', label: 'Done', color: '#34C759' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#34C759' },
    { value: 'medium', label: 'Medium', color: '#FF9500' },
    { value: 'high', label: 'High', color: '#FF3B30' },
  ];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {node ? 'Edit Node' : 'New Node'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Save size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Title</Text>
            <TextInput
              style={[styles.titleInput, { color: colors.text, borderColor: colors.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter node title..."
              placeholderTextColor={colors.textSecondary}
              multiline
              autoFocus
            />
          </Card>

          {/* Status & Priority */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Status & Priority</Text>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Status</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.optionsRow}>
                    {statusOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionChip,
                          { backgroundColor: status === option.value ? option.color : colors.surface },
                        ]}
                        onPress={() => setStatus(option.value)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            { color: status === option.value ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.optionsRow}>
                    {priorityOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionChip,
                          { backgroundColor: priority === option.value ? option.color : colors.surface },
                        ]}
                        onPress={() => setPriority(option.value)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            { color: priority === option.value ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Card>

          {/* Appearance */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
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
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.iconRow}>
                  {NodeIcons.map((iconName) => {
                    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Circle;
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
            </View>
          </Card>

          {/* Hierarchy */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hierarchy</Text>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.text }]}>Standalone root</Text>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}> 
                  Prevent auto-linking to previous nodes in this project.
                </Text>
              </View>
              <Switch
                value={standaloneRoot}
                onValueChange={setStandaloneRoot}
                thumbColor={Platform.OS === 'android' ? (standaloneRoot ? colors.surface : '#f4f3f4') : undefined}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </Card>

          {/* Tags */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                style={[styles.tagInput, { color: colors.text, borderColor: colors.border }]}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Add tag..."
                placeholderTextColor={colors.textSecondary}
                onSubmitEditing={addTag}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={addTag} style={[styles.addTagButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.addTagText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.tag, { backgroundColor: colors.surface }]}
                  onPress={() => removeTag(tag)}
                >
                  <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                  <X size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Notes */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
              <View style={styles.sectionActions}>
                <TouchableOpacity
                  onPress={() => setShowAttachmentDialog(true)}
                  style={[styles.addButton, { backgroundColor: colors.secondary }]}
                >
                  <Paperclip size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowDrawingCanvas(true)}
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                >
                  <Pen size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Attachments */}
            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((attachment) => (
                  <TouchableOpacity
                    key={attachment.id}
                    style={[styles.attachmentItem, { backgroundColor: colors.surface }]}
                    onPress={() => openAttachment(attachment)}
                  >
                    <View style={styles.attachmentInfo}>
                      <Text style={[styles.attachmentName, { color: colors.text }]}>
                        {attachment.name}
                      </Text>
                      <Text style={[styles.attachmentType, { color: colors.textSecondary }]}>
                        {attachment.type}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeAttachment(attachment.id)}
                      style={styles.removeAttachment}
                    >
                      <X size={16} color={colors.error} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {drawingData && (
              <View style={styles.drawingPreview}>
                <Text style={[styles.drawingLabel, { color: colors.textSecondary }]}>
                  Hand-drawn notes attached
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDrawingCanvas(true)}
                  style={[styles.viewDrawingButton, { borderColor: colors.border }]}
                >
                  <Pen size={16} color={colors.primary} />
                  <Text style={[styles.viewDrawingText, { color: colors.primary }]}>
                    View/Edit Drawing
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <TextInput
              ref={notesInputRef}
              style={[styles.notesInput, { color: colors.text, borderColor: colors.border }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add detailed notes, bullet points, or markdown..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </Card>

          {/* Due Date */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Due Date</Text>
            <TouchableOpacity
              style={[
                styles.dueDateToggle,
                { 
                  backgroundColor: hasDueDate ? colors.primary : colors.surface,
                  borderColor: hasDueDate ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setHasDueDate(!hasDueDate)}
            >
              <Text style={[
                styles.dueDateToggleText,
                { color: hasDueDate ? '#FFFFFF' : colors.text }
              ]}>
                {hasDueDate ? 'Due Date Set' : 'Set Due Date'}
              </Text>
            </TouchableOpacity>
            {hasDueDate && (
              <View style={styles.dateTimeContainer}>
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
              </View>
            )}
          </Card>

          {node ? (
            <Card style={styles.section}>
              <Button
                title="Delete Node"
                onPress={handleDelete}
                variant="outline"
                style={[styles.deleteButton, { borderColor: colors.error }]}
                textStyle={{ color: colors.error }}
              />
            </Card>
          ) : null}
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

        {/* Attachment Dialog */}
        <Modal
          visible={showAttachmentDialog}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAttachmentDialog(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.attachmentDialog, { backgroundColor: colors.card }]}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>
                Add Attachment
              </Text>
              <TextInput
                style={[styles.dialogInput, { color: colors.text, borderColor: colors.border }]}
                value={attachmentName}
                onChangeText={setAttachmentName}
                placeholder="Attachment name..."
                placeholderTextColor={colors.textSecondary}
              />
              <TextInput
                style={[styles.dialogInput, { color: colors.text, borderColor: colors.border }]}
                value={attachmentUrl}
                onChangeText={setAttachmentUrl}
                placeholder="URL or file path..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
              />
              <View style={styles.dialogActions}>
                <Button
                  title="Cancel"
                  onPress={() => setShowAttachmentDialog(false)}
                  variant="ghost"
                  size="small"
                />
                <Button
                  title="Add"
                  onPress={addAttachment}
                  size="small"
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Drawing Canvas Modal */}
        <DrawingCanvas
          visible={showDrawingCanvas}
          onClose={() => setShowDrawingCanvas(false)}
          onSave={(data) => {
            setDrawingData(data);
            setShowDrawingCanvas(false);
          }}
          initialDrawing={drawingData}
        />
      </View>
    </Modal>
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
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
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
  row: {
    marginBottom: 16,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
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
  iconRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  addTagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addTagText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
  },
  dueDateToggle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  dueDateToggleText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateTimeContainer: {
    gap: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  dateTimeText: {
    fontSize: 16,
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 16,
    fontWeight: '500',
    minWidth: 50,
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
  deleteButton: {
    backgroundColor: 'transparent',
  },
  drawingPreview: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
  drawingLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  viewDrawingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    gap: 6,
  },
  viewDrawingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  attachmentsList: {
    gap: 8,
    marginBottom: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  attachmentType: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  removeAttachment: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  attachmentDialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  dialogInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
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
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentsList: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  attachmentType: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  removeAttachment: {
    padding: 4,
  },
  richToolbar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 6,
  },
  richHint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  attachmentDialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  dialogInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
});