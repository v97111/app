import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { Bell, MessageCircle, UserPlus, Calendar, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock } from 'lucide-react-native';

interface Notification {
  id: string;
  type: 'mention' | 'comment' | 'invite' | 'reminder' | 'update' | 'completion';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable?: boolean;
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [notifications, setNotifications] = React.useState<Notification[]>([
    {
      id: '1',
      type: 'reminder',
      title: 'Project Review',
      message: 'Review the quarterly project progress and update stakeholders',
      timestamp: '2 hours ago',
      read: false,
      actionable: true,
    },
    {
      id: '2',
      type: 'mention',
      title: 'You were mentioned',
      message: 'John mentioned you in "Mobile App Design" project',
      timestamp: '4 hours ago',
      read: false,
      actionable: true,
    },
    {
      id: '3',
      type: 'completion',
      title: 'Task Completed',
      message: 'Sarah completed "User Interface Mockups" in Design System project',
      timestamp: '1 day ago',
      read: true,
      actionable: false,
    },
    {
      id: '4',
      type: 'invite',
      title: 'Workspace Invitation',
      message: 'You have been invited to join "Marketing Team" workspace',
      timestamp: '2 days ago',
      read: true,
      actionable: true,
    },
    {
      id: '5',
      type: 'update',
      title: 'Project Update',
      message: 'New updates available for "E-commerce Platform" project',
      timestamp: '3 days ago',
      read: true,
      actionable: false,
    },
  ]);

  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { size: 20, color: colors.primary };
    
    switch (type) {
      case 'mention':
        return <MessageCircle {...iconProps} />;
      case 'comment':
        return <MessageCircle {...iconProps} />;
      case 'invite':
        return <UserPlus {...iconProps} />;
      case 'reminder':
        return <Clock {...iconProps} color={colors.warning} />;
      case 'update':
        return <Bell {...iconProps} />;
      case 'completion':
        return <CheckCircle {...iconProps} color={colors.success} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      )
    );
    
    // Handle notification action based on type
    if (notification.actionable) {
      console.log('Handle notification action:', notification.type);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {unreadCount} unread
            </Text>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
              <Text style={[styles.clearText, { color: colors.error }]}>
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={[styles.markAllRead, { color: colors.primary }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No notifications
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification, index) => (
              <TouchableOpacity
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.notificationCard,
                    !notification.read && styles.unreadCard,
                    !notification.read && { backgroundColor: colors.surface },
                  ]}
                >
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <View style={styles.iconContainer}>
                        {getNotificationIcon(notification.type)}
                      </View>
                      <View style={styles.notificationText}>
                        <Text style={[styles.notificationTitle, { color: colors.text }]}>
                          {notification.title}
                        </Text>
                        <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
                          {notification.message}
                        </Text>
                      </View>
                      {!notification.read && (
                        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                      )}
                      <TouchableOpacity 
                        onPress={() => handleDeleteNotification(notification.id)}
                        style={styles.deleteButton}
                      >
                        <Text style={[styles.deleteText, { color: colors.error }]}>×</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                      {notification.timestamp}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
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
  markAllRead: {
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    marginLeft: 16,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
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
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  notificationsList: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  notificationCard: {
    marginBottom: 12,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 52,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  deleteText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});