/**
 * WorryBoxScreen — Quabble-inspired "Worry Box"
 *
 * Inspired by Quabble's worry externalisation tool:
 * Write a worry → lock it away → psychological distance reduces rumination.
 *
 * UX flow:
 *   1. User types a worry in the input
 *   2. Taps "Lock it away" — lock animation plays + haptic
 *   3. Worry joins the sealed list below
 *   4. Tap a locked worry → confirm "Release" to delete it
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Animated, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useWorryStore } from '@/state/useWorryStore';
import { hapticHeavy, hapticLight, hapticSuccess } from '@/utils/haptics';
import { colors, fonts, fontSizes, spacing, radii, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'WorryBox'>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function WorryBoxScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { worries, addWorry, releaseWorry } = useWorryStore();
  const [draft, setDraft] = useState('');
  const [locking, setLocking] = useState(false);

  // Lock animation
  const lockScale    = useRef(new Animated.Value(1)).current;
  const lockShake    = useRef(new Animated.Value(0)).current;
  const lockBounce   = useRef(new Animated.Value(0)).current;

  const canLock = draft.trim().length > 2 && !locking;

  const handleLock = () => {
    if (!canLock) return;
    setLocking(true);
    hapticHeavy();

    // Shake then bounce the lock icon
    Animated.sequence([
      Animated.timing(lockShake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(lockShake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(lockShake, { toValue: 0, duration: 60, useNativeDriver: true }),
      Animated.spring(lockScale, { toValue: 1.35, speed: 60, bounciness: 12, useNativeDriver: true }),
      Animated.spring(lockScale, { toValue: 1, speed: 30, bounciness: 8, useNativeDriver: true }),
    ]).start(() => {
      addWorry(draft.trim());
      hapticSuccess();
      setDraft('');
      setLocking(false);
    });
  };

  const handleRelease = (id: string, text: string) => {
    hapticLight();
    Alert.alert(
      'Release this worry?',
      `"${text.length > 60 ? text.slice(0, 60) + '…' : text}"\n\nLet it go — it no longer serves you.`,
      [
        { text: 'Keep it locked', style: 'cancel' },
        {
          text: 'Release',
          style: 'destructive',
          onPress: () => { hapticSuccess(); releaseWorry(id); },
        },
      ]
    );
  };

  const lockTranslate = lockShake.interpolate({
    inputRange: [-1, 1], outputRange: [-6, 6],
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.root}>
        {/* Header */}
        <LinearGradient
          colors={['#24412A', '#579E65']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.header, { paddingTop: insets.top + spacing.md }]}
        >
          <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={s.backTxt}>‹ Back</Text>
          </Pressable>

          <View style={s.headerContent}>
            <Animated.View
              style={{
                transform: [
                  { translateX: lockTranslate },
                  { scale: lockScale },
                ],
              }}
            >
              <Ionicons name="lock-closed" size={40} color="#FFFFFF" />
            </Animated.View>
            <Text style={s.headerTitle}>Worry Box</Text>
            <Text style={s.headerSub}>
              Write it down. Lock it away.{'\n'}You don't have to carry it alone.
            </Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 80 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Input card */}
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>What's weighing on you?</Text>
            <TextInput
              style={s.input}
              placeholder="Write your worry here…"
              placeholderTextColor={colors.inkFaint}
              multiline
              numberOfLines={4}
              value={draft}
              onChangeText={setDraft}
              textAlignVertical="top"
            />
            <Text style={s.inputHint}>
              Writing it down gives your mind permission to let go.
            </Text>
            <Pressable
              style={[s.lockBtn, !canLock && s.lockBtnDisabled]}
              onPress={handleLock}
              disabled={!canLock}
            >
              <LinearGradient
                colors={canLock ? ['#468752', '#579E65'] : [colors.outline, colors.inkFaint]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.lockBtnGrad}
              >
                <Ionicons name="lock-closed" size={15} color="#FFFFFF" />
                <Text style={s.lockBtnText}>Lock it away</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Locked worries */}
          {worries.length > 0 && (
            <>
              <Text style={s.sectionTitle}>
                Locked away ({worries.length})
              </Text>
              <Text style={s.sectionSub}>
                Tap a worry to release it when you're ready.
              </Text>
              {worries.map((w) => (
                <Pressable
                  key={w.id}
                  style={s.worryCard}
                  onPress={() => handleRelease(w.id, w.text)}
                >
                  <View style={s.worryLockCol}>
                    <Ionicons name="lock-closed" size={18} color={colors.coral} />
                  </View>
                  <View style={s.worryBody}>
                    <Text style={s.worryText} numberOfLines={3}>{w.text}</Text>
                    <Text style={s.worryDate}>{formatDate(w.date)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
                </Pressable>
              ))}
            </>
          )}

          {worries.length === 0 && (
            <View style={s.emptyWrap}>
              <Ionicons name="cube-outline" size={48} color={colors.inkFaint} />
              <Text style={s.emptyTitle}>Your box is empty</Text>
              <Text style={s.emptySub}>
                Write a worry above and lock it away.{'\n'}You'll feel lighter instantly.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  backBtn: { marginBottom: spacing.md },
  backTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.75)',
  },
  headerContent: { alignItems: 'center', gap: spacing.sm },
  lockEmoji: { fontSize: 52, marginBottom: 4 },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },

  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },

  // Input card
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.md,
  },
  inputLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  input: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.ink,
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 100,
    borderWidth: 1.5,
    borderColor: colors.line,
    lineHeight: 22,
  },
  inputHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
    fontStyle: 'italic',
  },
  lockBtn: {
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  lockBtnDisabled: { opacity: 0.5 },
  lockBtnGrad: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  lockBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
    marginTop: spacing.md,
  },
  sectionSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
    marginTop: -spacing.xs,
  },

  // Worry card
  worryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#579E65',
    ...shadow.sm,
  },
  worryLockCol: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(87,158,101,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  worryLockIcon: { fontSize: 18 },
  worryBody: { flex: 1, gap: 3 },
  worryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.ink,
    lineHeight: 20,
  },
  worryDate: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  emptySub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkFaint,
    textAlign: 'center',
    lineHeight: 20,
  },
});
