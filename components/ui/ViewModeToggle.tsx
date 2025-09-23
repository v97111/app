import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Grid2x2 as Grid, List } from 'lucide-react-native';

interface ViewModeToggleProps {
  mode: 'cards' | 'graph';
  onModeChange: (mode: 'cards' | 'graph') => void;
}

export function ViewModeToggle({ mode, onModeChange }: ViewModeToggleProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={[
          styles.button,
          mode === 'cards' && { backgroundColor: colors.primary },
        ]}
        onPress={() => onModeChange('cards')}
        activeOpacity={0.7}
      >
        <List 
          size={16} 
          color={mode === 'cards' ? '#FFFFFF' : colors.text} 
        />
        <Text
          style={[
            styles.buttonText,
            { color: mode === 'cards' ? '#FFFFFF' : colors.text },
          ]}
        >
          Cards
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.button,
          mode === 'graph' && { backgroundColor: colors.primary },
        ]}
        onPress={() => onModeChange('graph')}
        activeOpacity={0.7}
      >
        <Grid 
          size={16} 
          color={mode === 'graph' ? '#FFFFFF' : colors.text} 
        />
        <Text
          style={[
            styles.buttonText,
            { color: mode === 'graph' ? '#FFFFFF' : colors.text },
          ]}
        >
          Graph
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});