import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileSetupStackParamList } from '@/navigation/types';
import type { WellnessGoal } from '@/api/types';
import { spacing, fonts, fontSizes, calm } from '@/theme/tokens';
import { OptionRow } from '@/components/OptionRow';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/state/useAuthStore';
import { putWellnessPreferences, getProfileStatus } from '@/api/profileSetup';
import { WELLNESS_GOAL_LABELS } from './labels';
import { ProfileSetupLayout } from './ProfileSetupLayout';

type Props = NativeStackScreenProps<ProfileSetupStackParamList, 'WellnessGoals'>;

const GOALS = Object.keys(WELLNESS_GOAL_LABELS) as WellnessGoal[];
const MAX_GOALS = 5; // mirrors moodmate-auth's WellnessPreferenceService business rule

export function WellnessGoalsScreen({ navigation }: Props) {
  const token = useAuthStore((s) => s.token);
  const [selected, setSelected] = useState<Set<WellnessGoal>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(40);

  const toggle = (goal: WellnessGoal) => {
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(goal)) {
        next.delete(goal);
      } else {
        if (next.size >= MAX_GOALS) {
          setError(`You can pick up to ${MAX_GOALS} goals.`);
          return prev;
        }
        next.add(goal);
      }
      return next;
    });
  };

  const save = async () => {
    if (saving || !token || selected.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      await putWellnessPreferences(token, { goals: Array.from(selected) });
      const status = await getProfileStatus(token);
      setProgress(status.profileCompletion);
      navigation.navigate('Challenges');
    } catch {
      setError("Couldn't save — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileSetupLayout
      progress={progress}
      stepLabel="Step 3 of 5"
      title="What are you hoping to work on?"
      subtitle={`Pick up to ${MAX_GOALS} — this shapes what MoodMate nudges you toward.`}
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label={saving ? 'Saving…' : 'Continue'}
          variant="primary"
          fullWidth
          disabled={selected.size === 0 || saving}
          onPress={save}
        />
      }
    >
      <View style={styles.list}>
        {GOALS.map((g) => (
          <OptionRow
            key={g}
            label={WELLNESS_GOAL_LABELS[g]}
            selected={selected.has(g)}
            onPress={() => toggle(g)}
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ProfileSetupLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  error: {
    marginTop: spacing.md,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: calm.rust,
  },
});
