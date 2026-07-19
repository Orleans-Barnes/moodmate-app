import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileSetupStackParamList } from '@/navigation/types';
import type { YearOfStudy } from '@/api/types';
import { colors, spacing, fonts, fontSizes } from '@/theme/tokens';
import { Chip } from '@/components/Chip';
import { useAuthStore } from '@/state/useAuthStore';
import { putStudentProfile, getProfileStatus } from '@/api/profileSetup';
import { YEAR_OF_STUDY_LABELS } from './labels';
import { ProfileSetupLayout } from './ProfileSetupLayout';

type Props = NativeStackScreenProps<ProfileSetupStackParamList, 'YearOfStudy'>;

const YEARS = Object.keys(YEAR_OF_STUDY_LABELS) as YearOfStudy[];

export function YearOfStudyScreen({ navigation }: Props) {
  const token = useAuthStore((s) => s.token);
  const [selected, setSelected] = useState<YearOfStudy | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(20);

  const select = async (yearOfStudy: YearOfStudy) => {
    if (saving || !token) return;
    setSelected(yearOfStudy);
    setError(null);
    setSaving(true);
    try {
      await putStudentProfile(token, { yearOfStudy });
      const status = await getProfileStatus(token);
      setProgress(status.profileCompletion);
      setTimeout(() => navigation.navigate('WellnessGoals'), 350);
    } catch {
      setError("Couldn't save — check your connection and tap again.");
      setSaving(false);
    }
  };

  return (
    <ProfileSetupLayout
      progress={progress}
      stepLabel="Step 2 of 5"
      title="What year are you in?"
      onBack={() => navigation.goBack()}
    >
      <View style={styles.chipWrap}>
        {YEARS.map((y) => (
          <Chip
            key={y}
            label={YEAR_OF_STUDY_LABELS[y]}
            active={selected === y}
            onPress={() => select(y)}
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {saving && !error ? <Text style={styles.saved}>Saving…</Text> : null}
    </ProfileSetupLayout>
  );
}

const styles = StyleSheet.create({
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  error: {
    marginTop: spacing.md,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.coralDeep,
  },
  saved: {
    marginTop: spacing.md,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.sage,
  },
});
