import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface ProgressChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
    total?: number;
  }>;
  title?: string;
}

export function ProgressChart({ data, title }: ProgressChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const maxValue = Math.max(...data.map(item => item.total || item.value));

  return (
    <View style={styles.container}>
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
      )}
      
      <View style={styles.chart}>
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          const totalPercentage = item.total && maxValue > 0 ? (item.total / maxValue) * 100 : 100;
          
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barInfo}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {item.label}
                </Text>
                <Text style={[styles.value, { color: colors.textSecondary }]}>
                  {item.value}{item.total ? `/${item.total}` : ''}
                </Text>
              </View>
              
              <View style={styles.barWrapper}>
                <View 
                  style={[
                    styles.barBackground, 
                    { 
                      backgroundColor: colors.surface,
                      width: `${totalPercentage}%`
                    }
                  ]} 
                />
                <View 
                  style={[
                    styles.barFill, 
                    { 
                      backgroundColor: item.color,
                      width: `${percentage}%`
                    }
                  ]} 
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    gap: 12,
  },
  barContainer: {
    gap: 6,
  },
  barInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  barWrapper: {
    height: 8,
    backgroundColor: 'transparent',
    borderRadius: 4,
    position: 'relative',
  },
  barBackground: {
    position: 'absolute',
    height: '100%',
    borderRadius: 4,
    left: 0,
  },
  barFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 4,
    left: 0,
  },
});