import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { Skeleton } from '@/components/Skeleton';
import { useJournalStore } from '@/state/useJournalStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, radii, spacing, shadow, glow, gradients } from '@/theme/tokens';
import { hapticMedium, hapticLight } from '@/utils/haptics';

const { width: SW } = Dimensions.get('window');

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Journal'>,
  NativeStackScreenProps<RootStackParamList>
>;

function addDays(date: Date, n: number) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const TEMPLATES = [
  {
    icon: 'clipboard-outline', name: 'Daily reflection',
    sub: 'Reflect on your day',
    from: '#2A5C45', to: '#3D7A5C',
    glowColor: 'rgba(92,138,230,0.45)',
    accent: '#D9E8FF',
  },
  {
    icon: 'school-outline', name: 'Exam stress',
    sub: 'Write through pressure',
    from: '#3D7A5C', to: '#5F9E7C',
    glowColor: 'rgba(255,111,77,0.45)',
    accent: '#FFE4DC',
  },
  {
    icon: 'heart-circle-outline', name: 'Gratitude jar',
    sub: 'Count your blessings',
    from: '#3D8A63', to: '#6BBD90',
    glowColor: 'rgba(95,158,124,0.45)',
    accent: '#D4F0E4',
  },
  {
    icon: 'trophy-outline', name: 'Goals & wins',
    sub: 'Celebrate progress',
    from: '#6B58B0', to: '#A491D3',
    glowColor: 'rgba(142,123,192,0.45)',
    accent: '#EAE4FF',
  },
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// ── Animated template card ──────────────────────────────────────────────────
function TemplateCard({
  t, onPress,
}: {
  t: typeof TEMPLATES[number];
  onPress: () => void;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.94, speed: 80, bounciness: 0, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, speed: 40, bounciness: 10, useNativeDriver: true }).start();

  const handlePress = () => {
    hapticMedium();
    onPress();
  };

  return (
    <Animated.View
      style={[
        s.templateCardWrap,
        {
          transform: [{ scale }],
          shadowColor: t.glowColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 1,
          shadowRadius: 16,
          elevation: 8,
        },
      ]}
    >
      <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={handlePress} style={s.templatePressable}>
        <LinearGradient
          colors={[t.from, t.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={s.templateCard}
        >
          {/* Subtle top-right circle accent */}
          <View style={[s.templateCircle, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />

          {/* Icon in a frosted circle */}
          <View style={s.templateIconWrap}>
            <Ionicons name={t.icon as any} size={26} color="#FFFFFF" />
          </View>

          <View style={s.templateTextGroup}>
            <Text style={s.templateName}>{t.name}</Text>
            <Text style={s.templateSub}>{t.sub}</Text>
          </View>

          {/* Arrow chip */}
          <View style={s.templateArrow}>
            <Text style={s.templateArrowText}>→</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function JournalScreen({ navigation }: Props) {
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const entries  = useJournalStore((s) => s.entries);
  const loading  = useJournalStore((s) => s.loading);
  const load     = useJournalStore((s) => s.load);
  const token    = useAuthStore((s) => s.token);
  const toast    = useToast();
  const insets   = useSafeAreaInsets();

  const visibleDays = useMemo(
    () => [-2, -1, 0, 1, 2].map((o) => addDays(anchor, o)),
    [anchor],
  );
  const monthLabel = anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const refresh = useCallback(() => {
    if (!token) return;
    load(token).catch((err) =>
      toast(err instanceof ApiRequestError ? err.message : 'Could not load journal.'));
  }, [token, load, toast]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const handleTemplate = (t: typeof TEMPLATES[number]) => {
    if (t.name === 'Gratitude jar') navigation.navigate('GratitudeJar');
    else navigation.navigate('JournalEntry', { template: t.name, icon: t.icon });
  };

  const filteredEntries = entries; // could filter by selectedDate later

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#2B2D42', '#3D405B', '#5C6378']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>My Journal</Text>
            <Text style={s.headerSub}>{entries.length} entries</Text>
          </View>
          <Pressable
            style={s.newBtn}
            onPress={() => { hapticMedium(); navigation.navigate('JournalEntry', { template: 'Free write', icon: '✍️' }); }}
          >
            <Text style={s.newBtnText}>＋ New</Text>
          </Pressable>
        </View>

        {/* Calendar strip */}
        <View style={s.calWrap}>
          <View style={s.calMonthRow}>
            <Pressable onPress={() => { hapticLight(); setAnchor((d) => addDays(d, -5)); }} hitSlop={10}>
              <Text style={s.calArrow}>‹</Text>
            </Pressable>
            <Text style={s.calMonth}>{monthLabel}</Text>
            <Pressable onPress={() => { hapticLight(); setAnchor((d) => addDays(d, 5)); }} hitSlop={10}>
              <Text style={s.calArrow}>›</Text>
            </Pressable>
          </View>
          <View style={s.calDays}>
            {visibleDays.map((day) => {
              const active = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              return (
                <Pressable
                  key={day.toISOString()}
                  style={[s.calDay, active && s.calDayActive]}
                  onPress={() => { hapticLight(); setSelectedDate(day); }}
                >
                  <Text style={[s.calDayName, active && s.calDayTextActive]}>
                    {DAY_NAMES[day.getDay()]}
                  </Text>
                  <Text style={[s.calDayNum, active && s.calDayTextActive, isToday && !active && s.calToday]}>
                    {day.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Template cards ── */}
        <Text style={s.sectionTitle}>Start writing</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.templateRow}
        >
          {TEMPLATES.map((t) => (
            <TemplateCard
              key={t.name}
              t={t}
              onPress={() => handleTemplate(t)}
            />
          ))}
        </ScrollView>

        {/* ── Entry list ── */}
        <Text style={s.sectionTitle}>Notebook</Text>

        {loading && entries.length === 0 && (
          [0, 1, 2].map((i) => (
            <View key={`skel-${i}`} style={s.entryCard}>
              <Skeleton width={140} height={13} />
              <Skeleton width="70%" height={11} />
            </View>
          ))
        )}

        {!loading && entries.length === 0 && (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>✍️</Text>
            <Text style={s.emptyTitle}>No entries yet</Text>
            <Text style={s.emptySub}>Pick a template above to start your first journal entry.</Text>
          </View>
        )}

        {filteredEntries.map((entry) => (
          <Pressable
            key={entry.id}
            style={s.entryCard}
            onPress={() => {
              hapticLight();
              navigation.navigate('JournalView', {
                id: entry.id,
                title: entry.title,
                body: entry.body,
                moodEmoji: entry.moodEmoji,
                date: entry.date,
              });
            }}
          >
            <View style={s.entryTop}>
              <View style={s.moodDot}>
                <Text style={s.moodDotEmoji}>{entry.moodEmoji ?? '📝'}</Text>
              </View>
              <View style={s.entryMeta}>
                <Text style={s.entryTitle} numberOfLines={1}>{entry.title}</Text>
                <Text style={s.entryDate}>{entry.date}</Text>
              </View>
              <Text style={s.entryChevron}>›</Text>
            </View>
            {!!entry.body && (
              <Text style={s.entryPreview} numberOfLines={2}>{entry.body}</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_R = 18;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  newBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  newBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
  },

  // Calendar
  calWrap: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: CARD_R,
    padding: spacing.md,
  },
  calMonthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  calMonth: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  calArrow: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.bodyBold,
    paddingHorizontal: 4,
  },
  calDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 3,
  },
  calDayActive: { backgroundColor: colors.coral },
  calDayName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  calDayNum: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: 'rgba(255,255,255,0.9)',
  },
  calDayTextActive: { color: '#FFFFFF' },
  calToday: { color: colors.sun },

  // Scroll
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },

  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
    marginTop: spacing.xs,
  },

  // Templates horizontal scroll
  templateRow: { gap: spacing.md, paddingBottom: 8, paddingHorizontal: 2 },
  templateCardWrap: {
    width: (SW - spacing.lg * 2 - spacing.md * 2) / 1.85,
    borderRadius: CARD_R + 4,
    overflow: 'hidden',
  },
  templatePressable: { borderRadius: CARD_R + 4, overflow: 'hidden' },
  templateCard: {
    padding: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xl,
    minHeight: 165,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  // Decorative circle in top-right corner
  templateCircle: {
    position: 'absolute',
    width: 90, height: 90,
    borderRadius: 45,
    top: -28, right: -22,
  },
  // Icon in frosted white circle
  templateIconWrap: {
    width: 52, height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 2,
  },
  templateIcon: { fontSize: 26 },
  templateTextGroup: { flex: 1, gap: 3 },
  templateName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  templateSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 15,
  },
  // Arrow chip at bottom
  templateArrow: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  templateArrowText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Entry cards
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_R,
    padding: spacing.lg,
    ...shadow.sm,
    gap: spacing.sm,
  },
  entryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  moodDot: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodDotEmoji: { fontSize: 20 },
  entryMeta: { flex: 1 },
  entryTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  entryDate: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
    marginTop: 2,
  },
  entryChevron: {
    fontSize: 20,
    color: colors.inkFaint,
    fontFamily: fonts.bodyBold,
  },
  entryPreview: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    lineHeight: 18,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyEmoji: { fontSize: 48 },
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
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
  },
});
