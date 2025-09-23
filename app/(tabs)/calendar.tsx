import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { StorageService } from '@/utils/storage';
import { Reminder, Node } from '@/types';
import { Calendar as CalendarIcon, Clock, CircleAlert as AlertCircle, Plus, CircleCheck as CheckCircle, X } from 'lucide-react-native';

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [todayReminders, setTodayReminders] = React.useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = React.useState<Reminder[]>([]);
  const [overdueReminders, setOverdueReminders] = React.useState<Reminder[]>([]);
  const [nodesWithDueDates, setNodesWithDueDates] = React.useState<Node[]>([]);

  const loadCalendarData = React.useCallback(async () => {
    try {
      console.log('Loading calendar data...');
      
      // Load reminders
      const [allReminders, upcomingRems, overdueRems] = await Promise.all([
        StorageService.getReminders(),
        StorageService.getUpcomingReminders(7),
        StorageService.getOverdueReminders(),
      ]);

      // Filter today's reminders manually
      const today = new Date();
      const todayRems = allReminders.filter(reminder => {
        const reminderDate = new Date(reminder.dueDate);
        return reminderDate.toDateString() === today.toDateString() && !reminder.isCompleted;
      });

      setTodayReminders(todayRems);
      setUpcomingReminders(upcomingRems);
      setOverdueReminders(overdueRems);

      // Load nodes with due dates
      const allNodes = await StorageService.getNodes();
      const nodesWithDates = allNodes.filter(node => node.dueDate);
      setNodesWithDueDates(nodesWithDates);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      Alert.alert('Error', 'Failed to load calendar data');
    }
  }, []);

  React.useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadCalendarData().finally(() => setRefreshing(false));
  }, [loadCalendarData]);

  const handleCreateReminder = () => {
    router.push('/reminders/create');
  };

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      await StorageService.updateReminder(reminderId, { isCompleted: true });
      await loadCalendarData();
    } catch (error) {
      console.error('Error completing reminder:', error);
      Alert.alert('Error', 'Failed to complete reminder');
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await StorageService.deleteReminder(reminderId);
      await loadCalendarData();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      Alert.alert('Error', 'Failed to delete reminder');
    }
  };

  const handleNodePress = (node: Node) => {
    router.push(`/projects/${node.projectId}`);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const ReminderItem = ({ reminder, showDate = false }: { reminder: Reminder; showDate?: boolean }) => (
    <View style={styles.reminderItem}>
      <View style={styles.reminderContent}>
        {showDate && (
          <Text style={[styles.reminderDate, { color: colors.textSecondary }]}>
            {formatDate(reminder.dueDate)}
          </Text>
        )}
        <Text style={[styles.reminderTitle, { color: colors.text }]}>
          {reminder.title}
        </Text>
        <Text style={[styles.reminderTime, { color: colors.textSecondary }]}>
          {formatTime(reminder.dueDate)}
        </Text>
      </View>
      <View style={styles.reminderActions}>
        <TouchableOpacity
          onPress={() => handleCompleteReminder(reminder.id)}
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CheckCircle size={16} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteReminder(reminder.id)}
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const NodeItem = ({ node }: { node: Node }) => (
    <TouchableOpacity
      style={styles.nodeItem}
      onPress={() => handleNodePress(node)}
      activeOpacity={0.7}
    >
      <View style={styles.nodeContent}>
        <Text style={[styles.nodeTitle, { color: colors.text }]}>
          {node.title}
        </Text>
        <Text style={[styles.nodeTime, { color: colors.textSecondary }]}>
          Due: {formatDate(node.dueDate!)} at {formatTime(node.dueDate!)}
        </Text>
      </View>
      <StatusChip status={node.status} size="small" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Calendar
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <Button
          title="New"
          onPress={handleCreateReminder}
          size="small"
        />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overdue Items */}
        {overdueReminders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertCircle size={20} color={colors.error} />
              <Text style={[styles.sectionTitle, { color: colors.error }]}>
                Overdue ({overdueReminders.length})
              </Text>
            </View>
            
            <Card style={styles.itemsCard}>
              {overdueReminders.map((reminder, index) => (
                <View key={reminder.id}>
                  <ReminderItem reminder={reminder} showDate />
                  {index < overdueReminders.length - 1 && (
                    <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CalendarIcon size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Today ({todayReminders.length + nodesWithDueDates.filter(n => 
                new Date(n.dueDate!).toDateString() === new Date().toDateString()
              ).length})
            </Text>
          </View>
          
          <Card style={styles.itemsCard}>
            {/* Today's Reminders */}
            {todayReminders.map((reminder, index) => (
              <View key={`reminder-${reminder.id}`}>
                <ReminderItem reminder={reminder} />
                {(index < todayReminders.length - 1 || nodesWithDueDates.some(n => 
                  new Date(n.dueDate!).toDateString() === new Date().toDateString()
                )) && (
                  <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
            
            {/* Today's Nodes */}
            {nodesWithDueDates
              .filter(node => new Date(node.dueDate!).toDateString() === new Date().toDateString())
              .map((node, index, filteredNodes) => (
                <View key={`node-${node.id}`}>
                  <NodeItem node={node} />
                  {index < filteredNodes.length - 1 && (
                    <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            
            {todayReminders.length === 0 && 
             nodesWithDueDates.filter(n => new Date(n.dueDate!).toDateString() === new Date().toDateString()).length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No items scheduled for today
                </Text>
                <Button
                  title="Create Reminder"
                  onPress={handleCreateReminder}
                  size="small"
                />
              </View>
            )}
          </Card>
        </View>

        {/* Upcoming */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Upcoming ({upcomingReminders.length + nodesWithDueDates.filter(n => {
                const nodeDate = new Date(n.dueDate!);
                const today = new Date();
                const weekFromNow = new Date();
                weekFromNow.setDate(today.getDate() + 7);
                return nodeDate > today && nodeDate <= weekFromNow;
              }).length})
            </Text>
          </View>
          
          <Card style={styles.itemsCard}>
            {/* Upcoming Reminders */}
            {upcomingReminders.map((reminder, index) => (
              <View key={`upcoming-reminder-${reminder.id}`}>
                <ReminderItem reminder={reminder} showDate />
                {(index < upcomingReminders.length - 1 || nodesWithDueDates.some(n => {
                  const nodeDate = new Date(n.dueDate!);
                  const today = new Date();
                  const weekFromNow = new Date();
                  weekFromNow.setDate(today.getDate() + 7);
                  return nodeDate > today && nodeDate <= weekFromNow;
                })) && (
                  <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
            
            {/* Upcoming Nodes */}
            {nodesWithDueDates
              .filter(node => {
                const nodeDate = new Date(node.dueDate!);
                const today = new Date();
                const weekFromNow = new Date();
                weekFromNow.setDate(today.getDate() + 7);
                return nodeDate > today && nodeDate <= weekFromNow;
              })
              .map((node, index, filteredNodes) => (
                <View key={`upcoming-node-${node.id}`}>
                  <NodeItem node={node} />
                  {index < filteredNodes.length - 1 && (
                    <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            
            {upcomingReminders.length === 0 && 
             nodesWithDueDates.filter(n => {
               const nodeDate = new Date(n.dueDate!);
               const today = new Date();
               const weekFromNow = new Date();
               weekFromNow.setDate(today.getDate() + 7);
               return nodeDate > today && nodeDate <= weekFromNow;
             }).length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No upcoming items
                </Text>
              </View>
            )}
          </Card>
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
  date: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  itemsCard: {
    padding: 0,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  reminderContent: {
    flex: 1,
  },
  reminderDate: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 14,
  },
  reminderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  nodeContent: {
    flex: 1,
    marginRight: 12,
  },
  nodeTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  nodeTime: {
    fontSize: 14,
  },
  itemDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
});