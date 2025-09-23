import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusColors } from '@/constants/Colors';

interface StatusChipProps {
  status: 'todo' | 'in-progress' | 'blocked' | 'done' | 'backlog';
  size?: 'small' | 'medium';
}

export function StatusChip({ status, size = 'medium' }: StatusChipProps) {
  const getStatusText = () => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'blocked':
        return 'Blocked';
      case 'done':
        return 'Done';
      case 'backlog':
        return 'Backlog';
      default:
        return status;
    }
  };

  return (
    <View
      style={[
        styles.chip,
        styles[size],
        { backgroundColor: StatusColors[status] },
      ]}
    >
      <Text style={[styles.text, styles[`${size}Text`]]}>
        {getStatusText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  small: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  medium: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
});