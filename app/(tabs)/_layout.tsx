import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Chrome as Home, Calendar, Bell, User, Briefcase, Search } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push('/search')}
              style={{ marginRight: 16, padding: 8 }}
            >
              <Search size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workspaces"
        options={{
          title: 'Workspaces',
          tabBarIcon: ({ size, color }) => (
            <Briefcase size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ size, color }) => (
            <Bell size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}