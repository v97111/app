import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PriorityColors } from '@/constants/Colors';

interface PriorityChipProps {
  priority: 'low' | 'medium' | 'high';
  size?: 'small' | 'medium';
}

export function PriorityChip({ priority, size = 'medium' }: PriorityChipProps) {
  const getPriorityText = () => {
    switch (priority) {
      case 'low':
        return 'Low';
      case 'medium':
        return 'Medium';
      case 'high':
        return 'High';
      default:
        return priority;
    }
  };

  return (
    <View
      style={[
        styles.chip,
        styles[size],
        { backgroundColor: PriorityColors[priority] },
      ]}
    >
      <Text style={[styles.text, styles[`${size}Text`]]}>
        {getPriorityText()}
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