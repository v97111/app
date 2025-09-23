import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Search, X } from 'lucide-react-native';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({
  placeholder = 'Search...',
  value,
  onChangeText,
  onClear,
  autoFocus = false,
}: SearchBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
});