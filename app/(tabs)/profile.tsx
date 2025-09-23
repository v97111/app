import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/contexts/UserContext';
import { User, Settings, Bell, Shield, CircleHelp as HelpCircle, LogOut, ChevronRight, CreditCard as Edit, Mail, Calendar, Camera, Check, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, updateUser } = useUser();

  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState(user.name);
  const [isEditingEmail, setIsEditingEmail] = React.useState(false);
  const [tempEmail, setTempEmail] = React.useState(user.email);

  const menuItems = [
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Push notifications, email alerts',
      icon: Bell,
      onPress: () => console.log('Notifications settings'),
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Account security, data privacy',
      icon: Shield,
      onPress: () => console.log('Privacy settings'),
    },
    {
      id: 'preferences',
      title: 'Preferences',
      subtitle: 'Theme, language, display',
      icon: Settings,
      onPress: () => console.log('Preferences'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'FAQ, contact support',
      icon: HelpCircle,
      onPress: () => console.log('Help'),
    },
  ];

  const handleEditName = () => {
    setTempName(user.name);
    setIsEditingEmail(false);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      updateUser({ name: tempName.trim() });
      setIsEditingName(false);
    }
  };

  const handleCancelEditName = () => {
    setTempName(user.name);
    setIsEditingName(false);
  };

  const handleEditEmail = () => {
    setTempEmail(user.email);
    setIsEditingName(false);
    setIsEditingEmail(true);
  };

  const handleSaveEmail = () => {
    const trimmedEmail = tempEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      Alert.alert('Invalid Email', 'Email address cannot be empty.');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    updateUser({ email: trimmedEmail });
    setIsEditingEmail(false);
  };

  const handleCancelEditEmail = () => {
    setTempEmail(user.email);
    setIsEditingEmail(false);
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose a new profile photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose from Gallery', onPress: pickImageFromGallery },
        { text: 'Use Default Avatar', onPress: useDefaultAvatar },
      ]
    );
  };

  const pickImageFromGallery = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateUser({ avatar: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const useDefaultAvatar = () => {
    updateUser({ avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' });
  };

  const handleSignOut = () => {
    console.log('Sign out');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Profile
        </Text>
        <TouchableOpacity onPress={handleEditName}>
          <Edit size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handleChangePhoto} style={styles.avatarContainer}>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              <View style={[styles.cameraOverlay, { backgroundColor: colors.primary }]}>
                <Camera size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              {isEditingName ? (
                <View style={styles.nameEditContainer}>
                  <TextInput
                    style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
                    value={tempName}
                    onChangeText={setTempName}
                    autoFocus
                    selectTextOnFocus
                  />
                  <View style={styles.nameEditActions}>
                    <TouchableOpacity onPress={handleSaveName} style={[styles.nameActionButton, { backgroundColor: colors.success }]}>
                      <Check size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCancelEditName} style={[styles.nameActionButton, { backgroundColor: colors.error }]}>
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity onPress={handleEditName}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {user.name}
                  </Text>
                </TouchableOpacity>
              )}
              <View style={styles.userDetail}>
                <Mail size={14} color={colors.textSecondary} />
                {isEditingEmail ? (
                  <View style={styles.emailEditContainer}>
                    <TextInput
                      style={[
                        styles.emailInput,
                        { color: colors.text, borderColor: colors.border },
                      ]}
                      value={tempEmail}
                      onChangeText={setTempEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <View style={styles.emailEditActions}>
                      <TouchableOpacity
                        onPress={handleSaveEmail}
                        style={[styles.nameActionButton, { backgroundColor: colors.success }]}
                      >
                        <Check size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleCancelEditEmail}
                        style={[styles.nameActionButton, { backgroundColor: colors.error }]}
                      >
                        <X size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.emailDisplay}
                    onPress={handleEditEmail}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                      {user.email}
                    </Text>
                    <Edit size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.userDetail}>
                <Calendar size={14} color={colors.textSecondary} />
                <Text style={[styles.joinedDate, { color: colors.textSecondary }]}>
                  Joined {user.joinedDate}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {user.workspaces}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Workspaces
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {user.projects}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Projects
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {user.completedTasks}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Tasks Done
            </Text>
          </Card>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Card style={styles.menuItem}>
                <View style={styles.menuItemContent}>
                  <View style={[styles.menuIcon, { backgroundColor: colors.surface }]}>
                    <item.icon size={20} color={colors.primary} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            style={[styles.signOutButton, { borderColor: colors.error }]}
            textStyle={{ color: colors.error }}
          />
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Version 1.0.0
          </Text>
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
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  userDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  emailDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 8,
  },
  userEmail: {
    fontSize: 16,
  },
  joinedDate: {
    fontSize: 14,
    marginLeft: 8,
  },
  nameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  nameEditActions: {
    flexDirection: 'row',
    gap: 8,
  },
  nameActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emailEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  emailInput: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  emailEditActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  menuItem: {
    marginBottom: 12,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
  },
  signOutSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  signOutButton: {
    backgroundColor: 'transparent',
  },
  versionSection: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  versionText: {
    fontSize: 14,
  },
});