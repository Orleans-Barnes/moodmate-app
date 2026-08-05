import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Button } from '@/components/Button';
import { ToggleCards } from '@/components/ToggleCards';
import { Skeleton } from '@/components/Skeleton';
import { cancelRsvp, listArticles, listEvents, rsvpToEvent, createEvent, deleteEvent } from '@/api/hub';
import { useHubStore } from '@/state/useHubStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import { TextField } from '@/components/TextField';

type Props = NativeStackScreenProps<RootStackParamList, 'Hub'>;

export function HubScreen({ navigation }: Props) {
  const [tab, setTab] = useState<'articles' | 'events'>('articles');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Event creation form state
  const [showForm, setShowForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventLoc, setEventLoc] = useState('');
  const [eventCap, setEventCap] = useState('50');

  const articles = useHubStore((s) => s.articles);
  const events = useHubStore((s) => s.events);
  const loading = useHubStore((s) => s.loading);
  const load = useHubStore((s) => s.load);
  const toggleRsvp = useHubStore((s) => s.toggleRsvp);

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const toast = useToast();

  const isCounsellorOrAdmin = user?.role === 'COUNSELLOR' || user?.role === 'ADMIN';

  const refresh = useCallback(() => {
    if (!token) return;
    load(token).catch((err) => toast(err instanceof ApiRequestError ? err.message : 'Could not load the Hub.'));
  }, [token, load, toast]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleRsvp = async (id: number) => {
    if (!token) return;
    try {
      await toggleRsvp(token, id);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not update your RSVP.');
    }
  };

  const handleCreate = async () => {
    if (!token) return;
    if (!eventTitle.trim() || !eventLoc.trim()) {
      Alert.alert('Validation Error', 'Please enter a title and location for the event.');
      return;
    }
    try {
      const capacityNum = parseInt(eventCap, 10);
      await createEvent(token, {
        title: eventTitle.trim(),
        description: eventDesc.trim() || 'No description provided.',
        location: eventLoc.trim(),
        startsAt: new Date(Date.now() + 86400000 * 2).toISOString(), // defaults to 2 days from now
        capacity: isNaN(capacityNum) ? undefined : capacityNum,
      });
      toast('Event posted! Notifications sent to members.');
      setShowForm(false);
      setEventTitle('');
      setEventDesc('');
      setEventLoc('');
      refresh();
    } catch (err) {
      toast('Could not create event. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEvent(token, id);
            toast('Event deleted successfully.');
            refresh();
          } catch {
            toast('Could not delete event.');
          }
        }
      }
    ]);
  };

  const showSkeleton = loading && articles.length === 0 && events.length === 0;

  return (
    <Screen
      backgroundColor={colors.bg}
      contentContainerStyle={styles.content}
      refreshing={loading && (articles.length > 0 || events.length > 0)}
      onRefresh={refresh}
      refreshTintColor={colors.coral}
    >
      <ScreenHeader title="Wellness Hub" onClose={() => navigation.goBack()} />

      <ToggleCards
        options={[
          { key: 'articles', icon: 'document-text-outline', label: 'Articles', sublabel: 'blogs & guides' },
          { key: 'events', icon: 'calendar-outline', label: 'Events', sublabel: 'campus wellness' },
        ]}
        selected={tab}
        onSelect={(key) => setTab(key as 'articles' | 'events')}
      />

      {showSkeleton ? (
        <>
          <Card>
            <Skeleton width={90} height={11} style={styles.skeletonGap} />
            <Skeleton width="85%" height={14} style={styles.skeletonGap} />
            <Skeleton width="40%" height={11} />
          </Card>
          <Card>
            <Skeleton width={90} height={11} style={styles.skeletonGap} />
            <Skeleton width="70%" height={14} style={styles.skeletonGap} />
            <Skeleton width="35%" height={11} />
          </Card>
        </>
      ) : tab === 'articles' ? (
        <View>
          {articles.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>No articles yet.</Text>
            </Card>
          ) : (
            articles.map((article) => {
              const expanded = expandedId === article.id;
              return (
                <Card key={article.id} onPress={() => setExpandedId(expanded ? null : article.id)}>
                  <View style={styles.tagRow}>
                    <Chip label={article.tag} />
                  </View>
                  <Text style={styles.articleTitle}>
                    {article.imageEmoji} {article.title}
                  </Text>
                  <Text style={styles.articleMeta}>{article.readTime}</Text>
                  {expanded && (
                    <>
                      <Text style={styles.articleSummary}>{article.summary}</Text>
                      <Text style={styles.articleBody}>{article.body}</Text>
                    </>
                  )}
                </Card>
              );
            })
          )}
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          {isCounsellorOrAdmin && (
            <Card style={{ padding: spacing.md, gap: spacing.sm }}>
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onPress={() => setShowForm(!showForm)}
              >
                <Ionicons name={showForm ? 'chevron-up' : 'add-circle-outline'} size={20} color={colors.coral} />
                <Text style={{ fontFamily: fonts.bodyBold, color: colors.coral }}>
                  {showForm ? 'Collapse Form' : 'Create New Event'}
                </Text>
              </Pressable>

              {showForm && (
                <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
                  <TextField label="Event Title" placeholder="e.g. Mental Health Seminar" value={eventTitle} onChangeText={setEventTitle} />
                  <TextField label="Location" placeholder="e.g. Great Hall, KNUST" value={eventLoc} onChangeText={setEventLoc} />
                  <TextField label="Description" placeholder="Topics covered, schedule, etc." value={eventDesc} onChangeText={setEventDesc} />
                  <TextField label="Estimated Capacity" placeholder="50" keyboardType="numeric" value={eventCap} onChangeText={setEventCap} />
                  <Button label="Post Event" onPress={handleCreate} />
                </View>
              )}
            </Card>
          )}

          {events.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>No events yet.</Text>
            </Card>
          ) : (
            events.map((event) => (
              <Card key={event.id} style={styles.eventCard}>
                <View style={styles.eventDateBlock}>
                  <Text style={styles.eventDay}>{event.day}</Text>
                  <Text style={styles.eventMonth}>{event.month}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventMeta}>
                    <Ionicons name="location-outline" size={12} color={colors.inkSoft} /> {event.location} · {event.time}
                  </Text>
                  <Text style={styles.eventMeta}>
                    <Ionicons name="people-outline" size={12} color={colors.inkSoft} /> {event.going}{event.capacity ? ` / ${event.capacity}` : ''} registered
                  </Text>
                </View>
                <View style={{ gap: spacing.xs, alignItems: 'flex-end' }}>
                  <Button
                    label={event.rsvped ? 'Going ✓' : 'RSVP'}
                    variant={event.rsvped ? 'ghost' : 'primary'}
                    onPress={() => handleRsvp(event.id)}
                  />
                  {isCounsellorOrAdmin && (
                    <Pressable onPress={() => handleDelete(event.id)} hitSlop={10} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={16} color={colors.coral} />
                    </Pressable>
                  )}
                </View>
              </Card>
            ))
          )}
          <Button
            label="Sync to my calendar"
            fullWidth
            onPress={() => toast('Synced events to your calendar')}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.sm },
  articleTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.ink, lineHeight: 19 },
  articleMeta: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.inkFaint, marginTop: spacing.sm },
  articleSummary: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    marginTop: spacing.sm + 2,
    lineHeight: 19,
  },
  articleBody: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  emptyText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.inkFaint, textAlign: 'center' },
  skeletonGap: { marginBottom: 8 },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  eventDateBlock: {
    width: 46,
    alignItems: 'center',
    backgroundColor: colors.sageSoft,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
  },
  eventDay: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: colors.sage },
  eventMonth: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.sage, textTransform: 'uppercase' },
  eventName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink, lineHeight: 17 },
  eventMeta: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.inkSoft, marginTop: 3 },
});
