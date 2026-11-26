import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface SearchInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search patients, records, doctors...',
  containerStyle,
  ...rest
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Search
        size={18}
        color={UyirinaiTheme.colors.textSecondary}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={UyirinaiTheme.colors.textMuted}
        returnKeyType="search"
        {...rest}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.clearBtn}
        >
          <X size={16} color={UyirinaiTheme.colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    paddingHorizontal: UyirinaiTheme.spacing.md,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: UyirinaiTheme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: UyirinaiTheme.typography.fontSizes.sm,
    color: UyirinaiTheme.colors.textPrimary,
    paddingVertical: UyirinaiTheme.spacing.sm,
  },
  clearBtn: {
    padding: 2,
  },
});
