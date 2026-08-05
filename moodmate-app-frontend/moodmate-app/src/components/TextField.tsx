import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, TextInputProps } from 'react-native';
import { colors, calm, darkPalette, fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  isPassword?: boolean;
}

export function TextField({ label, isPassword = false, ...inputProps }: TextFieldProps) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  const { isDark } = useResolvedAppearance();

  return (
    <View style={styles.group}>
      <Text style={[styles.label, isDark && styles.labelDark]}>{label}</Text>
      <View style={styles.wrap}>
        <TextInput
          {...inputProps}
          secureTextEntry={isPassword && hidden}
          placeholderTextColor={isDark ? darkPalette.textFaint : calm.faint}
          style={[styles.input, isDark && styles.inputDark, focused && styles.inputFocused, isPassword && styles.inputWithIcon]}
          onFocus={(e) => { setFocused(true); inputProps.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); inputProps.onBlur?.(e); }}
        />
        {isPassword && (
          <Pressable
            style={styles.eyeBtn}
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            accessibilityState={{ selected: !hidden }}
          >
            <Text style={[styles.eyeText, isDark && styles.eyeTextDark]}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: spacing.md + 2,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: calm.muted,
    marginBottom: 8,
  },
  labelDark: { color: darkPalette.textMuted },
  wrap: {
    position: 'relative',
  },
  input: {
    borderWidth: 1.5,
    borderColor: calm.border,
    borderRadius: radii.lg,
    paddingVertical: 19,
    paddingHorizontal: 20,
    fontFamily: fonts.body,
    fontSize: fontSizes.md - 1,
    backgroundColor: colors.surface,
    color: calm.ink,
  },
  inputDark: {
    backgroundColor: darkPalette.surface,
    borderColor: darkPalette.border,
    color: darkPalette.text,
  },
  inputFocused: {
    borderColor: calm.primary,
  },
  inputWithIcon: {
    paddingRight: 60,
  },
  eyeBtn: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: calm.muted,
  },
  eyeTextDark: { color: darkPalette.textMuted },
});
