import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileSetupStackParamList } from '@/navigation/types';
import { colors, spacing, fonts, fontSizes, calm } from '@/theme/tokens';
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
        <View style={styles.iconWrap}>
          <Ionicons name="leaf" size={30} color={calm.primary} />
        </View>
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
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: calm.mintBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 30,
    color: calm.forest,
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
