import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { useToast } from '@/state/useToast';
import { useAuthStore } from '@/state/useAuthStore';
import { adminSetup } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { colors, fonts, fontSizes, spacing, radii } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminSetup'>;

export function AdminSetupScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const setSession = useAuthStore((s) => s.setSession);
  const keyboardHeight = useKeyboardOffset();

  const canSubmit =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    password === confirm;

  const handleCreate = async () => {
    if (password !== confirm) {
      toast('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { token, refreshToken, user } = await adminSetup({ fullName: fullName.trim(), email: email.trim(), password });
      await setSession(token, refreshToken, user);
      Alert.alert(
        'Admin account created!',
        `Welcome, ${user.fullName}. You can now approve counsellor requests.`,
        [{ text: 'Continue', onPress: () => navigation.replace('AdminDashboard') }],
      );
    } catch (err) {
      if (err instanceof ApiRequestError && err.message.includes('already exists')) {
        Alert.alert(
          'Admin already set up',
          'An admin account already exists. Go back and log in with your admin credentials.',
          [{ text: 'Back to Login', onPress: () => { if (navigation.canGoBack()) navigation.goBack(); else navigation.replace('RoleSelect'); } }],
        );
      } else {
        toast(err instanceof ApiRequestError ? err.message : 'Setup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      backgroundColor={colors.bg}
      contentContainerStyle={styles.content}
      extraBottomGap={spacing.giant + keyboardHeight}
    >
      {/* Back */}
      <Pressable style={styles.backBtn} onPress={() => { if (navigation.canGoBack()) navigation.goBack(); else navigation.replace('RoleSelect'); }}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      {/* Header */}
      <View style={styles.iconWrap}>
        <Ionicons name="shield-checkmark-outline" size={28} color={colors.coral} />
      </View>
      <Text style={styles.heading}>Create Admin Account</Text>
      <Text style={styles.subheading}>
        This is a one-time setup. Once an admin exists, this screen will no longer work.
      </Text>

      {/* Warning banner */}
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          The admin account can approve and reject counsellor applications. Keep these credentials safe.
        </Text>
      </View>

      <TextField
        label="FULL NAME"
        placeholder="e.g. Dr. Kwame Mensah"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />
      <TextField
        label="EMAIL"
        placeholder="admin@moodmate.app"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label="PASSWORD (min 8 characters)"
        placeholder="••••••••"
        isPassword
        value={password}
        onChangeText={setPassword}
      />
      <TextField
        label="CONFIRM PASSWORD"
        placeholder="••••••••"
        isPassword
        value={confirm}
        onChangeText={setConfirm}
      />

      {password.length > 0 && password !== confirm && (
        <Text style={styles.matchError}>Passwords do not match</Text>
      )}

      <Button
        label={loading ? 'Creating…' : 'Create Admin Account'}
        variant="primary"
        fullWidth
        disabled={!canSubmit || loading}
        onPress={handleCreate}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xxl,
  },
  backBtn: {
    marginBottom: spacing.lg,
  },
  backText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.coral,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  iconEmoji: { fontSize: 28 },
  heading: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 4,
  },
  subheading: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  warningBox: {
    backgroundColor: '#FFF3D9',
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  warningText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: '#5A4300',
    lineHeight: 20,
  },
  matchError: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.coral,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
});
