import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, TextInputProps } from 'react-native';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  isPassword?: boolean;
}

export function TextField({ label, isPassword = false, ...inputProps }: TextFieldProps) {
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.wrap}>
        <TextInput
          {...inputProps}
          secureTextEntry={isPassword && hidden}
          placeholderTextColor={colors.inkFaint}
          style={[styles.input, isPassword && styles.inputWithIcon]}
        />
        {isPassword && (
          <Pressable style={styles.eyeBtn} onPress={() => setHidden((h) => !h)}>
            <Text style={styles.eyeIcon}>{hidden ? '👁' : '🙈'}</Text>
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
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
    marginBottom: 6,
  },
  wrap: {
    position: 'relative',
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    backgroundColor: colors.surface,
    color: colors.ink,
  },
  inputWithIcon: {
    paddingRight: 42,
  },
  eyeBtn: {
    position: 'absolute',
    right: 6,
    top: 0,
    bottom: 0,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 15,
  },
});
