import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { Button } from '@/components/ui/Button';
import { CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, TrendingUp, Users, Calendar, Plus, Briefcase, Target, Bell, ArrowRight, Activity, ChartBar as BarChart3, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { StorageService } from '@/utils/storage';
import { Workspace, Project, Node, Reminder } from '@/types';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { useUser } from '@/contexts/UserContext';
import { Alert } from 'react-native';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useUser();
  const [refreshing, setRefreshing] = React.useState(false);
  const [todayTasks, setTodayTasks] = React.useState<Node[]>([]);
  const [activeProjects, setActiveProjects] = React.useState<Project[]>([]);
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  // Load all dashboard data
  const loadDashboardData = React.useCallback(async () => {
    try {
      const [
        allWorkspaces,
        allProjects,
        allNodes,
        allReminders,
      ] = await Promise.all([
        StorageService.getWorkspaces(),
        StorageService.getProjects(),
        StorageService.getNodes(),
        StorageService.getReminders(),
      ]);

      setWorkspaces(allWorkspaces);
      setActiveProjects(allProjects.filter(p => p.status === 'in-progress').slice(0, 5));
      
      // Get today's tasks (nodes with due dates today or overdue)
      const today = new Date();
      const todayNodes = allNodes.filter(node => {
        if (!node.dueDate) return false;
        const nodeDate = new Date(node.dueDate);
        return nodeDate.toDateString() === today.toDateString() || nodeDate < today;
      }).slice(0, 10);
      setTodayTasks(todayNodes);

      // Get today's reminders
      const todayReminders = allReminders.filter(reminder => {
        if (reminder.isCompleted) return false;
        const reminderDate = new Date(reminder.dueDate);
        return reminderDate.toDateString() === today.toDateString() || reminderDate < today;
      }).slice(0, 5);
      setReminders(todayReminders);

      // Generate recent activity
      const activity = [
        ...allNodes.slice(0, 3).map(node => ({
          id: `node-${node.id}`,
          type: 'node_created',
          title: `Created "${node.title}"`,
          time: node.createdAt,
          icon: Target,
        })),
        ...allProjects.slice(0, 2).map(project => ({
          id: `project-${project.id}`,
          type: 'project_created',
          title: `Created project "${project.name}"`,
          time: project.createdAt,
          icon: Briefcase,
        })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
      setRecentActivity(activity);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadDashboardData().finally(() => setRefreshing(false));
  }, [loadDashboardData]);

  const handleCreateTask = () => {
    if (workspaces.length === 0) {
      Alert.alert(
        'No Workspaces',
        'You need to create a workspace first before adding reminders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create Workspace', onPress: () => router.push('/workspaces/create') }
        ]
      );
    } else {
      router.push('/reminders/create');
    }
  };

  const handleCreateProject = () => {
    if (workspaces.length === 0) {
      Alert.alert(
        'No Workspaces',
        'You need to create a workspace first before adding projects.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create Workspace', onPress: () => router.push('/workspaces/create') }
        ]
      );
    } else {
      router.push('/projects/create');
    }
  };

  const handleViewAllProjects = () => {
    router.push('/(tabs)/workspaces');
  };

  const handleViewAllTasks = () => {
    router.push('/(tabs)/calendar');
  };

  const handleNodePress = (node: Node) => {
    router.push(`/projects/${node.projectId}`);
  };

  const handleProjectPress = (project: Project) => {
    router.push(`/projects/${project.id}`);
  };

  const handleWorkspacePress = (workspace: Workspace) => {
    router.push(`/workspaces/${workspace.id}`);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getProjectProgress = (project: Project) => {
    // Simple progress calculation based on project age and status
    const daysSinceCreated = Math.floor((new Date().getTime() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const baseProgress = Math.min(daysSinceCreated * 10, 80);
    
    switch (project.status) {
      case 'done': return 100;
      case 'in-progress': return Math.max(baseProgress, 20);
      case 'backlog': return Math.min(baseProgress, 10);
      default: return baseProgress;
    }
  };

  const stats = [
    { 
      label: 'Workspaces', 
      value: workspaces.length.toString(), 
      icon: Briefcase, 
      color: colors.primary,
      onPress: () => router.push('/(tabs)/workspaces')
    },
    { 
      label: 'Active Projects', 
      value: activeProjects.length.toString(), 
      icon: Target, 
      color: colors.secondary,
      onPress: handleViewAllProjects
    },
    { 
      label: 'Due Today', 
      value: (todayTasks.length + reminders.length).toString(), 
      icon: Clock, 
      color: colors.warning,
      onPress: handleViewAllTasks
    },
    { 
      label: 'Completed', 
      value: todayTasks.filter(t => t.status === 'done').length.toString(), 
      icon: CheckCircle, 
      color: colors.success,
      onPress: handleViewAllTasks
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Activity size={32} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user.name}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.notificationButton, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/(tabs)/notifications')}
            >
              <Bell size={20} color={colors.text} />
              {(todayTasks.length + reminders.length) > 0 && (
                <View style={[styles.notificationBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.notificationBadgeText}>
                    {Math.min(todayTasks.length + reminders.length, 9)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <Button
              title="New"
              onPress={handleCreateTask}
              size="small"
              style={styles.newTaskButton}
            />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <TouchableOpacity key={index} onPress={stat.onPress} activeOpacity={0.7}>
              <Card style={styles.statCard}>
                <View style={styles.statContent}>
                  <stat.icon size={24} color={stat.color} />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {stat.value}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    {stat.label}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionCard} 
              onPress={() => router.push('/workspaces/create')}
              activeOpacity={0.7}
            >
              <Card style={styles.quickActionCardInner}>
                <Briefcase size={24} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  Workspace
                </Text>
              </Card>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard} 
              onPress={handleCreateProject}
              activeOpacity={0.7}
            >
              <Card style={styles.quickActionCardInner}>
                <Target size={24} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  Project
                </Text>
              </Card>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard} 
              onPress={handleCreateTask}
              activeOpacity={0.7}
            >
              <Card style={styles.quickActionCardInner}>
                <Bell size={24} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  Reminder
                </Text>
              </Card>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Workspaces */}
        {workspaces.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recent Workspaces
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/workspaces')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.horizontalList}>
                {workspaces.slice(0, 5).map((workspace) => (
                  <TouchableOpacity
                    key={workspace.id}
                    onPress={() => handleWorkspacePress(workspace)}
                    activeOpacity={0.7}
                  >
                    <Card style={[styles.workspaceCard, { borderLeftColor: workspace.color }]}>
                      <View style={[styles.workspaceIcon, { backgroundColor: workspace.color }]}>
                        <Briefcase size={16} color="#FFFFFF" />
                      </View>
                      <Text style={[styles.workspaceName, { color: colors.text }]} numberOfLines={1}>
                        {workspace.name}
                      </Text>
                      <Text style={[styles.workspaceProjects, { color: colors.textSecondary }]}>
                        {workspace.projectCount} projects
                      </Text>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Today's Tasks & Reminders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Today's Schedule
            </Text>
            <TouchableOpacity onPress={handleViewAllTasks}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <Card style={styles.tasksCard}>
            {/* Reminders */}
            {reminders.map((reminder, index) => (
              <View key={`reminder-${reminder.id}`}>
                <TouchableOpacity 
                  style={styles.taskItem}
                  onPress={() => router.push('/(tabs)/calendar')}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                      <Bell size={16} color={colors.warning} />
                      <Text style={[styles.taskTitle, { color: colors.text }]}>
                        {reminder.title}
                      </Text>
                    </View>
                    <Text style={[styles.taskTime, { color: colors.textSecondary }]}>
                      {new Date(reminder.dueDate).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      })}
                    </Text>
                  </View>
                  <ArrowRight size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                {(index < reminders.length - 1 || todayTasks.length > 0) && (
                  <View style={[styles.taskDivider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}

            {/* Tasks (Nodes) */}
            {todayTasks.map((task, index) => (
              <View key={`task-${task.id}`}>
                <TouchableOpacity 
                  style={styles.taskItem}
                  onPress={() => handleNodePress(task)}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                      <Target size={16} color={task.color} />
                      <Text style={[styles.taskTitle, { color: colors.text }]}>
                        {task.title}
                      </Text>
                    </View>
                    <Text style={[styles.taskTime, { color: colors.textSecondary }]}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      }) : 'No due time'}
                    </Text>
                  </View>
                  <View style={styles.taskStatus}>
                    <StatusChip status={task.status} size="small" />
                  </View>
                </TouchableOpacity>
                {index < todayTasks.length - 1 && (
                  <View style={[styles.taskDivider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}

            {todayTasks.length === 0 && reminders.length === 0 && (
              <View style={styles.emptyState}>
                <CheckCircle size={48} color={colors.success} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  All caught up!
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {workspaces.length === 0 
                    ? 'Create your first workspace to get started' 
                    : 'No tasks or reminders for today'}
                </Text>
                <Button
                  title={workspaces.length === 0 ? "Create Workspace" : "Create Reminder"}
                  onPress={workspaces.length === 0 ? () => router.push('/workspaces/create') : handleCreateTask}
                  size="small"
                  style={styles.createButton}
                />
              </View>
            )}
          </Card>
        </View>

        {/* Active Projects */}
        {activeProjects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Active Projects
              </Text>
              <TouchableOpacity onPress={handleViewAllProjects}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {activeProjects.map((project) => (
              <TouchableOpacity
                key={project.id}
                onPress={() => handleProjectPress(project)}
                activeOpacity={0.7}
              >
                <Card style={[styles.projectCard, { borderLeftColor: project.color }]}>
                  <View style={styles.projectHeader}>
                    <View style={styles.projectInfo}>
                      <Text style={[styles.projectName, { color: colors.text }]}>
                        {project.name}
                      </Text>
                      <Text style={[styles.projectNodes, { color: colors.textSecondary }]}>
                        {project.nodeCount} nodes
                      </Text>
                    </View>
                    <StatusChip status={project.status} size="small" />
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.progressFill,
                          { 
                            backgroundColor: project.color,
                            width: `${getProjectProgress(project)}%`
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                      {getProjectProgress(project)}%
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Activity
            </Text>
            
            <Card style={styles.activityCard}>
              <View>
              {recentActivity.map((activity, index) => (
                <View key={activity.id}>
                  <View style={styles.activityItem}>
                    <View style={[styles.activityIcon, { backgroundColor: colors.surface }]}>
                      <activity.icon size={16} color={colors.primary} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={[styles.activityTitle, { color: colors.text }]}>
                        {activity.title}
                      </Text>
                      <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                        {formatTimeAgo(activity.time)}
                      </Text>
                    </View>
                  </View>
                  {index < recentActivity.length - 1 && (
                    <View style={[styles.activityDivider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
              </View>
            </Card>
          </View>
        )}

        {/* Analytics Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              This Week
            </Text>
            <TouchableOpacity onPress={() => router.push('/analytics')}>
              <BarChart3 size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <Card style={styles.analyticsCard}>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <Text style={[styles.analyticsValue, { color: colors.success }]}>
                  {todayTasks.filter(t => t.status === 'done').length}
                </Text>
                <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
                  Completed
                </Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={[styles.analyticsValue, { color: colors.primary }]}>
                  {todayTasks.filter(t => t.status === 'in-progress').length}
                </Text>
                <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
                  In Progress
                </Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={[styles.analyticsValue, { color: colors.warning }]}>
                  {activeProjects.length}
                </Text>
                <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
                  Projects
                </Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={[styles.analyticsValue, { color: colors.secondary }]}>
                  {workspaces.length}
                </Text>
                <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
                  Workspaces
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onCreateWorkspace={() => router.push('/workspaces/create')}
        onCreateProject={handleCreateProject}
        onCreateReminder={handleCreateTask}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
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
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  newTaskButton: {
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
  },
  quickActionCardInner: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  horizontalList: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  workspaceCard: {
    width: 140,
    borderLeftWidth: 4,
    alignItems: 'center',
    paddingVertical: 16,
  },
  workspaceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  workspaceName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  workspaceProjects: {
    fontSize: 12,
    textAlign: 'center',
  },
  tasksCard: {
    padding: 0,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  taskContent: {
    flex: 1,
    marginRight: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  taskTime: {
    fontSize: 14,
  },
  taskStatus: {
    marginLeft: 8,
  },
  taskDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  projectCard: {
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  projectNodes: {
    fontSize: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 35,
  },
  activityCard: {
    padding: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  activityDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  analyticsCard: {
    paddingVertical: 20,
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  analyticsItem: {
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  createButton: {
    paddingHorizontal: 24,
  },
});