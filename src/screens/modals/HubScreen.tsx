import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import { useHubStore } from '@/state/useHubStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Hub'>;

export function HubScreen({ navigation }: Props) {
  const [tab, setTab] = useState<'articles' | 'events'>('articles');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const articles = useHubStore((s) => s.articles);
  const events = useHubStore((s) => s.events);
  const loading = useHubStore((s) => s.loading);
  const load = useHubStore((s) => s.load);
  const toggleRsvp = useHubStore((s) => s.toggleRsvp);
  const token = useAuthStore((s) => s.token);
  const toast = useToast();

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
          { key: 'articles', icon: '📝', label: 'Articles', sublabel: 'blogs & guides' },
          { key: 'events', icon: '📅', label: 'Events', sublabel: 'campus wellness' },
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
        <View>
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
                  <Text style={styles.eventMeta}>📍 {event.location} · {event.time}</Text>
                  <Text style={styles.eventMeta}>
                    👥 {event.going}{event.capacity ? ` / ${event.capacity}` : ''} going
                  </Text>
                </View>
                <Button
                  label={event.rsvped ? 'Going ✓' : 'RSVP'}
                  variant={event.rsvped ? 'ghost' : 'primary'}
                  onPress={() => handleRsvp(event.id)}
                />
              </Card>
            ))
          )}
          <Button
            label="📅 Sync to my calendar"
            fullWidth
            onPress={() => toast('Synced events to your calendar 📅')}
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
