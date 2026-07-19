import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileSetupStackParamList } from '@/navigation/types';
import type { PreferredSupport } from '@/api/types';
import { colors, spacing, fonts, fontSizes } from '@/theme/tokens';
import { Chip } from '@/components/Chip';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/state/useAuthStore';
import { putWellnessPreferences, getProfileStatus } from '@/api/profileSetup';
import { PREFERRED_SUPPORT_LABELS } from './labels';
import { ProfileSetupLayout } from './ProfileSetupLayout';

type Props = NativeStackScreenProps<ProfileSetupStackParamList, 'PreferredSupport'>;

const SUPPORTS = Object.keys(PREFERRED_SUPPORT_LABELS) as PreferredSupport[];
const MAX_SUPPORT = 3; // mirrors backend business rule

export function PreferredSupportScreen({ navigation }: Props) {
  const token = useAuthStore((s) => s.token);
  const [selected, setSelected] = useState<Set<PreferredSupport>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(80);

  const toggle = (support: PreferredSupport) => {
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(support)) {
        next.delete(support);
      } else {
        if (next.size >= MAX_SUPPORT) {
          setError(`You can pick up to ${MAX_SUPPORT}.`);
          return prev;
        }
        next.add(support);
      }
      return next;
    });
  };

  const advance = () => navigation.navigate('Preparing');

  const save = async () => {
    if (saving || !token) return;
    if (selected.size === 0) {
      advance();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await putWellnessPreferences(token, { preferredSupport: Array.from(selected) });
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
      stepLabel="Step 5 of 5"
      title="How do you like to be supported?"
      subtitle="We'll surface these first — you can always explore everything else too."
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
      <View style={styles.chipWrap}>
        {SUPPORTS.map((s) => (
          <Chip
            key={s}
            label={PREFERRED_SUPPORT_LABELS[s]}
            active={selected.has(s)}
            onPress={() => toggle(s)}
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
});
