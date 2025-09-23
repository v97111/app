import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { StorageService } from '@/utils/storage';
import { Card } from '@/components/ui/Card';
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { ProgressChart } from '@/components/analytics/ProgressChart';
import { ArrowLeft, Calendar, TrendingUp, Users, Target, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle } from 'lucide-react-native';

export default function AnalyticsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalWorkspaces: 0,
    totalProjects: 0,
    totalNodes: 0,
    completedNodes: 0,
    overdueNodes: 0,
    activeProjects: 0,
    completionRate: 0,
    productivityScore: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  const loadAnalytics = async () => {
    try {
      const [workspaces, projects, nodes, reminders] = await Promise.all([
        StorageService.getWorkspaces(),
        StorageService.getProjects(),
        StorageService.getNodes(),
        StorageService.getReminders(),
      ]);

      const completedNodes = nodes.filter(n => n.status === 'done').length;
      const overdueNodes = nodes.filter(n => 
        n.dueDate && new Date(n.dueDate) < new Date() && n.status !== 'done'
      ).length;
      const activeProjects = projects.filter(p => p.status === 'in-progress').length;
      const completionRate = nodes.length > 0 ? Math.round((completedNodes / nodes.length) * 100) : 0;

      setAnalytics({
        totalWorkspaces: workspaces.length,
        totalProjects: projects.length,
        totalNodes: nodes.length,
        completedNodes,
        overdueNodes,
        activeProjects,
        completionRate,
        productivityScore: Math.min(100, Math.round((completionRate + (activeProjects * 10)) / 2)),
      });

      // Chart data for project status
      const projectsByStatus = {
        backlog: projects.filter(p => p.status === 'backlog').length,
        'in-progress': projects.filter(p => p.status === 'in-progress').length,
        done: projects.filter(p => p.status === 'done').length,
      };

      setChartData([
        {
          label: 'Backlog',
          value: projectsByStatus.backlog,
          color: colors.textSecondary,
          total: projects.length,
        },
        {
          label: 'In Progress',
          value: projectsByStatus['in-progress'],
          color: colors.primary,
          total: projects.length,
        },
        {
          label: 'Completed',
          value: projectsByStatus.done,
          color: colors.success,
          total: projects.length,
        },
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Analytics
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Overview
          </Text>
          
          <View style={styles.cardsGrid}>
            <AnalyticsCard
              title="Workspaces"
              value={analytics.totalWorkspaces}
              color={colors.primary}
              subtitle="Total workspaces"
            />
            <AnalyticsCard
              title="Projects"
              value={analytics.totalProjects}
              color={colors.secondary}
              subtitle="All projects"
            />
          </View>

          <View style={styles.cardsGrid}>
            <AnalyticsCard
              title="Tasks"
              value={analytics.totalNodes}
              color={colors.warning}
              subtitle="Total tasks"
            />
            <AnalyticsCard
              title="Completed"
              value={analytics.completedNodes}
              color={colors.success}
              subtitle="Finished tasks"
            />
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Performance
          </Text>
          
          <View style={styles.cardsGrid}>
            <AnalyticsCard
              title="Completion Rate"
              value={`${analytics.completionRate}%`}
              change={analytics.completionRate > 50 ? 12 : -8}
              changeLabel="vs last week"
              color={analytics.completionRate > 70 ? colors.success : colors.warning}
            />
            <AnalyticsCard
              title="Active Projects"
              value={analytics.activeProjects}
              color={colors.primary}
              subtitle="In progress"
            />
          </View>

          <Card style={styles.fullWidthCard}>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreInfo}>
                <Text style={[styles.scoreTitle, { color: colors.text }]}>
                  Productivity Score
                </Text>
                <Text style={[styles.scoreValue, { color: colors.primary }]}>
                  {analytics.productivityScore}/100
                </Text>
                <Text style={[styles.scoreSubtitle, { color: colors.textSecondary }]}>
                  Based on completion rate and active projects
                </Text>
              </View>
              <View style={styles.scoreVisual}>
                <View style={[styles.scoreCircle, { borderColor: colors.surface }]}>
                  <View 
                    style={[
                      styles.scoreProgress, 
                      { 
                        borderColor: colors.primary,
                        transform: [{ rotate: `${(analytics.productivityScore / 100) * 360}deg` }]
                      }
                    ]} 
                  />
                  <Text style={[styles.scoreText, { color: colors.primary }]}>
                    {analytics.productivityScore}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* Project Status Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Project Status
          </Text>
          
          <Card style={styles.chartCard}>
            <ProgressChart
              data={chartData}
              title="Projects by Status"
            />
          </Card>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Insights
          </Text>
          
          <Card style={styles.insightCard}>
            <View style={styles.insightItem}>
              <CheckCircle size={20} color={colors.success} />
              <View style={styles.insightText}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>
                  Great Progress!
                </Text>
                <Text style={[styles.insightDescription, { color: colors.textSecondary }]}>
                  You've completed {analytics.completedNodes} tasks. Keep up the momentum!
                </Text>
              </View>
            </View>

            {analytics.overdueNodes > 0 && (
              <View style={styles.insightItem}>
                <AlertCircle size={20} color={colors.error} />
                <View style={styles.insightText}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>
                    Overdue Tasks
                  </Text>
                  <Text style={[styles.insightDescription, { color: colors.textSecondary }]}>
                    You have {analytics.overdueNodes} overdue tasks. Consider reviewing your priorities.
                  </Text>
                </View>
              </View>
            )}

            {analytics.activeProjects === 0 && analytics.totalProjects > 0 && (
              <View style={styles.insightItem}>
                <Clock size={20} color={colors.warning} />
                <View style={styles.insightText}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>
                    No Active Projects
                  </Text>
                  <Text style={[styles.insightDescription, { color: colors.textSecondary }]}>
                    Consider starting work on one of your projects to maintain productivity.
                  </Text>
                </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  fullWidthCard: {
    marginTop: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  scoreSubtitle: {
    fontSize: 12,
  },
  scoreVisual: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scoreProgress: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: '#007AFF',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartCard: {
    padding: 0,
  },
  insightCard: {
    gap: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});