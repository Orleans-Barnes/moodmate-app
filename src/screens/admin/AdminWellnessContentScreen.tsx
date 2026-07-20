/**
 * AdminWellnessContentScreen — Phase 1H (Admin Portal - Wellness Content).
 *
 * Articles/Events tab toggle (same pattern as AdminCounsellorMentorManagementScreen). Create via
 * an inline expandable form, delete via a confirm alert. No edit UI in this pass (deliberate,
 * documented scope limit - the backend PATCH endpoints exist and are ready for a future edit
 * screen, but a create+delete loop already closes the real gap this phase called out: HubController
 * was entirely read-only before).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import {
  listArticles, createArticle, deleteArticle,
  listEvents, createEvent, deleteEvent,
} from '@/api/hub';
import { ApiRequestError } from '@/api/client';
import type { ArticleView, EventView } from '@/api/types';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminWellnessContent'>;
type Tab = 'articles' | 'events';

const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTimeLabel(slot: string): string {
  const [hh, mm] = slot.split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${mm.toString().padStart(2, '0')} ${period}`;
}

function formatEventWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function AdminWellnessContentScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token) ?? '';

  const [tab, setTab] = useState<Tab>('articles');
  const [articles, setArticles] = useState<ArticleView[]>([]);
  const [events, setEvents] = useState<EventView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Article form
  const [aTitle, setATitle] = useState('');
  const [aSummary, setASummary] = useState('');
  const [aBody, setABody] = useState('');
  const [aCategory, setACategory] = useState('');
  const [aReadMinutes, setAReadMinutes] = useState('5');
  const [aEmoji, setAEmoji] = useState('🌱');

  // Event form
  const [eTitle, setETitle] = useState('');
  const [eDescription, setEDescription] = useState('');
  const [eLocation, setELocation] = useState('');
  const [eCapacity, setECapacity] = useState('');
  const [eDay, setEDay] = useState(() => new Date());
  const [eTime, setETime] = useState(TIME_SLOTS[0]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'articles') {
        const page = await listArticles(token);
        setArticles(page.content);
      } else {
        const page = await listEvents(token);
        setEvents(page.content);
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not load content.');
    } finally {
      setLoading(false);
    }
  }, [token, tab]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setShowForm(false); }, [tab]);

  const resetArticleForm = () => {
    setATitle(''); setASummary(''); setABody(''); setACategory(''); setAReadMinutes('5'); setAEmoji('🌱');
  };
  const resetEventForm = () => {
    setETitle(''); setEDescription(''); setELocation(''); setECapacity(''); setEDay(new Date()); setETime(TIME_SLOTS[0]);
  };

  const handleCreateArticle = async () => {
    if (!aTitle.trim() || !aBody.trim() || !aCategory.trim()) {
      Alert.alert('Missing fields', 'Title, body, and category are required.');
      return;
    }
    setSaving(true);
    try {
      const created = await createArticle(token, {
        title: aTitle.trim(),
        summary: aSummary.trim() || undefined,
        body: aBody.trim(),
        category: aCategory.trim(),
        readMinutes: Number(aReadMinutes) || 1,
        imageEmoji: aEmoji.trim() || '🌱',
      });
      setArticles((prev) => [created, ...prev]);
      resetArticleForm();
      setShowForm(false);
    } catch (err) {
      Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not publish this article.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eTitle.trim()) {
      Alert.alert('Missing fields', 'Title is required.');
      return;
    }
    const startsAt = new Date(eDay);
    const [hh, mm] = eTime.split(':').map(Number);
    startsAt.setHours(hh, mm, 0, 0);
    setSaving(true);
    try {
      const created = await createEvent(token, {
        title: eTitle.trim(),
        description: eDescription.trim() || undefined,
        startsAt: startsAt.toISOString(),
        location: eLocation.trim() || undefined,
        capacity: eCapacity.trim() ? Number(eCapacity) : undefined,
      });
      setEvents((prev) => [created, ...prev].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()));
      resetEventForm();
      setShowForm(false);
    } catch (err) {
      Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not create this event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = (item: ArticleView) => {
    Alert.alert('Delete article?', `"${item.title}" will be removed for everyone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeletingId(item.id);
          try {
            await deleteArticle(token, item.id);
            setArticles((prev) => prev.filter((a) => a.id !== item.id));
          } catch (err) {
            Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not delete this article.');
          } finally { setDeletingId(null); }
        },
      },
    ]);
  };

  const handleDeleteEvent = (item: EventView) => {
    Alert.alert('Delete event?', `"${item.title}" and its RSVPs will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeletingId(item.id);
          try {
            await deleteEvent(token, item.id);
            setEvents((prev) => prev.filter((e) => e.id !== item.id));
          } catch (err) {
            Alert.alert('Error', err instanceof ApiRequestError ? err.message : 'Could not delete this event.');
          } finally { setDeletingId(null); }
        },
      },
    ]);
  };

  const visibleDays = [0, 1, 2, 3, 4, 5, 6].map((offset) => addDays(new Date(), offset));

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#2C1654', '#5B2FA0', '#2980B9']} style={s.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>Wellness Content</Text>
        <Pressable style={s.backBtn} onPress={() => setShowForm((v) => !v)} hitSlop={10}>
          <Ionicons name={showForm ? 'close' : 'add'} size={22} color="#fff" />
        </Pressable>
      </LinearGradient>

      <View style={s.tabRow}>
        <Pressable style={[s.tabBtn, tab === 'articles' && s.tabBtnActive]} onPress={() => setTab('articles')}>
          <Text style={[s.tabText, tab === 'articles' && s.tabTextActive]}>Articles</Text>
        </Pressable>
        <Pressable style={[s.tabBtn, tab === 'events' && s.tabBtnActive]} onPress={() => setTab('events')}>
          <Text style={[s.tabText, tab === 'events' && s.tabTextActive]}>Events</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {showForm && tab === 'articles' && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>New article</Text>
            <TextInput style={s.input} placeholder="Title" placeholderTextColor={colors.inkFaint} value={aTitle} onChangeText={setATitle} />
            <TextInput style={s.input} placeholder="Summary (optional)" placeholderTextColor={colors.inkFaint} value={aSummary} onChangeText={setASummary} />
            <TextInput style={[s.input, s.inputMultiline]} placeholder="Body" placeholderTextColor={colors.inkFaint} value={aBody} onChangeText={setABody} multiline />
            <View style={s.formRow}>
              <TextInput style={[s.input, s.inputFlex]} placeholder="Category" placeholderTextColor={colors.inkFaint} value={aCategory} onChangeText={setACategory} />
              <TextInput style={[s.input, s.inputSmall]} placeholder="Min" placeholderTextColor={colors.inkFaint} value={aReadMinutes} onChangeText={setAReadMinutes} keyboardType="number-pad" />
              <TextInput style={[s.input, s.inputSmall]} placeholder="🌱" placeholderTextColor={colors.inkFaint} value={aEmoji} onChangeText={setAEmoji} />
            </View>
            <Pressable style={[s.publishBtn, saving && s.btnDisabled]} onPress={handleCreateArticle} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.publishBtnText}>Publish article</Text>}
            </Pressable>
          </View>
        )}

        {showForm && tab === 'events' && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>New event</Text>
            <TextInput style={s.input} placeholder="Title" placeholderTextColor={colors.inkFaint} value={eTitle} onChangeText={setETitle} />
            <TextInput style={s.input} placeholder="Description (optional)" placeholderTextColor={colors.inkFaint} value={eDescription} onChangeText={setEDescription} />
            <TextInput style={s.input} placeholder="Location (optional)" placeholderTextColor={colors.inkFaint} value={eLocation} onChangeText={setELocation} />
            <TextInput style={s.input} placeholder="Capacity (optional, blank = unlimited)" placeholderTextColor={colors.inkFaint} value={eCapacity} onChangeText={setECapacity} keyboardType="number-pad" />

            <Text style={s.formLabel}>Day</Text>
            <View style={s.dayRow}>
              {visibleDays.map((day) => {
                const active = isSameDay(day, eDay);
                return (
                  <Pressable key={day.toISOString()} style={[s.dayChip, active && s.dayChipActive]} onPress={() => setEDay(day)}>
                    <Text style={[s.dayChipWeekday, active && s.dayChipTextActive]}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                    <Text style={[s.dayChipNum, active && s.dayChipTextActive]}>{day.getDate()}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={s.formLabel}>Time</Text>
            <View style={s.timeRow}>
              {TIME_SLOTS.map((slot) => {
                const active = slot === eTime;
                return (
                  <Pressable key={slot} style={[s.timeChip, active && s.timeChipActive]} onPress={() => setETime(slot)}>
                    <Text style={[s.timeChipText, active && s.timeChipTextActive]}>{formatTimeLabel(slot)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={[s.publishBtn, saving && s.btnDisabled]} onPress={handleCreateEvent} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.publishBtnText}>Create event</Text>}
            </Pressable>
          </View>
        )}

        {error ? (
          <View style={s.alertBanner}>
            <Ionicons name="warning-outline" size={18} color="#C0392B" />
            <Text style={s.alertText}>{error}</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.lavender} style={{ marginVertical: 40 }} />
        ) : tab === 'articles' ? (
          articles.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="document-text-outline" size={40} color={colors.inkFaint} />
              <Text style={s.emptyBody}>No articles published yet.</Text>
            </View>
          ) : articles.map((item) => (
            <View key={item.id} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.cardEmoji}>{item.imageEmoji}</Text>
                <View style={s.cardInfo}>
                  <Text style={s.cardName} numberOfLines={2}>{item.title}</Text>
                  <Text style={s.cardMeta}>{item.category} · {item.readMinutes} min read</Text>
                </View>
                <Pressable
                  style={s.deleteBtn}
                  onPress={() => handleDeleteArticle(item)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id
                    ? <ActivityIndicator size="small" color={colors.coral} />
                    : <Ionicons name="trash-outline" size={18} color={colors.coral} />}
                </Pressable>
              </View>
              {item.summary ? <Text style={s.cardBody} numberOfLines={2}>{item.summary}</Text> : null}
            </View>
          ))
        ) : events.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="calendar-outline" size={40} color={colors.inkFaint} />
            <Text style={s.emptyBody}>No events scheduled yet.</Text>
          </View>
        ) : events.map((item) => (
          <View key={item.id} style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.eventDateBox}>
                <Text style={s.eventDateNum}>{new Date(item.startsAt).getDate()}</Text>
              </View>
              <View style={s.cardInfo}>
                <Text style={s.cardName} numberOfLines={2}>{item.title}</Text>
                <Text style={s.cardMeta}>{formatEventWhen(item.startsAt)}</Text>
                <Text style={s.cardMeta}>{item.goingCount} going{item.capacity ? ` / ${item.capacity} spots` : ''}</Text>
              </View>
              <Pressable
                style={s.deleteBtn}
                onPress={() => handleDeleteEvent(item)}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id
                  ? <ActivityIndicator size="small" color={colors.coral} />
                  : <Ionicons name="trash-outline" size={18} color={colors.coral} />}
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
  },
  backBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg, color: '#fff' },

  tabRow: {
    flexDirection: 'row', marginHorizontal: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.surface, borderRadius: radii.pill, padding: 4, ...shadow.sm,
  },
  tabBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.pill, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.lavender },
  tabText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.inkSoft },
  tabTextActive: { color: '#fff' },

  formCard: {
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg,
    marginHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm, ...shadow.sm,
  },
  formTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink, marginBottom: 4 },
  formLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 4 },
  formRow: { flexDirection: 'row', gap: 8 },
  input: {
    fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.ink,
    backgroundColor: '#F4F2F8', borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  inputFlex: { flex: 1 },
  inputSmall: { width: 60 },
  publishBtn: {
    marginTop: spacing.sm, backgroundColor: colors.lavender, borderRadius: radii.md,
    paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center',
  },
  // Was referenced on the Publish/Create buttons but never defined - disabled={saving} still
  // blocked double-taps functionally, this just restores the visual dimmed-while-saving state.
  btnDisabled: { opacity: 0.5 },
  publishBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#fff' },

  dayRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: {
    width: 44, paddingVertical: 8, borderRadius: radii.sm, backgroundColor: '#F4F2F8', alignItems: 'center',
  },
  dayChipActive: { backgroundColor: colors.lavender },
  dayChipWeekday: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.inkSoft },
  dayChipNum: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink },
  dayChipTextActive: { color: '#fff' },

  timeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  timeChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: radii.sm, backgroundColor: '#F4F2F8' },
  timeChipActive: { backgroundColor: colors.lavender },
  timeChipText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft },
  timeChipTextActive: { color: '#fff' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.xl, marginTop: spacing.md,
    backgroundColor: '#FEF0EE', borderRadius: radii.md, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: '#C0392B',
  },
  alertText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#7B1010', flex: 1 },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 10, marginHorizontal: spacing.xl },
  emptyBody: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkSoft, textAlign: 'center' },

  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg,
    marginHorizontal: spacing.xl, marginBottom: spacing.md, ...shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardEmoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  cardMeta: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 2 },
  cardBody: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkSoft, marginTop: spacing.sm, lineHeight: 20 },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#FEF0EE',
    alignItems: 'center', justifyContent: 'center',
  },
  eventDateBox: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: colors.lavenderSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  eventDateNum: { fontFamily: fonts.display, fontSize: fontSizes.lg, color: colors.lavenderDeep },
});
