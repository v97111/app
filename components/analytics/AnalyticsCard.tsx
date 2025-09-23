import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  color?: string;
  subtitle?: string;
}

export function AnalyticsCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  color,
  subtitle 
}: AnalyticsCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getChangeIcon = () => {
    if (!change) return null;
    if (change > 0) return <TrendingUp size={16} color={colors.success} />;
    if (change < 0) return <TrendingDown size={16} color={colors.error} />;
    return <Minus size={16} color={colors.textSecondary} />;
  };

  const getChangeColor = () => {
    if (!change) return colors.textSecondary;
    if (change > 0) return colors.success;
    if (change < 0) return colors.error;
    return colors.textSecondary;
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          {title}
        </Text>
        {change !== undefined && (
          <View style={styles.changeContainer}>
            {getChangeIcon()}
            <Text style={[styles.changeText, { color: getChangeColor() }]}>
              {Math.abs(change)}%
            </Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.value, { color: color || colors.text }]}>
        {value}
      </Text>
      
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
      
      {changeLabel && (
        <Text style={[styles.changeLabel, { color: colors.textSecondary }]}>
          {changeLabel}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  changeLabel: {
    fontSize: 11,
  },
});