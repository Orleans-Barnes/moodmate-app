import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileSetupStackParamList } from '@/navigation/types';
import type { Programme } from '@/api/types';
import { colors, spacing, fonts, fontSizes } from '@/theme/tokens';
import { Chip } from '@/components/Chip';
import { useAuthStore } from '@/state/useAuthStore';
import { putStudentProfile, getProfileStatus } from '@/api/profileSetup';
import { PROGRAMME_LABELS } from './labels';
import { ProfileSetupLayout } from './ProfileSetupLayout';

type Props = NativeStackScreenProps<ProfileSetupStackParamList, 'Programme'>;

const PROGRAMMES = Object.keys(PROGRAMME_LABELS) as Programme[];

export function ProgrammeScreen({ navigation }: Props) {
  const token = useAuthStore((s) => s.token);
  const [selected, setSelected] = useState<Programme | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const select = async (programme: Programme) => {
    if (saving || !token) return;
    setSelected(programme);
    setError(null);
    setSaving(true);
    try {
      await putStudentProfile(token, { programme });
      const status = await getProfileStatus(token);
      setProgress(status.profileCompletion);
      setTimeout(() => navigation.navigate('YearOfStudy'), 350);
    } catch {
      // Network failure during a partial save — per the sequence contract, don't advance the
      // screen, let the user retry the same tap. Selection stays visually chosen so retrying is
      // just tapping the same chip again.
      setError("Couldn't save — check your connection and tap again.");
      setSaving(false);
    }
  };

  return (
    <ProfileSetupLayout
      progress={progress}
      stepLabel="Step 1 of 5"
      title="What are you studying?"
      subtitle="This helps us tailor check-ins to your academic rhythm."
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
    >
      <View style={styles.chipWrap}>
        {PROGRAMMES.map((p) => (
          <Chip
            key={p}
            label={PROGRAMME_LABELS[p]}
            active={selected === p}
            onPress={() => select(p)}
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
