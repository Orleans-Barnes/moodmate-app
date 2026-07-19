import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileSetupStackParamList } from '@/navigation/types';
import { colors, spacing, fonts, fontSizes } from '@/theme/tokens';
import { Button } from '@/components/Button';

type Props = NativeStackScreenProps<ProfileSetupStackParamList, 'Welcome'>;

/**
 * First screen of the profile-completion journey. No backend call here — this is purely framing,
 * setting the "guided story" tone before the first real question (Programme). Skip is available
 * from here onward (see ProfileSetupLayout footer pattern on later screens).
 */
export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🌱</Text>
        <Text style={styles.title}>Let's build your{'\n'}wellness space</Text>
        <Text style={styles.body}>
          A few quick questions help MoodMate personalize your check-ins, goals, and support —
          takes about a minute.
        </Text>
      </View>
      <Button
        label="Let's go"
        variant="primary"
        fullWidth
        onPress={() => navigation.navigate('Programme')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.ink,
    lineHeight: 38,
  },
  body: {
    marginTop: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    color: colors.inkSoft,
    lineHeight: 22,
  },
});
