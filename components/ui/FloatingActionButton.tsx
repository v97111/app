import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Plus, X, Briefcase, Target, Bell } from 'lucide-react-native';

interface FloatingActionButtonProps {
  onCreateWorkspace: () => void;
  onCreateProject: () => void;
  onCreateReminder: () => void;
}

export function FloatingActionButton({
  onCreateWorkspace,
  onCreateProject,
  onCreateReminder,
}: FloatingActionButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    setIsOpen(!isOpen);
  };

  const handleAction = (action: () => void) => {
    action();
    toggleMenu();
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const translateY1 = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -70],
  });

  const translateY2 = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -130],
  });

  const translateY3 = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -190],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      {/* Action Buttons */}
      <Animated.View
        style={[
          styles.actionButton,
          {
            backgroundColor: colors.secondary,
            transform: [{ translateY: translateY3 }, { scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.actionButtonInner}
          onPress={() => handleAction(onCreateReminder)}
        >
          <Bell size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.actionButton,
          {
            backgroundColor: colors.warning,
            transform: [{ translateY: translateY2 }, { scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.actionButtonInner}
          onPress={() => handleAction(onCreateProject)}
        >
          <Target size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.actionButton,
          {
            backgroundColor: colors.success,
            transform: [{ translateY: translateY1 }, { scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.actionButtonInner}
          onPress={() => handleAction(onCreateWorkspace)}
        >
          <Briefcase size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Main FAB */}
      <TouchableOpacity
        style={[styles.mainButton, { backgroundColor: colors.primary }]}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Plus size={24} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>

      {/* Backdrop */}
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          onPress={toggleMenu}
          activeOpacity={1}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: -1,
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1,
  },
  actionButton: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});