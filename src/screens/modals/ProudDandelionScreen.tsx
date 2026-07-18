/**
 * ProudDandelionScreen — Quabble-inspired "Proud Dandelion"
 *
 * Quabble concept: build self-esteem by celebrating daily victories, no matter
 * how small. Research (positive psychology / CBT) shows self-compassion and
 * celebrating micro-wins improves resilience and reduces self-criticism.
 *
 * UX: write a win → dandelion seed flies away → win card added below + XP
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Animated, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useProudStore } from '@/state/useProudStore';
import { useGamificationStore, XP_VALUES } from '@/state/useGamificationStore';
import { hapticHeavy, hapticLight, hapticSuccess } from '@/utils/haptics';
import { colors, fonts, fontSizes, spacing, radii, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ProudDandelion'>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

// Floating seed animation (3 seeds fly upward + fade)
function DandelionBurst({ visible }: { visible: boolean }) {
  const seeds = useRef(
    Array.from({ length: 5 }, () => ({
      y:   new Animated.Value(0),
      x:   new Animated.Value(0),
      op:  new Animated.Value(0),
      rot: new Animated.Value(0),
    }))
  ).current;

  React.useEffect(() => {
    if (!visible) return;
    seeds.forEach((s, i) => {
      s.y.setValue(0);
      s.x.setValue(0);
      s.op.setValue(1);
      s.rot.setValue(0);
      Animated.parallel([
        Animated.timing(s.y,  { toValue: -(80 + i * 15), duration: 900 + i * 80, useNativeDriver: true }),
        Animated.timing(s.x,  { toValue: (i % 2 === 0 ? 1 : -1) * (20 + i * 8), duration: 900 + i * 80, useNativeDriver: true }),
        Animated.timing(s.op, { toValue: 0, duration: 700 + i * 80, delay: 200, useNativeDriver: true }),
        Animated.timing(s.rot, { toValue: (i % 2 === 0 ? 360 : -360), duration: 900, useNativeDriver: true }),
      ]).start();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={b.burstWrap} pointerEvents="none">
      {seeds.map((s, i) => {
        const rotate = s.rot.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
        return (
          <Animated.Text
            key={i}
            style={[
              b.seed,
              {
                opacity: s.op,
                transform: [
                  { translateY: s.y },
                  { translateX: s.x },
                  { rotate },
                ],
              },
            ]}
          >
            🌼
          </Animated.Text>
        );
      })}
    </View>
  );
}

const b = StyleSheet.create({
  burstWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 20,
    pointerEvents: 'none',
  },
  seed: { position: 'absolute', fontSize: 22 },
});

export function ProudDandelionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { moments, addMoment, deleteMoment } = useProudStore();
  const awardXp = useGamificationStore((s) => s.awardXp);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [burst, setBurst] = useState(false);

  const dandelionScale = useRef(new Animated.Value(1)).current;
  const btnScale       = useRef(new Animated.Value(1)).current;
  const canSubmit = draft.trim().length > 2 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    hapticHeavy();

    // Button spring + dandelion bounce
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.93, speed: 60, bounciness: 0, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1,    speed: 30, bounciness: 10, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.spring(dandelionScale, { toValue: 1.4, speed: 40, bounciness: 15, useNativeDriver: true }),
      Animated.spring(dandelionScale, { toValue: 1,   speed: 30, bounciness: 8, useNativeDriver: true }),
    ]).start();

    setBurst(true);
    setTimeout(() => setBurst(false), 1000);

    setTimeout(() => {
      addMoment(draft.trim());
      awardXp(XP_VALUES.gratitude ?? 10, 0);
      hapticSuccess();
      setDraft('');
      setSubmitting(false);
    }, 600);
  };

  const handleDelete = (id: string) => {
    hapticLight();
    Alert.alert(
      'Remove this win?',
      'You earned it — but you can let it go if you want.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteMoment(id) },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.root}>
        {/* Header */}
        <LinearGradient
          colors={['#1C2E0A', '#2E4A14', '#4A7020']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.header, { paddingTop: insets.top + spacing.md }]}
        >
          <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={s.backTxt}>‹ Back</Text>
          </Pressable>

          <View style={s.headerContent}>
            <View style={s.dandelionWrap}>
              <Animated.Text
                style={[s.dandelionEmoji, { transform: [{ scale: dandelionScale }] }]}
              >
                🌼
              </Animated.Text>
              <DandelionBurst visible={burst} />
            </View>
            <Text style={s.headerTitle}>Proud Dandelion</Text>
            <Text style={s.headerSub}>
              Every win, big or small, deserves{'\n'}to be celebrated. 🌱
            </Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 80 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Input */}
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>What are you proud of today?</Text>
            <TextInput
              style={s.input}
              placeholder="I finished my assignment early…"
              placeholderTextColor={colors.inkFaint}
              multiline
              numberOfLines={3}
              value={draft}
              onChangeText={setDraft}
              textAlignVertical="top"
            />
            <Text style={s.inputHint}>No win is too small. This counts. 💚</Text>

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <Pressable
                style={[s.submitBtn, !canSubmit && s.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                <LinearGradient
                  colors={canSubmit ? ['#3A6614', '#5A9020'] : ['#C8C8C8', '#DEDEDE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.submitGrad}
                >
                  <Text style={s.submitText}>🌼  I'm proud of this</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>

          {/* Wins list */}
          {moments.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Your wins ({moments.length})</Text>
              {moments.map((m) => (
                <Pressable
                  key={m.id}
                  style={s.winCard}
                  onLongPress={() => handleDelete(m.id)}
                >
                  <View style={s.winEmojiWrap}>
                    <Text style={s.winEmoji}>{m.emoji}</Text>
                  </View>
                  <View style={s.winBody}>
                    <Text style={s.winText}>{m.text}</Text>
                    <Text style={s.winDate}>{formatDate(m.date)}</Text>
                  </View>
                </Pressable>
              ))}
              <Text style={s.holdHint}>Long-press a card to remove it</Text>
            </>
          )}

          {moments.length === 0 && (
            <View style={s.emptyWrap}>
              <Text style={s.emptyEmoji}>🌱</Text>
              <Text style={s.emptyTitle}>Your garden is waiting</Text>
              <Text style={s.emptySub}>
                Share your first win above.{'\n'}Every seed matters.
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
  dandelionWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
  },
  dandelionEmoji: { fontSize: 52 },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 20,
  },

  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },

  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
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
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 80,
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
  submitBtn: {
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  submitText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
  },

  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
    marginTop: spacing.sm,
  },

  winCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#5A9020',
    ...shadow.sm,
  },
  winEmojiWrap: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(90,144,32,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winEmoji: { fontSize: 20 },
  winBody: { flex: 1, gap: 3 },
  winText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.ink,
    lineHeight: 20,
  },
  winDate: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
  },

  holdHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: -4,
  },

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
