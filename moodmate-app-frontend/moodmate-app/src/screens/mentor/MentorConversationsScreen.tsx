import React, { useCallback, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MentorTabParamList, RootStackParamList } from '@/navigation/types';
import { useToast } from '@/state/useToast';
import { useAuthStore } from '@/state/useAuthStore';
import { listMentorConversations } from '@/api/support';
import { ApiRequestError } from '@/api/client';
import type { CounsellorConversationView } from '@/api/types';
import { hapticLight } from '@/utils/haptics';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MentorTabParamList, 'Conversations'>,
  NativeStackScreenProps<RootStackParamList>
>;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Phase 1G - mirrors CounsellorConversationsScreen.tsx exactly, adapted to mentor API calls. */
export function MentorConversationsScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const toast    = useToast();
  const token    = useAuthStore((s) => s.token);

  const [convos, setConvos]     = useState<CounsellorConversationView[]>([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setConvos(await listMentorConversations(token));
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not load conversations.');
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visible = query.trim()
    ? convos.filter(c => c.studentName.toLowerCase().includes(query.toLowerCase()))
    : convos;

  const unreadTotal = convos.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#24412A', '#579E65']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Messages</Text>
            <Text style={s.headerSub}>
              {convos.length} students · {unreadTotal > 0 ? `${unreadTotal} unread` : 'all read'}
            </Text>
          </View>
        </View>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={s.searchInput}
            placeholder="Search students…"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Text style={s.clearTxt}>✕</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading && convos.length === 0 ? (
          [0,1,2,3].map(i => <View key={i} style={[s.row, s.skeleton]} />)
        ) : visible.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name={query ? 'search-outline' : 'chatbubbles-outline'} size={36} color={colors.inkFaint} />
            <Text style={s.emptyTitle}>{query ? 'No results' : 'No conversations yet'}</Text>
            <Text style={s.emptySub}>{query ? 'Try a different name' : 'When you accept a request, the conversation appears here'}</Text>
          </View>
        ) : (
          visible.map(c => {
            const initials = c.studentName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
            const hasUnread = c.unreadCount > 0;
            return (
              <Pressable
                key={c.id}
                style={({ pressed }) => [s.row, pressed && s.rowPressed]}
                onPress={() => {
                  hapticLight();
                  navigation.navigate('MentorChat', {
                    conversationId: c.id,
                    studentName: c.studentName,
                  });
                }}
              >
                <View style={[s.avatar, hasUnread && s.avatarUnread]}>
                  <Text style={s.avatarTxt}>{initials}</Text>
                </View>
                <View style={s.rowBody}>
                  <View style={s.rowTop}>
                    <Text style={[s.rowName, hasUnread && s.rowNameBold]}>{c.studentName}</Text>
                    <Text style={s.rowTime}>{timeAgo(c.createdAt)}</Text>
                  </View>
                  <Text style={[s.rowPreview, hasUnread && s.rowPreviewBold]} numberOfLines={1}>
                    {c.lastMessagePreview ?? 'Tap to open conversation'}
                  </Text>
                </View>
                {hasUnread && (
                  <View style={s.badge}>
                    <Text style={s.badgeTxt}>{c.unreadCount > 9 ? '9+' : c.unreadCount}</Text>
                  </View>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: '#FFFFFF' },
  headerSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#FFFFFF' },
  clearTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  scroll: { flex: 1 },
  content: { padding: spacing.md, gap: 2 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: 16,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    marginBottom: 6, ...shadow.sm,
  },
  rowPressed: { opacity: 0.8 },
  skeleton: { height: 70, opacity: 0.35 },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.sageDeep, alignItems: 'center', justifyContent: 'center' },
  avatarUnread: { backgroundColor: '#24412A' },
  avatarTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF' },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.base, color: colors.ink },
  rowNameBold: { fontFamily: fonts.bodyBold },
  rowTime: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.inkFaint },
  rowPreview: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft, marginTop: 2 },
  rowPreviewBold: { fontFamily: fonts.bodyBold, color: colors.ink },
  badge: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.sageDeep, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { fontFamily: fonts.bodyBold, fontSize: 9, color: '#FFFFFF' },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink },
  emptySub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint, textAlign: 'center' },
});
