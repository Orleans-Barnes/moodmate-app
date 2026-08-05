import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileSetupStackParamList } from '@/navigation/types';
import type { Challenge } from '@/api/types';
import { spacing, fonts, fontSizes, calm } from '@/theme/tokens';
import { OptionRow } from '@/components/OptionRow';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/state/useAuthStore';
import { putWellnessPreferences, getProfileStatus } from '@/api/profileSetup';
import { CHALLENGE_LABELS } from './labels';
import { ProfileSetupLayout } from './ProfileSetupLayout';

type Props = NativeStackScreenProps<ProfileSetupStackParamList, 'Challenges'>;

const CHALLENGES = Object.keys(CHALLENGE_LABELS) as Challenge[];
const MAX_CHALLENGES = 3; // mirrors backend business rule; this field is never scored, purely informational

export function ChallengesScreen({ navigation }: Props) {
  const token = useAuthStore((s) => s.token);
  const [selected, setSelected] = useState<Set<Challenge>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(60);

  const toggle = (challenge: Challenge) => {
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(challenge)) {
        next.delete(challenge);
      } else {
        if (next.size >= MAX_CHALLENGES) {
          setError(`You can pick up to ${MAX_CHALLENGES}.`);
          return prev;
        }
        next.add(challenge);
      }
      return next;
    });
  };

  const advance = () => navigation.navigate('PreferredSupport');

  const save = async () => {
    if (saving || !token) return;
    if (selected.size === 0) {
      // Optional field, backend never weights it — skipping straight through is fine.
      advance();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await putWellnessPreferences(token, { challenges: Array.from(selected) });
      const status = await getProfileStatus(token);
      setProgress(status.profileCompletion);
      advance();
    } catch {
      setError("Couldn't save — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileSetupLayout
      progress={progress}
      stepLabel="Step 4 of 5"
      title="Anything weighing on you lately?"
      subtitle="Totally optional — helps us tailor tone, not required to continue."
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label={saving ? 'Saving…' : selected.size === 0 ? 'Skip this one' : 'Continue'}
          variant={selected.size === 0 ? 'ghost' : 'primary'}
          fullWidth
          disabled={saving}
          onPress={save}
        />
      }
    >
      <View style={styles.list}>
        {CHALLENGES.map((c) => (
          <OptionRow
            key={c}
            label={CHALLENGE_LABELS[c]}
            selected={selected.has(c)}
            onPress={() => toggle(c)}
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
